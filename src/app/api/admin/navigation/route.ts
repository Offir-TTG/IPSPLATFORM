import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/navigation
 * Fetch navigation items for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const tenantId = userData.tenant_id;

    // Fetch all navigation items for this tenant, ordered by order field
    const { data: navItems, error: navError } = await supabase
      .from('navigation_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('order', { ascending: true });

    console.log('[Navigation API GET] Fetched items:', navItems?.length || 0, 'items');
    console.log('[Navigation API GET] Error:', navError);

    if (navError) {
      throw navError;
    }

    // Transform flat structure into hierarchical sections and items
    const sections = buildHierarchy(navItems || []);

    console.log('[Navigation API GET] Built sections:', sections.length);
    console.log('[Navigation API GET] Sample section:', sections[0]);

    return NextResponse.json({
      success: true,
      data: { sections }
    });

  } catch (error) {
    console.error('[Navigation API] Error fetching navigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch navigation'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/navigation
 * Update navigation items (toggle visibility, reorder)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is admin
    if (userData.role !== 'admin' && userData.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const tenantId = userData.tenant_id;
    const body = await request.json();
    const { updates } = body; // Array of {id, is_active, order}

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid updates array' },
        { status: 400 }
      );
    }

    // Update each navigation item
    for (const update of updates) {
      const { id, is_active, order } = update;

      const updateData: any = {};
      if (typeof is_active === 'boolean') updateData.is_active = is_active;
      if (typeof order === 'number') updateData.order = order;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('navigation_items')
          .update(updateData)
          .eq('id', id)
          .eq('tenant_id', tenantId);

        if (updateError) {
          console.error(`Error updating nav item ${id}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Navigation updated successfully'
    });

  } catch (error) {
    console.error('[Navigation API] Error updating navigation:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update navigation'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to build hierarchical structure from flat navigation items
 */
function buildHierarchy(items: any[]) {
  // Separate sections (no parent) from items (has parent)
  const sections = items
    .filter(item => !item.parent_id)
    .map(section => ({
      id: section.id,
      translation_key: section.translation_key,
      visible: section.is_active,
      order: section.order,
      items: items
        .filter(item => item.parent_id === section.id)
        .map(item => ({
          id: item.id,
          translation_key: item.translation_key,
          icon: item.icon,
          href: item.href,
          visible: item.is_active,
          order: item.order,
        }))
        .sort((a, b) => a.order - b.order)
    }))
    .sort((a, b) => a.order - b.order);

  return sections;
}
