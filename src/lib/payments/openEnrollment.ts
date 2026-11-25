import type { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import { hasPaymentStarted, type ScheduleRow } from './dueSchedules';

/**
 * The one rule for enrolling: a client has at most one OPEN enrollment per
 * product (per child, for coaching). Open = started but not finished
 * ('draft', or 'pending' = waiting for the client). Every way in (the
 * product link, a club join, logging in from an enrollment, the admin's new
 * enrollment, a program's "add client", a coaching package) asks
 * startOrContinue() first:
 *
 *   already_enrolled  active or completed: nothing to start
 *   suspended         on hold (payments failed): fix the payment instead
 *   continue          an open one exists: keep using it (same row)
 *   start             nothing open: a new enrollment may be created
 *
 * Cancelled ones are history, so a former client can enroll again. The
 * database backs this up with a partial unique index (see
 * "supabase/SQL Scripts/20261125000001_one_open_enrollment.sql"); an insert
 * that loses a race gets error 23505 and the caller asks again.
 */

export const OPEN_STATUSES = ['draft', 'pending'] as const;

export type EnrollmentRow = {
  id: string;
  status: string;
  enrollment_token: string | null;
  token_expires_at: string | null;
  created_at: string;
  child_id?: string | null;
};

export type StartOrContinue =
  | { kind: 'already_enrolled'; enrollment: EnrollmentRow }
  | { kind: 'suspended'; enrollment: EnrollmentRow }
  | { kind: 'continue'; enrollment: EnrollmentRow }
  | { kind: 'start'; enrollment?: undefined };

export const newEnrollmentToken = () => randomBytes(32).toString('base64url');

/** True when a link exists and still works. */
export const hasWorkingLink = (e: Pick<EnrollmentRow, 'enrollment_token' | 'token_expires_at'>) =>
  !!e.enrollment_token && !!e.token_expires_at && new Date(e.token_expires_at) > new Date();

/** Postgres "unique violation": another open enrollment got there first. */
export const isUniqueViolation = (error: { code?: string } | null | undefined) => error?.code === '23505';

/**
 * Decides for this client, product (and child). Without a client (a guest)
 * the answer is always "start": a guest gets one guest enrollment, joined
 * to their account when they log in (link-user).
 *
 * `refreshLink` (default true) gives a continued enrollment a link that
 * works for 7 more days, as the product link always did. The admin side
 * passes false: it only reports whether the link works and sends a new one
 * through send-link.
 */
export async function startOrContinue(
  db: SupabaseClient,
  input: { tenantId: string; productId: string; userId: string | null; childId?: string | null; refreshLink?: boolean },
): Promise<StartOrContinue> {
  if (!input.userId) return { kind: 'start' };

  let query = db
    .from('enrollments')
    .select('id, status, enrollment_token, token_expires_at, created_at, child_id')
    .eq('tenant_id', input.tenantId)
    .eq('user_id', input.userId)
    .eq('product_id', input.productId);
  query = input.childId ? query.eq('child_id', input.childId) : query.is('child_id', null);
  // Several rows are normal (history, or older duplicates): never .single().
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw new Error(`Could not check existing enrollments: ${error.message}`);
  const rows = (data ?? []) as EnrollmentRow[];

  const current = rows.find((e) => e.status === 'active' || e.status === 'completed');
  if (current) return { kind: 'already_enrolled', enrollment: current };

  const suspended = rows.find((e) => e.status === 'suspended');
  if (suspended) return { kind: 'suspended', enrollment: suspended };

  const open = rows.find((e) => (OPEN_STATUSES as readonly string[]).includes(e.status));
  if (open) {
    if (input.refreshLink !== false) await refreshLink(db, open);
    return { kind: 'continue', enrollment: open };
  }

  return { kind: 'start' };
}

/** A link that works for 7 more days (a new one if there was none). Updates `row` in place. */
async function refreshLink(db: SupabaseClient, row: EnrollmentRow) {
  const update: Record<string, string> = {};
  if (!row.enrollment_token) update.enrollment_token = newEnrollmentToken();
  const expires = row.token_expires_at ? new Date(row.token_expires_at) : null;
  if (update.enrollment_token || !expires || expires < new Date()) {
    const fresh = new Date();
    fresh.setDate(fresh.getDate() + 7);
    update.token_expires_at = fresh.toISOString();
  }
  if (!Object.keys(update).length) return;
  const { error } = await db.from('enrollments').update(update).eq('id', row.id);
  if (!error) Object.assign(row, update);
}

/**
 * Enrollments (of the given ids) where money was taken or is being taken:
 * a payment row, or a schedule paid / being charged. Those are never
 * deleted or cancelled by the client.
 */
export async function enrollmentsWithMoney(db: SupabaseClient, ids: string[]): Promise<Set<string>> {
  const out = new Set<string>();
  if (!ids.length) return out;
  const [{ data: payments, error: payErr }, { data: schedules, error: schedErr }] = await Promise.all([
    db.from('payments').select('enrollment_id').in('enrollment_id', ids),
    db.from('payment_schedules').select('enrollment_id, status').in('enrollment_id', ids),
  ]);
  // Can't tell: treat all as paid, so nothing is deleted by mistake.
  if (payErr || schedErr) return new Set(ids);
  for (const p of payments ?? []) out.add((p as any).enrollment_id);
  const byEnrollment = new Map<string, ScheduleRow[]>();
  for (const s of (schedules ?? []) as any[]) {
    const list = byEnrollment.get(s.enrollment_id) ?? [];
    list.push(s);
    byEnrollment.set(s.enrollment_id, list);
  }
  for (const [id, list] of byEnrollment) if (hasPaymentStarted(list)) out.add(id);
  return out;
}
