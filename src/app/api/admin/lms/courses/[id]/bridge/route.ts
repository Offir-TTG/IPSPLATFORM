import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ZoomService } from '@/lib/zoom/zoomService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/lms/courses/[id]/bridge
 * Create instructor bridge link for a course
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const courseId = params.id;

    // Get course with instructor information
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        tenant_id,
        instructor_id
      `)
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Verify the course belongs to the user's tenant
    if (course.tenant_id !== userData.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Course not in your tenant' },
        { status: 403 }
      );
    }

    // Check if instructor is assigned
    const instructorId = course.instructor_id;

    if (!instructorId) {
      return NextResponse.json(
        { success: false, error: 'No instructor assigned to this course. Please assign an instructor first.' },
        { status: 400 }
      );
    }

    // Create or get existing bridge link
    const zoomService = new ZoomService(course.tenant_id);
    const result = await zoomService.createInstructorBridgeLink(
      courseId,
      instructorId
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to create bridge link' },
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
      description: `Course: ${course.title}, Slug: ${result.data!.bridge_slug}`,
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
    console.error('Error in POST /api/admin/lms/courses/[id]/bridge:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/lms/courses/[id]/bridge
 * Get existing instructor bridge link for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify admin access
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const courseId = params.id;

    // Get course to verify tenant
    const { data: course } = await supabase
      .from('courses')
      .select('tenant_id')
      .eq('id', courseId)
      .single();

    if (!course || course.tenant_id !== userData.tenant_id) {
      return NextResponse.json(
        { success: false, error: 'Course not found or access denied' },
        { status: 404 }
      );
    }

    // Get existing bridge link
    const { data: bridgeLink, error } = await supabase
      .from('instructor_bridge_links')
      .select(`
        *,
        instructor:users!instructor_bridge_links_instructor_id_fkey (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('course_id', courseId)
      .single();

    if (error || !bridgeLink) {
      // Return success with null data if no bridge link exists yet
      return NextResponse.json({
        success: true,
        data: null,
      });
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
    console.error('Error in GET /api/admin/lms/courses/[id]/bridge:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
