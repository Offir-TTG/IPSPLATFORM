import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
export const dynamic = 'force-dynamic';

// OPTIMIZED VERSION - Fixes N+1 query problem
// GET /api/user/courses - Get user's course enrollments (both standalone and from programs)
export const GET = withAuth(
  async (_request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();
      const adminClient = createAdminClient();

      console.log('Fetching courses for user:', user.id);

      // OPTIMIZATION 1: Fetch ALL enrollments with products in ONE query
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
        .in('status', ['active', 'completed', 'pending'])
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch enrollments' },
          { status: 500 }
        );
      }

      if (!allEnrollments || allEnrollments.length === 0) {
        console.log('No enrollments found for user');
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      console.log('Total enrollments found:', allEnrollments.length);

      // Get tenant ID for payment access checks
      const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      const tenantId = tenantUser?.tenant_id;

      // OPTIMIZATION 2: Extract all course IDs and program IDs upfront
      const courseIds = new Set<string>();
      const programIds = new Set<string>();
      const enrollmentIds = allEnrollments.map(e => e.id);

      for (const enrollment of allEnrollments) {
        const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;
        if (!product) continue;

        if (product.type === 'course' && product.course_id) {
          courseIds.add(product.course_id);
        } else if (product.type === 'program' && product.program_id) {
          programIds.add(product.program_id);
        }
      }

      // OPTIMIZATION 3: Fetch ALL courses in ONE bulk query
      const { data: allCourses, error: coursesError } = await supabase
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
        .in('id', Array.from(courseIds))
        .eq('is_published', true)
        .eq('is_active', true);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch courses' },
          { status: 500 }
        );
      }

      // OPTIMIZATION 4: Fetch ALL program courses in ONE bulk query
      const { data: programCoursesData, error: programCoursesError } = await supabase
        .from('program_courses')
        .select(`
          program_id,
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
        .in('program_id', Array.from(programIds))
        .order('order', { ascending: true });

      if (programCoursesError) {
        console.error('Error fetching program courses:', programCoursesError);
      }

      // OPTIMIZATION 5: Fetch ALL programs in ONE bulk query
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('id, name')
        .in('id', Array.from(programIds));

      if (programsError) {
        console.error('Error fetching programs:', programsError);
      }

      // Add program courses to our course list
      const programCourses = programCoursesData
        ?.map(pc => ({
          ...pc.courses,
          program_id: pc.program_id
        }))
        .filter((course: any) => course.is_published && course.is_active) || [];

      // Combine standalone courses and program courses
      const allCoursesToProcess = [
        ...(allCourses || []).map(c => ({ ...c, program_id: null })),
        ...programCourses
      ];

      // Add all program course IDs to our set
      for (const course of programCourses) {
        courseIds.add((course as any).id);
      }

      // OPTIMIZATION 6: Fetch ALL lessons for ALL courses in ONE bulk query
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, module_id, modules!inner(id, course_id)')
        .in('modules.course_id', Array.from(courseIds));

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
      }

      // OPTIMIZATION 7: Fetch ALL user progress in ONE bulk query
      const { data: allProgress, error: progressError } = await adminClient
        .from('user_progress')
        .select('lesson_id, status, completed_at, enrollment_id')
        .eq('user_id', user.id)
        .in('enrollment_id', enrollmentIds);

      if (progressError) {
        console.error('Error fetching progress:', progressError);
      }

      // Create lookup maps for fast access
      const courseMap = new Map(allCoursesToProcess.map((c: any) => [c.id, c]));
      const programMap = new Map(programsData?.map((p: any) => [p.id, p]) || []);
      const lessonsByCourse = new Map<string, any[]>();
      const progressByEnrollment = new Map<string, any[]>();

      // Group lessons by course
      for (const lesson of allLessons || []) {
        const courseId = (lesson.modules as any)?.course_id || (lesson.modules as any)?.[0]?.course_id;
        if (!courseId) continue;

        if (!lessonsByCourse.has(courseId)) {
          lessonsByCourse.set(courseId, []);
        }
        lessonsByCourse.get(courseId)!.push(lesson);
      }

      // Group progress by enrollment
      for (const progress of allProgress || []) {
        if (!progressByEnrollment.has(progress.enrollment_id)) {
          progressByEnrollment.set(progress.enrollment_id, []);
        }
        progressByEnrollment.get(progress.enrollment_id)!.push(progress);
      }

      // Build final result with access checks
      const result: any[] = [];
      const { checkCourseAccess } = await import('@/lib/payments/accessControl');

      for (const enrollment of allEnrollments) {
        const product = Array.isArray(enrollment.products) ? enrollment.products[0] : enrollment.products;
        if (!product) continue;

        const enrollmentProgress = progressByEnrollment.get(enrollment.id) || [];

        // Handle standalone courses
        if (product.type === 'course' && product.course_id) {
          const course = courseMap.get(product.course_id);
          if (!course) continue;

          const lessons = lessonsByCourse.get((course as any).id) || [];
          const lessonIds = lessons.map(l => l.id);
          const courseProgress = enrollmentProgress.filter(p => lessonIds.includes(p.lesson_id));
          const completedLessons = courseProgress.filter(p => p.status === 'completed').length;
          const totalLessons = lessons.length;
          const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          const instructor = Array.isArray(course.users) ? course.users[0] : course.users;
          const instructorName = instructor
            ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
            : null;

          // Check payment-based access
          let accessCheck: { hasAccess: boolean; reason?: string; overdueAmount?: number; overdueDays?: number } = { hasAccess: true };
          if (tenantId) {
            accessCheck = await checkCourseAccess(user.id, product.course_id, tenantId);
          }

          result.push({
            id: enrollment.id,
            course_id: (course as any).id,
            course_name: (course as any).title,
            course_description: (course as any).description,
            course_image: (course as any).image_url,
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
            hasAccess: accessCheck.hasAccess,
            accessReason: accessCheck.reason,
            overdueAmount: accessCheck.overdueAmount,
            overdueDays: accessCheck.overdueDays,
          });
        }

        // Handle program enrollments
        else if (product.type === 'program' && product.program_id) {
          const program = programMap.get(product.program_id);
          if (!program) continue;

          // Get all courses for this program
          const programCoursesForEnrollment = allCoursesToProcess.filter(
            c => c.program_id === product.program_id
          );

          // If program has courses, add each course as a separate entry
          if (programCoursesForEnrollment.length > 0) {
            for (const course of programCoursesForEnrollment) {
              const lessons = lessonsByCourse.get((course as any).id) || [];
              const lessonIds = lessons.map((l: any) => l.id);
              const courseProgress = enrollmentProgress.filter(p => lessonIds.includes(p.lesson_id));
              const completedLessons = courseProgress.filter(p => p.status === 'completed').length;
              const totalLessons = lessons.length;
              const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

              const instructor = Array.isArray((course as any).users) ? (course as any).users[0] : (course as any).users;
              const instructorName = instructor
                ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
                : null;

              // Check payment-based access for program courses
              let accessCheck: { hasAccess: boolean; reason?: string; overdueAmount?: number; overdueDays?: number } = { hasAccess: true };
              if (tenantId) {
                accessCheck = await checkCourseAccess(user.id, (course as any).id, tenantId);
              }

              result.push({
                id: enrollment.id,
                course_id: (course as any).id,
                course_name: (course as any).title,
                course_description: (course as any).description,
                course_image: (course as any).image_url,
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
                hasAccess: accessCheck.hasAccess,
                accessReason: accessCheck.reason,
                overdueAmount: accessCheck.overdueAmount,
                overdueDays: accessCheck.overdueDays,
              });
            }
          } else {
            // Program has no published courses - show the program itself as a placeholder
            result.push({
              id: enrollment.id,
              course_id: null, // No course yet
              course_name: program.name, // Use program name
              course_description: product.description || null,
              course_image: null,
              program_id: program.id,
              program_name: program.name,
              status: enrollment.status,
              enrolled_at: enrollment.enrolled_at,
              completed_at: enrollment.completed_at,
              expires_at: enrollment.expires_at,
              overall_progress: 0,
              completed_lessons: 0,
              total_lessons: 0,
              instructor: null,
              payment_status: enrollment.payment_status,
              total_amount: enrollment.total_amount,
              paid_amount: enrollment.paid_amount,
              currency: enrollment.currency,
            });
          }
        }
      }

      console.log('Total courses to return:', result.length);
return NextResponse.json({
        success: true,
        data: result,
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
