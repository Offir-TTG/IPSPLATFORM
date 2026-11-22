/**
 * Cron Job: Retry Failed Payments
 *
 * Runs every 6 hours to retry failed payments that are due for retry.
 * Checks for failed payments with next_retry_date <= now and retry_count < 3.
 *
 * Schedule: Every 6 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createScheduledInvoice } from '@/lib/payments/invoiceService';
import { PAYMENT_CONFIG } from '@/lib/payments/config';
import { runCron } from '@/lib/cron/withCronLogging';
import { runInBatches } from '@/lib/payments/batch';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[CRON - Payment Retry] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCron('retry-failed-payments', async ({ dryRun }) => {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    console.log('[CRON - Payment Retry] Checking for payments to retry...', { dryRun });

    // Find schedules ready for retry
    const { data: retrySchedules, error: queryError } = await supabase
      .from('payment_schedules')
      .select('id, tenant_id, retry_count, scheduled_date')
      .eq('status', 'failed')
      .not('next_retry_date', 'is', null)
      .lte('next_retry_date', now)
      .lt('retry_count', PAYMENT_CONFIG.maxRetries)
      .order('next_retry_date', { ascending: true })
      .limit(300);

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!retrySchedules || retrySchedules.length === 0) {
      console.log('[CRON - Payment Retry] No payments to retry');
      return {
        success: true,
        retried: 0,
        failed: 0,
        message: 'No payments to retry',
      };
    }

    console.log(`[CRON - Payment Retry] Found ${retrySchedules.length} payments to retry`);

    if (dryRun) {
      return {
        success: true,
        dry_run: true,
        would_retry: retrySchedules.length,
        message: `Dry-run enabled; would retry ${retrySchedules.length} schedules`,
      };
    }

    let retried = 0;
    const errors: string[] = [];

    // A few at a time, stopping before the time limit; the rest wait for
    // the next run. The charger pays the open invoice again, never a new one.
    const batch = await runInBatches(retrySchedules, (schedule) =>
      createScheduledInvoice(schedule.id, schedule.tenant_id).then((result) => ({ id: schedule.id, result })),
    );
    for (const { id, result } of batch.results) {
      if (result.error) {
        errors.push(`Schedule ${id}: ${result.error}`);
      } else {
        retried++;
      }
    }

    console.log('[CRON - Payment Retry] Complete:', {
      retried,
      failed: errors.length,
      remaining: batch.remaining,
    });

    return {
      success: true,
      retried,
      failed: errors.length,
      remaining: batch.remaining,
      errors,
      message: `Retried ${retried} payments, ${errors.length} failed`,
    };
  });
}
