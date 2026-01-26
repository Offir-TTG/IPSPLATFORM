/**
 * Admin Charge Now API
 *
 * Allows admin to manually trigger immediate payment for a schedule.
 * Creates a Stripe invoice and attempts to charge it immediately,
 * regardless of the scheduled_date.
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
      .select('id, status, amount, currency')
      .eq('id', scheduleId)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Check if already paid
    if (schedule.status === 'paid') {
      return NextResponse.json(
        { error: 'Payment schedule is already paid' },
        { status: 400 }
      );
    }

    console.log(`[Admin Charge Now] Creating invoice for schedule ${scheduleId}`);

    // Create invoice and charge immediately (chargeNow = true)
    const result = await createScheduledInvoice(scheduleId, userData.tenant_id, true);

    if (result.error) {
      console.error(`[Admin Charge Now] Error:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    console.log(`[Admin Charge Now] Invoice ${result.invoice_id} created and charged successfully`);

    return NextResponse.json({
      success: true,
      invoice_id: result.invoice_id,
      message: 'Payment initiated successfully. The invoice will be charged automatically.',
    });

  } catch (error) {
    console.error('[Admin Charge Now] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
