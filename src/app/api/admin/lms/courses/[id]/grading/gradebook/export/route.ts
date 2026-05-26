/**
 * GET /api/admin/lms/courses/[id]/grading/gradebook/export
 *
 * Streams the course's gradebook as a CSV download. One column per
 * published grade_item, plus a Total column. Header row uses the
 * grade_item.name (with the same name re-imported via the matching
 * /import endpoint to update grades), so the export ⇄ import round-trip
 * is column-name keyed — not positional.
 *
 * Columns:
 *   Student ID, Email, Full Name, <Item Name 1> (/<max>), <Item Name 2>, …, Total
 *
 * UTF-8 BOM is prepended so Excel renders Hebrew names correctly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  // Quote anything containing comma, quote, or newline.
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const courseId = params.id;

    // Optional ?student_ids=uuid1,uuid2,… — when set, the export is
    // limited to those students. The gradebook page uses this to honor
    // its active filters (search/category/grade range) and any explicit
    // row selection. Empty/unset = whole course.
    const studentIdsParam = new URL(request.url).searchParams.get('student_ids');
    const restrictToStudentIds = studentIdsParam
      ? new Set(studentIdsParam.split(',').map((s) => s.trim()).filter(Boolean))
      : null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Course (for filename + tenant scope verification).
    const { data: course } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', courseId)
      .eq('tenant_id', userData.tenant_id)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    // Students enrolled in the course.
    const studentsRes = await fetch(
      new URL(`/api/admin/lms/courses/${courseId}/students`, request.url),
      { headers: { cookie: request.headers.get('cookie') ?? '' } },
    );
    if (!studentsRes.ok) {
      return NextResponse.json({ error: 'Failed to load students' }, { status: 500 });
    }
    const studentsJson = await studentsRes.json();
    const allStudents: Array<{ id: string; full_name: string; email: string }> =
      studentsJson.data ?? [];
    const students = restrictToStudentIds
      ? allStudents.filter((s) => restrictToStudentIds.has(s.id))
      : allStudents;

    // Grade items (sorted to match the on-screen gradebook order).
    const { data: items } = await supabase
      .from('grade_items')
      .select('id, name, max_points, display_order')
      .eq('course_id', courseId)
      .eq('tenant_id', userData.tenant_id)
      .order('display_order', { ascending: true });

    const gradeItems = (items ?? []) as Array<{
      id: string;
      name: string;
      max_points: number;
      display_order: number;
    }>;

    // All grades for this course (joined so we can match by student + item).
    const { data: grades } = await supabase
      .from('student_grades')
      .select('student_id, grade_item_id, points_earned, is_excused, grade_item:grade_items!inner(course_id)')
      .eq('tenant_id', userData.tenant_id)
      .eq('grade_item.course_id', courseId);

    // Map: studentId -> itemId -> points_earned (excused rows become 'EXCUSED').
    const byStudent = new Map<string, Map<string, string>>();
    (grades ?? []).forEach((g: any) => {
      const inner = byStudent.get(g.student_id) ?? new Map<string, string>();
      const value = g.is_excused
        ? 'EXCUSED'
        : g.points_earned == null
          ? ''
          : String(g.points_earned);
      inner.set(g.grade_item_id, value);
      byStudent.set(g.student_id, inner);
    });

    // Build CSV.
    const headers = [
      'Student ID',
      'Email',
      'Full Name',
      ...gradeItems.map((i) => `${i.name} (/${i.max_points})`),
      'Total Earned',
      'Total Possible',
      'Percentage',
    ];

    const rows = students.map((s) => {
      const studentGrades = byStudent.get(s.id) ?? new Map<string, string>();
      let earned = 0;
      let possible = 0;
      const itemCols = gradeItems.map((item) => {
        const raw = studentGrades.get(item.id) ?? '';
        if (raw === 'EXCUSED') {
          // Excused doesn't count toward earned/possible.
          return raw;
        }
        if (raw !== '') {
          earned += Number(raw);
          possible += Number(item.max_points);
        } else {
          // Ungraded still counts toward possible? No — keep "earned/possible"
          // consistent with what the page shows in the totals column (which
          // does add every item's max_points). To match, include max_points
          // for every item:
          possible += Number(item.max_points);
        }
        return raw;
      });
      const pct = possible > 0 ? (earned / possible) * 100 : 0;
      return [
        s.id,
        s.email,
        s.full_name,
        ...itemCols,
        earned.toFixed(2),
        possible.toFixed(2),
        pct.toFixed(2),
      ];
    });

    const csvLines = [
      headers.map(csvCell).join(','),
      ...rows.map((r) => r.map(csvCell).join(',')),
    ];
    const csv = '﻿' + csvLines.join('\n');

    // Build a Content-Disposition that survives Hebrew course titles.
    // HTTP headers are ASCII-only, so we provide:
    //   - filename=<ascii-fallback>  for legacy clients (Hebrew letters
    //     replaced with '-' so the byte stream stays in 0..127)
    //   - filename*=UTF-8''<percent-encoded>  per RFC 5987 for modern
    //     browsers, which decode it back to the original Hebrew name.
    const utf8Title = course.title.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 60) || 'course';
    const asciiTitle = utf8Title.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'course';
    const date = new Date().toISOString().slice(0, 10);
    const asciiName = `gradebook-${asciiTitle}-${date}.csv`;
    const utf8Name = `gradebook-${utf8Title}-${date}.csv`;
    const contentDisposition =
      `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(utf8Name)}`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error: any) {
    console.error('Gradebook export error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
