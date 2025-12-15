import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';

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

    // Get all users in this tenant
    const { data: tenantUsers, error } = await supabase
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
          email,
          first_name,
          last_name,
          phone
        )
      `
      )
      .eq('tenant_id', tenant.id)
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching tenant users:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: tenantUsers });
  } catch (error) {
    console.error('Get tenant users error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching users' },
      { status: 500 }
    );
  }
}
