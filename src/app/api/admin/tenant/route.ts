import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
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

    // Identity already verified via `auth.getUser()`. Use admin client
    // for the tenant + membership reads to bypass the tenant-context RLS
    // that API routes can't satisfy (same fix as in `withAuth` and the
    // login route).
    const admin = createAdminClient();

    // Fetch complete tenant data directly from table to ensure we get all fields
    const { data: fullTenant, error: tenantError } = await admin
      .from('tenants')
      .select('*')
      .eq('id', tenant.id)
      .single();

    if (tenantError || !fullTenant) {
      console.error('Error fetching full tenant data:', tenantError);
      return NextResponse.json({ success: false, error: 'Failed to fetch tenant data' }, { status: 500 });
    }

    // Get user's role in this tenant
    const { data: tenantUser } = await admin
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
    // Identity already verified via `verifyTenantAdmin`. The `tenants`
    // table only has UPDATE policies for super-admins, so a regular
    // tenant admin's update would silently match 0 rows under RLS and
    // surface as "Failed to update tenant". Use the admin client for
    // the actual write — narrowly scoped to `.eq('id', tenant.id)`.
    const supabase = await createClient();
    const admin = createAdminClient();

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
      // Email branding fields (drive the master email layout — see
      // src/lib/email/layout.ts and src/lib/email/renderTemplate.ts).
      'email_primary_color',
      'email_button_color',
      'email_logo_url',
      'email_footer_text',
      'email_sender_name',
      'email_reply_to',
      'email_header_style',
      // Absolute base URL of the user portal. Used by webhooks /
      // triggers when constructing email links so the admin can
      // flip from staging to production without a redeploy.
      'portal_url',
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

    // Update tenant via admin client (bypasses RLS — see note above).
    const { data: updatedTenant, error } = await admin
      .from('tenants')
      .update(filteredUpdate)
      .eq('id', tenant.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tenant:', error);
      // Surface the underlying message so we don't keep guessing at
      // RLS / column-not-found / check-constraint failures.
      return NextResponse.json(
        { success: false, error: `Failed to update tenant: ${error.message}` },
        { status: 500 }
      );
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
