import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/enrollments/token/:token/profile
 *
 * Save profile data to enrollment WITHOUT creating user account
 * NO AUTHENTICATION REQUIRED - uses token validation instead
 * Uses admin client to bypass RLS since users are not authenticated yet
 * Profile data is stored in wizard_profile_data JSON column until enrollment completion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      address
    } = body;

    console.log('[Profile Save] Token:', params.token);
    console.log('[Profile Save] Received data:', { first_name, last_name, email, phone, address });

    // Validate required fields
    if (!first_name || !last_name || !email || !phone || !address) {
      console.error('[Profile Save] Missing required fields:', { first_name, last_name, email, phone, address });
      return NextResponse.json(
        { error: 'First name, last name, email, phone, and address are required' },
        { status: 400 }
      );
    }

    // Validate token and get enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('id, token_expires_at, tenant_id')
      .eq('enrollment_token', params.token)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Invalid enrollment token' }, { status: 404 });
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    // Store profile data in wizard_profile_data JSON column (NOT in users table yet!)
    const profileDataToSave = {
      first_name,
      last_name,
      email,
      phone,
      address,
      updated_at: new Date().toISOString()
    };

    console.log('[Profile Save] Enrollment ID:', enrollment.id);
    console.log('[Profile Save] Saving profile data:', profileDataToSave);

    const updateTimestamp = new Date().toISOString();
    console.log('[Profile Save] Setting updated_at to:', updateTimestamp);

    const { data: updateData, error: updateError } = await supabase
      .from('enrollments')
      .update({
        wizard_profile_data: profileDataToSave,
        updated_at: updateTimestamp
      })
      .eq('enrollment_token', params.token)
      .select('id, wizard_profile_data, updated_at');

    if (updateError) {
      console.error('[Profile Save] Error updating wizard profile data:', updateError);
      return NextResponse.json(
        { error: 'Failed to save profile data' },
        { status: 500 }
      );
    }

    console.log('[Profile Save] Successfully saved profile data');
    console.log('[Profile Save] Updated enrollment data:', updateData);
    console.log('[Profile Save] Returned updated_at:', updateData?.[0]?.updated_at);

    // Verify the data was actually saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('enrollments')
      .select('id, wizard_profile_data')
      .eq('enrollment_token', params.token)
      .single();

    console.log('[Profile Save] Verification query result:', verifyData);
    if (verifyError) {
      console.error('[Profile Save] Verification error:', verifyError);
    }

    // Return the saved profile data so the frontend doesn't need to refetch
    return NextResponse.json({
      success: true,
      message: 'Profile data saved successfully',
      profile: profileDataToSave
    });

  } catch (error: any) {
    console.error('Error in POST /api/enrollments/token/:token/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/enrollments/token/:token/profile
 *
 * Get current profile data from wizard_profile_data
 * Uses admin client to bypass RLS since users are not authenticated yet
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // Use admin client to bypass RLS - enrollment links are accessed by unauthenticated users
    const supabase = createAdminClient();

    // Validate token and get enrollment
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('wizard_profile_data, token_expires_at')
      .eq('enrollment_token', params.token)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Invalid enrollment token' }, { status: 404 });
    }

    // Verify token not expired
    if (new Date(enrollment.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Enrollment token has expired' }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      profile: enrollment.wizard_profile_data || {}
    });

  } catch (error: any) {
    console.error('Error in GET /api/enrollments/token/:token/profile:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
