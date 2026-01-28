import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments/disputes
 * Get all payment disputes
 */
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('payment_disputes')
      .select(`
        id,
        stripe_dispute_id,
        stripe_charge_id,
        amount,
        currency,
        reason,
        status,
        evidence_due_date,
        evidence_submitted,
        evidence_submitted_at,
        created_at,
        updated_at,
        user_id,
        users (
          id,
          first_name,
          last_name,
          email
        ),
        enrollment_id,
        enrollments (
          id,
          product_id,
          products (
            id,
            title
          )
        ),
        payment_id,
        payments (
          id,
          stripe_payment_intent_id
        )
      `)
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Search by user name, email, or dispute ID
    if (search) {
      // Note: Supabase doesn't support OR across joins easily
      // We'll do multiple queries and merge results
      const disputeIdQuery = supabase
        .from('payment_disputes')
        .select('*')
        .eq('tenant_id', tenant.id)
        .ilike('stripe_dispute_id', `%${search}%`);

      const { data: disputesBySearch } = await disputeIdQuery;

      // Get user IDs that match search
      const { data: matchingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenant.id)
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);

      const userIds = matchingUsers?.map(u => u.id) || [];

      if (disputesBySearch && disputesBySearch.length > 0) {
        // Return disputes found by dispute ID search
        query = supabase
          .from('payment_disputes')
          .select(`
            id,
            stripe_dispute_id,
            stripe_charge_id,
            amount,
            currency,
            reason,
            status,
            evidence_due_date,
            evidence_submitted,
            evidence_submitted_at,
            created_at,
            updated_at,
            user_id,
            users (
              id,
              first_name,
              last_name,
              email
            ),
            enrollment_id,
            enrollments (
              id,
              product_id,
              products (
                id,
                title
              )
            ),
            payment_id,
            payments (
              id,
              stripe_payment_intent_id
            )
          `)
          .eq('tenant_id', tenant.id)
          .ilike('stripe_dispute_id', `%${search}%`)
          .order('created_at', { ascending: false });
      } else if (userIds.length > 0) {
        // Return disputes for matching users
        query = supabase
          .from('payment_disputes')
          .select(`
            id,
            stripe_dispute_id,
            stripe_charge_id,
            amount,
            currency,
            reason,
            status,
            evidence_due_date,
            evidence_submitted,
            evidence_submitted_at,
            created_at,
            updated_at,
            user_id,
            users (
              id,
              first_name,
              last_name,
              email
            ),
            enrollment_id,
            enrollments (
              id,
              product_id,
              products (
                id,
                title
              )
            ),
            payment_id,
            payments (
              id,
              stripe_payment_intent_id
            )
          `)
          .eq('tenant_id', tenant.id)
          .in('user_id', userIds)
          .order('created_at', { ascending: false });
      } else {
        // No matches, return empty
        return NextResponse.json({
          success: true,
          disputes: [],
        });
      }
    }

    const { data: disputes, error: disputesError } = await query;

    if (disputesError) {
      console.error('Error fetching disputes:', disputesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch disputes' },
        { status: 500 }
      );
    }

    // Format disputes for frontend
    const formattedDisputes = (disputes || []).map((dispute: any) => ({
      id: dispute.id,
      disputeId: dispute.stripe_dispute_id,
      chargeId: dispute.stripe_charge_id,
      amount: parseFloat(dispute.amount),
      currency: dispute.currency,
      reason: dispute.reason,
      status: dispute.status,
      created: dispute.created_at,
      evidenceDue: dispute.evidence_due_date,
      evidenceSubmitted: dispute.evidence_submitted,
      user: dispute.users ? {
        id: dispute.users.id,
        name: `${dispute.users.first_name} ${dispute.users.last_name}`,
        email: dispute.users.email,
      } : null,
      product: dispute.enrollments?.products ? {
        id: dispute.enrollments.products.id,
        name: dispute.enrollments.products.title,
      } : null,
      transactionId: dispute.payments?.stripe_payment_intent_id || null,
    }));

    return NextResponse.json({
      success: true,
      disputes: formattedDisputes,
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}
