import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/user/courses/[courseId]/grade-categories - Get grade categories for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
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
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user is enrolled in this course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .eq('status', 'active')
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    // Get grade categories for this course
    const { data: categories, error: categoriesError } = await supabase
      .from('grade_categories')
      .select('*')
      .eq('course_id', params.courseId)
      .eq('tenant_id', userData.tenant_id)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('Error fetching grade categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to fetch grade categories' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: categories || [],
    });
  } catch (error) {
    console.error('Error in GET /api/user/courses/[courseId]/grade-categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
