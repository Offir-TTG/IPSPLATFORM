import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/user/courses/[id]/attendance/stats
 * Retrieves attendance statistics for the current user in a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Authentication
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

    // Verify course exists and belongs to tenant
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get attendance statistics from the view
    const { data: stats, error: statsError } = await supabase
      .from('attendance_stats')
      .select('*')
      .eq('course_id', params.id)
      .eq('student_id', user.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (statsError) {
      // If no stats found, return zeros
      if (statsError.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            total_sessions: 0,
            present_count: 0,
            absent_count: 0,
            late_count: 0,
            excused_count: 0,
            attendance_percentage: 0,
          },
        });
      }

      console.error('Error fetching attendance stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch attendance statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error in GET /api/user/courses/[id]/attendance/stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
