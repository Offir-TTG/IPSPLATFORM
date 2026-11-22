import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/enrollments/token/[token]/accept
 *
 * Accept enrollment invitation
 * This endpoint is public - no authentication required
 * Uses admin client to bypass RLS since users are not authenticated yet
 *
 * Returns:
 * - success: true if accepted
 * - wizard_url: URL to enrollment wizard
 * - enrollment_id: ID of the enrollment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();

    // NO AUTHENTICATION REQUIRED - token-based enrollment flow
    // User account will be created at the END of the wizard (in complete endpoint)
    // This prevents "ghost accounts" from abandoned enrollments

    // Fetch enrollment by token with product details
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        status,
        token_expires_at,
        total_amount,
        currency,
        email_language,
        product_id,
        tenant_id,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          enrollment_confirmation_template_key
        ),
        payment_plan:payment_plans!enrollments_payment_plan_id_fkey (
          id,
          plan_name
        )
      `)
      .eq('enrollment_token', params.token)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Invalid enrollment' }, { status: 404 });
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    // Opening the link moves only a fresh invitation (draft) to pending.
    // Before, it reset ANY enrollment to pending: a paid, active student lost
    // access, and a cancelled one stopped looking cancelled.
    if (enrollment.status === 'cancelled' || enrollment.status === 'suspended') {
      return NextResponse.json(
        { error: 'This enrollment is no longer open. Please contact the school.' },
        { status: 409 }
      );
    }
    if (enrollment.status === 'active' || enrollment.status === 'completed') {
      return NextResponse.json({ error: 'You are already enrolled', already_enrolled: true }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        status: 'pending'
      })
      .eq('id', enrollment.id)
      .eq('status', 'draft');

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept enrollment' },
        { status: 500 }
      );
    }

    // No onboarding fields to set - user account doesn't exist yet
    // Onboarding will be set when account is created in the complete endpoint

    // Skip sending confirmation email - will be sent after account creation in complete endpoint
    // (We don't have user email yet - it will be collected in the wizard)

    // Redirect to enrollment wizard to complete all steps (with token)
    return NextResponse.json({
      success: true,
      wizard_url: `/enroll/wizard/${enrollment.id}?token=${params.token}`,
      enrollment_id: enrollment.id,
      token: params.token
    });

  } catch (error) {
    console.error('Error accepting enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to accept enrollment' },
      { status: 500 }
    );
  }
}
