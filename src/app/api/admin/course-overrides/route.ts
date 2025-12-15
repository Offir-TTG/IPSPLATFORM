import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/course-overrides - List all course overrides (with filters)
export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const courseId = searchParams.get('course_id');
    const accessType = searchParams.get('access_type');

    let query = supabase
      .from('user_course_overrides')
      .select(`
        id,
        access_type,
        reason,
        expires_at,
        created_at,
        user:users!user_course_overrides_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        course:courses (
          id,
          title,
          description
        ),
        created_by_user:users!user_course_overrides_created_by_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (courseId) query = query.eq('course_id', courseId);
    if (accessType) query = query.eq('access_type', accessType);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching course overrides:', error);
      return NextResponse.json(
        { error: 'Failed to fetch course overrides' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error) {
    console.error('Error in GET /api/admin/course-overrides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/course-overrides - Create course override
export async function POST(request: NextRequest) {
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
    const {
      user_id,
      course_id,
      access_type,
      reason,
      expires_at
    } = body;

    if (!user_id || !course_id || !access_type) {
      return NextResponse.json(
        { error: 'user_id, course_id, and access_type are required' },
        { status: 400 }
      );
    }

    if (!['grant', 'hide'].includes(access_type)) {
      return NextResponse.json(
        { error: 'access_type must be either "grant" or "hide"' },
        { status: 400 }
      );
    }

    // Create override
    const { data, error } = await supabase
      .from('user_course_overrides')
      .insert({
        user_id,
        course_id,
        access_type,
        reason,
        expires_at,
        created_by: user.id
      })
      .select(`
        id,
        access_type,
        reason,
        expires_at,
        created_at,
        user:users!user_course_overrides_user_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        course:courses (
          id,
          title,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error creating course override:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create override' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/course-overrides:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
