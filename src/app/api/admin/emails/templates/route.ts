import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// =====================================================
// GET - List all email templates for tenant
// =====================================================
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user to verify admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant_id from user
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Verify admin role
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tenantId = userData.tenant_id;

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('email_templates')
      .select('id, template_key, template_name, template_category, description, is_system, is_active, variables, created_at')
      .eq('tenant_id', tenantId)
      .order('template_category', { ascending: true })
      .order('template_name', { ascending: true });

    // Apply filters
    if (category) {
      query = query.eq('template_category', category);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0,
    });

  } catch (error: any) {
    console.error('Error in templates API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
