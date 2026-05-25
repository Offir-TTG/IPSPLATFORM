/**
 * Cron — Drain person-identity outbox.
 *
 * Polls public.outbox_events for pending events and POSTs each one to
 * IParentingSchool's inbound endpoint. Idempotent on the receiver via
 * event_id. See lib/persons/outbox-drainer.ts for the worker.
 *
 * Schedule: 1-minute cadence on Vercel cron.
 *
 *   GET /api/cron/drain-outbox
 *   Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server';
import { drainOutbox } from '@/lib/persons/outbox-drainer';
import { runCron } from '@/lib/cron/withCronLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return runCron('drain-outbox', async ({ dryRun }) => {
    if (dryRun) {
      // Read-only probe: just count what *would* have been picked. The
      // drainer itself doesn't expose a dry-run knob, so we skip
      // entirely and let ops verify via the cron_runs row that the
      // wrapper is firing.
      return { ok: true, dry_run: true, picked: 0, delivered: 0 };
    }
    const result = await drainOutbox();
    return { ok: true, ...result };
  });
}
