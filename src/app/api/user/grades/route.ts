/**
 * GET /api/user/grades
 *
 * Returns the full list of grades for the calling student across every
 * enrolled course. Mirrors the dashboard's `recent_grades` shape (so
 * the page can reuse the `RecentGrade` type from `useDashboard`) but
 * removes the 10-row limit and adds the scale-resolution logic the
 * dashboard already does — letters/colors come from the course's
 * grading scale (or tenant default) when `student_grades.letter_grade`
 * is NULL.
 *
 * RLS on `student_grades` already restricts to the caller's own rows.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_request: NextRequest, user: any) => {
  try {
    const supabase = await createClient();

    const { data: rawGrades, error } = await supabase
      .from('student_grades')
      .select(`
        id,
        points_earned,
        percentage,
        letter_grade,
        status,
        is_excused,
        graded_at,
        grade_item:grade_items!inner (
          id,
          name,
          max_points,
          due_date,
          course:courses ( id, title, grading_scale_id ),
          category:grade_categories ( name, color_code )
        )
      `)
      .eq('student_id', user.id)
      .order('graded_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Failed to fetch grades:', error);
      return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
    }

    // Same scale-resolution pattern as the dashboard route. Collect
    // every scale referenced by a row missing `letter_grade`, plus
    // the tenant default scale; bulk-fetch ranges; resolve letter +
    // color per row.
    const scaleIdsNeedingLookup = new Set<string>();
    (rawGrades ?? []).forEach((g: any) => {
      const item = Array.isArray(g.grade_item) ? g.grade_item[0] : g.grade_item;
      const course = item?.course
        ? Array.isArray(item.course) ? item.course[0] : item.course
        : null;
      if (course?.grading_scale_id) scaleIdsNeedingLookup.add(course.grading_scale_id);
    });

    const { data: userRow } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    let tenantDefaultScaleId: string | null = null;
    if (userRow?.tenant_id) {
      const { data: defaultScaleRow } = await supabase
        .from('grading_scales')
        .select('id')
        .eq('tenant_id', userRow.tenant_id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (defaultScaleRow?.id) {
        tenantDefaultScaleId = defaultScaleRow.id;
        scaleIdsNeedingLookup.add(defaultScaleRow.id);
      }
    }

    type Range = { min: number; max: number; label: string; color: string | null };
    const rangesByScale = new Map<string, Range[]>();
    if (scaleIdsNeedingLookup.size > 0) {
      const { data: rangeRows } = await supabase
        .from('grade_ranges')
        .select('grading_scale_id, min_percentage, max_percentage, grade_label, color_code')
        .in('grading_scale_id', Array.from(scaleIdsNeedingLookup));
      (rangeRows ?? []).forEach((r: any) => {
        const arr = rangesByScale.get(r.grading_scale_id) ?? [];
        arr.push({
          min: Number(r.min_percentage),
          max: Number(r.max_percentage),
          label: r.grade_label,
          color: r.color_code ?? null,
        });
        rangesByScale.set(r.grading_scale_id, arr);
      });
    }

    function matchRange(pct: number, scaleId: string | null): Range | null {
      if (!scaleId) return null;
      const ranges = rangesByScale.get(scaleId);
      if (!ranges) return null;
      return ranges.find((r) => pct >= r.min && pct <= r.max) ?? null;
    }
    function resolveRange(pct: number, scaleId: string | null): Range | null {
      return matchRange(pct, scaleId) ?? matchRange(pct, tenantDefaultScaleId);
    }
    function colorForStoredLetter(label: string | null, scaleId: string | null): string | null {
      if (!label) return null;
      const tryScale = (id: string | null): string | null => {
        if (!id) return null;
        const rows = rangesByScale.get(id);
        return rows?.find((row) => row.label === label)?.color ?? null;
      };
      return tryScale(scaleId) ?? tryScale(tenantDefaultScaleId);
    }

    const grades = (rawGrades ?? []).map((g: any) => {
      const item = Array.isArray(g.grade_item) ? g.grade_item[0] : g.grade_item;
      const course = item?.course
        ? Array.isArray(item.course) ? item.course[0] : item.course
        : null;
      const category = item?.category
        ? Array.isArray(item.category) ? item.category[0] : item.category
        : null;
      const pct = g.percentage != null ? Number(g.percentage) : null;
      const courseScaleId = course?.grading_scale_id ?? null;

      let letter: string | null = g.letter_grade ?? null;
      let color: string | null = null;
      if (letter) {
        color = colorForStoredLetter(letter, courseScaleId);
      } else if (pct !== null) {
        const range = resolveRange(pct, courseScaleId);
        letter = range?.label ?? null;
        color = range?.color ?? null;
      }

      return {
        id: g.id,
        grade_item_id: item?.id ?? null,
        grade_item_name: item?.name ?? '',
        course_id: course?.id ?? null,
        course_name: course?.title ?? '',
        points_earned: g.points_earned,
        max_points: item?.max_points ?? null,
        percentage: g.percentage,
        letter_grade: letter,
        letter_color: color,
        status: g.status,
        is_excused: g.is_excused,
        graded_at: g.graded_at,
        due_date: item?.due_date ?? null,
        category_name: category?.name ?? null,
        category_color: category?.color_code ?? null,
      };
    });

    return NextResponse.json({ success: true, data: grades });
  } catch (err: any) {
    console.error('Error in GET /api/user/grades:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}, ['student', 'instructor']);
