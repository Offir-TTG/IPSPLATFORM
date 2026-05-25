/**
 * Cron Job: Create Payment Invoices
 *
 * Runs daily at 3 AM to create Stripe invoices for upcoming scheduled payments.
 * Creates invoices for all payments due within the next 30 days.
 *
 * Schedule: 0 3 * * * (Daily at 3:00 AM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createUpcomingInvoices } from '@/lib/payments/invoiceService';
import { PAYMENT_CONFIG } from '@/lib/payments/config';
import { runCron } from '@/lib/cron/withCronLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[CRON - Invoice Creation] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCron('create-payment-invoices', async ({ dryRun }) => {
    console.log('[CRON - Invoice Creation] Starting invoice generation...', { dryRun });

    if (dryRun) {
      // No safe read-only probe for upcoming invoices (creating a Stripe
      // invoice is itself the side-effect). Skip entirely and log.
      return {
        success: true,
        dry_run: true,
        created: 0,
        failed: 0,
        message: 'CRON_DRY_RUN enabled; skipped invoice creation',
      };
    }

    // Create invoices for payments due in next 30 days
    const results = await createUpcomingInvoices(PAYMENT_CONFIG.invoiceCreationWindow);

    console.log('[CRON - Invoice Creation] Complete:', {
      created: results.created,
      failed: results.failed,
      totalErrors: results.errors.length,
    });

    return {
      success: true,
      created: results.created,
      failed: results.failed,
      errors: results.errors,
      message: `Created ${results.created} invoices, ${results.failed} failed`,
    };
  });
}
