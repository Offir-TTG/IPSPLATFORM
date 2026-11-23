import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Whether a course uses grades and attendance (Course → Settings). A parents'
 * club, for example, turns both off, and the client portal then shows no
 * grades or attendance for it.
 *
 * Both are on unless switched off. Read on their own and forgivingly: until
 * supabase/migrations/20261123_course_grades_attendance_switches.sql runs the
 * columns don't exist, and everything stays on.
 */
export type CourseFeatures = { grades: boolean; attendance: boolean };

export const ALL_FEATURES: CourseFeatures = { grades: true, attendance: true };

export async function loadCourseFeatures(db: SupabaseClient, courseIds: string[]): Promise<Map<string, CourseFeatures>> {
  const out = new Map<string, CourseFeatures>();
  const ids = [...new Set(courseIds.filter(Boolean))];
  for (const id of ids) out.set(id, { ...ALL_FEATURES });
  if (!ids.length) return out;
  const { data, error } = await db.from('courses').select('id, uses_grades, uses_attendance').in('id', ids);
  if (error) return out; // columns not added yet: everything on
  for (const r of data ?? []) {
    out.set(r.id as string, { grades: (r as any).uses_grades !== false, attendance: (r as any).uses_attendance !== false });
  }
  return out;
}
