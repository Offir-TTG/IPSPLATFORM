import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/courses - Get user's course enrollments (both standalone and from programs)
export const GET = withAuth(
  async (_request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();
      const adminClient = createAdminClient(); // For querying user_progress to bypass RLS

      console.log('Fetching courses for user:', user.id);

      // Fetch ALL enrollments first
      const { data: allEnrollments, error: enrollmentsError } = await supabase
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
          products!inner (
            id,
            type,
            title,
            description,
            course_id,
            program_id
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'completed'])
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch enrollments' },
          { status: 500 }
        );
      }

      console.log('Total enrollments found:', allEnrollments?.length || 0);

      const allCourses: any[] = [];

      if (!allEnrollments || allEnrollments.length === 0) {
        console.log('No enrollments found for user');
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      // Process each enrollment
      for (const enrollment of allEnrollments) {
        const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;

        if (!product) {
          console.log('Enrollment has no product:', enrollment.id);
          continue;
        }

        console.log('Processing enrollment:', enrollment.id, 'Product type:', product.type);

        // Handle standalone course enrollments
        if (product.type === 'course' && product.course_id) {
          // Get course details
          const { data: course, error: courseError } = await supabase
            .from('courses')
            .select(`
              id,
              title,
              description,
              image_url,
              instructor_id,
              is_published,
              is_active,
              users!courses_instructor_id_fkey (
                first_name,
                last_name
              )
            `)
            .eq('id', product.course_id)
            .single();

          // Skip if course is not published or not active
          if (course && (!course.is_published || !course.is_active)) {
            console.log('Skipping inactive/unpublished course:', course.title);
            continue;
          }

          if (courseError || !course) {
            console.error('Error fetching course:', courseError);
            continue;
          }

          // Get progress for this course
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('id, module_id, modules!inner(id, course_id)')
            .eq('modules.course_id', course.id);

          const totalLessons = lessonData?.length || 0;

          // Get user progress (use admin client to bypass RLS)
          const { data: progressData } = await adminClient
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
            const instructor = Array.isArray(course.users) ? course.users[0] : course.users;
            if (instructor) {
              instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
            }
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

        // Handle program enrollments - get all courses in the program
        else if (product.type === 'program' && product.program_id) {
          // Get program details
          const { data: program, error: programError } = await supabase
            .from('programs')
            .select('id, name')
            .eq('id', product.program_id)
            .single();

          if (programError || !program) {
            console.error('Error fetching program:', programError);
            continue;
          }

          console.log('Looking for courses in program:', program.id, program.name);

          // Get all courses linked to this program through program_courses junction table
          const { data: programCourseLinks, error: coursesError } = await supabase
            .from('program_courses')
            .select(`
              course_id,
              courses!inner (
                id,
                title,
                description,
                image_url,
                instructor_id,
                is_published,
                is_active,
                users!courses_instructor_id_fkey (
                  first_name,
                  last_name
                )
              )
            `)
            .eq('program_id', program.id)
            .order('order', { ascending: true });

          if (coursesError) {
            console.error('Error fetching program courses:', coursesError);
            continue;
          }

          // Filter for published and active courses
          const programCourses = programCourseLinks
            ?.map(link => link.courses)
            .filter(course => {
              if (Array.isArray(course)) {
                return course[0]?.is_published && course[0]?.is_active;
              }
              return course?.is_published && course?.is_active;
            })
            .map(course => Array.isArray(course) ? course[0] : course) || [];

          console.log('Found courses in program:', programCourses?.length || 0);

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

            // Get user progress (use admin client to bypass RLS)
            const { data: progressData } = await adminClient
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
              const instructor = Array.isArray(course.users) ? course.users[0] : course.users;
              if (instructor) {
                instructorName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim();
              }
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

      console.log('Total courses to return:', allCourses.length);

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
