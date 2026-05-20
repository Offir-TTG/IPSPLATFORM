import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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
    // Each update may carry: { id, is_active?, order?, parent_id? }
    // parent_id is explicitly nullable: pass `null` to un-nest an item
    // back to top-level (section), or a UUID to nest under that parent.
    // Omit the field entirely to leave the existing parent untouched.
    //
    // `deletes`: array of navigation_items.id to remove. Used by the
    // editor to drop empty sections (the UI gates this to empty rows
    // only). DELETEs run BEFORE updates so the FK chain stays sane.
    const { updates, deletes } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, error: 'Invalid updates array' },
        { status: 400 }
      );
    }

    // Admin already verified above via the `users.role` check. RLS on
    // navigation_items may not let the user's auth client DELETE rows
    // (same pattern that broke /api/admin/settings earlier — the
    // policy checks JWT claims, our admin gate checks the DB column).
    // Switch to the service-role client for the mutation paths; the
    // tenant_id filter still keeps writes scoped.
    const adminClient = createAdminClient();

    // Delete first (if any). Each delete is tenant-scoped to prevent
    // a request from one tenant ever wiping another's rows.
    if (Array.isArray(deletes) && deletes.length > 0) {
      const { data: deletedRows, error: deleteError } = await adminClient
        .from('navigation_items')
        .delete()
        .in('id', deletes)
        .eq('tenant_id', tenantId)
        .select('id');
      if (deleteError) {
        console.error('[Navigation API] Delete failed:', deleteError);
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 },
        );
      }
      console.log(
        `[Navigation API] Deleted ${deletedRows?.length ?? 0} of ${deletes.length} requested rows`,
      );
    }

    // Update each navigation item
    for (const update of updates) {
      const { id, is_active, order, parent_id } = update;

      const updateData: any = {};
      if (typeof is_active === 'boolean') updateData.is_active = is_active;
      if (typeof order === 'number') updateData.order = order;
      // `parent_id` must distinguish "not provided" (leave alone) from
      // "explicitly null" (un-nest to top-level). The Object.prototype
      // hasOwn check is the only safe way — `parent_id !== undefined`
      // would mishandle `null` correctly but JSON.parse will give us
      // `null` for `"parent_id": null` so we need to detect presence.
      if (Object.prototype.hasOwnProperty.call(update, 'parent_id')) {
        updateData.parent_id = parent_id;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await adminClient
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
 * Helper function to build hierarchical structure from flat navigation items.
 *
 * Schema is two-level: section → item → sub-item.
 *   • Sections    = rows with parent_id IS NULL.
 *   • Items       = rows whose parent_id points to a section.
 *   • Sub-items   = rows whose parent_id points to an item.
 *
 * The editor enforces a max depth of 2 (sub-item can't have children of
 * its own), so we don't recurse further.
 */
function buildHierarchy(items: any[]) {
  const buildItem = (item: any) => ({
    id: item.id,
    translation_key: item.translation_key,
    icon: item.icon,
    href: item.href,
    visible: item.is_active,
    order: item.order,
    children: items
      .filter((sub) => sub.parent_id === item.id)
      .map((sub) => ({
        id: sub.id,
        translation_key: sub.translation_key,
        icon: sub.icon,
        href: sub.href,
        visible: sub.is_active,
        order: sub.order,
      }))
      .sort((a, b) => a.order - b.order),
  });

  const sections = items
    .filter((item) => !item.parent_id)
    .map((section) => ({
      id: section.id,
      translation_key: section.translation_key,
      visible: section.is_active,
      order: section.order,
      items: items
        .filter((item) => item.parent_id === section.id)
        .map(buildItem)
        .sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);

  return sections;
}
