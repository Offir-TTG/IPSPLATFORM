import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleService } from '@/lib/lms/moduleService';

// ============================================================================
// POST /api/lms/modules/bulk
// Bulk create modules (e.g., "Add 10 Modules")
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
    if (!body.course_id || !body.count || !body.title_pattern || body.starting_order === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: course_id, count, title_pattern, starting_order' },
        { status: 400 }
      );
    }

    // Validate count
    if (body.count < 1 || body.count > 50) {
      return NextResponse.json(
        { success: false, error: 'Count must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Bulk create modules
    const result = await moduleService.bulkCreateModules({
      course_id: body.course_id,
      count: body.count,
      title_pattern: body.title_pattern,
      description_template: body.description_template,
      starting_order: body.starting_order,
      is_published: body.is_published ?? false,
      is_optional: body.is_optional ?? false,
      duration_minutes: body.duration_minutes,
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
      resource_type: 'modules',
      action: 'Bulk created modules',
      description: `Created ${body.count} modules in course`,
      new_values: {
        count: body.count,
        title_pattern: body.title_pattern,
        course_id: body.course_id,
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
    console.error('Error bulk creating modules:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
