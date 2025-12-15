import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, first_name, last_name, phone } = await request.json();

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'Email, password, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const supabase = await createClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          phone,
        },
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Use admin client to bypass RLS for user creation
    const supabaseAdmin = createAdminClient();

    // Create user profile with tenant_id
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        role: 'student',
        first_name,
        last_name,
        phone: phone || null,
        tenant_id: tenant.id,
      })
      .select()
      .single();

    if (userError) {
      console.error('User profile creation error:', userError);

      // Rollback: delete auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.error('Error deleting user during rollback:', deleteError);
      }

      return NextResponse.json(
        { success: false, error: `Failed to create user profile: ${userError.message}` },
        { status: 500 }
      );
    }

    // Add user to tenant_users table
    const { error: tenantUserError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: authData.user.id,
        role: 'student',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (tenantUserError) {
      console.error('Tenant user creation error:', tenantUserError);
      // Continue anyway - user was created, just not added to tenant_users
      // This can be fixed manually by admin if needed
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
          role: 'student',
        },
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
