import { createAdminClient, createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth/requireStaff';
import { NextRequest, NextResponse } from 'next/server';

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

/** The columns an admin may change on a course. */
const EDITABLE = [
  'program_id',
  'instructor_id',
  'title',
  'description',
  'access_tag',
  'start_date',
  'end_date',
  'is_active',
  'image_url',
  'is_standalone',
  'course_type',
  'is_published',
  'grading_scale_id',
  // Whether clients see grades and attendance for this course.
  'uses_grades',
  'uses_attendance',
] as const;

// GET /api/lms/courses/[id] - Get course details (student view)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Course content is for staff here; students read it through /api/user/courses, which checks enrollment.
    const denied = await requireStaff();
    if (denied) return denied;

    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get course with instructor details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        *,
        program:programs(id, name),
        instructor:users!courses_instructor_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error in GET /api/lms/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/lms/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant and role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Managing courses is for admins only (not instructors).
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // The admin role is checked above. Saving goes through the server client
    // (the signed-in user's own connection can be stopped by row rules),
    // always limited to the admin's own tenant.
    const db = createAdminClient();

    // Only the course's own columns can change (never id, tenant_id, ...).
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of EDITABLE) {
      if (key in body) updates[key] = body[key] === '' ? null : body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: current, error: currentError } = await db
      .from('courses')
      .select('program_id, is_standalone, start_date, end_date')
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .single();
    if (currentError || !current) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // The same rules as creating a course.
    const next = { ...current, ...updates } as any;
    if ('title' in updates && !String(updates.title ?? '').trim()) {
      return NextResponse.json({ success: false, error: 'lms.courses.error.title_required' }, { status: 400 });
    }
    if (next.is_standalone) {
      updates.program_id = null;
      next.program_id = null;
    } else if (('program_id' in updates || 'is_standalone' in updates) && !next.program_id) {
      return NextResponse.json({ success: false, error: 'lms.courses.error.program_required' }, { status: 400 });
    }
    if (next.start_date && next.end_date && new Date(next.end_date) < new Date(next.start_date)) {
      return NextResponse.json({ success: false, error: 'lms.courses.error.end_date_invalid' }, { status: 400 });
    }

    const { data: course, error: updateError } = await db
      .from('courses')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .select()
      .single();

    if (updateError || !course) {
      console.error('Error updating course:', updateError);
      return NextResponse.json({ error: 'Failed to update course' }, { status: 400 });
    }

    // Keep the program link in step when the course moves program. Other
    // programs the course was added to (from the Programs page) stay.
    if (current.program_id !== course.program_id) {
      if (current.program_id) {
        await db.from('program_courses').delete().eq('program_id', current.program_id).eq('course_id', id);
      }
      if (course.program_id) {
        const { data: existing } = await db
          .from('program_courses')
          .select('id')
          .eq('program_id', course.program_id)
          .eq('course_id', id)
          .limit(1);
        if (!existing || existing.length === 0) {
          const { data: last } = await db
            .from('program_courses')
            .select('order')
            .eq('program_id', course.program_id)
            .order('order', { ascending: false })
            .limit(1);
          const { error: linkError } = await db.from('program_courses').insert({
            program_id: course.program_id,
            course_id: id,
            is_required: true,
            order: last && last.length > 0 ? last[0].order + 1 : 0,
          });
          if (linkError) console.error('Error linking course to program:', linkError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error in PATCH /api/lms/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/lms/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant and role
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions (admin or super_admin only for deletions)
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if course is attached to any products
    const { data: relatedProducts, error: productsCheckError } = await supabase
      .from('products')
      .select('id, title')
      .eq('course_id', id)
      .eq('tenant_id', userData.tenant_id);

    if (productsCheckError) {
      console.error('Error checking related products:', productsCheckError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check course dependencies'
      }, { status: 400 });
    }

    if (relatedProducts && relatedProducts.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete course: it is attached to one or more products. Please remove the course from all products first.',
        error_he: 'לא ניתן למחוק את הקורס: הוא משויך למוצר אחד או יותר. נא להסיר את הקורס מכל המוצרים תחילה.',
        dependencies: {
          products: relatedProducts,
          programs: []
        }
      }, { status: 400 });
    }

    // Check if course is part of any programs
    const { data: relatedProgramCourses, error: programsCheckError } = await supabase
      .from('program_courses')
      .select('program_id, programs!inner(id, name)')
      .eq('course_id', id);

    if (programsCheckError) {
      console.error('Error checking related programs:', programsCheckError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check course dependencies',
        error_he: 'שגיאה בבדיקת תלויות הקורס'
      }, { status: 400 });
    }

    const relatedPrograms = relatedProgramCourses?.map((pc: any) => pc.programs) || [];

    if (relatedPrograms.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete course: it is part of one or more programs. Please remove the course from all programs first.',
        error_he: 'לא ניתן למחוק את הקורס: הוא חלק מתוכנית אחת או יותר. נא להסיר את הקורס מכל התוכניות תחילה.',
        dependencies: {
          products: [],
          programs: relatedPrograms
        }
      }, { status: 400 });
    }

    // Delete course (cascading deletes will handle related records like lessons, materials, etc.)
    const { error: deleteError } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete course'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/lms/courses/[id]:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
