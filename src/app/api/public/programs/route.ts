import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6');

    // Get all programs
    const { data: programs, error } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        description,
        image_url
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    // Get stats for each program
    const programsWithStats = await Promise.all(
      (programs || []).map(async (program) => {
        // Get courses in this program
        const { data: programCoursesData } = await supabase
          .from('program_courses')
          .select(`
            course_id,
            courses!inner (
              id
            )
          `)
          .eq('program_id', program.id);

        // Get all courses in the program
        const programCourses = programCoursesData
          ?.map(pc => Array.isArray(pc.courses) ? pc.courses[0] : pc.courses)
          .filter((course: any) => course) || [];

        const courseIds = programCourses.map((c: any) => c.id);
        let totalLessons = 0;
        let totalHours = 0;

        if (courseIds.length > 0) {
          // Get lessons with duration
          const { data: lessonCounts } = await supabase
            .from('lessons')
            .select('id, duration, module_id, modules!inner(id, course_id)')
            .in('modules.course_id', courseIds);

          totalLessons = lessonCounts?.length || 0;
          totalHours = Math.round((lessonCounts?.reduce((sum: number, lesson: any) =>
            sum + (lesson.duration || 0), 0) || 0) / 60);
        }

        // Get enrollment count (programs are stored as products)
        const { data: products, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('program_id', program.id)
          .eq('product_type', 'program')
          .maybeSingle();

        let enrollmentCount = 0;
        if (products && !productError) {
          const { count } = await supabase
            .from('enrollments')
            .select('id', { count: 'exact', head: true })
            .eq('product_id', products.id);

          enrollmentCount = count || 0;
        }

        return {
          id: program.id,
          name: program.name,
          description: program.description,
          image_url: program.image_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop',
          total_courses: programCourses.length,
          total_lessons: totalLessons,
          total_hours: totalHours,
          student_count: enrollmentCount,
        };
      })
    );

    return NextResponse.json({
      success: true,
      programs: programsWithStats,
    });
  } catch (error) {
    console.error('Error in public programs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
