/**
 * Cron Job: Automatic reminders
 * Finds new cases for every reminder that is on and sends the steps that
 * are due, through the client-settings check (src/lib/messaging).
 *
 * Schedule: every 5 minutes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runCron } from '@/lib/cron/withCronLogging';
import { runReminders } from '@/lib/messaging/engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runCron('run-reminders', async ({ dryRun }) => {
    const summary = await runReminders({ dryRun });
    return { success: summary.errors.length === 0, dry_run: dryRun, ...summary };
  });
}
