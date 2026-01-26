import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// GET /api/user/courses/[id] - Get course details with modules, lessons, and progress
export const GET = withAuth(
  async (_request: NextRequest, user: any, context: { params: Promise<{ id: string }> }) => {
    try {
      const supabase = await createClient();
      const params = await context.params;
      const courseId = params.id;

      console.log('Fetching course details for user:', user.id, 'course:', courseId);

      // Get ALL user enrollments
      const { data: allEnrollments, error: allEnrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
          enrolled_at,
          completed_at,
          expires_at,
          product_id,
          products!inner (
            id,
            type,
            course_id,
            program_id
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'completed']);

      if (allEnrollmentsError || !allEnrollments || allEnrollments.length === 0) {
        console.log('No enrollments found for user');
        return NextResponse.json(
          { success: false, error: 'You do not have access to this course' },
          { status: 403 }
        );
      }

      console.log('Found enrollments:', allEnrollments.length);

      // Check for direct course enrollment
      let activeEnrollment = null;
      for (const enr of allEnrollments) {
        const product = Array.isArray(enr.products) ? enr.products[0] : enr.products;
        if (product && product.type === 'course' && product.course_id === courseId) {
          activeEnrollment = enr;
          console.log('Found direct course enrollment:', enr.id);
          break;
        }
      }

      // If no direct enrollment, check program enrollments
      if (!activeEnrollment) {
        console.log('No direct enrollment, checking program enrollments');

        for (const enr of allEnrollments) {
          const product = Array.isArray(enr.products) ? enr.products[0] : enr.products;

          if (product && product.type === 'program' && product.program_id) {
            // Check if this program includes the course
            const { data: programCourseLink } = await supabase
              .from('program_courses')
              .select('course_id')
              .eq('program_id', product.program_id)
              .eq('course_id', courseId)
              .maybeSingle();

            if (programCourseLink) {
              activeEnrollment = enr;
              console.log('Found program enrollment with access:', enr.id);
              break;
            }
          }
        }
      }

      if (!activeEnrollment) {
        console.log('No enrollment found with access to course');
        return NextResponse.json(
          { success: false, error: 'You do not have access to this course' },
          { status: 403 }
        );
      }

      const enrollmentId = activeEnrollment.id;

      // Get tenant ID for payment access check
      const { data: tenantUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!tenantUser?.tenant_id) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }

      // Check payment-based course access
      const { requireCourseAccess } = await import('@/lib/payments/accessControl');
      const accessDenied = await requireCourseAccess(user.id, courseId, tenantUser.tenant_id);
      if (accessDenied) return accessDenied;

      // Fetch course details
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
            last_name,
            email
          )
        `)
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        console.error('Error fetching course:', courseError);
        return NextResponse.json(
          { success: false, error: 'Course not found' },
          { status: 404 }
        );
      }

      // Check if course is published and active
      if (!course.is_published || !course.is_active) {
        return NextResponse.json(
          { success: false, error: 'This course is not currently available' },
          { status: 403 }
        );
      }

      // Get user's tenant_id
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      const tenantId = userData?.tenant_id;

      // Fetch modules with lessons and topics using admin client (bypasses RLS for read-only content)
      const adminClient = createAdminClient();
      const { data: modules, error: modulesError } = await adminClient
        .from('modules')
        .select(`
          id,
          title,
          description,
          order,
          is_published,
          is_optional,
          duration_minutes,
          lessons (
            id,
            title,
            description,
            order,
            duration,
            is_published,
            start_time,
            zoom_meeting_id,
            zoom_join_url,
            zoom_passcode,
            recording_url,
            status,
            zoom_sessions (
              id,
              platform,
              daily_room_name,
              daily_room_url,
              daily_room_id
            ),
            lesson_topics (
              id,
              title,
              content_type,
              content,
              order,
              duration_minutes,
              is_required,
              is_published
            )
          )
        `)
        .eq('course_id', courseId)
        .eq('tenant_id', tenantId)
        .order('order', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch course content' },
          { status: 500 }
        );
      }

      // Filter and sort modules, lessons and topics - only show published content
      const processedModules = modules
        ?.filter(module => module.is_published)
        .map(module => ({
          ...module,
          lessons: module.lessons
            ?.filter(lesson => lesson.is_published)
            .sort((a, b) => a.order - b.order)
            .map(lesson => {
              // Handle zoom_sessions being either an array or a single object
              const zoomSession = Array.isArray(lesson.zoom_sessions)
                ? lesson.zoom_sessions[0]
                : lesson.zoom_sessions;

              return {
                ...lesson,
                // Add platform and Daily.co fields from zoom_sessions
                platform: zoomSession?.platform || null,
                daily_room_name: zoomSession?.daily_room_name || null,
                daily_room_url: zoomSession?.daily_room_url || null,
                daily_room_id: zoomSession?.daily_room_id || null,
                // recording_url stays from lesson table
                // Remove zoom_sessions array from response
                zoom_sessions: undefined,
                lesson_topics: lesson.lesson_topics
                  ?.filter(topic => topic.is_published)
                  .sort((a, b) => a.order - b.order) || []
              };
            }) || []
        })) || [];

      // Fetch user progress for this enrollment
      // Use admin client to bypass RLS and avoid tenant config parameter issues
      const { data: allProgressData } = await adminClient
        .from('user_progress')
        .select('lesson_id, status, progress_percentage, completed_at, last_accessed_at')
        .eq('user_id', user.id)
        .eq('enrollment_id', enrollmentId);

      // Get all lesson IDs for THIS course only
      const courseLessonIds = processedModules.flatMap(module =>
        module.lessons.map(lesson => lesson.id)
      );

      // IMPORTANT: Filter progress to only include lessons from THIS course
      const progressData = allProgressData?.filter(p =>
        courseLessonIds.includes(p.lesson_id)
      ) || [];

      // Calculate overall progress
      const totalLessons = processedModules.reduce(
        (acc, module) => acc + module.lessons.length,
        0
      );
      const completedLessons = progressData.filter(p => p.status === 'completed').length;
      const overallProgress = totalLessons > 0
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

      // Fetch course materials
      const { data: materials } = await supabase
        .from('course_materials')
        .select('id, title, description, file_name, file_url, file_type, file_size, category, is_published, display_order, created_at')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('display_order', { ascending: true })
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      // Count enrolled students for this course
      const { count: enrolledStudents } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', activeEnrollment.product_id)
        .in('status', ['active', 'completed']);

      // Calculate total topics and study time
      const totalTopics = processedModules.reduce(
        (acc, module) => acc + module.lessons.reduce(
          (lessonAcc, lesson) => lessonAcc + lesson.lesson_topics.length,
          0
        ),
        0
      );

      // Calculate total study time from multiple sources
      const totalStudyTime = processedModules.reduce(
        (acc, module) => {
          // Add module duration if available
          let moduleTotalTime = module.duration_minutes || 0;

          // Add lesson durations
          const lessonsDuration = module.lessons.reduce((lessonAcc, lesson) => {
            // Parse lesson duration (could be string like "90", "2h", "90m", etc.)
            let lessonMinutes = 0;
            if (lesson.duration) {
              const durationStr = lesson.duration.toString();
              // If it's just a number, treat as minutes
              if (/^\d+$/.test(durationStr)) {
                lessonMinutes = parseInt(durationStr);
              }
            }

            // Add topics duration
            const topicsDuration = lesson.lesson_topics.reduce(
              (topicAcc, topic) => topicAcc + (topic.duration_minutes || 0),
              0
            );

            // Use the maximum of lesson duration or sum of topics duration
            // This prevents double counting if lesson duration is aggregate of topics
            return lessonAcc + Math.max(lessonMinutes, topicsDuration);
          }, 0);

          // Use the maximum of module duration or sum of lessons duration
          return acc + Math.max(moduleTotalTime, lessonsDuration);
        },
        0
      );

      // Calculate in-progress lessons
      const inProgressLessons = progressData?.filter(p => p.status === 'in_progress').length || 0;

      return NextResponse.json({
        success: true,
        data: {
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.image_url,
            instructor: instructorName,
          },
          enrollment: activeEnrollment || null,
          modules: processedModules,
          progress: {
            overall_progress: overallProgress,
            completed_lessons: completedLessons,
            in_progress_lessons: inProgressLessons,
            total_lessons: totalLessons,
            lesson_progress: progressData || [],
          },
          statistics: {
            total_modules: processedModules.length,
            total_lessons: totalLessons,
            total_topics: totalTopics,
            total_study_time: totalStudyTime,
            enrolled_students: enrolledStudents || 0,
            materials_count: materials?.length || 0,
          },
          materials: materials || [],
        },
      });
    } catch (error: any) {
      console.error('Error in course details API:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
      });
      return NextResponse.json(
        { success: false, error: 'Internal server error: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);
