import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/programs - Get user's program enrollments
export const GET = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();

      // Fetch enrollments for programs only (where product type is 'program')
      const { data: enrollments, error: enrollmentsError } = await supabase
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
            program_id,
            course_id,
            completion_benefit,
            completion_description,
            access_duration,
            access_description,
            programs:programs!products_program_id_fkey (
              id,
              name,
              description,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('products.type', 'program')
        .in('status', ['active', 'completed'])
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching program enrollments:', enrollmentsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch program enrollments' },
          { status: 500 }
        );
      }

      // For each program enrollment, get course progress data
      const programsWithProgress = await Promise.all(
        (enrollments || []).map(async (enrollment: any) => {
          const product = enrollment.products;
          const program = product?.programs;

          if (!program) {
            return null;
          }

          // Get all courses in this program using the program_courses junction table
          const { data: programCoursesData, error: coursesError } = await supabase
            .from('program_courses')
            .select(`
              course_id,
              courses!inner (
                id,
                title,
                description,
                is_published,
                is_active
              )
            `)
            .eq('program_id', program.id)
            .order('order', { ascending: true });

          if (coursesError) {
            console.error('Error fetching program courses:', coursesError);
          }

          console.log(`Program ${program.name} (${program.id}):`, {
            totalCoursesFound: programCoursesData?.length || 0,
            courses: programCoursesData?.map(pc => ({
              id: (pc.courses as any)?.id,
              title: (pc.courses as any)?.title,
              is_published: (pc.courses as any)?.is_published
            }))
          });

          // Extract courses and filter only published and active ones
          const courses = programCoursesData
            ?.map(pc => {
              const course = Array.isArray(pc.courses) ? pc.courses[0] : pc.courses;
              return course;
            })
            .filter((course: any) => course && course.is_published && course.is_active)
            .map((course: any) => ({
              id: course.id,
              title: course.title,
              description: course.description,
              status: 'not_started', // We'll calculate this below
            })) || [];

          console.log(`Published courses for ${program.name}:`, courses.length);

          // Get progress for all courses in this program
          const courseIds = courses.map(c => c.id);
          let completedCourses = 0;
          let totalLessons = 0;
          let completedLessons = 0;

          let totalHours = 0;
          let completedHours = 0;

          if (courseIds.length > 0) {
            // Get lessons with duration per course (lessons -> modules -> courses)
            const { data: lessonCounts } = await supabase
              .from('lessons')
              .select('id, duration, module_id, modules!inner(id, course_id)')
              .in('modules.course_id', courseIds);

            totalLessons = lessonCounts?.length || 0;

            // Calculate total hours from lesson durations (duration is in minutes)
            totalHours = Math.round((lessonCounts?.reduce((sum: number, lesson: any) =>
              sum + (lesson.duration || 0), 0) || 0) / 60);

            // Get user progress
            const { data: progressData } = await supabase
              .from('user_progress')
              .select('lesson_id, status, completed_at')
              .eq('user_id', user.id)
              .eq('enrollment_id', enrollment.id);

            const completedLessonIds = new Set(
              progressData?.filter(p => p.status === 'completed').map(p => p.lesson_id) || []
            );

            completedLessons = completedLessonIds.size;

            // Calculate completed hours from completed lesson durations
            const completedLessonDurations = lessonCounts?.filter((l: any) =>
              completedLessonIds.has(l.id)
            ) || [];
            completedHours = Math.round((completedLessonDurations.reduce((sum: number, lesson: any) =>
              sum + (lesson.duration || 0), 0) / 60));

            // Update course statuses based on progress
            for (const course of courses) {
              const courseLessons = lessonCounts?.filter(
                (l: any) => l.modules?.course_id === course.id
              ) || [];
              const courseCompletedCount = courseLessons.filter((l: any) =>
                completedLessonIds.has(l.id)
              ).length;

              if (courseCompletedCount === courseLessons.length && courseLessons.length > 0) {
                course.status = 'completed';
                completedCourses++;
              } else if (courseCompletedCount > 0) {
                course.status = 'in_progress';
              } else {
                course.status = 'not_started';
              }
            }
          }

          // Get instructor info from the first course in the program (if available)
          let instructorName = null;
          if (courses && courses.length > 0) {
            const { data: firstCourseWithInstructor } = await supabase
              .from('courses')
              .select('instructor_id, users!courses_instructor_id_fkey(first_name, last_name)')
              .eq('id', courses[0].id)
              .single();

            if (firstCourseWithInstructor?.users) {
              const instructor = firstCourseWithInstructor.users as any;
              instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
            }
          }

          // Calculate overall progress
          const progress = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

          return {
            id: enrollment.id,
            program_id: program.id,
            name: program.name,
            description: program.description,
            image_url: program.image_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&h=400&fit=crop',
            status: enrollment.status,
            progress,
            total_courses: courses.length,
            completed_courses: completedCourses,
            total_lessons: totalLessons,
            completed_lessons: completedLessons,
            enrolled_at: enrollment.enrolled_at,
            completed_at: enrollment.completed_at,
            estimated_completion: enrollment.expires_at,
            instructor: instructorName,
            total_hours: totalHours,
            hours_completed: completedHours,
            certificate_eligible: enrollment.status === 'completed' && progress === 100,
            completion_benefit: product?.completion_benefit,
            completion_description: product?.completion_description,
            access_duration: product?.access_duration,
            access_description: product?.access_description,
            courses: courses.slice(0, 10), // Limit to first 10 courses for preview
            payment_status: enrollment.payment_status,
            total_amount: enrollment.total_amount,
            paid_amount: enrollment.paid_amount,
            currency: enrollment.currency,
          };
        })
      );

      // Filter out null values (programs that couldn't be loaded)
      const validPrograms = programsWithProgress.filter(p => p !== null);

      return NextResponse.json({
        success: true,
        data: validPrograms,
      });
    } catch (error) {
      console.error('Error in programs API:', error);
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);
