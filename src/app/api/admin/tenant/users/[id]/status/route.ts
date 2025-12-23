import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/tenant/users/[id]/status - Quick status change
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { status, reason } = body;

    // Validate status
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: active, inactive, or suspended' },
        { status: 400 }
      );
    }

    // Require reason for suspension
    if (status === 'suspended' && !reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for suspension' },
        { status: 400 }
      );
    }

    // Prevent self-deactivation
    if (id === user.id && (status === 'inactive' || status === 'suspended')) {
      return NextResponse.json(
        { success: false, error: 'Cannot deactivate or suspend your own account' },
        { status: 400 }
      );
    }

    // Verify target user belongs to this tenant
    const { data: targetTenantUser } = await supabase
      .from('tenant_users')
      .select('id, users!inner(email, first_name, last_name)')
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    if (!targetTenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Update tenant_users status
    const { error: updateError } = await supabase
      .from('tenant_users')
      .update({ status })
      .eq('tenant_id', tenant.id)
      .eq('user_id', id);

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    // Also update is_active in users table
    const isActive = status === 'active';
    await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', id);

    // Log audit event
    const targetUserInfo = (targetTenantUser.users as any);
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'STATUS_CHANGE',
      event_category: 'USER_MANAGEMENT',
      resource_type: 'users',
      resource_id: id,
      action: 'Changed user status',
      description: `Changed status to ${status}${reason ? `: ${reason}` : ''}`,
      new_values: { status, reason },
      risk_level: status === 'suspended' ? 'high' : 'medium',
      metadata: {
        reason,
        status,
        target_user_email: targetUserInfo.email,
      },
    });

    // Fetch updated user
    const { data: updatedUser } = await supabase
      .from('tenant_users')
      .select(
        `
        id,
        user_id,
        role,
        status,
        joined_at,
        last_accessed_at,
        users!inner (
          id,
          email,
          first_name,
          last_name,
          phone,
          is_active
        )
      `
      )
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User status changed to ${status}`,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while updating user status' },
      { status: 500 }
    );
  }
}
