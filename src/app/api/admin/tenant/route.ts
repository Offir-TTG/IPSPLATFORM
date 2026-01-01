import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant/detection';
import { verifyTenantAdmin } from '@/lib/tenant/auth';

export const dynamic = 'force-dynamic';

// GET - Get current tenant details
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

    // Fetch complete tenant data directly from table to ensure we get all fields
    const { data: fullTenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenant.id)
      .single();

    if (tenantError || !fullTenant) {
      console.error('Error fetching full tenant data:', tenantError);
      return NextResponse.json({ success: false, error: 'Failed to fetch tenant data' }, { status: 500 });
    }

    // Get user's role in this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .single();

    if (!tenantUser) {
      return NextResponse.json(
        { success: false, error: 'User not part of this tenant' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...fullTenant,
        userRole: tenantUser.role,
      },
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching tenant details' },
      { status: 500 }
    );
  }
}

// PATCH - Update tenant settings
export async function PATCH(request: NextRequest) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();

    const updateData = await request.json();

    // Only allow certain fields to be updated
    const allowedFields = [
      'name',
      'logo_url',
      'primary_color',
      'admin_email',
      'default_language',
      'timezone',
      'currency',
      'enabled_features',
    ];

    const filteredUpdate: any = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(filteredUpdate).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    filteredUpdate.updated_at = new Date().toISOString();

    // Update tenant
    const { data: updatedTenant, error } = await supabase
      .from('tenants')
      .update(filteredUpdate)
      .eq('id', tenant.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      return NextResponse.json({ success: false, error: 'Failed to update tenant' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: updatedTenant,
      message: 'Tenant updated successfully',
    });
  } catch (error) {
    console.error('Update tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while updating tenant' },
      { status: 500 }
    );
  }
}
