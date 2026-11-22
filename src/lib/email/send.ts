/**
 * Email sending utility. Every email the platform sends goes through
 * `sendEmail`, which hands it to Resend (https://resend.com).
 *
 * The Resend settings (API key, sender email and name) are saved per tenant
 * on the Integrations page, encrypted, and read with `loadIntegration`. A
 * tenant without its own settings uses the platform-wide row, and then the
 * RESEND_API_KEY / RESEND_FROM_EMAIL environment variables.
 *
 * Bounces that Resend learns about later arrive at /api/webhooks/resend.
 */

import { createClient } from '@supabase/supabase-js';
import { isEmailDeliverable } from './blocklist';
import { classifyResendError, type BounceClass } from './bounce';
import { loadIntegration } from '@/lib/integrations/store';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
  tenantId?: string; // Optional tenant ID to use that tenant's Resend settings
}

export interface EmailResult {
  success: boolean;
  /** Resend's id for the email, used to match its later bounce report. */
  messageId?: string;
  error?: string;
  // Populated when the send was aborted before reaching Resend because
  // the recipient is on the hard-bounce list. Callers (e.g. the queue
  // cron) use this to mark the row `cancelled` rather than `failed`.
  skipped?: 'blocked';
  // Diagnostic fields from Resend's refusal, so the queue cron can
  // classify and persist a bounce.
  statusCode?: number;
  reason?: string;
  bounceClass?: BounceClass;
}

interface ResendConfig {
  apiKey: string;
  from?: string;
  fromName?: string;
}

const RESEND_API = 'https://api.resend.com/emails';

// Settings by tenant, for a few minutes, so a queue run reads them once.
const configCache = new Map<string, { config: ResendConfig | null; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/** The tenant's Resend settings, else the platform-wide ones, else env. */
async function getResendConfig(tenantId?: string): Promise<ResendConfig | null> {
  const cacheKey = tenantId || 'default';
  const cached = configCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.config;

  let config: ResendConfig | null = null;
  try {
    let { data } = await loadIntegration(tenantId ?? null, 'resend', { enabledOnly: true });
    if (!data && tenantId) ({ data } = await loadIntegration(null, 'resend', { enabledOnly: true }));
    if (data?.credentials?.api_key) {
      config = {
        apiKey: data.credentials.api_key,
        from: data.credentials.from_email || undefined,
        fromName: data.credentials.from_name || undefined,
      };
    }
  } catch (error) {
    console.error('[Email] Could not read the Resend settings:', error instanceof Error ? error.message : error);
  }

  if (!config && process.env.RESEND_API_KEY) {
    config = {
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL,
      fromName: process.env.RESEND_FROM_NAME,
    };
  }

  configCache.set(cacheKey, { config, timestamp: Date.now() });
  return config;
}

/** True when Resend is set up for this tenant (or platform-wide). */
export async function verifyEmailConnection(tenantId?: string): Promise<boolean> {
  return (await getResendConfig(tenantId)) !== null;
}

const asList = (value?: string | string[]) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

/**
 * Send an email through Resend.
 * Returns Resend's message id on success, for tracking.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    // Universal deliverability gate. Every email path — queue cron,
    // direct transactional (verification, password reset), admin
    // "send now" — funnels through here, so this is the single place
    // we need to enforce the hard-bounce list. Array recipients skip
    // the check today; the only producer of an array is the rare bcc
    // case and we'd need per-address filtering to handle it cleanly.
    if (typeof options.to === 'string') {
      const adminSb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const deliverable = await isEmailDeliverable(adminSb, options.to);
      if (!deliverable) {
        console.warn('[Email] Skipping send: recipient previously hard-bounced');
        return {
          success: false,
          skipped: 'blocked',
          error: 'Recipient address previously hard-bounced',
        };
      }
    }

    const config = await getResendConfig(options.tenantId);

    if (!config) {
      // Not set up: in development, show the email in the console instead.
      if (process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(80));
        console.log('📧 EMAIL WOULD BE SENT (Development Mode - Resend Not Configured)');
        console.log('='.repeat(80));
        console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('\nText Version:');
        console.log('-'.repeat(80));
        console.log(options.text);
        console.log('='.repeat(80) + '\n');
        return { success: true, messageId: `dev-${Date.now()}@localhost` };
      }
      return {
        success: false,
        error: 'Email is not set up. Add the Resend API key under Settings → Integrations.',
        bounceClass: 'transport',
      };
    }

    // Tenant-level email branding (sender name + reply-to) lets admins
    // override the integration's `from_name` and set a reply-to. Failure is
    // non-fatal — we fall back to the integration's values.
    let tenantSenderName: string | undefined;
    let tenantReplyTo: string | undefined;
    if (options.tenantId) {
      try {
        const adminSb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
        );
        const { data: tenantBranding } = await adminSb
          .from('tenants')
          .select('email_sender_name, email_reply_to')
          .eq('id', options.tenantId)
          .single();
        tenantSenderName = tenantBranding?.email_sender_name || undefined;
        tenantReplyTo = tenantBranding?.email_reply_to || undefined;
      } catch (err) {
        console.warn('[Email] Could not load tenant email branding, using the Resend defaults', err);
      }
    }

    // From address and name. The tenant's sender name wins over the
    // integration's `from_name`; an explicit `options.from` wins over both.
    const senderEmail = config.from || 'onboarding@resend.dev';
    const senderName = tenantSenderName || config.fromName;
    const from = options.from || (senderName ? `${senderName} <${senderEmail}>` : senderEmail);
    const replyTo = options.replyTo || tenantReplyTo;

    const attachments = options.attachments?.map((a) => ({
      filename: a.filename,
      ...(a.path ? { path: a.path } : {}),
      ...(a.content !== undefined
        ? { content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : Buffer.from(a.content).toString('base64') }
        : {}),
      ...(a.contentType ? { content_type: a.contentType } : {}),
    }));

    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: asList(options.to),
        subject: options.subject,
        html: options.html,
        text: options.text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(options.cc ? { cc: asList(options.cc) } : {}),
        ...(options.bcc ? { bcc: asList(options.bcc) } : {}),
        ...(attachments?.length ? { attachments } : {}),
        // Lets the bounce webhook find the tenant of a direct (not queued) email.
        ...(options.tenantId ? { tags: [{ name: 'tenant_id', value: options.tenantId.replace(/[^A-Za-z0-9_-]/g, '') }] } : {}),
      }),
    });

    const body = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
      statusCode?: number;
    };

    if (!response.ok || !body.id) {
      const classified = classifyResendError(response.status, body);
      console.error('❌ Resend refused the email:', response.status, body.name ?? '', body.message ?? '');
      return {
        success: false,
        error: classified.reason,
        statusCode: response.status,
        reason: classified.reason,
        bounceClass: classified.bounceClass,
      };
    }

    console.log('✅ Email sent via Resend:', { messageId: body.id, subject: options.subject });
    return { success: true, messageId: body.id };
  } catch (error) {
    // The request didn't reach Resend (network). Our problem, not the recipient's.
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bounceClass: 'transport',
    };
  }
}

/** Forget saved Resend settings, after they change on the Integrations page. */
export function clearEmailConfigCache(tenantId?: string): void {
  if (tenantId) configCache.delete(tenantId);
  else configCache.clear();
}

/**
 * Send verification email to new organization admin
 */
export async function sendVerificationEmail(options: {
  email: string;
  firstName: string;
  organizationName: string;
  verificationUrl: string;
  trialEndsAt: string;
}): Promise<EmailResult> {
  const { getVerificationEmailHtml, getVerificationEmailText } = await import('./templates');

  const html = getVerificationEmailHtml({
    firstName: options.firstName,
    organizationName: options.organizationName,
    verificationUrl: options.verificationUrl,
    trialEndsAt: options.trialEndsAt,
  });

  const text = getVerificationEmailText({
    firstName: options.firstName,
    organizationName: options.organizationName,
    verificationUrl: options.verificationUrl,
    trialEndsAt: options.trialEndsAt,
  });

  return sendEmail({
    to: options.email,
    subject: `Verify your email for ${options.organizationName}`,
    html,
    text,
  });
}
