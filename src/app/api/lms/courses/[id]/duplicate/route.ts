import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { courseService } from '@/lib/lms/courseService';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/lms/courses/[id]/duplicate
// Duplicate a course with all modules, lessons, and topics
// ============================================================================

export async function POST(
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

    // Get optional new title from request body
    let newTitle: string | undefined;
    try {
      const body = await request.json();
      newTitle = body.newTitle;
    } catch {
      // No body or invalid JSON, that's fine
    }

    // Duplicate the course
    const result = await courseService.duplicateCourse(params.id, newTitle);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'EDUCATION',
      resource_type: 'courses',
      resource_id: result.data?.id,
      action: 'Duplicated course',
      description: `Duplicated course from ${params.id}`,
      new_values: {
        original_course_id: params.id,
        new_course_id: result.data?.id,
        new_title: result.data?.title,
      },
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error duplicating course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
