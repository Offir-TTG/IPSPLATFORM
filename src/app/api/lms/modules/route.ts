import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moduleService } from '@/lib/lms/moduleService.server';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ============================================================================
// GET /api/lms/modules
// List modules for a course
// ============================================================================

export async function GET(request: NextRequest) {
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
    const courseId = searchParams.get('course_id');
    const includeLessons = searchParams.get('include_lessons') === 'true';

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'course_id is required' },
        { status: 400 }
      );
    }

    // Get modules
    const result = await moduleService.getModulesByCourse(courseId, includeLessons);

    if (!result.success) {
      console.error('Failed to fetch modules:', result.error);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/lms/modules
// Create a new module
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
    if (!body.course_id || !body.title || body.order === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create module
    const result = await moduleService.createModule({
      course_id: body.course_id,
      title: body.title,
      description: body.description,
      order: body.order,
      is_published: body.is_published ?? false,
      is_optional: body.is_optional ?? false,
      duration_minutes: body.duration_minutes,
    });

    if (!result.success) {
      console.error('Module creation failed:', result.error);
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
      resource_id: result.data!.id,
      action: 'Created new module',
      description: `Module: ${body.title}`,
      new_values: result.data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/lms/modules (Bulk reorder)
// Reorder multiple modules at once
// ============================================================================

export async function PATCH(request: NextRequest) {
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

    // Check if this is a reorder request
    if (body.action === 'reorder' && body.items) {
      const result = await moduleService.reorderModules({
        items: body.items,
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
        event_type: 'UPDATE',
        event_category: 'EDUCATION',
        resource_type: 'modules',
        action: 'Reordered modules',
        description: `Reordered ${body.items.length} modules`,
        new_values: { items: body.items },
        risk_level: 'low',
      });

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
