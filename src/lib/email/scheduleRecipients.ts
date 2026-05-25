// Resolve an email_schedule's recipient_filter (JSONB) and/or
// recipient_ids (UUID[]) into the final list of user records that
// should receive a queued email. Applies the communication-eligible
// gate so suspended/inactive users are excluded.

import type { SupabaseClient } from '@supabase/supabase-js';
import { filterEligibleRecipientIds } from '@/lib/users/communication-eligible';

export interface RecipientFilter {
  /** Match against users.role. */
  role?: string;
  /** Match against users.status. */
  status?: string;
  /** Match against tenant_users.role. */
  tenant_role?: string;
  /** Restrict to users enrolled in this product. */
  product_id?: string;
  /** Restrict to users with this product type (program, course, ...). */
  product_type?: string;
  /** Free-text email match (ILIKE %term%). */
  email_contains?: string;
}

export interface ResolvedRecipient {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  preferred_language: string | null;
}

/**
 * Resolve a schedule's recipient configuration to a deduped list of
 * eligible recipients. Pass `dryRun=true` to skip the eligibility gate
 * — used by the preview endpoint when we want a raw count.
 */
export async function resolveScheduleRecipients(
  supabase: SupabaseClient,
  tenantId: string,
  options: {
    filter?: RecipientFilter | null;
    recipientIds?: string[] | null;
    dryRun?: boolean;
  },
): Promise<ResolvedRecipient[]> {
  const { filter, recipientIds, dryRun } = options;

  const ids = new Set<string>();
  const hasFilter = filter && Object.keys(filter).length > 0;
  const hasIds = (recipientIds?.length ?? 0) > 0;

  // 0. "All users" — no filter, no explicit ids. Fetch every user in
  // the tenant. Without this, mode='all' would return zero.
  if (!hasFilter && !hasIds) {
    const { data: all, error } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId);
    if (error) {
      console.error('[scheduleRecipients] all-users query failed:', error);
    } else {
      for (const row of all ?? []) {
        if (row.id) ids.add(row.id);
      }
    }
  }

  // 1. Explicit recipient_ids (always included).
  for (const id of recipientIds ?? []) {
    if (id) ids.add(id);
  }

  // 2. recipient_filter → resolve to user ids.
  if (hasFilter) {
    let query = supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId);

    if (filter.role) query = query.eq('role', filter.role);
    if (filter.status) query = query.eq('status', filter.status);
    if (filter.email_contains) {
      query = query.ilike('email', `%${filter.email_contains}%`);
    }

    const { data: matched, error } = await query;
    if (error) {
      console.error('[scheduleRecipients] user filter query failed:', error);
    } else {
      for (const row of matched ?? []) {
        if (row.id) ids.add(row.id);
      }
    }

    // tenant_role / product filters: post-narrow the set.
    if (filter.tenant_role && ids.size > 0) {
      const { data: tu } = await supabase
        .from('tenant_users')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('role', filter.tenant_role)
        .in('user_id', Array.from(ids));
      const keep = new Set((tu ?? []).map((r: any) => r.user_id));
      for (const id of Array.from(ids)) {
        if (!keep.has(id)) ids.delete(id);
      }
    }

    if ((filter.product_id || filter.product_type) && ids.size > 0) {
      let enrQuery = supabase
        .from('enrollments')
        .select('user_id, product:products(type)')
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .in('user_id', Array.from(ids));
      if (filter.product_id) enrQuery = enrQuery.eq('product_id', filter.product_id);
      const { data: enr } = await enrQuery;
      const keep = new Set(
        (enr ?? [])
          .filter((r: any) =>
            !filter.product_type ||
            (Array.isArray(r.product) ? r.product[0]?.type : r.product?.type) === filter.product_type,
          )
          .map((r: any) => r.user_id),
      );
      for (const id of Array.from(ids)) {
        if (!keep.has(id)) ids.delete(id);
      }
    }
  }

  if (ids.size === 0) return [];

  // 3. Communication-eligible gate (unless preview).
  const eligibleIds = dryRun
    ? Array.from(ids)
    : await filterEligibleRecipientIds(supabase, Array.from(ids));

  if (eligibleIds.length === 0) return [];

  // 4. Hydrate to the final recipient records.
  const { data: rows, error: hydrateErr } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, preferred_language')
    .in('id', eligibleIds);

  if (hydrateErr) {
    console.error('[scheduleRecipients] hydrate query failed:', hydrateErr);
    return [];
  }

  return (rows ?? [])
    .filter((r: any) => !!r.email)
    .map((r: any) => ({
      user_id: r.id,
      email: r.email,
      first_name: r.first_name ?? null,
      last_name: r.last_name ?? null,
      preferred_language: r.preferred_language ?? null,
    }));
}
