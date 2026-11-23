import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { createReplacementModule, currentTenantId, placeReplacementModule, loadModule, moduleLessons, moveLessons } from '@/lib/lms/moduleDelete.server';
import { requireStaff } from '@/lib/auth/requireStaff';
import { moduleService } from '@/lib/lms/moduleService.server';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET /api/lms/modules/[id]
// Get a single module by ID
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Course content is for staff here; students read it through /api/user/courses, which checks enrollment.
    const denied = await requireStaff();
    if (denied) return denied;

    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const includeLessons = searchParams.get('include_lessons') === 'true';

    const result = await moduleService.getModuleById(id, includeLessons);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/modules/[id]
// Update a module
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Students can't change course content.
    const denied = await requireStaff();
    if (denied) return denied;

    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Update module
    const result = await moduleService.updateModule(id, body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'EDUCATION',
      resource_type: 'modules',
      resource_id: id,
      action: 'Updated module',
      new_values: body,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/lms/modules/[id]
// Delete a module
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Students can't change course content.
    const denied = await requireStaff();
    if (denied) return denied;

    const supabase = await createClient();
    const { id } = await params;

    console.log('[DELETE /api/lms/modules/[id]] Deleting module:', id);

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error('[DELETE /api/lms/modules/[id]] User not authenticated');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // A module with lessons needs a choice: move them to another module of
    // the course, or delete them one by one (which also cancels their Zoom /
    // Daily meetings). Without one, nothing is deleted.
    const body = (await request.json().catch(() => ({}))) as { lessons?: 'move' | 'delete'; target_module_id?: string; new_module_title?: string };
    const tenantId = await currentTenantId();
    if (!tenantId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const db = createAdminClient();
    const mod = await loadModule(db, id, tenantId);
    if (!mod) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    const lessons = await moduleLessons(db, id);
    let lessonNote = '';
    let replacementId: string | null = null;
    if (lessons.length > 0) {
      if (body.lessons === 'move') {
        const newTitle = (body.new_module_title || '').trim();
        let target: { id: string; course_id: string } | null = null;
        if (newTitle) {
          if (newTitle.length > 200) return NextResponse.json({ success: false, error: 'title_too_long' }, { status: 400 });
          target = { ...(await createReplacementModule(db, mod, newTitle)), course_id: mod.course_id };
          replacementId = target.id;
        } else if (body.target_module_id) {
          target = await loadModule(db, body.target_module_id, tenantId);
        }
        if (!target || target.id === id || target.course_id !== mod.course_id) {
          return NextResponse.json({ success: false, error: 'target_invalid' }, { status: 400 });
        }
        await moveLessons(db, lessons, target.id);
        lessonNote = ` (${lessons.length} lessons moved to ${target.id})`;
      } else if (body.lessons === 'delete') {
        const { lessonService } = await import('@/lib/lms/lessonService.server');
        let deleted = 0;
        for (const l of lessons) {
          const r = await lessonService.deleteLesson(l.id);
          if (!r.success) {
            return NextResponse.json({ success: false, error: 'lesson_delete_failed', deleted, total: lessons.length }, { status: 500 });
          }
          deleted += 1;
        }
        lessonNote = ` (${deleted} lessons deleted)`;
      } else {
        return NextResponse.json({ success: false, error: 'has_lessons', lesson_count: lessons.length }, { status: 409 });
      }
    }

    // Delete module
    const result = await moduleService.deleteModule(id);
    console.log('[DELETE /api/lms/modules/[id]] Delete result:', result);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    if (replacementId) await placeReplacementModule(db, replacementId, mod.order);

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'DELETE',
      event_category: 'EDUCATION',
      resource_type: 'modules',
      resource_id: id,
      action: 'Deleted module',
      description: `Deleted module ${id}${lessonNote}`,
      risk_level: 'medium',
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
