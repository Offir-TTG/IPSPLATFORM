import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/lib/lms/courseService';

export const dynamic = 'force-dynamic';

// GET /api/admin/lms/courses/[id] - Get course details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Admin Course API] Fetching course:', id);
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      console.error('[Admin Course API] User not found:', userDataError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('[Admin Course API] User data:', { role: userData.role, tenant_id: userData.tenant_id });

    // Check permissions (admin, super_admin, or instructor)
    if (!['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      console.error('[Admin Course API] Permission denied for role:', userData.role);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (courseError || !course) {
      console.error('[Admin Course API] Course not found:', courseError);
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    console.log('[Admin Course API] Course found:', course.title);

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/lms/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/lms/courses/[id] - Update course
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('[Admin Course API] Updating course:', id);
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data with tenant
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (userDataError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check permissions (admin, super_admin, or instructor)
    if (!['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify course exists and belongs to tenant
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, tenant_id')
      .eq('id', id)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Verify tenant matches (if course has tenant_id)
    if (course.tenant_id && course.tenant_id !== userData.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();

    console.log('[Admin Course API] Updating with data:', body);

    // Update course
    const result = await courseService.updateCourse(id, body);

    if (!result.success) {
      console.error('[Admin Course API] Update failed:', result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log('[Admin Course API] Course updated successfully');

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/lms/courses/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
