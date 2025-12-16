import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/courses - Get user's course enrollments (both standalone and from programs)
export const GET = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();

      // Fetch standalone course enrollments (where product type is 'course')
      const { data: courseEnrollments, error: courseEnrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          status,
          enrolled_at,
          completed_at,
          expires_at,
          total_amount,
          paid_amount,
          currency,
          payment_status,
          products (
            id,
            type,
            title,
            description,
            course_id,
            courses:courses!products_course_id_fkey (
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
          )
        `)
        .eq('user_id', user.id)
        .eq('products.type', 'course')
        .in('status', ['active', 'completed'])
        .order('enrolled_at', { ascending: false });

      if (courseEnrollmentsError) {
        console.error('Error fetching course enrollments:', courseEnrollmentsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch course enrollments' },
          { status: 500 }
        );
      }

      // Fetch program enrollments to get their courses
      const { data: programEnrollments, error: programEnrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          product_id,
          status,
          enrolled_at,
          completed_at,
          expires_at,
          products (
            id,
            type,
            program_id,
            programs:programs!products_program_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('products.type', 'program')
        .in('status', ['active', 'completed'])
        .order('enrolled_at', { ascending: false });

      if (programEnrollmentsError) {
        console.error('Error fetching program enrollments:', programEnrollmentsError);
      }

      const allCourses: any[] = [];

      // Process standalone course enrollments
      if (courseEnrollments) {
        for (const enrollment of courseEnrollments) {
          const product = enrollment.products;
          const course = product?.courses;

          if (!course) continue;

          // Get progress for this course
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('id, module_id, modules!inner(id, course_id)')
            .eq('modules.course_id', course.id);

          const totalLessons = lessonData?.length || 0;

          // Get user progress
          const { data: progressData } = await supabase
            .from('user_progress')
            .select('lesson_id, status, completed_at')
            .eq('user_id', user.id)
            .eq('enrollment_id', enrollment.id);

          const completedLessons = progressData?.filter(p => p.status === 'completed').length || 0;
          const progress = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

          // Get instructor name
          let instructorName = null;
          if (course.users) {
            const instructor = course.users as any;
            instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
          }

          allCourses.push({
            id: enrollment.id,
            course_id: course.id,
            course_name: course.title,
            course_description: course.description,
            course_image: course.image_url,
            program_id: null,
            program_name: null,
            status: enrollment.status,
            enrolled_at: enrollment.enrolled_at,
            completed_at: enrollment.completed_at,
            expires_at: enrollment.expires_at,
            overall_progress: progress,
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            instructor: instructorName,
            payment_status: enrollment.payment_status,
            total_amount: enrollment.total_amount,
            paid_amount: enrollment.paid_amount,
            currency: enrollment.currency,
          });
        }
      }

      // Process program enrollments to get their courses
      if (programEnrollments) {
        for (const enrollment of programEnrollments) {
          const product = enrollment.products;
          const program = product?.programs;

          if (!program) continue;

          // Get all courses in this program
          const { data: programCourses, error: coursesError } = await supabase
            .from('courses')
            .select(`
              id,
              title,
              description,
              image_url,
              instructor_id,
              users!courses_instructor_id_fkey (
                first_name,
                last_name
              )
            `)
            .eq('program_id', program.id)
            .eq('is_published', true);

          if (coursesError) {
            console.error('Error fetching program courses:', coursesError);
            continue;
          }

          // Add each course from the program
          for (const course of programCourses || []) {
            // Get progress for this course
            const { data: lessonData } = await supabase
              .from('lessons')
              .select('id, module_id, modules!inner(id, course_id)')
              .eq('modules.course_id', course.id);

            const totalLessons = lessonData?.length || 0;

            // Get user progress
            const { data: progressData } = await supabase
              .from('user_progress')
              .select('lesson_id, status, completed_at')
              .eq('user_id', user.id)
              .eq('enrollment_id', enrollment.id);

            const completedLessons = progressData?.filter(p => p.status === 'completed').length || 0;
            const progress = totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

            // Get instructor name
            let instructorName = null;
            if (course.users) {
              const instructor = course.users as any;
              instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
            }

            allCourses.push({
              id: enrollment.id,
              course_id: course.id,
              course_name: course.title,
              course_description: course.description,
              course_image: course.image_url,
              program_id: program.id,
              program_name: program.name,
              status: enrollment.status,
              enrolled_at: enrollment.enrolled_at,
              completed_at: enrollment.completed_at,
              expires_at: enrollment.expires_at,
              overall_progress: progress,
              completed_lessons: completedLessons,
              total_lessons: totalLessons,
              instructor: instructorName,
              payment_status: enrollment.payment_status,
              total_amount: enrollment.total_amount,
              paid_amount: enrollment.paid_amount,
              currency: enrollment.currency,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: allCourses,
      });
    } catch (error) {
      console.error('Error in courses API:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);
