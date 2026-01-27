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

    // Get all unique stripe_customer_id values from user's enrollments
    const { data: enrollments, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null);

    if (enrollmentError) {
      console.error('Error fetching enrollment data:', enrollmentError);
    }

    // Collect all unique customer IDs (from user record and enrollments)
    const customerIds = new Set<string>();
    if (userData?.stripe_customer_id) {
      customerIds.add(userData.stripe_customer_id);
    }
    if (enrollments) {
      enrollments.forEach(e => {
        if (e.stripe_customer_id) {
          customerIds.add(e.stripe_customer_id);
        }
      });
    }

    console.log(`[User Invoices] Found ${customerIds.size} unique Stripe customer IDs for user ${user.id}`);

    // If user doesn't have any Stripe customer IDs, return empty array
    if (customerIds.size === 0) {
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

    // Fetch invoices from Stripe for all customer IDs
    const allStripeInvoices: any[] = [];
    for (const customerId of customerIds) {
      try {
        console.log(`[User Invoices] Fetching invoices for customer ${customerId}`);
        const customerInvoices = await stripe.invoices.list({
          customer: customerId,
          limit: 100,
        });
        allStripeInvoices.push(...customerInvoices.data);
        console.log(`[User Invoices] Found ${customerInvoices.data.length} invoices for customer ${customerId}`);
      } catch (stripeError: any) {
        console.error(`[User Invoices] Stripe API error for customer ${customerId}:`, stripeError.message);
        // If customer doesn't exist in Stripe, skip it
        if (stripeError.type === 'StripeInvalidRequestError' || stripeError.statusCode === 404) {
          console.log(`[User Invoices] Customer ${customerId} not found in Stripe, skipping`);
          continue;
        }
        throw stripeError;
      }
    }

    console.log(`[User Invoices] Total invoices found across all customers: ${allStripeInvoices.length}`);

    // Fetch payment intents to check for refunds
    const paymentIntentIds = allStripeInvoices
      .map(inv => inv.payment_intent)
      .filter(Boolean) as string[];

    const paymentIntentsWithRefunds = new Map<string, { amount_refunded: number; refunds: any[] }>();

    for (const piId of paymentIntentIds) {
      try {
        const pi = await stripe.paymentIntents.retrieve(piId, {
          expand: ['charges.data.refunds'],
        }) as any; // Use any to access expanded properties

        if (pi.amount_refunded && pi.amount_refunded > 0) {
          paymentIntentsWithRefunds.set(piId, {
            amount_refunded: pi.amount_refunded / 100,
            refunds: pi.charges?.data?.[0]?.refunds?.data || [],
          });
        }
      } catch (error) {
        console.error(`[User Invoices] Error fetching payment intent ${piId}:`, error);
      }
    }

    // Transform Stripe invoices to our format
    let invoices = allStripeInvoices.map((inv) => {
      // Calculate if invoice is overdue
      const isOverdue =
        inv.status === 'open' &&
        inv.due_date &&
        inv.due_date * 1000 < Date.now();

      // Check for refunds on the payment intent
      const piId = inv.payment_intent as string;
      const refundInfo = piId ? paymentIntentsWithRefunds.get(piId) : null;

      // Determine status including refund states
      let status = isOverdue ? 'overdue' : inv.status;
      if (refundInfo) {
        const totalAmount = inv.amount_paid / 100;
        const refundedAmount = refundInfo.amount_refunded;

        if (refundedAmount >= totalAmount) {
          status = 'refunded';
        } else if (refundedAmount > 0) {
          status = 'partially_refunded';
        }
      }

      return {
        id: inv.id,
        number: inv.number || inv.id,
        status,
        amount_due: inv.amount_due / 100,
        amount_paid: inv.amount_paid / 100,
        refund_amount: refundInfo?.amount_refunded || 0,
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
