import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface GradeInput {
  id?: string;
  grade_item_id: string;
  student_id: string;
  points_earned: number | null;
  percentage: number | null;
  status: string;
  is_excused: boolean;
}

// POST /api/admin/lms/courses/[id]/grading/grades/bulk - Bulk upsert grades
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Check permissions
    if (!['admin', 'super_admin', 'instructor'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const { grades }: { grades: GradeInput[] } = await request.json();

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json({ error: 'Invalid grades data' }, { status: 400 });
    }

    // Verify all grade items belong to this course
    const gradeItemIds = [...new Set(grades.map(g => g.grade_item_id))];
    const { data: gradeItems, error: itemsError } = await supabase
      .from('grade_items')
      .select('id')
      .eq('course_id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .in('id', gradeItemIds);

    if (itemsError || !gradeItems || gradeItems.length !== gradeItemIds.length) {
      return NextResponse.json({ error: 'Invalid grade item IDs' }, { status: 400 });
    }

    // Prepare grades for upsert
    const gradesToUpsert = grades.map(grade => ({
      ...(grade.id && { id: grade.id }),
      tenant_id: userData.tenant_id,
      grade_item_id: grade.grade_item_id,
      student_id: grade.student_id,
      points_earned: grade.points_earned,
      percentage: grade.percentage,
      status: grade.status,
      is_excused: grade.is_excused,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    }));

    // Upsert grades
    const { data: upsertedGrades, error: upsertError } = await supabase
      .from('student_grades')
      .upsert(gradesToUpsert, {
        onConflict: 'tenant_id,grade_item_id,student_id',
        ignoreDuplicates: false,
      })
      .select();

    if (upsertError) {
      console.error('Error upserting grades:', upsertError);
      return NextResponse.json({ error: 'Failed to save grades' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: upsertedGrades,
      count: upsertedGrades?.length || 0,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/lms/courses/[id]/grading/grades/bulk:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
