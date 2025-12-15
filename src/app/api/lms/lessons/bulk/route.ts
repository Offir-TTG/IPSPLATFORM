import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lessonService } from '@/lib/lms/lessonService';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/lms/lessons/bulk
// Bulk create lessons (e.g., "Add 10 Lessons")
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (
      !body.course_id ||
      !body.count ||
      !body.title_pattern ||
      !body.base_start_time ||
      body.starting_order === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: course_id, count, title_pattern, base_start_time, starting_order',
        },
        { status: 400 }
      );
    }

    // Validate count
    if (body.count < 1 || body.count > 100) {
      return NextResponse.json(
        { success: false, error: 'Count must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Bulk create lessons
    const result = await lessonService.bulkCreateLessons({
      course_id: body.course_id,
      module_id: body.module_id,
      count: body.count,
      title_pattern: body.title_pattern,
      description_template: body.description_template,
      starting_order: body.starting_order,
      base_start_time: body.base_start_time,
      duration: body.duration || 60,
      interval_days: body.interval_days || 1, // Default: 1 day between lessons
    });

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
      resource_type: 'lessons',
      action: 'Bulk created lessons',
      description: `Created ${body.count} lessons in ${body.module_id ? 'module' : 'course'}`,
      new_values: {
        count: body.count,
        title_pattern: body.title_pattern,
        course_id: body.course_id,
        module_id: body.module_id,
        created_ids: result.data?.created_ids,
      },
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error bulk creating lessons:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
