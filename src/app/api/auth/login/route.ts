import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant, validateUserTenantAccess, getUserTenantRole } from '@/lib/tenant/detection';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 401 }
      );
    }

    // Get current tenant from URL (for org-based routes)
    let tenant = await getCurrentTenant(request);

    // If no tenant found from URL (e.g., /login instead of /org/slug/login),
    // try to find tenant from user's profile
    if (!tenant) {
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', authData.user.id)
        .single();

      if (userData?.tenant_id) {
        const { data: tenantData } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', userData.tenant_id)
          .single();

        if (tenantData) {
          tenant = tenantData;
        }
      }
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Check if tenant email is verified (for self-service signups)
    if (tenant.creation_method === 'self_service' && !tenant.email_verified) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          requiresVerification: true,
          email: tenant.admin_email
        },
        { status: 403 }
      );
    }

    // Validate user has access to this tenant
    const hasAccess = await validateUserTenantAccess(authData.user.id, tenant.id);
    if (!hasAccess) {
      // Sign out the user since they don't have access to this tenant
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Get user's role in this tenant
    const tenantRole = await getUserTenantRole(authData.user.id, tenant.id);

    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session: authData.session,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          role: tenantRole,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
