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

    // Get course counts and student counts for each program
    const transformedPrograms = await Promise.all(
      (programs || []).map(async (program) => {
        // Get course count
        const { count: courseCount } = await supabase
          .from('program_courses')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', program.id);

        // Get student count by counting enrollments for products that reference this program
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select(`
            id,
            product:products!enrollments_product_id_fkey(
              program_id
            )
          `);

        // Filter enrollments where product.program_id matches this program
        const programEnrollments = (enrollments || []).filter((e: any) =>
          e.product?.program_id === program.id
        );

        return {
          ...program,
          course_count: courseCount || 0,
          student_count: programEnrollments.length,
        };
      })
    );

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
}, ['admin', 'instructor']);

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
        crm_tag: body.crm_tag || 'general', // Default CRM tag
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
}, ['admin']);