/**
 * Bounce classes for the email deliverability gate.
 *
 * Two sources:
 *   - a refusal from Resend's API at send time (`classifyResendError`), and
 *   - Resend's later bounce report, by webhook (`bounceClassFromResendEvent`),
 *     handled in /api/webhooks/resend.
 *
 * Only `hard` blocks future sends to the address (see blocklist.ts). Soft and
 * transport failures are recorded without blocking: transport failures (Resend
 * unreachable, rate limited, our key wrong) are our problem, not the recipient's.
 */

export type BounceClass = 'hard' | 'soft' | 'transport' | 'unknown';

export interface ClassifiedBounce {
  bounceClass: BounceClass;
  reason: string;
}

/** A refusal from Resend's send API. */
export function classifyResendError(
  status: number,
  body: { name?: string; message?: string },
): ClassifiedBounce {
  const reason = body.message || body.name || `Resend refused the email (${status})`;
  // An address Resend won't accept at all ("Invalid `to` field").
  if (status === 422 && /\bto\b|recipient|email address/i.test(reason)) {
    return { bounceClass: 'hard', reason };
  }
  // Rate limits, Resend outages, and a missing or wrong key or sender domain.
  if (status === 429 || status >= 500 || status === 401 || status === 403) {
    return { bounceClass: 'transport', reason };
  }
  return { bounceClass: 'unknown', reason };
}

/** Resend's bounce report: "Permanent" is hard, anything else soft. */
export function bounceClassFromResendEvent(bounceType: unknown): 'hard' | 'soft' {
  return typeof bounceType === 'string' && bounceType.toLowerCase() === 'permanent' ? 'hard' : 'soft';
}
