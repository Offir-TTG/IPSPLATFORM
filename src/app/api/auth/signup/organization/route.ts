import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Public API endpoint for self-service organization signup
 * Creates both tenant and admin user in a single transaction
 * The person who signs up becomes the tenant admin automatically
 */
export async function POST(request: NextRequest) {
  try {
    const { organizationName, slug, firstName, lastName, email, password } = await request.json();

    // Validation
    if (!organizationName || !slug || !firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { success: false, error: 'Invalid organization identifier format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for creation
    const supabaseAdmin = createAdminClient();

    // Check if slug is available
    const { data: slugAvailable } = await supabaseAdmin.rpc('is_slug_available', {
      p_slug: slug,
    });

    if (!slugAvailable) {
      return NextResponse.json(
        { success: false, error: 'Organization identifier is already taken' },
        { status: 400 }
      );
    }

    // Generate email verification token
    const { data: verificationToken } = await supabaseAdmin.rpc('generate_verification_token');

    if (!verificationToken) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate verification token' },
        { status: 500 }
      );
    }

    // Step 1: Create auth user (this will be the tenant admin)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirm email immediately since we handle verification ourselves
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
      },
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create admin account' },
        { status: 400 }
      );
    }

    const adminUserId = authData.user.id;

    try {
      // Step 2: Create tenant with trial period (14 days)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const { data: tenantData, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: organizationName,
          slug,
          admin_name: `${firstName} ${lastName}`,
          admin_email: email,
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
          subscription_tier: 'basic',
          subscription_status: 'trialing',
          creation_method: 'self_service',
          email_verified: false,
          email_verification_token: verificationToken,
          email_verification_sent_at: new Date().toISOString(),
          signup_completed_at: new Date().toISOString(),
          // Default resource limits for trial/basic
          max_users: 25,
          max_courses: 10,
          max_storage_gb: 5,
          max_instructors: 5,
          // Regional defaults
          default_language: 'en',
          timezone: 'UTC',
          currency: 'USD',
          created_by: adminUserId,
        })
        .select()
        .single();

      if (tenantError || !tenantData) {
        console.error('Tenant creation error:', tenantError);
        // Rollback: delete auth user
        await supabaseAdmin.auth.admin.deleteUser(adminUserId);
        return NextResponse.json(
          { success: false, error: `Failed to create organization: ${tenantError?.message}` },
          { status: 500 }
        );
      }

      // Step 3: Create user profile (links to tenant)
      const { error: userProfileError } = await supabaseAdmin.from('users').insert({
        id: adminUserId,
        email,
        role: 'admin', // This person is the tenant admin
        first_name: firstName,
        last_name: lastName,
        tenant_id: tenantData.id,
      });

      if (userProfileError) {
        console.error('User profile creation error:', userProfileError);
        // Rollback: delete tenant and auth user
        await supabaseAdmin.from('tenants').delete().eq('id', tenantData.id);
        await supabaseAdmin.auth.admin.deleteUser(adminUserId);
        return NextResponse.json(
          { success: false, error: `Failed to create admin profile: ${userProfileError.message}` },
          { status: 500 }
        );
      }

      // Step 4: Add to tenant_users junction table (as owner/admin)
      const { error: tenantUserError } = await supabaseAdmin.from('tenant_users').insert({
        tenant_id: tenantData.id,
        user_id: adminUserId,
        role: 'owner', // Highest privilege - this is the organization creator
        status: 'active',
        joined_at: new Date().toISOString(),
      });

      if (tenantUserError) {
        console.error('Tenant user creation error:', tenantUserError);
        // Continue anyway - user is created, just not in junction table
        // This can be fixed manually if needed
      }

      // Step 5: Send verification email
      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

      // Import and send verification email
      const { sendVerificationEmail } = await import('@/lib/email/send');
      const emailSent = await sendVerificationEmail({
        email,
        firstName,
        organizationName,
        verificationUrl,
        trialEndsAt: trialEndsAt.toISOString(),
      });

      if (!emailSent) {
        console.warn('Failed to send verification email, but signup was successful');
        // Don't fail the signup if email fails - log the URL instead
        console.log('='.repeat(80));
        console.log('⚠️  EMAIL SENDING FAILED - MANUAL VERIFICATION REQUIRED');
        console.log('='.repeat(80));
        console.log(`Organization: ${organizationName} (${slug})`);
        console.log(`Admin: ${firstName} ${lastName} <${email}>`);
        console.log(`Verification URL: ${verificationUrl}`);
        console.log(`Trial ends: ${trialEndsAt.toLocaleDateString()}`);
        console.log('='.repeat(80));
      }

      // Return success (without auto-login - user must verify email first)
      return NextResponse.json({
        success: true,
        message: 'Organization created successfully! Please check your email to verify your account.',
        data: {
          organizationId: tenantData.id,
          organizationName: tenantData.name,
          slug: tenantData.slug,
          adminEmail: email,
          trialEndsAt: trialEndsAt.toISOString(),
          requiresEmailVerification: true,
        },
      });
    } catch (error) {
      // Rollback: delete auth user if anything fails
      await supabaseAdmin.auth.admin.deleteUser(adminUserId);
      throw error;
    }
  } catch (error) {
    console.error('Organization signup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during organization creation',
      },
      { status: 500 }
    );
  }
}
