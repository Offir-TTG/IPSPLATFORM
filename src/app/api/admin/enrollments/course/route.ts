import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// POST /api/admin/enrollments/course - Enroll user in a specific course
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
      enrollment_status = 'active',
      expires_at,
      notes
    } = body;

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'user_id and course_id are required' },
        { status: 400 }
      );
    }

    // Check if enrollment already exists
    const { data: existingEnrollment } = await supabase
      .from('user_courses')
      .select('id')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .single();

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'User is already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const { data, error } = await supabase
      .from('user_courses')
      .insert({
        user_id,
        course_id,
        enrollment_status,
        enrollment_type: 'admin_assigned', // Mark as admin-assigned
        expires_at,
        notes,
        enrolled_by: user.id,
        enrolled_at: new Date().toISOString()
      })
      .select(`
        id,
        enrollment_status,
        enrollment_type,
        enrolled_at,
        expires_at,
        user:users (
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
      console.error('Error creating course enrollment:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to create enrollment' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/enrollments/course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
