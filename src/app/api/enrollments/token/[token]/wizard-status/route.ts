import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/enrollments/token/:token/wizard-status
 *
 * Get enrollment wizard progress status using enrollment token
 * NO AUTHENTICATION REQUIRED - uses token validation instead
 * This allows users to complete enrollment wizard without creating an account first
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();

    // Validate token and get enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select(`
        id,
        user_id,
        product_id,
        total_amount,
        paid_amount,
        currency,
        status,
        payment_status,
        signature_status,
        docusign_envelope_id,
        tenant_id,
        token_expires_at,
        wizard_profile_data,
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          requires_signature,
          signature_template_id,
          payment_model
        )
      `)
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Invalid enrollment token' }, { status: 404 });
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Check if profile is complete from wizard_profile_data
    const profileData = enrollment.wizard_profile_data || {};
    const requiredFields = ['first_name', 'last_name', 'phone', 'address', 'city', 'country'];
    const userProfileComplete = requiredFields.every(field => {
      const value = profileData[field];
      return value !== null && value !== undefined && value !== '';
    });

    // Determine if payment is required
    const paymentRequired = product.payment_model !== 'free' && enrollment.total_amount > 0;

    // Check if payment is complete
    const paymentComplete = enrollment.paid_amount >= enrollment.total_amount;

    return NextResponse.json({
      id: enrollment.id,
      product_name: product.title,
      product_type: product.type,
      total_amount: enrollment.total_amount,
      currency: enrollment.currency,
      requires_signature: product.requires_signature,
      signature_template_id: product.signature_template_id,
      signature_status: enrollment.signature_status,
      docusign_envelope_id: enrollment.docusign_envelope_id,
      user_profile_complete: userProfileComplete,
      payment_required: paymentRequired,
      payment_complete: paymentComplete,
      enrollment_status: enrollment.status,
      payment_status: enrollment.payment_status,
      wizard_profile_data: profileData
    });

  } catch (error: any) {
    console.error('Error in GET /api/enrollments/token/:token/wizard-status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
