import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Validate invitation token and get details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get invitation by token
    const { data: invitation, error } = await supabase
      .from('tenant_invitations')
      .select(
        `
        *,
        tenants!inner (
          id,
          name,
          slug,
          logo_url
        )
      `
      )
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        role: invitation.role,
        firstName: invitation.first_name,
        lastName: invitation.last_name,
        tenant: invitation.tenants,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while validating invitation' },
      { status: 500 }
    );
  }
}

// POST - Accept invitation and create account
export async function POST(request: NextRequest) {
  try {
    const { token, password, first_name, last_name, phone } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: 'Token and password are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get invitation by token
    const { data: invitation, error: inviteError } = await supabase
      .from('tenant_invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists (they might be accepting invitation for a second tenant)
    // Query auth.users table to check if email exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', invitation.email)
      .limit(1);

    let userId: string;
    let session = null;

    if (existingUsers && existingUsers.length > 0) {
      // User exists - just add them to this tenant
      userId = existingUsers[0].id;

      // Sign them in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInError) {
        return NextResponse.json(
          { success: false, error: 'Invalid password for existing account' },
          { status: 401 }
        );
      }

      session = signInData.session;
    } else {
      // New user - create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            first_name: first_name || invitation.first_name,
            last_name: last_name || invitation.last_name,
            phone,
          },
        },
      });

      if (authError) {
        console.error('Auth error:', authError);
        return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
      }

      if (!authData.user) {
        return NextResponse.json(
          { success: false, error: 'Failed to create user' },
          { status: 500 }
        );
      }

      userId = authData.user.id;
      session = authData.session;

      // Use admin client to create user profile
      const supabaseAdmin = createAdminClient();

      const { error: userError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email: invitation.email,
        role: invitation.role,
        first_name: first_name || invitation.first_name,
        last_name: last_name || invitation.last_name,
        phone: phone || null,
        tenant_id: invitation.tenant_id,
      });

      if (userError) {
        console.error('User profile creation error:', userError);
        // Rollback auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        } catch (deleteError) {
          console.error('Error deleting user during rollback:', deleteError);
        }
        return NextResponse.json(
          { success: false, error: `Failed to create user profile: ${userError.message}` },
          { status: 500 }
        );
      }
    }

    // Add user to tenant_users table (whether new or existing user)
    const supabaseAdmin = createAdminClient();

    const { error: tenantUserError } = await supabaseAdmin.from('tenant_users').insert({
      tenant_id: invitation.tenant_id,
      user_id: userId,
      role: invitation.role,
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    if (tenantUserError) {
      console.error('Tenant user creation error:', tenantUserError);
      return NextResponse.json(
        { success: false, error: 'Failed to add user to organization' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from('tenant_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // Get tenant details
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('id', invitation.tenant_id)
      .single();

    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        session,
        tenant: {
          id: tenant?.id,
          name: tenant?.name,
          slug: tenant?.slug,
          role: invitation.role,
        },
      },
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while accepting invitation' },
      { status: 500 }
    );
  }
}
