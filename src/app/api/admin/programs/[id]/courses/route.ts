import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit/logger';

// GET /api/admin/programs/[id]/courses - List courses in a program
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get program courses with course details
    const { data: programCourses, error } = await supabase
      .from('program_courses')
      .select(`
        id,
        order,
        is_required,
        created_at,
        course:courses (
          id,
          title,
          description,
          instructor_id,
          is_active,
          start_date,
          end_date
        )
      `)
      .eq('program_id', params.id)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching program courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch program courses' },
        { status: 500 }
      );
    }

    return NextResponse.json(programCourses || []);

  } catch (error) {
    console.error('Error in GET /api/admin/programs/[id]/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/programs/[id]/courses - Add course to program
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { course_id, is_required = true, order } = body;

    if (!course_id) {
      return NextResponse.json(
        { error: 'course_id is required' },
        { status: 400 }
      );
    }

    // If order not provided, get the next order number
    let courseOrder = order;
    if (courseOrder === undefined) {
      const { data: existingCourses } = await supabase
        .from('program_courses')
        .select('order')
        .eq('program_id', params.id)
        .order('order', { ascending: false })
        .limit(1);

      courseOrder = existingCourses && existingCourses.length > 0
        ? existingCourses[0].order + 1
        : 0;
    }

    // Add course to program
    const { data, error } = await supabase
      .from('program_courses')
      .insert({
        program_id: params.id,
        course_id,
        is_required,
        order: courseOrder
      })
      .select(`
        id,
        order,
        is_required,
        created_at,
        course:courses (
          id,
          title,
          description,
          is_active
        )
      `)
      .single();

    if (error) {
      console.error('Error adding course to program:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to add course' },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'program.course_added',
      details: {
        programId: params.id,
        courseId: course_id,
        courseName: (data.course as any)?.title,
        isRequired: is_required,
        order: courseOrder,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in POST /api/admin/programs/[id]/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/programs/[id]/courses/order - Reorder courses in program
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { courseOrders } = body; // Array of { course_id, order }

    if (!Array.isArray(courseOrders)) {
      return NextResponse.json(
        { error: 'courseOrders must be an array' },
        { status: 400 }
      );
    }

    // Update each course order
    const updates = courseOrders.map(async ({ course_id, order }) => {
      return supabase
        .from('program_courses')
        .update({ order })
        .eq('program_id', params.id)
        .eq('course_id', course_id);
    });

    await Promise.all(updates);

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'program.courses_reordered',
      details: {
        programId: params.id,
        courseOrders: courseOrders,
        courseCount: courseOrders.length,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in PUT /api/admin/programs/[id]/courses/order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
