import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Who a notification reaches, counted with the same rule the portal uses
 * to show notifications (get_user_notifications):
 *   individual: the one person
 *   tenant:     every user in the tenant
 *   program:    people with an active enrollment in a product linked to the program
 *   course:     people with an active enrollment in a product linked to the
 *               course, or to a program containing it (courses.program_id or
 *               program_courses)
 * Read-only. Pass an admin (service) client: it counts other people's enrollments.
 */

type Db = SupabaseClient;
type Scope = 'course' | 'program';

/** People a set of courses or programs reach: per id, and everyone once. */
export async function countAudience(db: Db, tenantId: string, scope: Scope, ids: string[]): Promise<{ counts: Record<string, number>; total: number }> {
  if (ids.length === 0) return { counts: {}, total: 0 };

  // Which programs and courses each target reaches through.
  const programsFor = new Map<string, Set<string>>();
  const coursesFor = new Map<string, Set<string>>();
  for (const id of ids) {
    programsFor.set(id, new Set(scope === 'program' ? [id] : []));
    coursesFor.set(id, new Set(scope === 'course' ? [id] : []));
  }
  if (scope === 'course') {
    const [{ data: courseRows }, { data: links }] = await Promise.all([
      db.from('courses').select('id, program_id').in('id', ids),
      db.from('program_courses').select('course_id, program_id').in('course_id', ids),
    ]);
    for (const c of courseRows ?? []) if (c.program_id) programsFor.get(c.id)?.add(c.program_id);
    for (const l of links ?? []) if (l.program_id) programsFor.get(l.course_id)?.add(l.program_id);
  }

  const allPrograms = [...new Set([...programsFor.values()].flatMap((s) => [...s]))];
  const allCourses = [...new Set([...coursesFor.values()].flatMap((s) => [...s]))];

  // Products linked to those programs or courses, in the tenant.
  const productRows: Array<{ id: string; program_id: string | null; course_id: string | null }> = [];
  if (allPrograms.length) {
    const { data, error } = await db.from('products').select('id, program_id, course_id').eq('tenant_id', tenantId).in('program_id', allPrograms);
    if (error) throw error;
    productRows.push(...(data ?? []));
  }
  if (allCourses.length) {
    const { data, error } = await db.from('products').select('id, program_id, course_id').eq('tenant_id', tenantId).in('course_id', allCourses);
    if (error) throw error;
    productRows.push(...(data ?? []));
  }
  const productIds = [...new Set(productRows.map((p) => p.id))];

  const usersByProduct = new Map<string, Set<string>>();
  if (productIds.length) {
    const { data, error } = await db.from('enrollments').select('user_id, product_id').eq('status', 'active').in('product_id', productIds);
    if (error) throw error;
    for (const e of data ?? []) {
      if (!e.user_id || !e.product_id) continue;
      if (!usersByProduct.has(e.product_id)) usersByProduct.set(e.product_id, new Set());
      usersByProduct.get(e.product_id)!.add(e.user_id);
    }
  }

  const counts: Record<string, number> = {};
  const everyone = new Set<string>();
  for (const id of ids) {
    const programs = programsFor.get(id)!;
    const courses = coursesFor.get(id)!;
    const people = new Set<string>();
    for (const p of productRows) {
      const reaches = (p.program_id && programs.has(p.program_id)) || (p.course_id && courses.has(p.course_id));
      if (!reaches) continue;
      for (const u of usersByProduct.get(p.id) ?? []) people.add(u);
    }
    counts[id] = people.size;
    people.forEach((u) => everyone.add(u));
  }
  return { counts, total: everyone.size };
}

export type NotificationTarget = {
  id: string;
  scope: string;
  target_course_id?: string | null;
  target_program_id?: string | null;
};

/** How many people each notification was sent to, by notification id. */
export async function recipientTotals(db: Db, tenantId: string, notifications: NotificationTarget[]): Promise<Map<string, number>> {
  const courseIds = [...new Set(notifications.filter((n) => n.scope === 'course' && n.target_course_id).map((n) => n.target_course_id!))];
  const programIds = [...new Set(notifications.filter((n) => n.scope === 'program' && n.target_program_id).map((n) => n.target_program_id!))];
  const needTenant = notifications.some((n) => n.scope === 'tenant');

  const [courses, programs, tenantUsers] = await Promise.all([
    countAudience(db, tenantId, 'course', courseIds),
    countAudience(db, tenantId, 'program', programIds),
    needTenant
      ? db
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .then(({ count }) => count ?? 0)
      : Promise.resolve(0),
  ]);

  const totals = new Map<string, number>();
  for (const n of notifications) {
    totals.set(
      n.id,
      n.scope === 'individual'
        ? 1
        : n.scope === 'tenant'
          ? tenantUsers
          : n.scope === 'course' && n.target_course_id
            ? (courses.counts[n.target_course_id] ?? 0)
            : n.scope === 'program' && n.target_program_id
              ? (programs.counts[n.target_program_id] ?? 0)
              : 0,
    );
  }
  return totals;
}

/**
 * Which send a notification row belongs to. Choosing several students,
 * courses or programs saves one row each, all in one insert, so they share
 * the exact created_at and the same content.
 */
export function sendKey(n: {
  created_at: string;
  scope: string;
  title: string;
  message: string;
  priority?: string | null;
  category?: string | null;
  action_url?: string | null;
  display_style?: string | null;
}) {
  return [n.created_at, n.scope, n.priority ?? '', n.category ?? '', n.title, n.message, n.action_url ?? '', n.display_style ?? ''].join('\u0001');
}

/** How many people read each notification, by notification id. */
export async function readCounts(db: Db, notificationIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  for (let i = 0; i < notificationIds.length; i += 200) {
    const chunk = notificationIds.slice(i, i + 200);
    const { data, error } = await db.from('notification_reads').select('notification_id').in('notification_id', chunk);
    if (error) throw error;
    for (const r of data ?? []) counts.set(r.notification_id, (counts.get(r.notification_id) ?? 0) + 1);
  }
  return counts;
}
