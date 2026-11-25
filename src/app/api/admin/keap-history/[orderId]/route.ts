import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { keapMatches } from '@/lib/keap/matches';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/keap-history/<keap order id> — one Keap order (read-only):
 * the order, its payments, and how many card attempts failed.
 * ?failed=1 also lists the failed attempts.
 */
export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  const auth = await verifyTenantAdmin(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  const tenantId = auth.tenant.id;
  const orderId = Number(params.orderId);
  if (!Number.isFinite(orderId)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const db = createAdminClient();

  const { data: order, error } = await db.from('keap_orders').select('*').eq('tenant_id', tenantId).eq('keap_order_id', orderId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [{ data: payments }, { data: attempts }] = await Promise.all([
    db.from('keap_payments').select('keap_payment_id, pay_date, amount, pay_status, disputed, refund_of_payment_id').eq('tenant_id', tenantId).eq('keap_order_id', orderId).order('pay_date', { ascending: true }),
    db.from('keap_transactions').select('keap_transaction_id, transaction_date, amount, status, gateway').eq('tenant_id', tenantId).contains('order_ids', [orderId]).order('transaction_date', { ascending: true }),
  ]);
  const failed = (attempts ?? []).filter((t: any) => !/success/i.test(t.status ?? '') && !/deleted/i.test(t.status ?? ''));

  const matches = await keapMatches(tenantId, [order.email]);
  return NextResponse.json({
    order: { ...order, ...matches.of(order.email) },
    payments: payments ?? [],
    failedCount: failed.length,
    failed: new URL(request.url).searchParams.get('failed') === '1' ? failed : undefined,
  });
}
