import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/middleware/auth';
export const dynamic = 'force-dynamic';

// GET /api/user/dashboard - Get user dashboard data
export const GET = withAuth(
  async (request: NextRequest, user: any) => {
    try {
      const supabase = await createClient();

      // Call the optimized dashboard function (v3 with isolated subqueries to avoid GROUP BY issues)
      const { data, error } = await supabase.rpc('get_user_dashboard_v3', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Dashboard query error:', error);
        console.error('Dashboard query error details:', JSON.stringify(error, null, 2));

        return NextResponse.json(
          { success: false, error: 'Failed to fetch dashboard data' },
          { status: 500 }
        );
      }

      // Log the data to see what's being returned
      console.log('Dashboard data received:', JSON.stringify(data, null, 2));

      // Ensure recent_attendance exists (for backwards compatibility before SQL update)
      const dashboardData = data || {
        enrollments: [],
        upcoming_sessions: [],
        pending_assignments: [],
        recent_attendance: [],
        stats: {
          total_courses: 0,
          completed_lessons: 0,
          in_progress_lessons: 0,
          pending_assignments: 0,
          total_attendance: 0,
          attendance_present: 0,
          attendance_rate: 0,
          total_hours_spent: 0,
        },
        recent_activity: [],
      };

      // Add recent_attendance if missing (backwards compatibility)
      if (!dashboardData.recent_attendance) {
        dashboardData.recent_attendance = [];
      }

      // Ensure attendance stats exist (backwards compatibility)
      if (!dashboardData.stats.total_attendance) {
        dashboardData.stats.total_attendance = 0;
      }
      if (!dashboardData.stats.attendance_present) {
        dashboardData.stats.attendance_present = 0;
      }
      if (!dashboardData.stats.attendance_rate) {
        dashboardData.stats.attendance_rate = 0;
      }

      // Recent grades across all the student's courses.
      // Not in the RPC yet — fetch in parallel with the rest of the page
      // so a slow grades query doesn't block the dashboard load. RLS on
      // student_grades already restricts to the caller's own rows.
      const { data: rawGrades } = await supabase
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
        .order('graded_at', { ascending: false, nullsFirst: false })
        .limit(10);

      // Collect grading scales referenced by rows that have a
      // percentage but no stored letter. Each course may point at its
      // own scale; if a course has none (or its scale produced no
      // match), we also fall back to the tenant's default scale — same
      // behavior as the admin endpoint, so admin + student see the
      // same letter for the same row.
      const scaleIdsNeedingLookup = new Set<string>();
      (rawGrades ?? []).forEach((g: any) => {
        if (g.letter_grade) return;
        if (g.percentage == null) return;
        const item = Array.isArray(g.grade_item) ? g.grade_item[0] : g.grade_item;
        const course = item?.course
          ? Array.isArray(item.course) ? item.course[0] : item.course
          : null;
        if (course?.grading_scale_id) scaleIdsNeedingLookup.add(course.grading_scale_id);
      });

      // Tenant default scale — used when a row's course has no scale
      // (or when the course scale's ranges don't cover the percentage).
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
      let rangesByScale = new Map<string, Range[]>();
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
        // Prefer the course's own scale; fall back to the tenant
        // default. Both letter + color travel together.
        return matchRange(pct, scaleId) ?? matchRange(pct, tenantDefaultScaleId);
      }

      function colorForStoredLetter(label: string | null, scaleId: string | null): string | null {
        // When letter_grade was already written into student_grades,
        // we still want to surface the matching color so the UI can
        // paint the badge. Look it up by label, preferring the course
        // scale, then tenant default.
        if (!label) return null;
        const tryScale = (id: string | null): string | null => {
          if (!id) return null;
          const r = rangesByScale.get(id);
          return r?.find((row) => row.label === label)?.color ?? null;
        };
        return tryScale(scaleId) ?? tryScale(tenantDefaultScaleId);
      }

      dashboardData.recent_grades = (rawGrades ?? []).map((g: any) => {
        const item = Array.isArray(g.grade_item) ? g.grade_item[0] : g.grade_item;
        const course = item?.course
          ? Array.isArray(item.course) ? item.course[0] : item.course
          : null;
        const category = item?.category
          ? Array.isArray(item.category) ? item.category[0] : item.category
          : null;
        const pct = g.percentage != null ? Number(g.percentage) : null;
        const courseScaleId = course?.grading_scale_id ?? null;

        // Letter + color come from the same lookup so the badge in the
        // dashboard tile can match what the admin tab shows.
        let letter: string | null = g.letter_grade ?? null;
        let color: string | null = null;
        if (letter) {
          color = colorForStoredLetter(letter, courseScaleId);
        } else if (pct !== null && !g.is_excused) {
          const hit = resolveRange(pct, courseScaleId);
          letter = hit?.label ?? null;
          color = hit?.color ?? null;
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

      return NextResponse.json({
        success: true,
        data: dashboardData,
      });
    } catch (error) {
      console.error('Dashboard error:', error);

      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  ['student', 'instructor']
);
