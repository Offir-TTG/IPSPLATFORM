/**
 * Coaching packs through the normal enrollment flow, so it works for a parent
 * who has no portal account yet:
 *
 *   admin opens a pack → enrollment (parent's account, or only their name and
 *   email when they're new) → the enrollment link is emailed → the wizard
 *   creates the account at the end → the child record is created under it.
 *
 * Until the account exists, the child's details wait on the enrollment in
 * payment_metadata.pending_child (wizard_profile_data is rewritten by the
 * wizard's profile step, so it can't hold them).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server';

export type PendingChild = { first_name: string; last_name: string | null; birth_year: number | null };

type Fail = { ok: false; status: number; error: string };
const fail = (status: number, error: string): Fail => ({ ok: false, status, error });

export function cleanPendingChild(raw: any): PendingChild | { error: string } {
  const first = String(raw?.first_name ?? '').trim();
  if (!first || first.length > 80) return { error: "The child's first name is required" };
  const last = raw?.last_name ? String(raw.last_name).trim().slice(0, 80) || null : null;
  const yearRaw = raw?.birth_year ?? (raw?.age != null && raw.age !== '' ? new Date().getFullYear() - Number(raw.age) : null);
  const year = yearRaw == null || yearRaw === '' ? null : Number(yearRaw);
  const thisYear = new Date().getFullYear();
  if (year !== null && (!Number.isInteger(year) || year < thisYear - 30 || year > thisYear)) {
    return { error: "The child's age is not valid" };
  }
  return { first_name: first, last_name: last, birth_year: year };
}

/**
 * Checks the coaching part of an admin "open pack" request before the
 * enrollment is created. Returns what to store on the enrollment.
 */
export async function prepareCoaching(
  supabase: SupabaseClient,
  tenantId: string,
  input: { coach_id?: string | null; child_id?: string | null; child?: unknown; parentUserId: string | null },
): Promise<{ ok: true; coach_id: string | null; child_id: string | null; pending_child: PendingChild | null } | Fail> {
  let coachId: string | null = null;
  if (input.coach_id) {
    const { data: coach } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', input.coach_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (!coach || !['instructor', 'admin', 'super_admin'].includes(coach.role)) {
      return fail(400, 'Choose a coach from the team');
    }
    coachId = coach.id;
  }

  if (input.child_id) {
    if (!input.parentUserId) return fail(400, 'An existing child needs the parent’s account');
    const { data: child } = await supabase
      .from('children')
      .select('id, parent_user_id, archived_at')
      .eq('id', input.child_id)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (!child || child.parent_user_id !== input.parentUserId || child.archived_at) {
      return fail(400, 'This child does not belong to the chosen parent');
    }
    return { ok: true, coach_id: coachId, child_id: child.id, pending_child: null };
  }

  if (input.child) {
    const clean = cleanPendingChild(input.child);
    if ('error' in clean) return fail(400, clean.error);
    return { ok: true, coach_id: coachId, child_id: null, pending_child: clean };
  }

  return { ok: true, coach_id: coachId, child_id: null, pending_child: null };
}

/**
 * Creates the waiting child under the parent's account and links the
 * enrollment. Runs right after an admin opens a pack for an existing parent,
 * and when the wizard creates a new parent's account. Safe to call twice.
 */
export async function attachPendingChild(
  enrollmentId: string,
  parentUserId: string,
): Promise<{ ok: true; child_id: string | null } | Fail> {
  const supabase = createAdminClient();
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, tenant_id, child_id, payment_metadata')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment) return fail(404, 'Enrollment not found');
  if (enrollment.child_id) return { ok: true, child_id: enrollment.child_id };
  const meta = (enrollment.payment_metadata ?? {}) as Record<string, any>;
  const pending = meta.pending_child as PendingChild | undefined;
  if (!pending?.first_name) return { ok: true, child_id: null };

  // The parent may already have this child (e.g. added it in the portal).
  const { data: existing } = await supabase
    .from('children')
    .select('id, first_name, birth_year')
    .eq('parent_user_id', parentUserId)
    .is('archived_at', null);
  const same = (existing ?? []).find(
    (c: any) => c.first_name.trim().toLowerCase() === pending.first_name.trim().toLowerCase() &&
      (c.birth_year ?? null) === (pending.birth_year ?? null),
  );

  let childId = same?.id as string | undefined;
  if (!childId) {
    const { data: created, error } = await supabase
      .from('children')
      .insert({
        tenant_id: enrollment.tenant_id,
        parent_user_id: parentUserId,
        first_name: pending.first_name,
        last_name: pending.last_name,
        birth_year: pending.birth_year,
      })
      .select('id')
      .single();
    if (error || !created) return fail(500, error?.message ?? 'Child not saved');
    childId = created.id;
  }

  const { pending_child: _done, ...rest } = meta;
  const { error: linkError } = await supabase
    .from('enrollments')
    .update({ child_id: childId, payment_metadata: { ...rest, child_linked_at: new Date().toISOString() } })
    .eq('id', enrollmentId);
  if (linkError) return fail(500, linkError.message);
  return { ok: true, child_id: childId! };
}

/** The request this pack answers is done. */
export async function markRequestHandled(tenantId: string, requestId: string, adminId: string) {
  await createAdminClient()
    .from('coaching_requests')
    .update({ status: 'handled', handled_by: adminId, handled_at: new Date().toISOString() })
    .eq('id', requestId)
    .eq('tenant_id', tenantId);
}
