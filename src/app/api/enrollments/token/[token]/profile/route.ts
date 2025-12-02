import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/enrollments/token/:token/profile
 *
 * Save profile data to enrollment WITHOUT creating user account
 * NO AUTHENTICATION REQUIRED - uses token validation instead
 * Profile data is stored in wizard_profile_data JSON column until enrollment completion
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      country
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
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
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({
        wizard_profile_data: {
          first_name,
          last_name,
          email,
          phone: phone || null,
          address: address || null,
          city: city || null,
          country: country || null,
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('enrollment_token', params.token);

    if (updateError) {
      console.error('Error updating wizard profile data:', updateError);
      return NextResponse.json(
        { error: 'Failed to save profile data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile data saved successfully'
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
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = await createClient();

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
