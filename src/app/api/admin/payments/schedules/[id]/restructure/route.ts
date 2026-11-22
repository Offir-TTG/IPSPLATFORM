import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { logAuditEvent } from '@/lib/audit/logger';
import { getStripeClient } from '@/lib/payments/getStripeClient';
import { closeUnpaidInvoice } from '@/lib/payments/refunds';
import { refreshEnrollmentTotals } from '@/lib/payments/dueSchedules';

export const dynamic = 'force-dynamic';

/** 31 January plus one month is 28/29 February, not 3 March. */
function addMonthsClamped(date: Date, months: number): Date {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

/**
 * POST /api/admin/payments/schedules/[id]/restructure
 * Restructure payment plan - change number of installments
 *
 * This endpoint:
 * 1. Validates the enrollment and calculates remaining balance
 * 2. Cancels all pending/overdue/adjusted schedules
 * 3. Creates new schedules with recalculated amounts
 * 4. Updates the enrollment record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();
    const enrollmentId = params.id;

    // Get request body
    const body = await request.json();
    const { new_installment_count, start_date, reason } = body;

    if (!new_installment_count || new_installment_count < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid installment count' },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { success: false, error: 'Start date is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('tenant_id', tenant.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Get all payment schedules for this enrollment
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('payment_number', { ascending: true });

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No payment schedules found for this enrollment' },
        { status: 404 }
      );
    }

    const count = Math.floor(Number(new_installment_count));
    if (!Number.isFinite(count) || count < 1 || count > 60) {
      return NextResponse.json({ success: false, error: 'Invalid installment count' }, { status: 400 });
    }
    const baseDate = new Date(start_date);
    if (Number.isNaN(baseDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid start date' }, { status: 400 });
    }
    if (schedules.some((s) => s.payment_type === 'subscription')) {
      return NextResponse.json(
        { success: false, error: 'Subscriptions renew each period and cannot be split into installments' },
        { status: 400 }
      );
    }
    if (schedules.some((s) => s.status === 'processing')) {
      return NextResponse.json(
        { success: false, error: 'A payment is being charged right now. Wait for the result, then restructure.' },
        { status: 409 }
      );
    }

    // What's still to collect is exactly the unpaid payments being replaced,
    // failed ones included, so no money is counted twice. Paid, cancelled,
    // refunded and paused payments are left as they are.
    const REPLACEABLE = ['pending', 'overdue', 'adjusted', 'failed'];
    const pendingSchedules = schedules.filter((s) => REPLACEABLE.includes(s.status));
    const remainingCents = pendingSchedules.reduce((sum, s) => sum + Math.round(Number(s.amount) * 100), 0);

    if (remainingCents <= 0) {
      return NextResponse.json(
        { success: false, error: 'No remaining balance to restructure' },
        { status: 400 }
      );
    }

    // Make sure nothing being replaced was paid in the meantime, then make
    // its Stripe invoice or open charge unpayable so it can't be collected
    // on top of the new installments.
    const { stripe } = await getStripeClient(tenant.id).catch(() => ({ stripe: null as any }));
    if (stripe) {
      for (const s of pendingSchedules) {
        if (s.stripe_payment_intent_id && !s.stripe_invoice_id) {
          const intent = await stripe.paymentIntents.retrieve(s.stripe_payment_intent_id).catch(() => null);
          if (intent?.status === 'succeeded' || intent?.status === 'processing') {
            return NextResponse.json(
              { success: false, error: `Payment #${s.payment_number} was just paid by the client. Refresh and try again.` },
              { status: 409 }
            );
          }
        }
        if (s.stripe_invoice_id) {
          const invoice = await stripe.invoices.retrieve(s.stripe_invoice_id).catch(() => null);
          if (invoice?.status === 'paid') {
            return NextResponse.json(
              { success: false, error: `Payment #${s.payment_number} was just paid. Refresh and try again.` },
              { status: 409 }
            );
          }
        }
      }
      for (const s of pendingSchedules) {
        if (s.stripe_invoice_id) {
          const closed = await closeUnpaidInvoice(stripe, s.stripe_invoice_id);
          if (typeof closed === 'object') {
            return NextResponse.json(
              { success: false, error: `Could not close the Stripe invoice for payment #${s.payment_number}: ${closed.error}` },
              { status: 502 }
            );
          }
        } else if (s.stripe_payment_intent_id) {
          await stripe.paymentIntents.cancel(s.stripe_payment_intent_id).catch(() => null);
        }
      }
    } else if (pendingSchedules.some((s) => s.stripe_invoice_id)) {
      return NextResponse.json(
        { success: false, error: 'Stripe is not set up, so the open invoices cannot be closed' },
        { status: 400 }
      );
    }

    // The replaced payments are kept as cancelled, for the history.
    const scheduleIdsToDelete = pendingSchedules.map((s) => s.id);
    const nowIso = new Date().toISOString();
    const { error: cancelError } = await supabase
      .from('payment_schedules')
      .update({ status: 'cancelled', adjustment_reason: `Restructured: ${reason}`, updated_at: nowIso })
      .in('id', scheduleIdsToDelete)
      .in('status', REPLACEABLE);
    if (cancelError) {
      throw new Error(`Failed to cancel the old payments: ${cancelError.message}`);
    }

    // New installments, numbered after every existing payment, in whole cents;
    // the last one takes the rounding difference.
    const startingPaymentNumber = Math.max(0, ...schedules.map((s) => Number(s.payment_number) || 0)) + 1;
    const currency = schedules[0].currency || 'USD';
    const payment_plan_id = schedules[0].payment_plan_id;
    const baseCents = Math.floor(remainingCents / count);
    const newInstallmentAmount = baseCents / 100;

    const newSchedules = [];
    for (let i = 0; i < count; i++) {
      const scheduledDate = addMonthsClamped(baseDate, i);
      const cents = i === count - 1 ? remainingCents - baseCents * (count - 1) : baseCents;

      newSchedules.push({
        enrollment_id: enrollmentId,
        payment_plan_id,
        payment_number: startingPaymentNumber + i,
        payment_type: 'installment',
        amount: cents / 100,
        currency,
        original_due_date: scheduledDate.toISOString(),
        scheduled_date: scheduledDate.toISOString(),
        status: 'pending',
        tenant_id: tenant.id,
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    const { data: createdSchedules, error: insertError } = await supabase
      .from('payment_schedules')
      .insert(newSchedules)
      .select();

    if (insertError) {
      // Put the old payments back so nothing is lost. Their invoices are
      // void, so the charger makes new ones when they're due.
      await supabase
        .from('payment_schedules')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .in('id', scheduleIdsToDelete);
      throw new Error(`Failed to create new schedules: ${insertError.message}`);
    }

    await refreshEnrollmentTotals(supabase, enrollmentId);

    // Log audit event
    await logAuditEvent({
      tenantId: tenant.id,
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'payment_plan.restructured',
      details: {
        resourceType: 'enrollment',
        resourceId: enrollmentId,
        enrollmentId,
        userId: enrollment.user_id,
        reason,
        oldInstallmentCount: pendingSchedules.length,
        newInstallmentCount: count,
        newInstallmentAmount,
        remainingBalance: remainingCents / 100,
        deletedSchedules: scheduleIdsToDelete.length,
        createdSchedules: createdSchedules?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment plan restructured successfully',
      data: {
        deleted_count: scheduleIdsToDelete.length,
        created_count: createdSchedules?.length || 0,
        new_installment_amount: newInstallmentAmount,
        new_total_installments: schedules.filter((s) => s.status === 'paid').length + count,
      },
    });
  } catch (error: any) {
    console.error('Error restructuring payment plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restructure payment plan' },
      { status: 500 }
    );
  }
}
