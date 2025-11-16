import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Email verification endpoint
 * Verifies tenant admin email using verification token
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Find tenant by verification token
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('*')
      .eq('email_verification_token', token)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (tenant.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified. You can log in now.',
        data: {
          organizationName: tenant.name,
          slug: tenant.slug,
          alreadyVerified: true,
        },
      });
    }

    // Check if verification was sent more than 24 hours ago
    const sentAt = new Date(tenant.email_verification_sent_at);
    const now = new Date();
    const hoursSinceSent = (now.getTime() - sentAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceSent > 24) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification link has expired. Please request a new one.',
          expired: true,
        },
        { status: 400 }
      );
    }

    // Update tenant as verified
    const { error: updateError } = await supabaseAdmin
      .from('tenants')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        email_verification_token: null, // Clear token after use
      })
      .eq('id', tenant.id);

    if (updateError) {
      console.error('Error updating tenant verification:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    // Find the admin user and confirm their email in Supabase Auth
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('role', 'admin')
      .limit(1);

    if (!usersError && users && users.length > 0) {
      const adminUserId = users[0].id;

      // Confirm email in Supabase Auth
      await supabaseAdmin.auth.admin.updateUserById(adminUserId, {
        email_confirm: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your organization.',
      data: {
        organizationName: tenant.name,
        slug: tenant.slug,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during email verification',
      },
      { status: 500 }
    );
  }
}
