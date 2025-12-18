import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
