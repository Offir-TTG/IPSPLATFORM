import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/enrollments/token/:token/wizard-status
 *
 * Get enrollment wizard progress status using enrollment token
 * NO AUTHENTICATION REQUIRED - uses token validation instead
 * Uses admin client to bypass RLS since users are not authenticated yet
 * This allows users to complete enrollment wizard without creating an account first
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    // Create a fresh admin client for each request to avoid stale cache
    const supabase = createAdminClient();

    // Validate token and get enrollment
    console.log('[Wizard Status] Fetching enrollment with token:', params.token);

    // NUCLEAR OPTION: Always use direct query to bypass RPC caching issues
    // The RPC function was returning stale JSONB data even though marked as VOLATILE
    // Direct query ensures we always get fresh data from the database
    //
    // HYPER-AGGRESSIVE CACHE-BUSTING: Add headers to disable caching
    // PostgREST caches query results even with .order() and .limit()
    const cacheBuster = Date.now();
    console.log('[Wizard Status] Cache buster timestamp:', cacheBuster);

    const { data: enrollments, error: enrollmentError } = await supabase
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
        updated_at,
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
      .gte('created_at', `1970-01-01T00:00:${(cacheBuster % 60).toString().padStart(2, '0')}Z`) // Unique filter per second
      .order('updated_at', { ascending: false })
      .limit(1);

    const enrollment = enrollments && enrollments.length > 0 ? enrollments[0] : null;

    console.log('[Wizard Status] Query completed. Enrollment found:', !!enrollment);
    console.log('[Wizard Status] Enrollment updated_at:', enrollment?.updated_at);

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
    const requiredFields = ['first_name', 'last_name', 'phone', 'address'];
    const userProfileComplete = requiredFields.every(field => {
      const value = profileData[field];
      return value !== null && value !== undefined && value !== '';
    });

    // DEBUG: Log profile completion check
    console.log('[Wizard Status] Enrollment ID:', enrollment.id);
    console.log('[Wizard Status] wizard_profile_data:', enrollment.wizard_profile_data);
    console.log('[Wizard Status] profileData:', profileData);
    console.log('[Wizard Status] userProfileComplete:', userProfileComplete);

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
