import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/course-access - Get user's complete course access information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's program enrollments (RPC handles the program-aware join).
    const { data: enrollments, error: enrollError } = await supabase
      .rpc('get_user_program_enrollments', { p_user_id: params.id });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
    }

    // Get user's *direct* course enrollments — distinct from program
    // enrollments because a student can be enrolled in a single course
    // without being in any program. The Access tab previously only
    // surfaced program-level enrollments, leaving direct course
    // enrollments invisible at the top of the page.
    const { data: courseEnrollmentsRaw, error: courseEnrollError } = await supabase
      .from('enrollments')
      .select(
        `id, status, enrolled_at, product_id,
         products!inner(id, title, type, course_id)`
      )
      .eq('user_id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .eq('products.type', 'course');

    if (courseEnrollError) {
      console.error('Error fetching direct course enrollments:', courseEnrollError);
    }

    const courseEnrollments = (courseEnrollmentsRaw ?? []).map((e: any) => ({
      enrollment_id: e.id as string,
      course_id: (e.products?.course_id ?? e.products?.id) as string,
      course_name: (e.products?.title ?? '—') as string,
      enrollment_status: e.status as string,
      enrolled_at: e.enrolled_at as string,
    }));

    // Get user's course overrides
    const { data: overrides, error: overrideError } = await supabase
      .rpc('get_user_course_overrides', { p_user_id: params.id });

    if (overrideError) {
      console.error('Error fetching overrides:', overrideError);
    }

    // Get visible courses (final computed access)
    const { data: visibleCourses, error: visibleError } = await supabase
      .rpc('get_visible_courses', { p_user_id: params.id });

    if (visibleError) {
      console.error('Error fetching visible courses:', visibleError);
    }

    // Refine visible_courses.source — the `get_visible_courses` RPC
    // only knows 'program' vs everything-else, but "everything else"
    // is actually two distinct things: a direct course enrollment OR
    // a manual override grant. Cross-reference the data we already
    // have to bucket each visible course precisely.
    const directCourseIds = new Set(courseEnrollments.map((c) => c.course_id));
    const grantedCourseIds = new Set(
      (overrides ?? [])
        .filter((o: any) => o.access_type === 'grant')
        .map((o: any) => o.course_id as string),
    );
    const refinedVisibleCourses = (visibleCourses ?? []).map((c: any) => {
      if (c.source === 'program') return c;
      // Manual grant wins precedence if both exist (it was the explicit
      // admin action). Otherwise course-enrollment. Fall back to the
      // generic 'override' label if neither matches.
      if (grantedCourseIds.has(c.course_id)) {
        return { ...c, source: 'manual_grant' };
      }
      if (directCourseIds.has(c.course_id)) {
        return { ...c, source: 'course_enrollment' };
      }
      return c;
    });

    // Return comprehensive access information
    return NextResponse.json({
      user_id: params.id,
      program_enrollments: enrollments || [],
      course_enrollments: courseEnrollments,
      course_overrides: overrides || [],
      visible_courses: refinedVisibleCourses,
      summary: {
        total_programs: enrollments?.length || 0,
        total_course_enrollments: courseEnrollments.length,
        total_overrides: overrides?.length || 0,
        total_visible_courses: visibleCourses?.length || 0,
        granted_courses: overrides?.filter((o: any) => o.access_type === 'grant').length || 0,
        hidden_courses: overrides?.filter((o: any) => o.access_type === 'hide').length || 0
      }
    });

  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]/course-access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
