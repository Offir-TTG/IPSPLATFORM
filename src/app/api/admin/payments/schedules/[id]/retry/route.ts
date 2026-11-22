/**
 * Admin Retry Payment API
 *
 * Allows admin to manually retry a failed payment for a schedule.
 * Creates a new Stripe invoice and attempts to charge it immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createScheduledInvoice } from '@/lib/payments/invoiceService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: scheduleId } = await params;

    // Verify admin authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify schedule exists and belongs to tenant
    const { data: schedule, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('id, status, amount, currency, retry_count')
      .eq('id', scheduleId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Only payments still owed can be retried.
    if (['paid', 'cancelled', 'refunded', 'paused'].includes(schedule.status)) {
      return NextResponse.json(
        { error: `This payment is ${schedule.status} and can't be charged` },
        { status: 400 }
      );
    }

    // The charger refuses payments that can't be charged and guards against a
    // double charge; the webhook records a decline and its retry count.
    // Nothing is written here, so a refused retry can't turn a cancelled
    // payment back into "failed".
    const result = await createScheduledInvoice(scheduleId, userData.tenant_id, true);

    if (result.error) {
      console.error(`[Admin Retry] Error:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      invoice_id: result.invoice_id,
      retry_count: schedule.retry_count || 0,
      message: 'Payment retry initiated successfully.',
    });

  } catch (error) {
    console.error('[Admin Retry] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
