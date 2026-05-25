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

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
      .lt('retry_count', PAYMENT_CONFIG.maxRetries);

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
        message: `CRON_DRY_RUN enabled; would retry ${retrySchedules.length} schedules`,
      };
    }

    let retried = 0;
    const errors: string[] = [];

    // Process each schedule for retry
    for (const schedule of retrySchedules) {
      console.log(
        `[CRON - Payment Retry] Retrying schedule ${schedule.id} (attempt ${schedule.retry_count + 1}/${PAYMENT_CONFIG.maxRetries})`
      );

      // Create new invoice (old one failed)
      const result = await createScheduledInvoice(schedule.id, schedule.tenant_id);

      if (result.error) {
        errors.push(`Schedule ${schedule.id}: ${result.error}`);
        console.error(`[CRON - Payment Retry] Failed to retry ${schedule.id}:`, result.error);
      } else {
        retried++;
        console.log(`[CRON - Payment Retry] Successfully created retry invoice for ${schedule.id}`);
      }

      // Rate limit: Wait 20ms between requests
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    console.log('[CRON - Payment Retry] Complete:', {
      retried,
      failed: errors.length,
      totalSchedules: retrySchedules.length,
    });

    return {
      success: true,
      retried,
      failed: errors.length,
      errors,
      message: `Retried ${retried} payments, ${errors.length} failed`,
    };
  });
}
