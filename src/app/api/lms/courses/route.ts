import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { courseService } from '@/lib/lms/courseService';

// ============================================================================
// GET /api/lms/courses
// List all courses with optional filtering
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
    const program_id = searchParams.get('program_id');
    const instructor_id = searchParams.get('instructor_id');
    const is_active = searchParams.get('is_active');
    const search = searchParams.get('search');

    // Build filter
    const filter: any = {};
    if (program_id) filter.program_id = program_id;
    if (instructor_id) filter.instructor_id = instructor_id;
    if (is_active !== null) filter.is_active = is_active === 'true';
    if (search) filter.search = search;

    // Get courses
    const result = await courseService.listCourses(filter);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/lms/courses
// Create a new course
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
    if (!body.program_id || !body.title || !body.start_date || !body.course_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'lms.course.error_missing_required_fields',
          message: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Validate standalone pricing if applicable
    if (body.is_standalone && (!body.price || !body.payment_plan)) {
      return NextResponse.json(
        {
          success: false,
          error: 'lms.course.error_standalone_pricing_required',
          message: 'Price and payment plan are required for standalone courses'
        },
        { status: 400 }
      );
    }

    // Create course
    const courseData: any = {
      program_id: body.program_id,
      instructor_id: body.instructor_id || user.id,
      title: body.title,
      description: body.description,
      access_tag: body.access_tag,
      start_date: body.start_date,
      end_date: body.end_date,
      is_active: body.is_active ?? false,
      course_type: body.course_type,
      is_standalone: body.is_standalone ?? false,
    };

    // Only add pricing fields if standalone
    if (body.is_standalone) {
      courseData.price = body.price;
      courseData.currency = body.currency || 'usd';
      courseData.payment_plan = body.payment_plan;
      if (body.payment_plan === 'installments' && body.installment_count) {
        courseData.installment_count = body.installment_count;
      }
    }

    const result = await courseService.createCourse(courseData);

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
      resource_id: result.data!.id,
      action: 'Created new course',
      description: `Course: ${body.title}`,
      new_values: result.data,
      risk_level: 'low',
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
