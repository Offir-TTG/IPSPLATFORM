import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { zoomService } from '@/lib/zoom/zoomService';

// ============================================================================
// POST /api/admin/programs/[id]/bridge
// Generate instructor bridge link for a program
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const programId = params.id;

    // Get program with instructor information from its courses
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        tenant_id,
        courses (
          instructor_id
        )
      `)
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Get instructor ID from first course (assuming same instructor across program)
    const instructorId = program.courses?.[0]?.instructor_id;

    if (!instructorId) {
      return NextResponse.json(
        { error: 'No instructor assigned to this program' },
        { status: 400 }
      );
    }

    // Create or get existing bridge link
    const result = await zoomService.createInstructorBridgeLink(
      programId,
      instructorId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create bridge link' },
        { status: 400 }
      );
    }

    // Log audit event
    await supabase.from('audit_events').insert({
      user_id: user.id,
      event_type: 'CREATE',
      event_category: 'EDUCATION',
      resource_type: 'instructor_bridge_links',
      resource_id: result.data!.id,
      action: 'Created instructor bridge link',
      description: `Program: ${program.name}, Slug: ${result.data!.bridge_slug}`,
      new_values: result.data,
      risk_level: 'low',
    });

    // Build full bridge URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const bridgeUrl = `${baseUrl}/bridge/${result.data!.bridge_slug}`;

    return NextResponse.json({
      success: true,
      data: {
        ...result.data,
        bridge_url: bridgeUrl,
      },
      message: 'Instructor bridge link created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/programs/[id]/bridge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/admin/programs/[id]/bridge
// Get existing instructor bridge link for a program
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const programId = params.id;

    // Get existing bridge link
    const { data: bridgeLink, error } = await supabase
      .from('instructor_bridge_links')
      .select(`
        *,
        instructor:users (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('program_id', programId)
      .single();

    if (error || !bridgeLink) {
      return NextResponse.json(
        { success: false, data: null },
        { status: 200 }
      );
    }

    // Build full bridge URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const bridgeUrl = `${baseUrl}/bridge/${bridgeLink.bridge_slug}`;

    return NextResponse.json({
      success: true,
      data: {
        ...bridgeLink,
        bridge_url: bridgeUrl,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/admin/programs/[id]/bridge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
