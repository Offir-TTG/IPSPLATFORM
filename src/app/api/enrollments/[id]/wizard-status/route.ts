import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/enrollments/:id/wizard-status
 *
 * Get enrollment wizard progress status
 * Returns information about which steps are complete and what's next
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('id, tenant_id, first_name, last_name, phone, address, city, country')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get enrollment with product details
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
        product:products!enrollments_product_id_fkey (
          id,
          title,
          type,
          requires_signature,
          signature_template_id,
          payment_model
        )
      `)
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    // Check authorization - user can only see their own enrollments
    if (enrollment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const product = Array.isArray(enrollment.product) ? enrollment.product[0] : enrollment.product;

    // Check if profile is complete
    const requiredFields = ['first_name', 'last_name', 'phone', 'address', 'city', 'country'];
    const userProfileComplete = requiredFields.every(field => {
      const value = userData[field as keyof typeof userData];
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
      payment_status: enrollment.payment_status
    });

  } catch (error: any) {
    console.error('Error in GET /api/enrollments/:id/wizard-status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
