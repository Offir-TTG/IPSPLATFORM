/**
 * Email sending utility. Every email the platform sends goes through
 * `sendEmail`.
 *
 * Providers, in order:
 *   1. Resend (https://resend.com), when its API key is set.
 *   2. SMTP, as the fallback: used when Resend isn't set up, or when Resend
 *      fails on its side (outage, rate limit, wrong key or sender). A
 *      recipient Resend refuses (a bad address) is not retried over SMTP.
 *
 * Both are saved per tenant on Settings → Integrations (encrypted) and read
 * with `loadIntegration`. A tenant without its own settings uses the
 * platform-wide row, and then the environment variables:
 *   RESEND_API_KEY / RESEND_FROM_EMAIL / RESEND_FROM_NAME
 *   SMTP_HOST / SMTP_PORT / SMTP_SECURE (ssl | tls | none) / SMTP_USER /
 *   SMTP_PASSWORD / SMTP_FROM_EMAIL / SMTP_FROM_NAME
 *
 * Bounces that Resend learns about later arrive at /api/webhooks/resend.
 * SMTP has no bounce reports; a refusal at send time is still classified.
 */

import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { noStoreFetch } from '@/lib/supabase/noStoreFetch';
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
  tenantId?: string; // Optional tenant ID to use that tenant's email settings
}

export interface EmailResult {
  success: boolean;
  /** The provider's id for the email (Resend's is used to match its later bounce report). */
  messageId?: string;
  error?: string;
  // Populated when the send was aborted before reaching a provider because
  // the recipient is on the hard-bounce list. Callers (e.g. the queue
  // cron) use this to mark the row `cancelled` rather than `failed`.
  skipped?: 'blocked';
  // Diagnostic fields from the provider's refusal, so the queue cron can
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

export interface SmtpConfig {
  host: string;
  port: number;
  /** 'ssl' = encrypted from the start (usually port 465); 'tls' = STARTTLS (587); 'none'. */
  security: 'ssl' | 'tls' | 'none';
  user?: string;
  password?: string;
  from?: string;
  fromName?: string;
}

const RESEND_API = 'https://api.resend.com/emails';

/** Tags every email this platform sends, so its webhook can tell them apart
 *  from IParentingSchool's emails on the same Resend account. */
export const RESEND_APP_TAG = 'ipsplatform';

// Settings by tenant, for a few minutes, so a queue run reads them once.
const configCache = new Map<string, { config: ResendConfig | null; timestamp: number }>();
const smtpCache = new Map<string, { config: SmtpConfig | null; timestamp: number }>();
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

/** SMTP settings from saved fields (the Integrations page or env). Null without a host. */
export function smtpConfigFrom(values: Record<string, any> | null | undefined): SmtpConfig | null {
  const host = String(values?.host ?? '').trim();
  if (!host) return null;
  const rawSecurity = String(values?.security ?? values?.secure ?? '').trim().toLowerCase();
  const port = Number(values?.port) || (rawSecurity === 'ssl' || rawSecurity === 'true' ? 465 : 587);
  const security: SmtpConfig['security'] =
    rawSecurity === 'ssl' || rawSecurity === 'true'
      ? 'ssl'
      : rawSecurity === 'none'
        ? 'none'
        : rawSecurity === 'tls' || rawSecurity === 'false'
          ? 'tls'
          : port === 465
            ? 'ssl'
            : 'tls';
  return {
    host,
    port,
    security,
    user: values?.username || values?.user || undefined,
    password: values?.password || undefined,
    from: values?.from_email || undefined,
    fromName: values?.from_name || undefined,
  };
}

/** The tenant's SMTP settings, else the platform-wide ones, else env. */
async function getSmtpConfig(tenantId?: string): Promise<SmtpConfig | null> {
  const cacheKey = tenantId || 'default';
  const cached = smtpCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.config;

  let config: SmtpConfig | null = null;
  try {
    let { data } = await loadIntegration(tenantId ?? null, 'smtp', { enabledOnly: true });
    if (!data && tenantId) ({ data } = await loadIntegration(null, 'smtp', { enabledOnly: true }));
    config = smtpConfigFrom(data?.credentials);
  } catch (error) {
    console.error('[Email] Could not read the SMTP settings:', error instanceof Error ? error.message : error);
  }

  if (!config && process.env.SMTP_HOST) {
    config = smtpConfigFrom({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      security: process.env.SMTP_SECURE,
      username: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from_email: process.env.SMTP_FROM_EMAIL,
      from_name: process.env.SMTP_FROM_NAME,
    });
  }

  smtpCache.set(cacheKey, { config, timestamp: Date.now() });
  return config;
}

/** A mail connection for these SMTP settings. */
export function smtpTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.security === 'ssl',
    requireTLS: config.security === 'tls',
    ignoreTLS: config.security === 'none',
    auth: config.user ? { user: config.user, pass: config.password ?? '' } : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });
}

/** True when email can go out for this tenant: Resend or SMTP is set up. */
export async function verifyEmailConnection(tenantId?: string): Promise<boolean> {
  return (await getResendConfig(tenantId)) !== null || (await getSmtpConfig(tenantId)) !== null;
}

const asList = (value?: string | string[]) =>
  value === undefined ? undefined : Array.isArray(value) ? value : [value];

/**
 * Send an email: through Resend, or over SMTP when Resend isn't set up or
 * fails on its side. Returns the provider's message id on success.
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
        { global: { fetch: noStoreFetch } },
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

    const resend = await getResendConfig(options.tenantId);
    const smtp = await getSmtpConfig(options.tenantId);

    if (!resend && !smtp) {
      // Not set up: in development, show the email in the console instead.
      if (process.env.NODE_ENV === 'development') {
        console.log('\n' + '='.repeat(80));
        console.log('📧 EMAIL WOULD BE SENT (Development Mode - no Resend or SMTP set up)');
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
        error: 'Email is not set up. Add Resend or SMTP under Settings → Integrations.',
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
          { global: { fetch: noStoreFetch } },
        );
        const { data: tenantBranding } = await adminSb
          .from('tenants')
          .select('email_sender_name, email_reply_to')
          .eq('id', options.tenantId)
          .single();
        tenantSenderName = tenantBranding?.email_sender_name || undefined;
        tenantReplyTo = tenantBranding?.email_reply_to || undefined;
      } catch (err) {
        console.warn('[Email] Could not load tenant email branding, using the integration defaults', err);
      }
    }
    const replyTo = options.replyTo || tenantReplyTo;

    if (resend) {
      const viaResend = await sendViaResend(resend, options, tenantSenderName, replyTo);
      // Sent, or refused for a reason SMTP can't fix (the address itself).
      if (viaResend.success || !smtp || viaResend.bounceClass === 'hard') return viaResend;
      console.warn('[Email] Resend failed, sending over SMTP instead:', viaResend.error);
    }
    return await sendViaSmtp(smtp!, options, tenantSenderName, replyTo);
  } catch (error) {
    // Something failed before reaching a provider. Our problem, not the recipient's.
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      bounceClass: 'transport',
    };
  }
}

/** One email through Resend. */
async function sendViaResend(
  config: ResendConfig,
  options: SendEmailOptions,
  tenantSenderName: string | undefined,
  replyTo: string | undefined,
): Promise<EmailResult> {
  try {
    // From address and name. The tenant's sender name wins over the
    // integration's `from_name`; an explicit `options.from` wins over both.
    const senderEmail = config.from || 'onboarding@resend.dev';
    const senderName = tenantSenderName || config.fromName;
    const from = options.from || (senderName ? `${senderName} <${senderEmail}>` : senderEmail);

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
        // The Resend account is shared with IParentingSchool, and webhooks get
        // every email's events. `app` tells the bounce webhook which are ours;
        // `tenant_id` finds the tenant of a direct (not queued) email.
        tags: [
          { name: 'app', value: RESEND_APP_TAG },
          ...(options.tenantId ? [{ name: 'tenant_id', value: options.tenantId.replace(/[^A-Za-z0-9_-]/g, '') }] : []),
        ],
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
    // The request didn't reach Resend (network).
    console.error('❌ Could not reach Resend:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Could not reach Resend',
      bounceClass: 'transport',
    };
  }
}

/** One email over SMTP (the fallback). */
async function sendViaSmtp(
  config: SmtpConfig,
  options: SendEmailOptions,
  tenantSenderName: string | undefined,
  replyTo: string | undefined,
): Promise<EmailResult> {
  const senderEmail = config.from || config.user;
  if (!senderEmail) {
    return {
      success: false,
      error: 'SMTP has no sender email. Add it under Settings → Integrations → SMTP.',
      bounceClass: 'transport',
    };
  }
  const senderName = tenantSenderName || config.fromName;
  const from = options.from || (senderName ? { name: senderName, address: senderEmail } : senderEmail);

  try {
    const info = await smtpTransport(config).sendMail({
      from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        path: a.path,
        contentType: a.contentType,
      })),
      headers: { 'X-App': RESEND_APP_TAG },
    });

    // Every recipient refused at send time: report it like a bounce.
    if (info.accepted.length === 0 && info.rejected.length > 0) {
      return { success: false, error: 'The mail server refused the recipient', reason: 'recipient refused', bounceClass: 'hard' };
    }
    console.log('✅ Email sent via SMTP:', { messageId: info.messageId, subject: options.subject });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    // A 5xx about the recipient means the address is bad (4xx: try later);
    // anything else is the server or our settings.
    const code = Number(error?.responseCode) || undefined;
    const aboutRecipient = error?.command === 'RCPT TO' || /recipient|mailbox|user unknown/i.test(String(error?.response ?? ''));
    const bounceClass: BounceClass =
      code && aboutRecipient ? (code >= 500 ? 'hard' : code >= 400 ? 'soft' : 'transport') : 'transport';
    console.error('❌ SMTP refused the email:', code ?? '', error?.message ?? error);
    return {
      success: false,
      error: error?.message ?? 'SMTP send failed',
      statusCode: code,
      reason: String(error?.response ?? error?.message ?? 'SMTP send failed'),
      bounceClass,
    };
  }
}

/** Forget saved email settings, after they change on the Integrations page. */
export function clearEmailConfigCache(tenantId?: string): void {
  if (tenantId) {
    configCache.delete(tenantId);
    smtpCache.delete(tenantId);
  } else {
    configCache.clear();
    smtpCache.clear();
  }
  // A tenant may fall back to the platform-wide settings.
  configCache.delete('default');
  smtpCache.delete('default');
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
