/**
 * Cron Job: Daily summary
 * Clients who chose "one email a day" get the day's updates in one email at
 * the school's summary time (Automatic reminders → Sending settings).
 *
 * Schedule: every 15 minutes. Each run sends only what is due, so a missed
 * run is caught up by the next one and nothing is sent twice.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCron } from '@/lib/cron/withCronLogging';
import { sendDueSummaries } from '@/lib/messaging/dailySummary';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runCron('send-daily-summary', async ({ dryRun }) => {
    const r = await sendDueSummaries({ dryRun });
    return { success: true, dry_run: dryRun, ...r };
  });
}
