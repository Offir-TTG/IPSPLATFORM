import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET /api/admin/lms/programs/[id]/courses
// Get all courses in a program (via program_courses junction table)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

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

    // Get user metadata to extract tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all courses in this program via program_courses junction table
    const { data: programCourses, error } = await supabase
      .from('program_courses')
      .select(`
        course_id,
        order,
        is_required,
        courses (
          id,
          program_id,
          title,
          description,
          image_url,
          start_date,
          end_date,
          is_active,
          is_published,
          instructor_id,
          created_at,
          updated_at
        )
      `)
      .eq('program_id', params.id)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error loading program courses:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Extract just the course objects with the junction table metadata
    const courses = programCourses?.map((pc: any) => ({
      ...pc.courses,
      order: pc.order,
      is_required: pc.is_required,
    })) || [];

    return NextResponse.json({
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error('Error in program courses endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
