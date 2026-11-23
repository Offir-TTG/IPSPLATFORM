import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Deletes enrollments together with their payment schedules and payments.
 *
 * The database does not remove these with the enrollment, so deleting only
 * the enrollment left its charges behind with nothing to belong to, and a
 * pending one could still be charged by the daily charging. A payment and
 * its schedule point at each other, so they are unlinked first, then both
 * are deleted, then the enrollments (their sessions, intake answers and
 * offers go with them).
 *
 * Pass a client that may write these tables (the admin client, or the
 * signed-in admin's). Returns the first error, if any; nothing after a
 * failed step is deleted.
 */
export async function deleteEnrollmentsWithCharges(db: SupabaseClient, enrollmentIds: string[]): Promise<{ error: string | null; deleted: number }> {
  const ids = [...new Set(enrollmentIds.filter(Boolean))];
  if (!ids.length) return { error: null, deleted: 0 };

  const steps = [
    () => db.from('payment_schedules').update({ payment_id: null }).in('enrollment_id', ids),
    () => db.from('payments').update({ payment_schedule_id: null }).in('enrollment_id', ids),
    () => db.from('payments').delete().in('enrollment_id', ids),
    () => db.from('payment_schedules').delete().in('enrollment_id', ids),
  ];
  for (const step of steps) {
    const { error } = await step();
    if (error) return { error: error.message, deleted: 0 };
  }
  const { data, error } = await db.from('enrollments').delete().in('id', ids).select('id');
  return { error: error?.message ?? null, deleted: data?.length ?? 0 };
}
