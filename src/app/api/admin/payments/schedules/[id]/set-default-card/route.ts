/**
 * Set Default Payment Method API
 *
 * Updates the customer's default payment method for a schedule.
 * This allows admins to change which card will be charged by default.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/payments/getStripeClient';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: scheduleId } = await params;

    // Get payment method ID from request body
    const body = await request.json();
    const { payment_method_id } = body;

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'payment_method_id is required' },
        { status: 400 }
      );
    }

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
      .select('id, enrollment_id')
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

    // Get customer ID (check enrollment first, then user)
    let customerId = enrollment.stripe_customer_id;

    if (!customerId && enrollment.user_id) {
      const { data: userRecord } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', enrollment.user_id)
        .single();

      customerId = userRecord?.stripe_customer_id;
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this enrollment' },
        { status: 400 }
      );
    }

    // Get Stripe client
    const { stripe } = await getStripeClient(userData.tenant_id);
    if (!stripe) {
      return NextResponse.json(
        { error: 'Failed to initialize Stripe client' },
        { status: 500 }
      );
    }

    console.log(`[Set Default Card] Updating default payment method for customer ${customerId} to ${payment_method_id}`);

    // Update customer's default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: payment_method_id,
      },
    });

    console.log(`[Set Default Card] ✓ Default payment method updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Default payment method updated successfully',
    });

  } catch (error: any) {
    console.error('[Set Default Card] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
