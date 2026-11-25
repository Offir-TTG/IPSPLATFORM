import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Keap history badges: whether a Keap buyer's email is a client in this
 * portal, or a contact in the marketing site's CRM (IParentingSchool, asked
 * read-only over its lookup endpoint). Used by the list and the drawer.
 */

export type KeapMatches = {
  portal_user: { id: string; href: string } | null;
  crm_contact: { id: string; href: string; archived: boolean } | null;
};

const crmBase = () => (process.env.IPARENTING_URL ?? process.env.NEXT_PUBLIC_IPARENTING_URL ?? '').replace(/\/$/, '');

/** Portal users of this tenant with these emails. */
async function portalUsersByEmail(tenantId: string, emails: string[]) {
  const db = createAdminClient();
  const out = new Map<string, { id: string }>();
  if (!emails.length) return out;
  const { data } = await db.from('users').select('id, email').eq('tenant_id', tenantId).in('email', emails);
  for (const u of data ?? []) if (u.email) out.set(String(u.email).toLowerCase(), { id: u.id });
  // Emails saved with capitals.
  for (const e of emails.filter((x) => !out.has(x)).slice(0, 25)) {
    const { data: m } = await db.from('users').select('id').eq('tenant_id', tenantId).ilike('email', e).limit(1);
    if (m?.[0]) out.set(e, { id: m[0].id });
  }
  return out;
}

/** Contacts in the marketing site's CRM with these emails; null when it can't be asked. */
async function crmContactsByEmail(emails: string[]): Promise<Map<string, { id: string; archived: boolean }> | null> {
  const base = crmBase();
  const secret = process.env.CRM_LOOKUP_SECRET;
  if (!base || !secret) return null;
  if (!emails.length) return new Map();
  try {
    const res = await fetch(`${base}/api/admin/persons/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ emails }),
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return new Map((json.matches ?? []).map((m: any) => [String(m.email).toLowerCase(), { id: m.id, archived: !!m.archived }]));
  } catch {
    return null;
  }
}

/** Matches for these emails, keyed by lower-case email. `crmChecked` is false when the CRM didn't answer. */
export async function keapMatches(tenantId: string, rawEmails: Array<string | null | undefined>) {
  const emails = [...new Set(rawEmails.map((e) => (e ?? '').trim().toLowerCase()).filter(Boolean))];
  const [portal, crm] = await Promise.all([portalUsersByEmail(tenantId, emails), crmContactsByEmail(emails)]);
  const base = crmBase();
  const byEmail = new Map<string, KeapMatches>();
  for (const e of emails) {
    const p = portal.get(e);
    const c = crm?.get(e);
    byEmail.set(e, {
      portal_user: p ? { id: p.id, href: `/admin/users/${p.id}` } : null,
      crm_contact: c && base ? { id: c.id, href: `${base}/admin/crm/contacts/${c.id}`, archived: c.archived } : null,
    });
  }
  const of = (email: string | null | undefined): KeapMatches => byEmail.get((email ?? '').trim().toLowerCase()) ?? { portal_user: null, crm_contact: null };
  return { of, crmChecked: crm !== null };
}
