import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id: programId } = await params;

    // Get courses in this program with their modules and lessons
    const { data: programCourses, error: coursesError } = await supabase
      .from('program_courses')
      .select(`
        course_id,
        courses!inner (
          id,
          title,
          description,
          image_url,
          instructor_id,
          users!courses_instructor_id_fkey (
            first_name,
            last_name
          )
        )
      `)
      .eq('program_id', programId);

    if (coursesError) {
      console.error('Error fetching program courses:', coursesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch courses' },
        { status: 500 }
      );
    }

    // Extract course objects and fetch details for each
    const courses = await Promise.all(
      (programCourses || []).map(async (pc: any) => {
        const course = Array.isArray(pc.courses) ? pc.courses[0] : pc.courses;
        if (!course) return null;

        // Get modules for this course
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, description, order')
          .eq('course_id', course.id)
          .order('order', { ascending: true });

        if (modulesError) {
          console.error(`Error fetching modules for course ${course.id}:`, modulesError);
        }

        // Get lessons for each module
        const modulesWithLessons = await Promise.all(
          (modules || []).map(async (module: any) => {
            const { data: lessons } = await supabase
              .from('lessons')
              .select('id, title, description, duration, order')
              .eq('module_id', module.id)
              .order('order', { ascending: true });

            return {
              ...module,
              lessons: lessons || []
            };
          })
        );

        // Calculate course stats from modules we already fetched
        let total_lessons = 0;
        let total_duration = 0;

        if (modulesWithLessons && modulesWithLessons.length > 0) {
          for (const module of modulesWithLessons) {
            if (module.lessons && module.lessons.length > 0) {
              total_lessons += module.lessons.length;
              total_duration += module.lessons.reduce((sum: number, lesson: any) =>
                sum + (lesson.duration || 0), 0);
            }
          }
        }

        const total_hours = Math.round(total_duration / 60);

        // Get instructor name
        const instructor = course.users;
        const instructorName = instructor
          ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
          : null;

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          image_url: course.image_url,
          instructor: instructorName,
          total_lessons,
          total_hours,
          modules: modulesWithLessons
        };
      })
    );

    // Filter out null courses
    const validCourses = courses.filter(c => c !== null);

    return NextResponse.json({
      success: true,
      courses: validCourses
    });

  } catch (error) {
    console.error('Error in public program courses API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
