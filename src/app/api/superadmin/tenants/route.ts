import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/tenant/auth';

// GET - List all tenants (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = supabase
      .from('tenants')
      .select(`
        *,
        tenant_users!inner (count)
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,admin_email.ilike.%${search}%`);
    }

    const { data: tenants, error } = await query;

    if (error) {
      console.error('Error fetching tenants:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch tenants' }, { status: 500 });
    }

    // Get user counts for each tenant
    const tenantsWithCounts = await Promise.all(
      tenants.map(async (tenant) => {
        const { count } = await supabase
          .from('tenant_users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant.id)
          .eq('status', 'active');

        return {
          ...tenant,
          active_users: count || 0,
        };
      })
    );

    return NextResponse.json({ success: true, data: tenantsWithCounts });
  } catch (error) {
    console.error('Get tenants error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching tenants' },
      { status: 500 }
    );
  }
}

// POST - Create new tenant (Super Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      slug,
      domain,
      admin_email,
      subscription_tier,
      max_users,
      max_courses,
      logo_url,
      primary_color,
      default_language,
      timezone,
      currency,
      enabled_features,
    } = await request.json();

    if (!name || !slug || !admin_email) {
      return NextResponse.json(
        { success: false, error: 'Name, slug, and admin email are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTenant) {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 });
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name,
        slug,
        domain,
        admin_email,
        subscription_tier: subscription_tier || 'basic',
        max_users: max_users || 100,
        max_courses: max_courses || 50,
        logo_url,
        primary_color,
        default_language: default_language || 'en',
        timezone: timezone || 'UTC',
        currency: currency || 'USD',
        enabled_features: enabled_features || { courses: true, zoom: false, docusign: false },
        status: 'active',
        creation_method: 'super_admin', // Track that this was created by super admin
        email_verified: true, // Super admin created tenants are pre-verified
        created_by: user.id,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Error creating tenant:', tenantError);
      return NextResponse.json({ success: false, error: 'Failed to create tenant' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: tenant,
      message: 'Tenant created successfully',
    });
  } catch (error) {
    console.error('Create tenant error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while creating tenant' },
      { status: 500 }
    );
  }
}
