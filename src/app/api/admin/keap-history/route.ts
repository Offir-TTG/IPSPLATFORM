import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { keapHistoryStatus } from '@/lib/keap/history';
import { keapMatches } from '@/lib/keap/matches';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;
const STATES = ['full', 'partial', 'unpaid', 'refunded', 'free'];

/**
 * GET /api/admin/keap-history — search the Keap order history (read-only).
 *   ?q=      name, email, phone, product or order number
 *   ?state=  full | partial | unpaid | refunded | free
 *   ?product= one product name   ?year= 2021   ?page= 1
 *   ?meta=1  also: connection, totals and the product list
 * When every result belongs to one email, `client` sums that client's history.
 */
export async function GET(request: NextRequest) {
  const auth = await verifyTenantAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const tenantId = auth.tenant.id;
  const db = createAdminClient();
  const sp = new URL(request.url).searchParams;

  const q = (sp.get('q') ?? '').trim().toLowerCase().slice(0, 120);
  const state = sp.get('state') ?? '';
  const product = sp.get('product') ?? '';
  const year = Number(sp.get('year')) || 0;
  const page = Math.max(1, Number(sp.get('page')) || 1);

  // The search and the product/year filters; the state chips count within them.
  const narrow = (query: any) => {
    let out = query.eq('tenant_id', tenantId);
    if (q) out = out.ilike('search_text', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);
    if (product) out = out.contains('product_names', [product]);
    if (year >= 2000 && year <= 2100) out = out.gte('order_date', `${year}-01-01`).lt('order_date', `${year + 1}-01-01`);
    return out;
  };
  let query = narrow(
    db.from('keap_orders').select('keap_order_id, first_name, last_name, email, phone, title, pay_state, order_date, total, total_paid, currency, plan, product_names', { count: 'exact' }),
  );
  if (STATES.includes(state)) query = query.eq('pay_state', state);
  const countsPromise = Promise.all(
    ['', ...STATES].map(async (s) => {
      let c = narrow(db.from('keap_orders').select('id', { count: 'exact', head: true }));
      if (s) c = c.eq('pay_state', s);
      const { count: n } = await c;
      return [s || 'all', n ?? 0] as const;
    }),
  );
  const { data: rows, count, error } = await query
    .order('order_date', { ascending: false, nullsFirst: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // One client's history, when the search matches one email only.
  let client = null;
  const emails = new Set((rows ?? []).map((r: any) => (r.email ?? '').toLowerCase()).filter(Boolean));
  if (q && emails.size === 1 && (count ?? 0) > 0) {
    const email = String([...emails][0]);
    const { data: all } = await db.from('keap_orders').select('first_name, last_name, total_paid, refund_total, order_date, currency').eq('tenant_id', tenantId).ilike('email', email);
    if (all?.length) {
      const dates = all.map((r: any) => r.order_date).filter(Boolean).sort();
      client = {
        name: `${all[0].first_name ?? ''} ${all[0].last_name ?? ''}`.trim(),
        email,
        orders: all.length,
        paid: Math.round(all.reduce((s: number, r: any) => s + Number(r.total_paid) - Number(r.refund_total), 0) * 100) / 100,
        currency: all[0].currency ?? 'USD',
        since: dates[0] ?? null,
      };
    }
  }

  // Which buyers on this page are portal clients / contacts in the marketing CRM.
  const matches = await keapMatches(tenantId, (rows ?? []).map((r: any) => r.email));
  const withLinks = (rows ?? []).map((r: any) => ({ ...r, ...matches.of(r.email) }));

  let meta = null;
  if (sp.get('meta') === '1') {
    const status = await keapHistoryStatus(tenantId);
    // The product list for the filter (every order's product names, page by page).
    const names = new Set<string>();
    for (let from = 0; from < 50000; from += 1000) {
      const { data } = await db.from('keap_orders').select('product_names').eq('tenant_id', tenantId).range(from, from + 999);
      for (const r of data ?? []) for (const n of (r as any).product_names ?? []) names.add(n);
      if (!data || data.length < 1000) break;
    }
    meta = { ...status, products: [...names].sort((a, b) => a.localeCompare(b)) };
  }

  const counts = Object.fromEntries(await countsPromise);
  return NextResponse.json({ rows: withLinks, count: count ?? 0, counts, page, pageSize: PAGE_SIZE, client, meta, crmChecked: matches.crmChecked });
}
