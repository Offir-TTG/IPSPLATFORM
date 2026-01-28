import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/disputes/[id]/evidence
 * Submit evidence for a dispute
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

    const { tenant } = auth;
    const supabase = await createClient();
    const disputeId = params.id;

    // Get dispute details
    const { data: dispute, error: disputeError } = await supabase
      .from('payment_disputes')
      .select('*')
      .eq('id', disputeId)
      .eq('tenant_id', tenant.id)
      .single();

    if (disputeError || !dispute) {
      return NextResponse.json(
        { success: false, error: 'Dispute not found' },
        { status: 404 }
      );
    }

    // Check if evidence deadline has passed
    if (dispute.evidence_due_date) {
      const dueDate = new Date(dispute.evidence_due_date);
      if (dueDate < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Evidence deadline has passed' },
          { status: 400 }
        );
      }
    }

    // Get evidence data from request
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPurchaseIp,
      receiptUrl,
      productDescription,
      customerCommunication,
    } = body;

    // Get Stripe credentials from integrations table
    const { data: integration } = await supabase
      .from('integrations')
      .select('credentials')
      .eq('tenant_id', tenant.id)
      .eq('integration_key', 'stripe')
      .single();

    if (!integration?.credentials?.secret_key) {
      return NextResponse.json(
        { success: false, error: 'Stripe integration not configured' },
        { status: 500 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(integration.credentials.secret_key, {
      apiVersion: '2023-10-16',
    });

    // Submit evidence to Stripe
    try {
      const evidenceData: Stripe.DisputeUpdateParams.Evidence = {};

      if (customerName) evidenceData.customer_name = customerName;
      if (customerEmail) evidenceData.customer_email_address = customerEmail;
      if (customerPurchaseIp) evidenceData.customer_purchase_ip = customerPurchaseIp;
      if (receiptUrl) evidenceData.receipt = receiptUrl;
      if (productDescription) evidenceData.product_description = productDescription;
      if (customerCommunication) evidenceData.customer_communication = customerCommunication;

      await stripe.disputes.update(dispute.stripe_dispute_id, {
        evidence: evidenceData,
      });

      // Update dispute record in database
      await supabase
        .from('payment_disputes')
        .update({
          evidence_submitted: true,
          evidence_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId)
        .eq('tenant_id', tenant.id);

      return NextResponse.json({
        success: true,
        message: 'Evidence submitted successfully',
      });
    } catch (stripeError: any) {
      console.error('Error submitting evidence to Stripe:', stripeError);
      return NextResponse.json(
        { success: false, error: stripeError.message || 'Failed to submit evidence to Stripe' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error submitting dispute evidence:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit evidence' },
      { status: 500 }
    );
  }
}
