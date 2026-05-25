/**
 * POST /api/admin/payments/record-standalone
 *
 * Record a one-off manual payment not tied to any payment_schedules row.
 * See `recordStandalonePayment` in src/lib/payments/enrollmentService.ts
 * for the reconciliation logic (enrollment paid_amount + payment_status
 * are bumped only when an enrollment_id is supplied).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordStandalonePayment } from '@/lib/payments/enrollmentService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single();
    if (!userData || !['admin', 'super_admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      user_id,
      enrollment_id,
      amount,
      currency,
      payment_method,
      transaction_reference,
      notes,
      payment_date,
    } = body as {
      user_id?: string;
      enrollment_id?: string | null;
      amount?: number;
      currency?: string;
      payment_method?: string;
      transaction_reference?: string;
      notes?: string;
      payment_date?: string;
    };

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    if (typeof amount !== 'number' || !(amount > 0)) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 },
      );
    }
    if (!payment_method) {
      return NextResponse.json(
        { error: 'payment_method is required' },
        { status: 400 },
      );
    }

    const result = await recordStandalonePayment(userData.tenant_id, user.id, {
      user_id,
      enrollment_id: enrollment_id ?? null,
      amount,
      currency,
      payment_method,
      transaction_reference,
      notes,
      payment_date,
    });

    return NextResponse.json({
      success: true,
      message: 'Standalone payment recorded successfully',
      payment_id: result.payment_id,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/record-standalone:', error);
    // Validation errors thrown by the service are user-facing — return
    // them with 400 instead of 500 so the UI can surface a clean toast.
    const msg = error?.message ?? 'Internal server error';
    const validationLike =
      msg.includes('required') ||
      msg.includes('different tenant') ||
      msg.includes('not found') ||
      msg.includes('does not belong') ||
      msg.includes('must be');
    return NextResponse.json(
      { error: msg },
      { status: validationLike ? 400 : 500 },
    );
  }
}
