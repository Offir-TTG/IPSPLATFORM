import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getCurrentTenant } from '@/lib/tenant/detection';

export const dynamic = 'force-dynamic';

// POST /api/admin/tenant/users/[id]/set-password - Manually set user password
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { password } = body;

    // Validate password
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

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
      .select('role, user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Verify target user belongs to this tenant
    const { data: targetTenantUser } = await supabase
      .from('tenant_users')
      .select('user_id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', id)
      .single();

    if (!targetTenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not found in this tenant' },
        { status: 404 }
      );
    }

    // Get target user details
    const { data: targetUserData } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', id)
      .single();

    if (!targetUserData) {
      return NextResponse.json(
        { success: false, error: 'User details not found' },
        { status: 404 }
      );
    }

    // Create admin client with service role to update password
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Update user password using admin.updateUserById
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('✅ Password updated successfully for user:', id);

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'PASSWORD_SET',
      event_category: 'USER_MANAGEMENT',
      resource_type: 'users',
      resource_id: id,
      action: 'Manually set user password',
      description: `Password manually set for ${targetUserData.email} by admin`,
      risk_level: 'high',
      metadata: {
        target_user_email: targetUserData.email,
        target_user_name: `${targetUserData.first_name} ${targetUserData.last_name}`,
        admin_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while setting password' },
      { status: 500 }
    );
  }
}
