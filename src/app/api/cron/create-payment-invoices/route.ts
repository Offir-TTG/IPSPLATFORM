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

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[CRON - Invoice Creation] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON - Invoice Creation] Starting invoice generation...');

    // Create invoices for payments due in next 30 days
    const results = await createUpcomingInvoices(PAYMENT_CONFIG.invoiceCreationWindow);

    console.log('[CRON - Invoice Creation] Complete:', {
      created: results.created,
      failed: results.failed,
      totalErrors: results.errors.length,
    });

    return NextResponse.json({
      success: true,
      created: results.created,
      failed: results.failed,
      errors: results.errors,
      message: `Created ${results.created} invoices, ${results.failed} failed`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON - Invoice Creation] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
