import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6');

    // Get all courses that are in programs (to exclude them)
    const { data: programCourses } = await supabase
      .from('program_courses')
      .select('course_id');

    const programCourseIds = new Set(programCourses?.map(pc => pc.course_id) || []);

    // Get published and active courses with instructor info
    const { data: allCourses, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        image_url,
        instructor_id,
        users!courses_instructor_id_fkey(first_name, last_name)
      `)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false});

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    // Filter out courses that are part of programs (only keep standalone)
    const courses = allCourses?.filter(course => !programCourseIds.has(course.id)).slice(0, limit) || [];

    // Get enrollment counts and lesson stats for each course
    const coursesWithStats = await Promise.all(
      (courses || []).map(async (course) => {
        // Get total lessons via modules
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, duration, modules!inner(course_id)')
          .eq('modules.course_id', course.id);

        const totalLessons = lessons?.length || 0;
        const totalMinutes = lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
        const totalHours = Math.round(totalMinutes / 60);

        // Get enrollment count
        const { count: enrollmentCount } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', course.id)
          .eq('product_type', 'course');

        // Format instructor name
        const instructor = course.users as any;
        const instructorName = instructor
          ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
          : null;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          image_url: course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop',
          instructor: instructorName,
          total_lessons: totalLessons,
          total_hours: totalHours,
          student_count: enrollmentCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      courses: coursesWithStats,
    });
  } catch (error) {
    console.error('Error in public courses API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
