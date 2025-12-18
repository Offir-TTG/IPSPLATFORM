import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

// POST /api/user/courses/[id]/lessons/[lessonId]/progress - Update lesson progress
export const POST = withAuth(
  async (request: NextRequest, user: any, context: { params: Promise<{ id: string; lessonId: string }> }) => {
    try {
      const supabase = await createClient();
      const params = await context.params;
      const courseId = params.id;
      const lessonId = params.lessonId;

      // Parse request body
      const body = await request.json();
      const { status, progress_percentage } = body;

      // Validate status
      const validStatuses = ['not_started', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status value' },
          { status: 400 }
        );
      }

      // Get user's tenant_id
      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      const tenantId = userData?.tenant_id;

      if (!tenantId) {
        return NextResponse.json(
          { success: false, error: 'User tenant not found' },
          { status: 403 }
        );
      }

      // Get user's enrollment for this course
      const { data: allEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          status,
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

      if (enrollmentsError || !allEnrollments || allEnrollments.length === 0) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this course' },
          { status: 403 }
        );
      }

      // Find enrollment that grants access to this course
      let activeEnrollment = null;
      for (const enr of allEnrollments) {
        const product = Array.isArray(enr.products) ? enr.products[0] : enr.products;
        if (product && product.type === 'course' && product.course_id === courseId) {
          activeEnrollment = enr;
          break;
        }
      }

      // If no direct enrollment, check program enrollments
      if (!activeEnrollment) {
        for (const enr of allEnrollments) {
          const product = Array.isArray(enr.products) ? enr.products[0] : enr.products;

          if (product && product.type === 'program' && product.program_id) {
            const { data: programCourseLink } = await supabase
              .from('program_courses')
              .select('course_id')
              .eq('program_id', product.program_id)
              .eq('course_id', courseId)
              .maybeSingle();

            if (programCourseLink) {
              activeEnrollment = enr;
              break;
            }
          }
        }
      }

      if (!activeEnrollment) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this course' },
          { status: 403 }
        );
      }

      const enrollmentId = activeEnrollment.id;

      // Verify lesson exists and belongs to this course
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          module_id,
          modules!inner (
            id,
            course_id
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        return NextResponse.json(
          { success: false, error: 'Lesson not found' },
          { status: 404 }
        );
      }

      const module = Array.isArray(lesson.modules) ? lesson.modules[0] : lesson.modules;
      if (!module || module.course_id !== courseId) {
        return NextResponse.json(
          { success: false, error: 'Lesson does not belong to this course' },
          { status: 400 }
        );
      }

      // Use admin client for all user_progress operations to bypass RLS and avoid tenant config parameter issues
      // We've already validated authorization above (enrollment, tenant, lesson access)
      const adminClient = createAdminClient();

      // Check if progress record already exists
      const { data: existingProgress } = await adminClient
        .from('user_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      const now = new Date().toISOString();
      const completedAt = status === 'completed' ? now : null;

      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await adminClient
          .from('user_progress')
          .update({
            status,
            progress_percentage: progress_percentage || 0,
            completed_at: completedAt,
            last_accessed_at: now,
            updated_at: now,
          })
          .eq('id', existingProgress.id);

        if (updateError) {
          console.error('Error updating progress:', updateError);
          return NextResponse.json(
            { success: false, error: 'Failed to update progress' },
            { status: 500 }
          );
        }
      } else {
        // Create new progress record
        // Schema columns: tenant_id, user_id, enrollment_id (required), lesson_id, topic_id, status, etc.
        const { error: insertError } = await adminClient
          .from('user_progress')
          .insert({
            tenant_id: tenantId,
            user_id: user.id,
            enrollment_id: enrollmentId,
            lesson_id: lessonId,
            status,
            progress_percentage: progress_percentage || 0,
            completed_at: completedAt,
            last_accessed_at: now,
            started_at: status !== 'not_started' ? now : null,
          });

        if (insertError) {
          console.error('Error creating progress:', insertError);
          return NextResponse.json(
            { success: false, error: 'Failed to create progress' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          lesson_id: lessonId,
          status,
          progress_percentage: progress_percentage || 0,
          completed_at: completedAt,
        },
      });
    } catch (error: any) {
      console.error('Error in lesson progress API:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return NextResponse.json(
        { success: false, error: 'Internal server error: ' + (error.message || 'Unknown error') },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);
