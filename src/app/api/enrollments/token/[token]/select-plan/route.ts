import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { generatePaymentSchedules } from '@/lib/payments/paymentEngine';
import { getStripeClient } from '@/lib/payments/getStripeClient';

/**
 * POST /api/enrollments/token/:token/select-plan
 *
 * Allow unauthenticated user to select a payment plan for their enrollment
 * Updates enrollment with selected plan and generates payment schedules
 *
 * NO AUTHENTICATION REQUIRED - uses token validation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();
    const { payment_plan_id } = await request.json();

    if (!payment_plan_id) {
      return NextResponse.json(
        { error: 'payment_plan_id is required' },
        { status: 400 }
      );
    }

    // 1. Validate token and get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        tenant_id,
        product_id,
        total_amount,
        currency,
        status,
        token_expires_at,
        payment_start_date,
        product:products!enrollments_product_id_fkey (
          id,
          alternative_payment_plan_ids
        )
      `)
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // 2. Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Enrollment token has expired' },
        { status: 410 }
      );
    }

    // 3. Verify enrollment not completed
    if (enrollment.status === 'active' || enrollment.status === 'completed') {
      return NextResponse.json(
        { error: 'Enrollment already completed' },
        { status: 400 }
      );
    }

    // 4. Verify payment plan belongs to this product
    const product = enrollment.product as any;
    const alternativePlanIds = product?.alternative_payment_plan_ids || [];

    if (!alternativePlanIds.includes(payment_plan_id)) {
      return NextResponse.json(
        { error: 'Invalid payment plan for this product' },
        { status: 403 }
      );
    }

    // 5. Fetch payment plan template
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', payment_plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !paymentPlan) {
      return NextResponse.json(
        { error: 'Payment plan not found or inactive' },
        { status: 404 }
      );
    }

    // 6. Update enrollment with selected payment plan
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        payment_plan_id: payment_plan_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error updating enrollment with payment plan:', updateError);
      return NextResponse.json(
        { error: 'Failed to update enrollment' },
        { status: 500 }
      );
    }

    // 7. Cancel any existing Stripe payment intents/invoices before deleting schedules
    const { data: existingSchedules } = await supabase
      .from('payment_schedules')
      .select('id, stripe_payment_intent_id, stripe_invoice_id, status')
      .eq('enrollment_id', enrollment.id);

    if (existingSchedules && existingSchedules.length > 0) {
      console.log(`[Select Plan] Found ${existingSchedules.length} existing schedules to clean up`);

      try {
        const { stripe } = await getStripeClient(enrollment.tenant_id);

        for (const schedule of existingSchedules) {
          // Cancel payment intent if it exists and hasn't been paid
          if (schedule.stripe_payment_intent_id && schedule.status !== 'paid') {
            try {
              await stripe.paymentIntents.cancel(schedule.stripe_payment_intent_id);
              console.log(`[Select Plan] Cancelled payment intent: ${schedule.stripe_payment_intent_id}`);
            } catch (error: any) {
              // Payment intent might already be cancelled or doesn't exist
              console.log(`[Select Plan] Could not cancel payment intent ${schedule.stripe_payment_intent_id}:`, error.message);
            }
          }

          // Void/delete invoice if it exists and hasn't been paid
          if (schedule.stripe_invoice_id && schedule.status !== 'paid') {
            try {
              const invoice = await stripe.invoices.retrieve(schedule.stripe_invoice_id);

              if (invoice.status === 'draft') {
                // Delete draft invoices
                await stripe.invoices.del(schedule.stripe_invoice_id);
                console.log(`[Select Plan] Deleted draft invoice: ${schedule.stripe_invoice_id}`);
              } else if (invoice.status === 'open') {
                // Void open invoices
                await stripe.invoices.voidInvoice(schedule.stripe_invoice_id);
                console.log(`[Select Plan] Voided open invoice: ${schedule.stripe_invoice_id}`);
              }
            } catch (error: any) {
              console.log(`[Select Plan] Could not void/delete invoice ${schedule.stripe_invoice_id}:`, error.message);
            }
          }
        }
      } catch (stripeError: any) {
        console.error('[Select Plan] Error during Stripe cleanup:', stripeError);
        // Continue even if Stripe cleanup fails - we still want to update the schedules
      }
    }

    // 8. Delete existing payment schedules from database
    const { error: deleteError } = await supabase
      .from('payment_schedules')
      .delete()
      .eq('enrollment_id', enrollment.id);

    if (deleteError) {
      console.error('Error deleting existing schedules:', deleteError);
      // Don't fail - continue to create new schedules
    }

    // 9. Generate new payment schedules based on selected plan
    const paymentStartDate = enrollment.payment_start_date
      ? new Date(enrollment.payment_start_date)
      : new Date();

    const schedules = generatePaymentSchedules(
      enrollment.id,
      enrollment.tenant_id,
      paymentPlan,
      enrollment.total_amount,
      paymentStartDate
    );

    // 10. Insert new payment schedules
    const { data: insertedSchedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .insert(schedules)
      .select();

    if (schedulesError || !insertedSchedules) {
      console.error('Error creating payment schedules:', schedulesError);
      return NextResponse.json(
        { error: 'Failed to create payment schedules' },
        { status: 500 }
      );
    }

    // 11. Update enrollment with next payment date
    const nextSchedule = insertedSchedules.find((s: any) => s.status === 'pending');
    if (nextSchedule) {
      await supabase
        .from('enrollments')
        .update({ next_payment_date: nextSchedule.scheduled_date })
        .eq('id', enrollment.id);
    }

    // 12. Return updated enrollment data
    return NextResponse.json({
      success: true,
      enrollment: {
        id: enrollment.id,
        payment_plan_id: payment_plan_id,
        total_amount: enrollment.total_amount,
      },
      schedules: insertedSchedules,
    });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments/token/:token/select-plan:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
