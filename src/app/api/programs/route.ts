import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

// GET /api/programs - List all programs
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const supabase = await createClient();

    // Get programs with course counts (enrollments optional for now)
    const { data: programs, error } = await supabase
      .from('programs')
      .select(`
        *,
        courses:courses(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch programs:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform the data to include counts
    const transformedPrograms = programs?.map(program => ({
      ...program,
      course_count: program.courses?.[0]?.count || 0,
      student_count: 0, // Will be populated when enrollments table is ready
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
        price: body.price || 0, // Default to 0 if not provided
        currency: body.currency || 'USD', // Default to USD
        payment_plan: body.payment_plan || 'one_time', // Default payment plan (one_time or installments)
        crm_tag: body.crm_tag || 'general', // Default CRM tag
        duration_weeks: body.duration_weeks || null,
        max_students: body.max_students || null,
        docusign_template_id: body.docusign_template_id || null,
        installment_count: body.installment_count || null,
        require_signature: body.require_signature ?? false,
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