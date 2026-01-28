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

    // First get the enrollment ID using token (cannot be bypassed)
    const { data: tokenLookup, error: tokenError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('enrollment_token', params.token)
      .single();

    if (tokenError || !tokenLookup) {
      console.error('[Wizard Status] Token lookup failed:', tokenError);
      return NextResponse.json({ error: 'Invalid enrollment token' }, { status: 404 });
    }

    console.log('[Wizard Status] Found enrollment ID:', tokenLookup.id);

    // FORCE FRESH QUERY - Use dynamic timestamp to bust PostgREST cache
    // PostgREST caches queries aggressively, even with service role
    // Using current timestamp minus a large value creates a unique query each time
    const veryOldDate = new Date(Date.now() - (365 * 10 * 24 * 60 * 60 * 1000)).toISOString(); // 10 years ago
    console.log('[Wizard Status] Cache buster date:', veryOldDate);

    const { data: freshEnrollmentDataArray, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, tenant_id, user_id, product_id, payment_plan_id, total_amount, paid_amount, currency, status, payment_status, signature_status, docusign_envelope_id, token_expires_at, wizard_profile_data, updated_at')
      .eq('enrollment_token', params.token)
      .gte('updated_at', veryOldDate) // Dynamic value - forces new query each time
      .limit(1);

    if (enrollmentError || !freshEnrollmentDataArray || freshEnrollmentDataArray.length === 0) {
      console.error('[Wizard Status] Direct query failed:', enrollmentError);
      return NextResponse.json({ error: 'Failed to fetch enrollment data' }, { status: 500 });
    }

    const freshEnrollmentData = freshEnrollmentDataArray[0];

    console.log('[Wizard Status] Direct query returned data:', freshEnrollmentData);
    console.log('[Wizard Status] signature_status from direct query:', freshEnrollmentData.signature_status);
    console.log('[Wizard Status] wizard_profile_data RAW from direct query:', freshEnrollmentData.wizard_profile_data);
    console.log('[Wizard Status] wizard_profile_data TYPE:', typeof freshEnrollmentData.wizard_profile_data);
    console.log('[Wizard Status] wizard_profile_data JSON.stringify:', JSON.stringify(freshEnrollmentData.wizard_profile_data));
    console.log('[Wizard Status] wizard_profile_data KEYS:', freshEnrollmentData.wizard_profile_data ? Object.keys(freshEnrollmentData.wizard_profile_data) : 'null');

    // Get product data separately
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, title, type, requires_signature, signature_template_id, payment_model, alternative_payment_plan_ids')
      .eq('id', freshEnrollmentData.product_id)
      .single();

    if (productError || !productData) {
      console.error('[Wizard Status] Product fetch failed:', productError);
      return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
    }

    // Combine enrollment and product data
    const enrollment = {
      ...freshEnrollmentData,
      token_expires_at: freshEnrollmentData.token_expires_at,
      product: productData
    };

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

    // Check if profile is complete
    // For existing users (user_id set), fetch profile from users table
    // For new users, check wizard_profile_data
    let profileData = enrollment.wizard_profile_data || {};
    let userProfileComplete = false;

    if (enrollment.user_id) {
      // Existing user - fetch profile from users table
      console.log('[Wizard Status] Existing user detected (user_id:', enrollment.user_id, ') - fetching profile from users table');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name, email, phone, location')
        .eq('id', enrollment.user_id)
        .single();

      if (!userError && userData) {
        profileData = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.location || '' // Use location field from users table
        };

        // Check if profile is complete
        const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address'];
        userProfileComplete = requiredFields.every(field => {
          const value = profileData[field as keyof typeof profileData];
          return value !== null && value !== undefined && value !== '';
        });

        console.log('[Wizard Status] Loaded profile from users table:', {
          profileData,
          userProfileComplete
        });
      } else {
        console.error('[Wizard Status] Failed to fetch user profile:', userError);
      }
    } else {
      // New user - check wizard_profile_data
      // Parse if it's a JSON string, otherwise use as-is
      if (typeof profileData === 'string') {
        try {
          profileData = JSON.parse(profileData);
        } catch (e) {
          console.error('[Wizard Status] Failed to parse wizard_profile_data:', e);
          profileData = {};
        }
      }

      const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'address'];
      userProfileComplete = requiredFields.every(field => {
        const value = profileData[field];
        return value !== null && value !== undefined && value !== '';
      });

      console.log('[Wizard Status] New user - checking wizard_profile_data:', {
        profileData,
        userProfileComplete
      });
    }

    // DEBUG: Log profile completion check
    console.log('[Wizard Status] Enrollment ID:', enrollment.id);
    console.log('[Wizard Status] user_id:', enrollment.user_id);
    console.log('[Wizard Status] wizard_profile_data:', enrollment.wizard_profile_data);
    console.log('[Wizard Status] Final profileData:', profileData);
    console.log('[Wizard Status] userProfileComplete:', userProfileComplete);

    // Determine if payment is required
    const paymentRequired = product.payment_model !== 'free' && enrollment.total_amount > 0;

    // Check if payment is complete
    const paymentComplete = enrollment.paid_amount >= enrollment.total_amount;

    return NextResponse.json({
      id: enrollment.id,
      user_id: enrollment.user_id, // CRITICAL: Include user_id so frontend can determine if existing user
      product_id: product.id, // Added for multi-plan support
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
      wizard_profile_data: profileData,
      alternative_payment_plan_ids: product.alternative_payment_plan_ids || [], // Added for multi-plan support
      payment_plan_id: enrollment.payment_plan_id // Added to track selected plan
    });

  } catch (error: any) {
    console.error('Error in GET /api/enrollments/token/:token/wizard-status:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
