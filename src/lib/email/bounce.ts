/**
 * Classify a synchronous SMTP failure into a bounce category.
 *
 * Sources of signal nodemailer surfaces on the thrown error when the
 * remote MX rejects in-band:
 *   - `responseCode`: numeric SMTP status (e.g. 550, 421)
 *   - `code`: short string code, including Node DNS errors like
 *     ENOTFOUND / EAI_NONAME when the address has no MX at all
 *   - `response`: the raw SMTP response line, kept as `reason`
 *
 * We deliberately classify soft (4xx) and transport-level failures
 * (ECONNREFUSED/ETIMEDOUT/EAI_AGAIN) WITHOUT blocking the recipient —
 * soft DSN handling would need an inbound bounce mailbox we don't have,
 * and transport failures are our problem, not the recipient's.
 */

export type BounceClass = 'hard' | 'soft' | 'transport' | 'unknown';

export interface ClassifiedBounce {
  bounceClass: BounceClass;
  smtpCode: number | null;
  errorCode: string | null;
  reason: string;
}

const HARD_DNS_CODES = new Set([
  'ENOTFOUND',
  'EAI_NONAME',
  'EAI_FAIL',
  'EDNS',
]);

const TRANSPORT_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'ESOCKET',
  'EAI_AGAIN',
]);

export function classifyBounceError(err: unknown): ClassifiedBounce {
  const e = (err ?? {}) as {
    responseCode?: unknown;
    code?: unknown;
    response?: unknown;
    message?: unknown;
  };
  const smtpCode = typeof e.responseCode === 'number' ? e.responseCode : null;
  const errorCode = typeof e.code === 'string' ? e.code : null;
  const reason =
    (typeof e.response === 'string' && e.response) ||
    (typeof e.message === 'string' ? (e.message as string) : '') ||
    'Unknown SMTP error';

  if (errorCode && HARD_DNS_CODES.has(errorCode)) {
    return { bounceClass: 'hard', smtpCode, errorCode, reason };
  }
  if (errorCode && TRANSPORT_CODES.has(errorCode)) {
    return { bounceClass: 'transport', smtpCode, errorCode, reason };
  }
  if (smtpCode !== null) {
    if (smtpCode >= 500 && smtpCode < 600) {
      return { bounceClass: 'hard', smtpCode, errorCode, reason };
    }
    if (smtpCode >= 400 && smtpCode < 500) {
      return { bounceClass: 'soft', smtpCode, errorCode, reason };
    }
  }
  return { bounceClass: 'unknown', smtpCode, errorCode, reason };
}
