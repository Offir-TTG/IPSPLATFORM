import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { planSubscriptionAmount } from '@/lib/payments/paymentEngine';
import { loadPriceChanges, readMemberPrice, upcomingForMember } from '@/lib/payments/subscriptionPrice';
import { addPeriod } from '@/lib/payments/invoiceService';
import { hasEnded, readSubscriptionDates, shiftPastPause } from '@/lib/payments/subscriptionState';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/enrollments/[id]/subscription-price
 * For a membership: what the member pays per period, and a scheduled change
 * that will reach them (null when none). `data` is null for enrollments that
 * aren't memberships.
 */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const db = createAdminClient();
  const { data: me } = await db.from('users').select('tenant_id, role').eq('id', user.id).maybeSingle();
  if (!me || !['admin', 'super_admin'].includes(me.role)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { data: enrollment } = await db.from('enrollments').select('*').eq('id', params.id).eq('tenant_id', me.tenant_id).maybeSingle();
  if (!enrollment) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  const { data: rows } = await db
    .from('payment_schedules')
    .select('payment_number, amount, currency, scheduled_date, status, payment_plan_id')
    .eq('enrollment_id', enrollment.id)
    .eq('payment_type', 'subscription')
    .order('payment_number', { ascending: false });
  const latest = (rows || []).find((r: any) => r.status !== 'cancelled' && r.status !== 'refunded');
  if (!latest) return NextResponse.json({ success: true, data: null });

  const planId: string | null = enrollment.payment_plan_id ?? latest.payment_plan_id ?? null;
  const { data: plan } = planId ? await db.from('payment_plans').select('*').eq('id', planId).maybeSingle() : { data: null };
  const { data: product } = await db.from('products').select('payment_plan').eq('id', enrollment.product_id).maybeSingle();
  const memberPrice = readMemberPrice(enrollment.subscription_price, planId);
  const samePlan = (latest.payment_plan_id ?? null) === planId;
  const amount = memberPrice?.amount ?? (samePlan ? Number(latest.amount) : planSubscriptionAmount(plan) ?? Number(latest.amount));
  const ended = enrollment.status === 'cancelled' || !!enrollment.subscription_ends_at;
  const upcoming = ended
    ? null
    : upcomingForMember(
        memberPrice ?? { amount, plan_id: planId, set_at: String(latest.scheduled_date).slice(0, 10) },
        await loadPriceChanges(db, [enrollment.product_id]),
        planId,
        planSubscriptionAmount(plan) !== null,
      );

  const interval = plan?.subscription_frequency || (product?.payment_plan as any)?.subscription_interval || 'monthly';

  // The next charge, as the client's billing page works it out: an unpaid
  // period is charged now; otherwise the next period starts when the paid one
  // ends (moved past a pause). None once the membership ends or is ending.
  const dates = readSubscriptionDates(enrollment);
  let nextCharge: Date | null = null;
  if (!ended && !hasEnded(dates)) {
    nextCharge = latest.status !== 'paid' ? new Date(latest.scheduled_date) : addPeriod(new Date(latest.scheduled_date), interval);
    nextCharge = shiftPastPause(nextCharge, dates);
  }
  const nextAmount =
    nextCharge && upcoming && String(upcoming.effective_date) <= nextCharge.toISOString().slice(0, 10) ? Number(upcoming.new_amount) : amount;

  return NextResponse.json({
    success: true,
    data: {
      amount,
      currency: String(latest.currency || enrollment.currency || 'USD').toUpperCase(),
      interval,
      upcoming: upcoming ? { amount: Number(upcoming.new_amount), effective_date: upcoming.effective_date } : null,
      /** When the next period is charged (null when ending or ended). */
      next_charge_date: nextCharge ? nextCharge.toISOString() : null,
      next_charge_amount: nextCharge ? nextAmount : null,
      /** The date it ends, when the member cancelled to the end of the period. */
      ends_at: enrollment.subscription_ends_at ?? null,
    },
  });
}
