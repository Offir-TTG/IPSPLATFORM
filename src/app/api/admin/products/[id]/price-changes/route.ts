import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { planSubscriptionAmount } from '@/lib/payments/paymentEngine';
import { loadPriceChanges, readMemberPrice } from '@/lib/payments/subscriptionPrice';

export const dynamic = 'force-dynamic';

/** Enrollments that are still paying (same as the renewal job, invoiceService COLLECTING). */
const COLLECTING = ['active', 'suspended'];

async function adminTenant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: me } = await admin.from('users').select('tenant_id, role').eq('id', user.id).maybeSingle();
  if (!me || !['admin', 'super_admin'].includes(me.role)) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) };
  }
  return { admin, tenantId: me.tenant_id as string, userId: user.id };
}

/** The product and the prices a change can target: the product price and each subscription plan with its own price. */
async function loadPricing(admin: any, tenantId: string, productId: string) {
  const { data: product } = await admin
    .from('products')
    .select('id, title, price, currency, payment_model, default_payment_plan_id, alternative_payment_plan_ids, tenant_id')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!product) return null;
  const planIds = [product.default_payment_plan_id, ...(product.alternative_payment_plan_ids || [])].filter(Boolean);
  const { data: plans } = planIds.length
    ? await admin.from('payment_plans').select('*').in('id', planIds).eq('plan_type', 'subscription')
    : { data: [] as any[] };
  return { product, plans: (plans || []) as any[] };
}

/**
 * GET /api/admin/products/[id]/price-changes
 * The membership prices of a product (the product price, and each
 * subscription plan's own price), how many members pay each, and the
 * scheduled changes.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminTenant();
  if ('error' in auth) return auth.error;
  const { admin, tenantId } = auth;

  const pricing = await loadPricing(admin, tenantId, params.id);
  if (!pricing) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  const { product, plans } = pricing;
  const isSubscription = product.payment_model === 'subscription' || plans.length > 0;

  // Members still paying, grouped by the price target they're on.
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('id, status, payment_plan_id, subscription_price, subscription_ends_at')
    .eq('product_id', product.id)
    .in('status', COLLECTING);
  const ownPricePlans = new Set(plans.filter((p) => planSubscriptionAmount(p) !== null).map((p) => p.id));
  const memberCount = (planId: string | null) =>
    (enrollments || []).filter((e: any) => {
      if (e.subscription_ends_at) return false;
      const onOwnPricePlan = e.payment_plan_id && ownPricePlans.has(e.payment_plan_id);
      return planId ? e.payment_plan_id === planId : !onOwnPricePlan;
    }).length;

  const targets = [
    // The product price is used by members whose plan has no price of its own.
    { payment_plan_id: null, label: null, amount: Number(product.price) || 0, frequency: plans.find((p) => !ownPricePlans.has(p.id))?.subscription_frequency || 'monthly', members: memberCount(null) },
    ...plans
      .filter((p) => ownPricePlans.has(p.id))
      .map((p) => ({ payment_plan_id: p.id, label: p.plan_name, amount: planSubscriptionAmount(p) as number, frequency: p.subscription_frequency || 'monthly', members: memberCount(p.id) })),
  ];

  const changes = await loadPriceChanges(admin, [product.id]);
  return NextResponse.json({
    success: true,
    data: {
      is_subscription: isSubscription,
      currency: product.currency || 'USD',
      targets,
      changes: changes.sort((a, b) => a.effective_date.localeCompare(b.effective_date)),
    },
  });
}

/**
 * POST /api/admin/products/[id]/price-changes
 * Schedules a change: { payment_plan_id | null, new_amount, effective_date,
 * applies_to: 'new' | 'all', notice_days }.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminTenant();
  if ('error' in auth) return auth.error;
  const { admin, tenantId, userId } = auth;

  const pricing = await loadPricing(admin, tenantId, params.id);
  if (!pricing) return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
  const { product, plans } = pricing;

  const body = await request.json().catch(() => ({}));
  const planId: string | null = body.payment_plan_id || null;
  const newAmount = Math.round(Number(body.new_amount) * 100) / 100;
  const appliesTo = body.applies_to === 'all' ? 'all' : body.applies_to === 'new' ? 'new' : null;
  const noticeDays = Number.isInteger(Number(body.notice_days)) ? Number(body.notice_days) : 30;
  const effectiveDate = typeof body.effective_date === 'string' ? body.effective_date.slice(0, 10) : '';

  const errors: Record<string, string> = {};
  if (!(newAmount > 0)) errors.new_amount = 'price_required';
  if (!appliesTo) errors.applies_to = 'applies_to_required';
  if (noticeDays < 0 || noticeDays > 365) errors.notice_days = 'notice_invalid';
  const today = new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || effectiveDate <= today) errors.effective_date = 'date_future';
  else if (appliesTo === 'all') {
    const earliest = new Date(Date.now() + noticeDays * 86400000).toISOString().slice(0, 10);
    if (effectiveDate < earliest) errors.effective_date = 'date_notice';
  }

  const plan = planId ? plans.find((p) => p.id === planId) : null;
  if (planId && (!plan || planSubscriptionAmount(plan) === null)) errors.payment_plan_id = 'plan_invalid';
  const oldAmount = plan ? (planSubscriptionAmount(plan) as number) : Number(product.price) || 0;
  if (newAmount > 0 && newAmount === oldAmount) errors.new_amount = 'same_price';

  // One scheduled change per price at a time.
  const pending = (await loadPriceChanges(admin, [product.id])).find((c) => !c.applied_at && (c.payment_plan_id ?? null) === planId);
  if (pending) errors.effective_date = 'already_scheduled';

  if (Object.keys(errors).length) return NextResponse.json({ success: false, errors }, { status: 400 });

  const { data, error } = await admin
    .from('subscription_price_changes')
    .insert({
      tenant_id: tenantId,
      product_id: product.id,
      payment_plan_id: planId,
      old_amount: oldAmount,
      new_amount: newAmount,
      currency: product.currency || 'USD',
      effective_date: effectiveDate,
      applies_to: appliesTo,
      notice_days: noticeDays,
      created_by: userId,
    })
    .select()
    .single();
  if (error) {
    console.error('Failed to schedule price change:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, data });
}
