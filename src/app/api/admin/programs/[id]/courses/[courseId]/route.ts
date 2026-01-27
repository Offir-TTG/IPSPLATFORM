import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

// DELETE /api/admin/programs/[id]/courses/[courseId] - Remove course from program
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
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

    // Get course name before deleting for audit log
    const { data: courseData } = await supabase
      .from('program_courses')
      .select(`
        course:courses (
          title
        )
      `)
      .eq('program_id', params.id)
      .eq('course_id', params.courseId)
      .single();

    // Remove course from program
    const { error } = await supabase
      .from('program_courses')
      .delete()
      .eq('program_id', params.id)
      .eq('course_id', params.courseId);

    if (error) {
      console.error('Error removing course from program:', error);
      return NextResponse.json(
        { error: 'Failed to remove course' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in DELETE /api/admin/programs/[id]/courses/[courseId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/programs/[id]/courses/[courseId] - Update course settings in program
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
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
    const { is_required, order } = body;

    const updates: any = {};
    if (is_required !== undefined) updates.is_required = is_required;
    if (order !== undefined) updates.order = order;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update course settings
    const { data, error } = await supabase
      .from('program_courses')
      .update(updates)
      .eq('program_id', params.id)
      .eq('course_id', params.courseId)
      .select(`
        id,
        order,
        is_required,
        updated_at,
        course:courses (
          title
        )
      `)
      .single();

    if (error) {
      console.error('Error updating course in program:', error);
      return NextResponse.json(
        { error: 'Failed to update course' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PATCH /api/admin/programs/[id]/courses/[courseId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
