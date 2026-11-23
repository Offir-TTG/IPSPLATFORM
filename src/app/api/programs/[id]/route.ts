import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// GET /api/programs/[id] - Get a single program
export const GET = withAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const supabase = await createClient();

    const { data: program, error } = await supabase
      .from('programs')
      .select(`
        *,
        courses:courses(*)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Program not found' },
          { status: 404 }
        );
      }
      console.error('Failed to fetch program:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error('Get program error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}, ['admin', 'super_admin', 'instructor']);

// PATCH /api/programs/[id] - Update a program
export const PATCH = withAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    const body = await request.json();
    // withAuth has checked the admin role. Saving goes through the server
    // client (the signed-in user's own connection can be stopped by row
    // rules), limited to the admin's own tenant.
    const supabase = createAdminClient();

    // Build update object with only provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.duration_weeks !== undefined) updateData.duration_weeks = body.duration_weeks;
    if (body.max_students !== undefined) updateData.max_students = body.max_students;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;

    const { data: program, error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Program not found' },
          { status: 404 }
        );
      }
      console.error('Failed to update program:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'program.updated',
      details: {
        programId: program.id,
        programName: program.name,
        changes: updateData,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error('Update program error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update program' },
      { status: 500 }
    );
  }
}, ['admin', 'super_admin']);

// DELETE /api/programs/[id] - Delete a program
export const DELETE = withAuth(async (
  request: NextRequest,
  user: any,
  { params }: { params: { id: string } }
) => {
  try {
    // Same as saving: the admin role is checked; limited to the admin's tenant.
    const supabase = createAdminClient();

    // First get the program name for audit logging
    const { data: program } = await supabase
      .from('programs')
      .select('name')
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id)
      .single();
    if (!program) {
      return NextResponse.json({ success: false, error: 'Program not found' }, { status: 404 });
    }

    // A program with enrollments still running (active or pending) can't be
    // deleted: those students would lose their program.
    const { data: running, error: runningError } = await supabase
      .from('enrollments')
      .select('id, product:products!enrollments_product_id_fkey!inner(program_id)')
      .eq('product.program_id', params.id)
      .in('status', ['active', 'pending']);
    if (runningError) {
      console.error('Failed to check program enrollments:', runningError);
      return NextResponse.json({ success: false, error: 'Could not check the enrollments' }, { status: 500 });
    }
    if (running && running.length > 0) {
      return NextResponse.json(
        { success: false, error: 'has_active_enrollments', active_count: running.length },
        { status: 409 }
      );
    }

    // Delete the program (cascade will handle related records)
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', params.id)
      .eq('tenant_id', user.tenant_id);

    if (error) {
      console.error('Failed to delete program:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email,
      action: 'program.deleted',
      details: {
        programId: params.id,
        programName: program?.name || 'Unknown',
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Program deleted successfully',
    });
  } catch (error) {
    console.error('Delete program error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}, ['admin', 'super_admin']);