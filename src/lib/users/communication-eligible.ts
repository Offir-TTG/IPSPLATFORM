/**
 * Communication-eligibility gate.
 *
 * Rule (decided 2026-05-19): a user receives NO email/notification/
 * message when tenant_users.status ∈ ('inactive', 'suspended').
 *
 * `invited` is explicitly ALLOWED — the invitation email itself goes to
 * users with that status and must continue to arrive.
 *
 * Source of truth is `tenant_users.status` only. An earlier draft of
 * this helper also read `users.is_active`, but that column does not
 * exist on `public.users` (the admin status-change route writes to it
 * but it's a no-op against the actual schema). Querying it caused
 * every helper call to error and either fail-open (comms) or
 * fail-closed (login).
 *
 * Two entry points: a batch filter for recipient-list builders, and a
 * single-user check for transactional sends (password reset, resend
 * invitation, etc.).
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** tenant_users.status values that block all communication. */
const BLOCKED_TENANT_STATUSES = new Set(['inactive', 'suspended']);

/**
 * Given a list of user ids, return only those eligible to receive
 * communication. Loses the order of the input on purpose — callers
 * that need ordering should re-sort by the returned set.
 *
 * Safe defaults:
 *   • Missing tenant_users link → treated as eligible (some legacy
 *     users pre-date the tenant_users table; the blanket block
 *     would be more harmful than letting them through).
 *   • DB error → returns the input list unchanged so a transient
 *     query failure doesn't silently suppress every send. Errors are
 *     logged so they're visible.
 */
export async function filterEligibleRecipientIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<string[]> {
  if (!userIds || userIds.length === 0) return [];

  // De-dup so we don't waste rows on accidental duplicates.
  const uniqueIds = Array.from(new Set(userIds));

  // Query tenant_users directly — that's the canonical status row.
  // Joining via users would force a (non-existent) is_active column
  // into the select and PostgREST would 400 the whole request.
  const { data, error } = await supabase
    .from('tenant_users')
    .select('user_id, status')
    .in('user_id', uniqueIds);

  if (error) {
    console.error(
      '[communication-eligible] query failed; passing through ids unchanged:',
      error.message,
    );
    return uniqueIds;
  }
  if (!data) return uniqueIds;

  // Build a lookup of blocked user_ids. A user can have multiple
  // tenant_users rows (multi-tenant membership); we block as soon as
  // ANY of them is inactive/suspended — same conservative posture as
  // login: if you're suspended anywhere, comms stop.
  const blockedIds = new Set<string>();
  for (const row of data as Array<{ user_id: string; status: string | null }>) {
    if (row.status && BLOCKED_TENANT_STATUSES.has(row.status)) {
      blockedIds.add(row.user_id);
    }
  }

  return uniqueIds.filter((id) => !blockedIds.has(id));
}

/**
 * Single-user variant used by transactional sends. Returns true when
 * the user is eligible. On DB error returns `true` for the same
 * reason as the batch helper (don't silently suppress).
 */
export async function isUserEligibleForCommunication(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  if (!userId) return false;
  const eligible = await filterEligibleRecipientIds(supabase, [userId]);
  return eligible.length > 0;
}

/**
 * Login-time eligibility check. STRICTER than comms eligibility:
 *   • Communication allows `invited` (so the invite email lands).
 *   • Login REQUIRES `active` — invited users must complete the
 *     invitation flow first, they don't get to sign in directly.
 *
 * Returns a structured result so the login route can show a
 * meaningful message ("your account is suspended" vs "your
 * invitation hasn't been accepted yet").
 *
 * On DB error returns ok:false with reason 'unknown' — we DO want
 * to fail closed on login (unlike send paths, where false-blocking
 * has worse UX than false-allowing).
 */
export type LoginEligibility =
  | { ok: true }
  | { ok: false; reason: 'inactive' | 'suspended' | 'invited' | 'not_found' | 'unknown' };

export async function canUserLogIn(
  supabase: SupabaseClient,
  userId: string,
  /** Tenant the user is trying to access. When provided, the
   *  tenant_users.status check is scoped to this tenant — important
   *  for users who belong to multiple orgs (active in one, suspended
   *  in another should still get the suspended message for the
   *  suspended-tenant login attempt). */
  tenantId?: string,
): Promise<LoginEligibility> {
  if (!userId) return { ok: false, reason: 'not_found' };

  // Resolve the tenant_users status. Filter by tenantId when caller
  // supplied one; otherwise grab the first row (legacy behaviour).
  // We deliberately don't pre-check public.users — that table has no
  // is_active column in the live schema, and the user existence check
  // happens implicitly via the tenant_users row.
  let tuQuery = supabase
    .from('tenant_users')
    .select('status')
    .eq('user_id', userId)
    .limit(1);
  if (tenantId) {
    tuQuery = tuQuery.eq('tenant_id', tenantId);
  }
  const { data: tuRow, error: tuErr } = await tuQuery.maybeSingle();

  if (tuErr) {
    console.error('[canUserLogIn] tenant_users query failed; failing closed:', tuErr.message);
    return { ok: false, reason: 'unknown' };
  }

  const status = (tuRow as { status?: string } | null)?.status;

  // No row in this tenant → not a member (let the caller's tenant-
  // membership step surface a generic "no access" message).
  if (tenantId && !tuRow) return { ok: false, reason: 'not_found' };

  // Legacy users with no tenant_users row at all (no tenantId asked) —
  // treat as eligible.
  if (!status) return { ok: true };

  if (status === 'suspended') return { ok: false, reason: 'suspended' };
  if (status === 'inactive') return { ok: false, reason: 'inactive' };
  if (status === 'invited') return { ok: false, reason: 'invited' };
  return { ok: true };
}
