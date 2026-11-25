/**
 * Cron Job: Clean up abandoned guest enrollments
 *
 * A visitor who opens a product link without logging in gets a guest
 * enrollment (no client yet). Most are finished or joined to an account at
 * login; the rest are abandoned. Once a day, guest enrollments that are
 *   - self-started (the product link / buy button, enrollment_type
 *     'self_enrolled'; an admin's invitation to a new person is never touched),
 *   - still open (draft / pending), with no client (user_id null),
 *   - created more than 7 days ago, with a link that has expired,
 *   - and with nothing paid or being charged,
 * are deleted with their (unpaid) payment schedules. A logged-in client's
 * own open enrollment is never deleted.
 *
 * Schedule: 30 3 * * * (daily, 03:30)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { runCron } from '@/lib/cron/withCronLogging';
import { deleteEnrollmentsWithCharges } from '@/lib/payments/deleteEnrollments';
import { enrollmentsWithMoney, OPEN_STATUSES } from '@/lib/payments/openEnrollment';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AGE_DAYS = 7;
const BATCH = 200;

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[CRON - Guest cleanup] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCron('cleanup-guest-enrollments', async ({ dryRun }) => {
    const db = createAdminClient();
    const now = new Date();
    const cutoff = new Date(now.getTime() - AGE_DAYS * 24 * 60 * 60 * 1000);

    const { data, error } = await db
      .from('enrollments')
      .select('id, token_expires_at')
      .is('user_id', null)
      .eq('enrollment_type', 'self_enrolled')
      .in('status', OPEN_STATUSES as unknown as string[])
      .lt('created_at', cutoff.toISOString())
      .order('created_at', { ascending: true })
      .limit(BATCH);
    if (error) throw new Error(`Could not read guest enrollments: ${error.message}`);

    // Only when the link no longer works, so nobody is cut off mid-signup.
    const stale = (data ?? []).filter((e: any) => !e.token_expires_at || new Date(e.token_expires_at) < now).map((e: any) => e.id as string);
    const paid = await enrollmentsWithMoney(db, stale);
    const toDelete = stale.filter((id) => !paid.has(id));

    if (dryRun || !toDelete.length) {
      return { ok: true, dry_run: dryRun, found: data?.length ?? 0, stale: stale.length, kept_paid: paid.size, deleted: 0, would_delete: toDelete.length };
    }

    const result = await deleteEnrollmentsWithCharges(db, toDelete);
    if (result.error) throw new Error(`Could not delete guest enrollments: ${result.error}`);
    console.log(`[CRON - Guest cleanup] Deleted ${result.deleted} abandoned guest enrollments`);
    return { ok: true, found: data?.length ?? 0, stale: stale.length, kept_paid: paid.size, deleted: result.deleted };
  });
}
