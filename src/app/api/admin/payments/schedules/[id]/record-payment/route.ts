import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordManualPayment } from '@/lib/payments/enrollmentService';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

// POST /api/admin/payments/schedules/:id/record-payment - Record a manual payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
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

    const body = await request.json();
    const { payment_method, transaction_reference, notes } = body;

    if (!payment_method) {
      return NextResponse.json(
        { error: 'payment_method is required' },
        { status: 400 }
      );
    }

    // Get schedule details for logging
    const { data: schedule } = await supabase
      .from('payment_schedules')
      .select('id, amount, enrollment_id')
      .eq('id', params.id)
      .eq('tenant_id', userData.tenant_id)
      .single();

    if (!schedule) {
      return NextResponse.json({ error: 'Payment schedule not found' }, { status: 404 });
    }

    // Record payment
    await recordManualPayment(
      params.id,
      userData.tenant_id,
      user.id,
      payment_method,
      transaction_reference,
      notes
    );

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'payment.manual_recorded',
      details: {
        scheduleId: params.id,
        enrollmentId: schedule.enrollment_id,
        amount: schedule.amount,
        paymentMethod: payment_method,
        transactionReference: transaction_reference,
        notes,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      amount: schedule.amount,
    });

  } catch (error: any) {
    console.error('Error in POST /api/admin/payments/schedules/:id/record-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
