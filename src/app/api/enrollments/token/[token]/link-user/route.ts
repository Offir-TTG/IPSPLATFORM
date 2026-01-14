import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/enrollments/token/:token/link-user
 *
 * Link currently logged-in user to an enrollment
 * Used when a user logs in from the enrollment wizard
 *
 * This allows users who encounter "email exists" error to login
 * and then automatically continue with their enrollment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Get currently logged-in user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('[Link User] Attempting to link user to enrollment:', {
      userId: user.id,
      token: params.token
    });

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Get enrollment by token
    const { data: enrollment, error: enrollmentError } = await adminClient
      .from('enrollments')
      .select('id, user_id, tenant_id, status')
      .eq('enrollment_token', params.token)
      .single();

    if (enrollmentError || !enrollment) {
      console.error('[Link User] Enrollment not found:', enrollmentError);
      return NextResponse.json(
        { error: 'Invalid enrollment token' },
        { status: 404 }
      );
    }

    // Check if enrollment is already linked to a user
    if (enrollment.user_id) {
      // If already linked to this user, that's fine - return success
      if (enrollment.user_id === user.id) {
        console.log('[Link User] Enrollment already linked to this user');
        return NextResponse.json({
          success: true,
          message: 'Enrollment already linked to your account',
          enrollment_id: enrollment.id
        });
      } else {
        // Linked to a different user - this is an error
        console.error('[Link User] Enrollment already linked to different user');
        return NextResponse.json(
          { error: 'This enrollment is already linked to another account' },
          { status: 409 }
        );
      }
    }

    // Verify user exists in users table for this tenant
    const { data: userProfile, error: userError } = await adminClient
      .from('users')
      .select('id, email, first_name, last_name, phone, location')
      .eq('id', user.id)
      .eq('tenant_id', enrollment.tenant_id)
      .single();

    if (userError || !userProfile) {
      console.error('[Link User] User not found in tenant:', userError);
      return NextResponse.json(
        { error: 'User profile not found for this organization' },
        { status: 404 }
      );
    }

    // Link user to enrollment and pre-fill profile data
    const { error: updateError } = await adminClient
      .from('enrollments')
      .update({
        user_id: user.id,
        wizard_profile_data: {
          email: userProfile.email,
          first_name: userProfile.first_name || '',
          last_name: userProfile.last_name || '',
          phone: userProfile.phone || '',
          address: userProfile.location || ''
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('[Link User] Failed to link user:', updateError);
      return NextResponse.json(
        { error: 'Failed to link user to enrollment' },
        { status: 500 }
      );
    }

    console.log('[Link User] Successfully linked user to enrollment:', {
      enrollmentId: enrollment.id,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      message: 'Account linked successfully',
      enrollment_id: enrollment.id,
      user_id: user.id
    });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments/token/:token/link-user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
