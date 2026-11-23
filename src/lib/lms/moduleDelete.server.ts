import { createAdminClient, createClient } from '@/lib/supabase/server';

type Db = ReturnType<typeof createAdminClient>;

/** The signed-in user's tenant, or null when signed out. */
export async function currentTenantId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await createAdminClient().from('users').select('tenant_id').eq('id', user.id).maybeSingle();
  return data?.tenant_id ?? null;
}

/** The module, when it belongs to this tenant. */
export async function loadModule(db: Db, id: string, tenantId: string) {
  const { data } = await db.from('modules').select('id, course_id, title, tenant_id, order, is_published, is_optional').eq('id', id).eq('tenant_id', tenantId).maybeSingle();
  return data as { id: string; course_id: string; title: string; tenant_id: string; order: number | null; is_published: boolean | null; is_optional: boolean | null } | null;
}

/** The module's lessons in their order. */
export async function moduleLessons(db: Db, moduleId: string) {
  const { data } = await db.from('lessons').select('id, start_time, order').eq('module_id', moduleId).order('order', { ascending: true });
  return (data || []) as { id: string; start_time: string | null; order: number | null }[];
}

/**
 * What deleting the module would remove along with its lessons, and where
 * the lessons could move instead (the course's other modules).
 */
export async function moduleDeletePreview(db: Db, mod: { id: string; course_id: string }) {
  const lessons = await moduleLessons(db, mod.id);
  const ids = lessons.map((l) => l.id);
  const { data: others } = await db.from('modules').select('id, title').eq('course_id', mod.course_id).neq('id', mod.id).order('order', { ascending: true });

  let topics = 0;
  let meetings = 0;
  let attendance = 0;
  let heldWithAttendance = 0;
  if (ids.length) {
    const [t, s, a] = await Promise.all([
      db.from('lesson_topics').select('id', { count: 'exact', head: true }).in('lesson_id', ids),
      db.from('zoom_sessions').select('lesson_id, zoom_meeting_id, daily_room_name').in('lesson_id', ids),
      db.from('attendance').select('lesson_id').in('lesson_id', ids),
    ]);
    topics = t.count ?? 0;
    // A recurring Zoom meeting is shared by the whole series: count it once.
    meetings = new Set((s.data || []).map((r: any) => r.zoom_meeting_id || r.daily_room_name || r.lesson_id)).size;
    attendance = (a.data || []).length;
    heldWithAttendance = new Set((a.data || []).map((r: any) => r.lesson_id)).size;
  }
  return {
    lessons: ids.length,
    topics,
    meetings,
    attendance,
    held_with_attendance: heldWithAttendance,
    other_modules: (others || []) as { id: string; title: string }[],
  };
}

/** Moves the lessons to the end of another module of the same course, in the same order. */
export async function moveLessons(db: Db, lessons: { id: string }[], targetId: string) {
  const { data: last } = await db.from('lessons').select('order').eq('module_id', targetId).order('order', { ascending: false }).limit(1).maybeSingle();
  const start = (Number(last?.order) || 0) + 1;
  for (const [i, l] of lessons.entries()) {
    const { error } = await db.from('lessons').update({ module_id: targetId, order: start + i }).eq('id', l.id);
    if (error) throw new Error(error.message);
  }
}

/** A new module in the same course to take the lessons of the one being deleted. */
export async function createReplacementModule(
  db: Db,
  mod: { course_id: string; tenant_id: string; order: number | null; is_published: boolean | null; is_optional: boolean | null },
  title: string,
) {
  // Two modules of a course can't share a place (unique_module_order), so it
  // starts at the end; placeReplacementModule moves it up once the old one is gone.
  const { data: last } = await db.from('modules').select('order').eq('course_id', mod.course_id).order('order', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await db
    .from('modules')
    .insert({
      tenant_id: mod.tenant_id,
      course_id: mod.course_id,
      title,
      order: (Number(last?.order) || 0) + 1,
      is_published: mod.is_published ?? true,
      is_optional: mod.is_optional ?? false,
    })
    .select('id, title')
    .single();
  if (error || !data) throw new Error(error?.message || 'module_create_failed');
  return data as { id: string; title: string };
}

/** After the old module is deleted: the new one takes its place in the course. */
export async function placeReplacementModule(db: Db, newId: string, order: number | null) {
  if (order === null || order === undefined) return;
  await db.from('modules').update({ order }).eq('id', newId);
}
