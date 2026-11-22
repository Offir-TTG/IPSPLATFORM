import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { listIntegrations } from '@/lib/integrations/store';
import { recordQueueBounce } from '@/lib/email/blocklist';
import { bounceClassFromResendEvent } from '@/lib/email/bounce';

export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/resend
 *
 * Resend reports a bounce or a spam complaint after the email has left. The
 * address is then marked on its email_queue row, which is what the
 * deliverability gate (blocklist.ts) reads, so a hard-bounced address is
 * never sent to again.
 *
 * Requests are signed the Svix way (svix-id, svix-timestamp, svix-signature)
 * with the "Signing secret" saved on the tenant's Resend integration. The
 * event belongs to whichever tenant's secret verifies it; unsigned or
 * unverified requests are refused.
 */

const TOLERANCE_SECONDS = 5 * 60;

type ResendEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    bounce?: { type?: string; subType?: string; message?: string };
  };
};

/** Svix signature check: HMAC-SHA256 of "id.timestamp.body" with the secret. */
function verifySvix(secret: string, id: string, timestamp: string, body: string, signatures: string): boolean {
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();
  return signatures.split(' ').some((part) => {
    const [version, value] = part.split(',');
    if (version !== 'v1' || !value) return false;
    const given = Buffer.from(value, 'base64');
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const id = request.headers.get('svix-id');
    const timestamp = request.headers.get('svix-timestamp');
    const signatures = request.headers.get('svix-signature');
    if (!id || !timestamp || !signatures) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }
    // An old timestamp means a replayed request.
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {
      return NextResponse.json({ error: 'Stale signature' }, { status: 401 });
    }

    const { data: integrations, error: loadError } = await listIntegrations('resend');
    if (loadError) {
      console.error('[Resend webhook] Could not load Resend settings:', loadError.message);
      return NextResponse.json({ error: 'Could not load settings' }, { status: 500 });
    }
    const match = (integrations ?? []).find(
      (i) => typeof i.credentials?.webhook_secret === 'string' &&
        i.credentials.webhook_secret &&
        verifySvix(i.credentials.webhook_secret, id, timestamp, body, signatures),
    );
    if (!match) {
      console.error('[Resend webhook] Signature verification failed for every tenant');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    const tenantId: string | null = match.tenant_id ?? null;

    const supabase = createAdminClient();

    // Resend repeats an event when it isn't sure it arrived. One already
    // handled is acknowledged without being applied again.
    const { data: alreadyHandled } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('source', 'resend')
      .eq('payload->>svix_id', id)
      .limit(1)
      .maybeSingle();
    if (alreadyHandled) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const event = JSON.parse(body) as ResendEvent;
    const kind =
      event.type === 'email.bounced'
        ? bounceClassFromResendEvent(event.data?.bounce?.type)
        : event.type === 'email.complained'
          ? 'complaint'
          : null;

    if (kind) {
      const to = Array.isArray(event.data?.to) ? event.data?.to[0] : event.data?.to;
      await markBounce(supabase, {
        tenantId,
        emailId: event.data?.email_id ?? null,
        to: typeof to === 'string' ? to : null,
        kind,
        reason: event.data?.bounce?.message ?? (kind === 'complaint' ? 'Marked as spam' : 'Bounced'),
      });
    }

    // An audit trail, and how a repeat is recognised.
    await supabase.from('webhook_events').insert({
      source: 'resend',
      event_type: event.type,
      payload: { ...event, svix_id: id, tenant_id: tenantId },
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend webhook] Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Marks the email's queue row with the bounce. The row is found by Resend's
 * id, else by the most recent email to that address. An email sent directly
 * (not through the queue, such as a password reset) has no row, so a small
 * failed row is added: the gate reads rows, and the bounce must count.
 */
async function markBounce(
  supabase: ReturnType<typeof createAdminClient>,
  input: { tenantId: string | null; emailId: string | null; to: string | null; kind: 'hard' | 'soft' | 'complaint'; reason: string },
) {
  let rowId: string | null = null;

  if (input.emailId) {
    let query = supabase.from('email_queue').select('id').eq('smtp_message_id', input.emailId);
    if (input.tenantId) query = query.eq('tenant_id', input.tenantId);
    const { data } = await query.limit(1).maybeSingle();
    rowId = data?.id ?? null;
  }
  if (!rowId && input.to) {
    let query = supabase.from('email_queue').select('id').ilike('to_email', input.to);
    if (input.tenantId) query = query.eq('tenant_id', input.tenantId);
    const { data } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
    rowId = data?.id ?? null;
  }

  if (rowId) {
    await recordQueueBounce(supabase, rowId, input.kind);
    return;
  }
  if (!input.to || !input.tenantId) return;

  const { error } = await supabase.from('email_queue').insert({
    tenant_id: input.tenantId,
    to_email: input.to,
    subject: '(bounce reported by Resend)',
    body_html: '',
    body_text: '',
    status: 'failed',
    failed_at: new Date().toISOString(),
    error_message: input.reason,
    smtp_message_id: input.emailId,
    bounce_type: input.kind,
  });
  if (error) console.error('[Resend webhook] Could not record the bounce:', error.message);
}
