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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user's program enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .rpc('get_user_program_enrollments', { p_user_id: params.id });

    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError);
    }

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

    // Return comprehensive access information
    return NextResponse.json({
      user_id: params.id,
      program_enrollments: enrollments || [],
      course_overrides: overrides || [],
      visible_courses: visibleCourses || [],
      summary: {
        total_programs: enrollments?.length || 0,
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
