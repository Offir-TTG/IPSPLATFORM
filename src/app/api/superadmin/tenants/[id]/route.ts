import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/tenant/auth';

// GET - Get specific tenant details (Super Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Get tenant details
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Get tenant statistics
    const { count: userCount } = await supabase
      .from('tenant_users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('status', 'active');

    const { count: courseCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id);

    const { count: languageCount } = await supabase
      .from('languages')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('is_active', true);

    return NextResponse.json({
      success: true,
      data: {
        ...tenant,
        stats: {
          active_users: userCount || 0,
          courses: courseCount || 0,
          languages: languageCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching tenant' },
      { status: 500 }
    );
  }
}

// PATCH - Update tenant (Super Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    const updateData = await request.json();

    // Super admins can update all fields including subscription tier and limits
    const allowedFields = [
      'name',
      'domain',
      'status',
      'subscription_tier',
      'max_users',
      'max_courses',
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
      .eq('id', id)
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

// DELETE - Delete tenant (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Check if tenant exists
    const { data: tenant } = await supabase.from('tenants').select('slug').eq('id', id).single();

    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }

    // Prevent deletion of default tenant
    const defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || 'default';
    if (tenant.slug === defaultSlug) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default tenant' },
        { status: 400 }
      );
    }

    // Delete tenant (cascade will handle related records)
    const { error } = await supabase.from('tenants').delete().eq('id', id);

    if (error) {
      console.error('Error deleting tenant:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete tenant' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while deleting tenant' },
      { status: 500 }
    );
  }
}
