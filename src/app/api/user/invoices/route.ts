import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripeClient } from '@/lib/payments/getStripeClient';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/invoices
 * Fetch all Stripe invoices for the current user
 *
 * Query params:
 * - status: Filter by status (paid, open, draft, void, uncollectible)
 * - enrollment_id: Filter by enrollment ID (from metadata)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's stripe_customer_id and tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, tenant_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // If user doesn't have a Stripe customer ID, return empty array
    if (!userData?.stripe_customer_id) {
      return NextResponse.json({
        success: true,
        invoices: [],
      });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');
    const enrollmentIdFilter = searchParams.get('enrollment_id');

    // Get Stripe client from database
    let stripe;
    try {
      const stripeConfig = await getStripeClient(userData.tenant_id);
      stripe = stripeConfig.stripe;
    } catch (error) {
      console.error('Error getting Stripe client:', error);
      // If Stripe is not configured, return empty array
      return NextResponse.json({
        success: true,
        invoices: [],
      });
    }

    // Fetch invoices from Stripe
    let stripeInvoices;
    try {
      stripeInvoices = await stripe.invoices.list({
        customer: userData.stripe_customer_id,
        limit: 100,
      });
    } catch (stripeError: any) {
      console.error('Stripe API error:', stripeError);
      // If Stripe is not configured or customer doesn't exist, return empty array
      if (stripeError.type === 'StripeInvalidRequestError' || stripeError.statusCode === 404) {
        return NextResponse.json({
          success: true,
          invoices: [],
        });
      }
      throw stripeError;
    }

    // Transform Stripe invoices to our format
    let invoices = stripeInvoices.data.map((inv) => {
      // Calculate if invoice is overdue
      const isOverdue =
        inv.status === 'open' &&
        inv.due_date &&
        inv.due_date * 1000 < Date.now();

      return {
        id: inv.id,
        number: inv.number || inv.id,
        status: isOverdue ? 'overdue' : inv.status,
        amount_due: inv.amount_due / 100,
        amount_paid: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        created: inv.created * 1000, // Convert to milliseconds
        due_date: inv.due_date ? inv.due_date * 1000 : null,
        paid_at: inv.status_transitions?.paid_at
          ? inv.status_transitions.paid_at * 1000
          : null,
        invoice_pdf: inv.invoice_pdf,
        hosted_invoice_url: inv.hosted_invoice_url,
        description: inv.lines.data[0]?.description || 'Invoice',
        metadata: inv.metadata || {},
      };
    });

    // Apply status filter
    if (statusFilter) {
      invoices = invoices.filter((inv) => inv.status === statusFilter);
    }

    // Apply enrollment_id filter
    if (enrollmentIdFilter) {
      invoices = invoices.filter(
        (inv) => inv.metadata.enrollment_id === enrollmentIdFilter
      );
    }

    // Sort by created date (newest first)
    invoices.sort((a, b) => b.created - a.created);

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch invoices'
      },
      { status: 500 }
    );
  }
}
