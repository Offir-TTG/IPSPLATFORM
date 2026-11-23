import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// GET /api/programs - List all programs
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const supabase = await createClient();

    // Get programs first
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch programs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Course and student counts in two reads for all programs (this used to
    // read every enrollment once per program).
    const ids = (programs || []).map((p) => p.id);
    const courseCounts = new Map<string, number>();
    const studentCounts = new Map<string, number>();
    // Enrollments still running (active or pending) stop a program from being deleted.
    const activeCounts = new Map<string, number>();
    if (ids.length > 0) {
      const [{ data: links }, { data: enrollments }] = await Promise.all([
        supabase.from('program_courses').select('program_id').in('program_id', ids),
        supabase
          .from('enrollments')
          .select('id, status, product:products!enrollments_product_id_fkey!inner(program_id)')
          .in('product.program_id', ids),
      ]);
      for (const l of links || []) courseCounts.set(l.program_id, (courseCounts.get(l.program_id) || 0) + 1);
      for (const e of (enrollments || []) as any[]) {
        const pid = Array.isArray(e.product) ? e.product[0]?.program_id : e.product?.program_id;
        if (pid) studentCounts.set(pid, (studentCounts.get(pid) || 0) + 1);
        if (pid && (e.status === 'active' || e.status === 'pending')) activeCounts.set(pid, (activeCounts.get(pid) || 0) + 1);
      }
    }
    const transformedPrograms = (programs || []).map((program) => ({
      ...program,
      course_count: courseCounts.get(program.id) || 0,
      student_count: studentCounts.get(program.id) || 0,
      active_count: activeCounts.get(program.id) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: transformedPrograms,
    });
  } catch (error) {
    console.error('Get programs error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}, ['admin', 'super_admin', 'instructor']);

// POST /api/programs - Create a new program
export const POST = withAuth(async (request: NextRequest, user: any) => {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Program name is required' },
        { status: 400 }
      );
    }

    // Get tenant_id from user's session or existing data
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    // Create program with basic fields and defaults for required columns
    const { data: program, error } = await supabase
      .from('programs')
      .insert({
        tenant_id: userData?.tenant_id,
        name: body.name,
        description: body.description || null,
        is_active: body.is_active ?? true,
        duration_weeks: body.duration_weeks || null,
        max_students: body.max_students || null,
        image_url: body.image_url || null, // Store image URL
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create program:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'program.created',
      details: {
        programId: program.id,
        programName: program.name,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error('Create program error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create program' },
      { status: 500 }
    );
  }
}, ['admin', 'super_admin']);