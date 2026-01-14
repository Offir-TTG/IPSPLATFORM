import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/enrollments/token/[token]
 *
 * Validate enrollment token and return enrollment details
 * This endpoint is public - no authentication required for preview
 * Uses admin client to bypass RLS since users are not authenticated yet
 *
 * Returns:
 * - Enrollment details if token is valid
 * - Error if token is invalid or expired
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();

    console.log('[Enrollment Token] Looking for token:', params.token);

    // Fetch enrollment by token
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        product_id,
        user_id,
        total_amount,
        paid_amount,
        currency,
        token_expires_at,
        status,
        enrollment_token,
        enrollment_type,
        wizard_profile_data,
        user:users!enrollments_user_id_fkey (
          id,
          email,
          first_name,
          last_name
        ),
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          description,
          payment_model,
          payment_plan
        ),
        payment_plan:payment_plans!enrollments_payment_plan_id_fkey (
          id,
          plan_name
        )
      `)
      .eq('enrollment_token', params.token)
      .single();

    console.log('[Enrollment Token] Query result:', { error, enrollmentId: enrollment?.id, token: enrollment?.enrollment_token });

    if (error || !enrollment) {
      console.error('[Enrollment Token] Not found. Error:', error);
      return NextResponse.json(
        { error: 'Invalid enrollment link' },
        { status: 404 }
      );
    }

    // Check if token expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Extract single objects from arrays
    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;
    const paymentPlan = enrollment.payment_plan
      ? (Array.isArray(enrollment.payment_plan) ? enrollment.payment_plan[0] : enrollment.payment_plan)
      : null;
    const user = Array.isArray(enrollment.user) ? enrollment.user[0] : enrollment.user;
    // MEMORY-BASED WIZARD: Get email from user or wizard_profile_data
    let userEmail: string;
    if (user) {
      userEmail = user.email;
    } else if (enrollment.wizard_profile_data) {
      userEmail = enrollment.wizard_profile_data.email;
    } else {
      userEmail = 'Unknown';
    }

    console.log('[Enrollment Token] User email:', {
      hasUser: !!user,
      hasWizardProfileData: !!enrollment.wizard_profile_data,
      userEmail
    });


    // Prepare payment plan data for client-side translation
    let paymentPlanData: any = null;
    if (paymentPlan?.plan_name) {
      paymentPlanData = {
        type: 'named_plan',
        name: paymentPlan.plan_name
      };
    } else if (product.payment_model === 'deposit_then_plan') {
      const plan = product.payment_plan || {};

      // Calculate installment amount
      let installmentAmount = 0;
      const totalAmount = enrollment.total_amount;
      const installmentCount = plan.installments || 0;

      if (installmentCount > 0) {
        let depositAmount = 0;
        if (plan.deposit_type === 'fixed' && plan.deposit_amount) {
          depositAmount = plan.deposit_amount;
        } else if (plan.deposit_type === 'percentage' && plan.deposit_percentage) {
          depositAmount = (totalAmount * plan.deposit_percentage) / 100;
        }

        const remainingAmount = totalAmount - depositAmount;
        installmentAmount = remainingAmount / installmentCount;
      }

      paymentPlanData = {
        type: 'deposit_then_plan',
        installments: plan.installments || 0,
        frequency: plan.frequency || 'monthly',
        deposit_type: plan.deposit_type,
        deposit_amount: plan.deposit_amount,
        deposit_percentage: plan.deposit_percentage,
        installment_amount: installmentAmount
      };
    } else if (product.payment_model === 'subscription') {
      paymentPlanData = {
        type: 'subscription',
        interval: product.payment_plan?.subscription_interval || 'monthly'
      };
    } else if (product.payment_model === 'one_time') {
      paymentPlanData = {
        type: 'one_time'
      };
    } else if (product.payment_model === 'free') {
      paymentPlanData = {
        type: 'free'
      };
    }

    // Return enrollment details (no sensitive user data)
    return NextResponse.json({
      id: enrollment.id,
      product_name: product.title,
      product_type: product.type,
      product_description: product.description,
      total_amount: enrollment.total_amount,
      currency: enrollment.currency,
      payment_plan_data: paymentPlanData,
      payment_model: product.payment_model,
      token_expires_at: enrollment.token_expires_at,
      status: enrollment.status,
      user_email: userEmail, // Show email so user can verify it's for them
      enrollment_type: enrollment.enrollment_type // 'admin_invited' or 'self_enrolled'
    });

  } catch (error) {
    console.error('Error fetching enrollment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollment' },
      { status: 500 }
    );
  }
}
