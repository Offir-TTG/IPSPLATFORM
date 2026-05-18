import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

export const dynamic = 'force-dynamic';

// GET /api/admin/tenant/users/[id] - Get user details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  console.log('[GET /api/admin/tenant/users/[id]] ROUTE HIT!');
  try {
    const params = await context.params;
    const { id } = params;
    console.log('[GET /api/admin/tenant/users/[id]] Fetching user with id:', id);
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log('[GET /api/admin/tenant/users/[id]] ERROR: Unauthorized');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Get current tenant
    const tenant = await getCurrentTenant(request);
    console.log('[GET /api/admin/tenant/users/[id]] Tenant:', tenant?.id);
    if (!tenant) {
      console.log('[GET /api/admin/tenant/users/[id]] ERROR: Tenant not found');
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Verify user is admin in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    console.log('[GET /api/admin/tenant/users/[id]] Current user role:', tenantUser?.role);

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      console.log('[GET /api/admin/tenant/users/[id]] ERROR: Forbidden - user is not admin');
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // RLS on `tenant_users` is self-scoped, so the cookie client only
    // returns the calling admin's own row — even though we just verified
    // they're an admin. Use the admin client for the target-user lookups
    // (same pattern as the list endpoint). All queries are bounded to
    // `tenant.id`, so cross-tenant data leakage is impossible.
    const adminClient = createAdminClient();

    console.log('[GET /api/admin/tenant/users/[id]] Querying for target user...');
    const { data: targetTenantUser, error: tenantUserError } = await adminClient
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    console.log('[GET /api/admin/tenant/users/[id]] Query result - error:', tenantUserError);
    console.log('[GET /api/admin/tenant/users/[id]] Query result - data:', targetTenantUser);

    if (tenantUserError || !targetTenantUser) {
      console.log('[GET /api/admin/tenant/users/[id]] ERROR: User not found in tenant');
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Get user details from users table
    const { data: userDetails, error: userError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', targetTenantUser.user_id)
      .single();

    if (userError || !userDetails) {
      console.log('[GET /api/admin/tenant/users/[id]] ERROR: User details not found');
      return NextResponse.json(
        { success: false, error: 'User details not found' },
        { status: 404 }
      );
    }

    // Get enrollment statistics
    const { count: enrollmentCount } = await adminClient
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetTenantUser.user_id)
      .eq('tenant_id', tenant.id);

    const { count: completedCount } = await adminClient
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetTenantUser.user_id)
      .eq('tenant_id', tenant.id)
      .eq('status', 'completed');

    // Merge tenant_user with user details
    const mergedUser = {
      ...targetTenantUser,
      users: userDetails,
    };

    return NextResponse.json({
      success: true,
      data: {
        user: mergedUser,
        stats: {
          enrollmentCount: enrollmentCount || 0,
          completedCourses: completedCount || 0,
          lastActivity: targetTenantUser.last_accessed_at || userDetails.last_login_at,
        },
      },
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching user details' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/tenant/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
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

    // Prevent self-modification of role
    const body = await request.json();
    if (id === user.id && body.role && body.role !== tenantUser.role) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Prevent self-deactivation
    if (id === user.id && (body.is_active === false || body.status === 'inactive' || body.status === 'suspended')) {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Same RLS workaround as GET — the cookie client only returns the
    // calling admin's own tenant_users row. Authorization already verified
    // above; admin client below is scoped to `tenant.id` on every query.
    const adminClient = createAdminClient();

    // Verify target user belongs to this tenant (id param is user_id)
    const { data: targetTenantUser } = await adminClient
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    if (!targetTenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Separate updates for users table and tenant_users table
    const userUpdates: any = {};
    const tenantUserUpdates: any = {};

    // Map fields to appropriate tables
    if (body.first_name !== undefined) userUpdates.first_name = body.first_name;
    if (body.last_name !== undefined) userUpdates.last_name = body.last_name;
    if (body.email !== undefined) userUpdates.email = body.email;
    if (body.phone !== undefined) userUpdates.phone = body.phone;
    if (body.bio !== undefined) userUpdates.bio = body.bio;
    if (body.location !== undefined) userUpdates.location = body.location;
    if (body.contact_email !== undefined) userUpdates.contact_email = body.contact_email;
    if (body.is_whatsapp !== undefined) userUpdates.is_whatsapp = body.is_whatsapp;

    if (body.role !== undefined) tenantUserUpdates.role = body.role;
    if (body.status !== undefined) tenantUserUpdates.status = body.status;

    // Update users table if there are changes
    if (Object.keys(userUpdates).length > 0) {
      const { error: userError } = await adminClient
        .from('users')
        .update(userUpdates)
        .eq('id', id);

      if (userError) {
        console.error('Error updating user:', userError);
        return NextResponse.json(
          { success: false, error: userError.message },
          { status: 400 }
        );
      }
    }

    // Update tenant_users table if there are changes
    if (Object.keys(tenantUserUpdates).length > 0) {
      const { error: tenantUserError } = await adminClient
        .from('tenant_users')
        .update(tenantUserUpdates)
        .eq('tenant_id', tenant.id)
        .eq('user_id', id);

      if (tenantUserError) {
        console.error('Error updating tenant user:', tenantUserError);
        return NextResponse.json(
          { success: false, error: tenantUserError.message },
          { status: 400 }
        );
      }
    }

    // Log audit event (kept on cookie client so RLS-aware inserts behave
    // identically to before; audit_events insert was working previously).
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'USER_MANAGEMENT',
      resource_type: 'users',
      resource_id: id,
      action: 'Updated user profile',
      description: `Updated fields: ${Object.keys({ ...userUpdates, ...tenantUserUpdates }).join(', ')}`,
      new_values: { ...userUpdates, ...tenantUserUpdates },
      risk_level: body.role || body.status ? 'medium' : 'low',
    });

    // Fetch updated tenant_user (admin client — same RLS reason)
    const { data: updatedTenantUser } = await adminClient
      .from('tenant_users')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    // Fetch updated user details
    const { data: updatedUserDetails } = await adminClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    // Merge the data
    const updatedUser = {
      ...updatedTenantUser,
      users: updatedUserDetails,
    };

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while updating user' },
      { status: 500 }
    );
  }
}
