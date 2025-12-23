import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { renderEmailTemplate } from '@/lib/email/renderTemplate';
import { sendEmail } from '@/lib/email/send';

export const dynamic = 'force-dynamic';

// GET - List all users in current tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Verify user is admin in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const roleFilter = searchParams.get('role');
    const statusFilter = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'joined_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query for tenant_users
    let query = supabase
      .from('tenant_users')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id);

    // Apply role filter
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    // Apply status filter
    if (statusFilter === 'active') {
      query = query.eq('status', 'active');
    } else if (statusFilter === 'inactive') {
      query = query.eq('status', 'inactive');
    } else if (statusFilter === 'suspended') {
      query = query.eq('status', 'suspended');
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'role') {
      query = query.order('role', { ascending });
    } else {
      query = query.order('joined_at', { ascending });
    }

    // Fetch tenant_users
    const { data: tenantUsersData, error, count: totalCount } = await query;

    if (error) {
      console.error('Error fetching tenant users:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!tenantUsersData || tenantUsersData.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          users: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        },
      });
    }

    // Get user IDs
    const userIds = tenantUsersData.map((tu) => tu.user_id);

    // Fetch user details from users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }

    // Create a map of user details
    const usersMap = new Map(usersData?.map((u) => [u.id, u]) || []);

    // Merge tenant_users with user details
    let tenantUsers = tenantUsersData.map((tu) => ({
      ...tu,
      users: usersMap.get(tu.user_id) || null,
    }));

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      tenantUsers = tenantUsers.filter((tu) => {
        const firstName = tu.users?.first_name?.toLowerCase() || '';
        const lastName = tu.users?.last_name?.toLowerCase() || '';
        const email = tu.users?.email?.toLowerCase() || '';
        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          email.includes(searchLower)
        );
      });
    }

    const count = search ? tenantUsers.length : totalCount || 0;

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit;
    tenantUsers = tenantUsers.slice(from, to);

    // Calculate pagination info
    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      success: true,
      data: {
        users: tenantUsers || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Get tenant users error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}

// POST - Create/invite a new user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Verify user is admin in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { email, first_name, last_name, phone, role, password, language, send_email = true } = body;

    // Validate required fields
    if (!email || !first_name || !last_name || !password) {
      console.error('Missing required fields:', { email: !!email, first_name: !!first_name, last_name: !!last_name, password: !!password });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists in this tenant
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('tenant_id', tenant.id);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: `A user with email ${email} already exists` },
        { status: 409 }
      );
    }

    // Create the user in Supabase Auth using admin client
    const adminClient = createAdminClient();
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name,
        last_name,
        phone: phone || null,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { success: false, error: authError?.message || 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create user record in users table
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      first_name,
      last_name,
      phone: phone || null,
      tenant_id: tenant.id,
      role: role || 'student',
      status: 'active',
    });

    if (userError) {
      console.error('Error creating user record:', userError);
      console.error('User record details:', { id: authData.user.id, email, first_name, last_name, tenant_id: tenant.id });
      // Try to delete the auth user if user record creation failed
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: `Failed to create user record: ${userError.message}` },
        { status: 500 }
      );
    }

    // Add user to tenant with specified role
    const { error: tenantUserError } = await supabase.from('tenant_users').insert({
      tenant_id: tenant.id,
      user_id: authData.user.id,
      role: role || 'student',
      status: 'active',
      joined_at: new Date().toISOString(),
    });

    if (tenantUserError) {
      console.error('Error adding user to tenant:', tenantUserError);
      // Cleanup: delete user and auth user
      await supabase.from('users').delete().eq('id', authData.user.id);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: `Failed to add user to tenant: ${tenantUserError.message}` },
        { status: 500 }
      );
    }

    // Send welcome email with login credentials (if requested)
    if (send_email) {
      try {
        // Get current user info for adminName
        const { data: currentUser } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        const adminName = currentUser
          ? `${currentUser.first_name} ${currentUser.last_name}`.trim()
          : undefined;

        // Render email template
        const renderedEmail = await renderEmailTemplate({
          templateKey: 'system.user_invitation',
          tenantId: tenant.id,
          languageCode: (language as 'en' | 'he') || 'en',
          variables: {
            userName: first_name,
            userEmail: email,
            temporaryPassword: password,
            role: role || 'student',
            organizationName: tenant.name,
            loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`,
            adminName,
          },
        });

        if (renderedEmail) {
          await sendEmail({
            to: email,
            subject: renderedEmail.subject,
            html: renderedEmail.bodyHtml,
            text: renderedEmail.bodyText,
          });
          console.log('✅ Welcome email sent to:', email);
        } else {
          console.warn('⚠️ Could not render welcome email template');
        }
      } catch (emailError) {
        // Don't fail user creation if email fails
        console.error('❌ Error sending welcome email:', emailError);
      }
    } else {
      console.log('📧 Email sending skipped by admin');
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'USER_MANAGEMENT',
      resource_type: 'users',
      resource_id: authData.user.id,
      action: 'Invited new user',
      description: `Invited user: ${email} with role: ${role || 'student'}`,
      risk_level: 'medium',
    });

    return NextResponse.json({
      success: true,
      message: 'User invited successfully',
      data: {
        id: authData.user.id,
        email,
        first_name,
        last_name,
        role: role || 'student',
      },
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
