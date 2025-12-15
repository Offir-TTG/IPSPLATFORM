import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { courseService } from '@/lib/lms/courseService';

export const dynamic = 'force-dynamic';

// ============================================================================
// GET /api/lms/courses/[id]
// Get a single course by ID
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeModules = searchParams.get('include_modules') === 'true';

    // Get course
    const result = await courseService.getCourseById(params.id, includeModules);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/courses/[id]
// Update a course
// ============================================================================

export async function PATCH(
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

    // Get request body
    const body = await request.json();

    // Validate standalone/program logic if those fields are being updated
    if (body.is_standalone !== undefined || body.program_id !== undefined) {
      // If is_standalone is being set to false, program_id is required
      if (body.is_standalone === false && (!body.program_id || (typeof body.program_id === 'string' && body.program_id.trim() === ''))) {
        return NextResponse.json(
          {
            success: false,
            error: 'lms.courses.error.program_required',
            message: 'Program is required for non-standalone courses'
          },
          { status: 400 }
        );
      }

      // If is_standalone is true, program_id should not have a value
      if (body.is_standalone === true && body.program_id && typeof body.program_id === 'string' && body.program_id.trim() !== '') {
        return NextResponse.json(
          {
            success: false,
            error: 'lms.course.error_standalone_cannot_have_program',
            message: 'Standalone courses cannot be part of a program'
          },
          { status: 400 }
        );
      }
    }

    // Validate dates if both are provided
    if (body.start_date && body.end_date) {
      const startDate = new Date(body.start_date);
      const endDate = new Date(body.end_date);

      if (endDate < startDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'lms.courses.error.end_date_invalid',
            message: 'End date must be after start date'
          },
          { status: 400 }
        );
      }
    }

    // Check if course dates are compatible with existing lessons
    if (body.start_date || body.end_date) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, start_time')
        .eq('course_id', params.id)
        .not('start_time', 'is', null);

      if (lessons && lessons.length > 0) {
        const courseStartDate = body.start_date ? new Date(body.start_date) : null;
        const courseEndDate = body.end_date ? new Date(body.end_date) : null;

        const lessonsOutsideRange = lessons.filter(lesson => {
          const lessonDate = new Date(lesson.start_time);

          if (courseStartDate && lessonDate < courseStartDate) {
            return true;
          }

          if (courseEndDate && lessonDate > courseEndDate) {
            return true;
          }

          return false;
        });

        if (lessonsOutsideRange.length > 0) {
          const lessonTitles = lessonsOutsideRange.map(l => l.title).join(', ');
          return NextResponse.json(
            {
              success: false,
              error: 'lms.courses.error.lessons_outside_range',
              message: `Course dates conflict with existing lessons: ${lessonTitles}`,
              details: {
                count: lessonsOutsideRange.length,
                lessons: lessonsOutsideRange
              }
            },
            { status: 400 }
          );
        }
      }
    }

    // Get old course data for audit
    const oldCourse = await courseService.getCourseById(params.id);

    // Build update data
    const updateData: any = { ...body };

    // If setting to standalone, ensure program_id is null
    if (body.is_standalone === true) {
      updateData.program_id = null;
    }

    // If program_id is being updated and it's empty, set to null
    if (updateData.program_id !== undefined && typeof updateData.program_id === 'string' && updateData.program_id.trim() === '') {
      updateData.program_id = null;
    }

    // Update course
    const result = await courseService.updateCourse(params.id, updateData);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'UPDATE',
      event_category: 'EDUCATION',
      resource_type: 'courses',
      resource_id: params.id,
      action: 'Updated course',
      description: `Course: ${result.data!.title}`,
      old_values: oldCourse.data,
      new_values: result.data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/lms/courses/[id]
// Delete a course
// ============================================================================

export async function DELETE(
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

    // Get course data for audit before deletion
    const oldCourse = await courseService.getCourseById(params.id);

    // Delete course
    const result = await courseService.deleteCourse(params.id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'DELETE',
      event_category: 'EDUCATION',
      resource_type: 'courses',
      resource_id: params.id,
      action: 'Deleted course',
      description: `Course: ${oldCourse.data?.title}`,
      old_values: oldCourse.data,
      risk_level: 'high',
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
