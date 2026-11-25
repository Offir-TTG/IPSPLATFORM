import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBusinessCurrency } from '@/lib/tenant/currency';

export const dynamic = 'force-dynamic';

/** A payment row that is money received (failed / pending tries are not). */
const NOT_RECEIVED = new Set(['pending', 'processing', 'failed', 'cancelled', 'canceled']);
/** A schedule still to be paid. Same list as the admin dashboard. */
const OPEN_SCHEDULE = new Set(['pending', 'processing', 'adjusted', 'paused', 'failed', 'overdue']);
/** An open schedule whose date has passed, or whose charge failed, is late. */
const LATE_STATUS = new Set(['pending', 'failed', 'overdue']);

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? 0));
  return Number.isFinite(n) ? n : 0;
};
/** Money is added in cents, so the totals have no floating-point dust. */
const cents = (v: unknown) => Math.round(num(v) * 100);

/** Every row of a query, not just the first 1,000 the API returns at once. */
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const size = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < size) return rows;
  }
}

type PaymentRow = { amount: number | string | null; status: string | null; refunded_amount: number | string | null; paid_at: string | null; created_at: string | null; metadata: Record<string, unknown> | null };
type ScheduleRow = { enrollment_id: string | null; amount: number | string | null; status: string | null; scheduled_date: string | null };
type EnrollmentRow = { id: string; status: string | null; payment_status: string | null };

/**
 * GET /api/admin/payments/reports/stats: the numbers on the Payments page.
 *
 * Money in and out comes from the payments ledger (one row per charge,
 * card or recorded by hand, with or without an enrollment), not from the
 * schedules, which are the plan of what should be paid:
 *   total revenue = every payment received, before refunds
 *   refunds       = money given back (refunds, plus disputes lost to the bank)
 *   net revenue   = total revenue - refunds
 * Pending and overdue come from the schedules of enrollments that still exist
 * and are not cancelled.
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role, tenant_id').eq('id', user.id).single();
    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const tenantId = userData.tenant_id;

    const [payments, schedules, enrollments, disputes, currency] = await Promise.all([
      all<PaymentRow>((a, b) =>
        supabase.from('payments').select('amount, status, refunded_amount, paid_at, created_at, metadata').eq('tenant_id', tenantId).order('id').range(a, b),
      ),
      all<ScheduleRow>((a, b) =>
        supabase.from('payment_schedules').select('enrollment_id, amount, status, scheduled_date').eq('tenant_id', tenantId).order('id').range(a, b),
      ),
      all<EnrollmentRow>((a, b) => supabase.from('enrollments').select('id, status, payment_status').eq('tenant_id', tenantId).order('id').range(a, b)),
      all<{ amount: number | string | null }>((a, b) =>
        supabase.from('payment_disputes').select('amount').eq('tenant_id', tenantId).eq('status', 'lost').order('id').range(a, b),
      ),
      getBusinessCurrency(tenantId),
    ]);

    // ── Money received and given back ──────────────────────────────────
    const received = payments.filter((p) => !NOT_RECEIVED.has(String(p.status ?? '').toLowerCase()));
    const grossCents = received.reduce((s, p) => s + cents(p.amount), 0);
    const refundCents = received.reduce((s, p) => s + cents(p.refunded_amount), 0);
    const lostDisputeCents = disputes.reduce((s, d) => s + cents(d.amount), 0);
    const totalRefundsCents = refundCents + lostDisputeCents;

    // When a payment came in: the charge time, else the date typed in for a
    // payment recorded by hand, else when the row was written.
    const whenPaid = (p: PaymentRow) => {
      const iso = p.paid_at || (typeof p.metadata?.payment_date === 'string' ? p.metadata.payment_date : null) || p.created_at;
      return iso ? new Date(iso) : null;
    };
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const receivedBetween = (from: Date, to: Date) =>
      received.reduce((s, p) => {
        const d = whenPaid(p);
        return d && d >= from && d < to ? s + cents(p.amount) : s;
      }, 0);
    const thisMonthCents = receivedBetween(thisMonthStart, new Date(8.64e15));
    const lastMonthCents = receivedBetween(lastMonthStart, thisMonthStart);
    const revenueGrowth = lastMonthCents > 0 ? ((thisMonthCents - lastMonthCents) / lastMonthCents) * 100 : 0;

    // ── Still to be paid ───────────────────────────────────────────────
    // Only schedules of live enrollments: a cancelled or deleted enrollment
    // owes nothing more.
    const live = new Set(
      enrollments.filter((e) => e.status !== 'cancelled' && !['cancelled', 'refunded'].includes(e.payment_status ?? '')).map((e) => e.id),
    );
    const open = schedules.filter((s) => s.enrollment_id && live.has(s.enrollment_id) && OPEN_SCHEDULE.has(s.status ?? ''));
    const overdue = open.filter(
      (s) => s.status === 'failed' || s.status === 'overdue' || (LATE_STATUS.has(s.status ?? '') && s.scheduled_date && new Date(s.scheduled_date) < now),
    );

    return NextResponse.json({
      currency,
      totalRevenue: grossCents / 100,
      netRevenue: (grossCents - totalRefundsCents) / 100,
      totalRefunds: totalRefundsCents / 100,
      refundsOnly: refundCents / 100,
      lostDisputes: lostDisputeCents / 100,
      activeEnrollments: live.size,
      pendingPayments: open.length,
      pendingAmount: open.reduce((s, x) => s + cents(x.amount), 0) / 100,
      overduePayments: overdue.length,
      overdueAmount: overdue.reduce((s, x) => s + cents(x.amount), 0) / 100,
      thisMonthRevenue: thisMonthCents / 100,
      revenueGrowth: parseFloat(revenueGrowth.toFixed(1)),
    });
  } catch (error) {
    console.error('Error in GET /api/admin/payments/reports/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
