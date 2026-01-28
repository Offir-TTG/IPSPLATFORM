/**
 * Get Payment Methods API
 *
 * Fetches all saved payment methods for a schedule's customer.
 * Used by admins to select which card to charge when clicking "Charge Now".
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/payments/getStripeClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: scheduleId } = await params;

    // Verify admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get schedule to find enrollment
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('id, enrollment_id, amount, currency')
      .eq('id', scheduleId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Get enrollment to find customer ID
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, user_id, stripe_customer_id')
      .eq('id', schedule.enrollment_id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check if enrollment has a customer ID
    let customerId = enrollment.stripe_customer_id;

    // If no customer on enrollment, check user
    if (!customerId && enrollment.user_id) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', enrollment.user_id)
        .single();

      customerId = userRecord?.stripe_customer_id;
    }

    // If still no customer ID, return empty array
    if (!customerId) {
      return NextResponse.json({
        payment_methods: [],
        default_payment_method: null,
        message: 'No saved payment methods found',
      });
    }

    // Get Stripe client
    const { stripe } = await getStripeClient(userData.tenant_id);
    if (!stripe) {
      return NextResponse.json(
        { error: 'Failed to initialize Stripe client' },
        { status: 500 }
      );
    }

    // Fetch customer to get default payment method
    const customer = await stripe.customers.retrieve(customerId);

    if (!customer || customer.deleted) {
      return NextResponse.json({
        payment_methods: [],
        default_payment_method: null,
        message: 'Customer not found in Stripe',
      });
    }

    // Get default payment method ID
    const defaultPaymentMethodId =
      (customer as any).invoice_settings?.default_payment_method || null;

    // List all payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Format payment methods for frontend
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      type: pm.type,
      card: {
        brand: pm.card?.brand || 'unknown',
        last4: pm.card?.last4 || '****',
        exp_month: pm.card?.exp_month || 0,
        exp_year: pm.card?.exp_year || 0,
      },
      is_default: pm.id === defaultPaymentMethodId,
    }));

    return NextResponse.json({
      payment_methods: formattedMethods,
      default_payment_method: defaultPaymentMethodId,
      customer_id: customerId,
    });

  } catch (error: any) {
    console.error('[Get Payment Methods] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
