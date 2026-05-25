import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/grades
// Returns student_grades joined with grade_items and the parent course,
// plus the grader's name for display.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: callerRow } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!callerRow || !['admin', 'super_admin'].includes(callerRow.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from('student_grades')
      .select(`
        id,
        points_earned,
        percentage,
        letter_grade,
        status,
        is_excused,
        is_late,
        submitted_at,
        graded_at,
        feedback,
        grade_item:grade_items (
          id, name, max_points,
          course:courses ( id, title )
        ),
        grader:users!student_grades_graded_by_fkey ( id, first_name, last_name )
      `)
      .eq('student_id', params.id)
      .order('graded_at', { ascending: false, nullsFirst: false })
      .limit(200);

    if (error) {
      console.error('student_grades query failed:', error);
      return NextResponse.json(
        { error: 'Failed to load grades' },
        { status: 500 }
      );
    }

    return NextResponse.json({ grades: data ?? [] });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/grades:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
