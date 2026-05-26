import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/admin/users/[id]/attendance?page=1&per_page=20
// Returns:
//   summaries: per-course rollup computed over the user's FULL attendance
//              history (up to a generous cap), so the percentage stays
//              correct regardless of which records-page is showing.
//   records:   { rows, total, page, per_page } — paginated slice for the
//              detail table.
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));

    const adminClient = createAdminClient();

    // Pull the user's full history (cap at 5000 — far above any
    // realistic per-user attendance count) so summary percentages
    // reflect everything, not just the current page.
    const { data, error } = await adminClient
      .from('attendance')
      .select(
        `
        id,
        course_id,
        lesson_id,
        attendance_date,
        status,
        notes,
        course:courses ( id, title )
      `,
      )
      .eq('student_id', params.id)
      .order('attendance_date', { ascending: false })
      .limit(5000);

    if (error) {
      console.error('attendance query failed:', error);
      return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 });
    }

    type Row = {
      id: string;
      course_id: string;
      lesson_id: string | null;
      attendance_date: string;
      status: string;
      notes: string | null;
      course: { id: string; title: string } | { id: string; title: string }[] | null;
    };

    const rows = (data ?? []) as unknown as Row[];

    // Build per-course summary from ALL rows.
    const summariesMap = new Map<string, {
      course_id: string;
      course_title: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
    }>();

    const courseTitle = (c: Row['course']) =>
      Array.isArray(c) ? (c[0]?.title ?? '') : (c?.title ?? '');

    for (const r of rows) {
      const key = r.course_id;
      const entry = summariesMap.get(key) ?? {
        course_id: r.course_id,
        course_title: courseTitle(r.course),
        total: 0, present: 0, absent: 0, late: 0, excused: 0,
      };
      entry.total += 1;
      if (r.status === 'present') entry.present += 1;
      else if (r.status === 'absent') entry.absent += 1;
      else if (r.status === 'late') entry.late += 1;
      else if (r.status === 'excused') entry.excused += 1;
      summariesMap.set(key, entry);
    }

    const summaries = Array.from(summariesMap.values()).map((s) => ({
      ...s,
      rate: s.total > 0 ? Math.round((s.present / s.total) * 1000) / 10 : null,
    }));

    // Slice the page of records for the detail table.
    const total = rows.length;
    const from = (page - 1) * perPage;
    const pageSlice = rows.slice(from, from + perPage).map((r) => ({
      ...r,
      course: Array.isArray(r.course) ? (r.course[0] ?? null) : r.course,
    }));

    return NextResponse.json({
      summaries,
      records: { rows: pageSlice, total, page, per_page: perPage },
    });
  } catch (error) {
    console.error(`Error in GET /api/admin/users/${params.id}/attendance:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
