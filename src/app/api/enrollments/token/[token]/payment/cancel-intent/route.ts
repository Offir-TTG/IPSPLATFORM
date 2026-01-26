import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

/**
 * POST /api/enrollments/token/:token/payment/cancel-intent
 *
 * Cancel a Stripe payment intent when user navigates away from payment page
 * NO AUTHENTICATION REQUIRED - uses enrollment token
 * Fetches Stripe credentials from database (integrations table)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { payment_intent_id, schedule_id } = body;

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: 'payment_intent_id is required' },
        { status: 400 }
      );
    }

    console.log('[Cancel Intent] Attempting to cancel payment intent:', payment_intent_id);

    // Get enrollment using token
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, token_expires_at')
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Enrollment token has expired' },
        { status: 410 }
      );
    }

    // Get Stripe credentials from integrations table
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('tenant_id', enrollment.tenant_id)
      .eq('integration_key', 'stripe')
      .single();

    if (integrationError || !integration?.credentials?.secret_key) {
      console.error('[Cancel Intent] Stripe integration not configured for tenant:', enrollment.tenant_id);
      return NextResponse.json(
        { error: 'Payment processing not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe with tenant-specific credentials
    const stripe = new Stripe(integration.credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    try {
      // Check if intent is still cancellable
      const intent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (intent.status === 'requires_payment_method' ||
          intent.status === 'requires_confirmation' ||
          intent.status === 'requires_action') {
        // Cancel the intent
        await stripe.paymentIntents.cancel(payment_intent_id);
        console.log('[Cancel Intent] ✓ Successfully cancelled payment intent:', payment_intent_id);

        // Clear the payment intent ID from the schedule if provided
        if (schedule_id) {
          await supabase
            .from('payment_schedules')
            .update({ stripe_payment_intent_id: null })
            .eq('id', schedule_id)
            .eq('enrollment_id', enrollment.id);
        }

        return NextResponse.json({
          success: true,
          message: 'Payment intent cancelled successfully'
        });
      } else {
        console.log('[Cancel Intent] Intent status is', intent.status, '- not cancelling');
        return NextResponse.json({
          success: false,
          message: `Payment intent cannot be cancelled (status: ${intent.status})`
        });
      }
    } catch (error: any) {
      console.error('[Cancel Intent] Error cancelling payment intent:', error.message);

      // If intent doesn't exist or already cancelled, that's OK
      if (error.code === 'resource_missing' || error.message?.includes('canceled')) {
        return NextResponse.json({
          success: true,
          message: 'Payment intent already cancelled or does not exist'
        });
      }

      throw error;
    }

  } catch (error: any) {
    console.error('[Cancel Intent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
