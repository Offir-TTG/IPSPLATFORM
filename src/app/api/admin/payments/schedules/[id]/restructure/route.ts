import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyTenantAdmin } from '@/lib/tenant/auth';
import { logAuditEvent } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/payments/schedules/[id]/restructure
 * Restructure payment plan - change number of installments
 *
 * This endpoint:
 * 1. Validates the enrollment and calculates remaining balance
 * 2. Cancels all pending/overdue/adjusted schedules
 * 3. Creates new schedules with recalculated amounts
 * 4. Updates the enrollment record
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify tenant admin
    const auth = await verifyTenantAdmin(request);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or insufficient permissions' },
        { status: 403 }
      );
    }

    const { user, tenant } = auth;
    const supabase = await createClient();
    const enrollmentId = params.id;

    // Get request body
    const body = await request.json();
    const { new_installment_count, start_date, reason } = body;

    if (!new_installment_count || new_installment_count < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid installment count' },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json(
        { success: false, error: 'Start date is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Get enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', enrollmentId)
      .eq('tenant_id', tenant.id)
      .single();

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { success: false, error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Get all payment schedules for this enrollment
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('payment_number', { ascending: true });

    if (schedulesError) {
      throw new Error(`Failed to fetch schedules: ${schedulesError.message}`);
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No payment schedules found for this enrollment' },
        { status: 404 }
      );
    }

    // Calculate totals
    const paidSchedules = schedules.filter(s => s.status === 'paid');
    const pendingSchedules = schedules.filter(s =>
      ['pending', 'overdue', 'adjusted'].includes(s.status)
    );

    const paidAmount = paidSchedules.reduce((sum, s) => sum + s.amount, 0);
    const totalAmount = schedules.reduce((sum, s) => sum + s.amount, 0);
    const remainingBalance = totalAmount - paidAmount;

    if (remainingBalance <= 0) {
      return NextResponse.json(
        { success: false, error: 'No remaining balance to restructure' },
        { status: 400 }
      );
    }

    // Calculate new installment amount
    const newInstallmentAmount = remainingBalance / new_installment_count;

    // Delete all pending schedules (we'll recreate them)
    const scheduleIdsToDelete = pendingSchedules.map(s => s.id);
    if (scheduleIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('payment_schedules')
        .delete()
        .in('id', scheduleIdsToDelete);

      if (deleteError) {
        throw new Error(`Failed to delete pending schedules: ${deleteError.message}`);
      }
    }

    // Create new payment schedules
    const startingPaymentNumber = paidSchedules.length + 1;
    const currency = schedules[0].currency || 'USD';
    const payment_plan_id = schedules[0].payment_plan_id;

    // Use the start_date provided by admin
    const baseDate = new Date(start_date);

    const newSchedules = [];
    for (let i = 0; i < new_installment_count; i++) {
      const scheduledDate = new Date(baseDate);
      scheduledDate.setMonth(scheduledDate.getMonth() + i);

      newSchedules.push({
        enrollment_id: enrollmentId,
        payment_plan_id,
        payment_number: startingPaymentNumber + i,
        payment_type: 'installment',
        amount: newInstallmentAmount,
        currency,
        original_due_date: scheduledDate.toISOString(),
        scheduled_date: scheduledDate.toISOString(),
        status: 'pending',
        tenant_id: tenant.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Insert new schedules
    const { data: createdSchedules, error: insertError } = await supabase
      .from('payment_schedules')
      .insert(newSchedules)
      .select();

    if (insertError) {
      throw new Error(`Failed to create new schedules: ${insertError.message}`);
    }

    // Log audit event
    await logAuditEvent({
      tenantId: tenant.id,
      userId: user.id,
      userEmail: user.email || 'unknown',
      action: 'payment_plan.restructured',
      details: {
        resourceType: 'enrollment',
        resourceId: enrollmentId,
        enrollmentId,
        userId: enrollment.user_id,
        reason,
        oldInstallmentCount: pendingSchedules.length,
        newInstallmentCount: new_installment_count,
        newInstallmentAmount,
        remainingBalance,
        deletedSchedules: scheduleIdsToDelete.length,
        createdSchedules: createdSchedules?.length || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment plan restructured successfully',
      data: {
        deleted_count: scheduleIdsToDelete.length,
        created_count: createdSchedules?.length || 0,
        new_installment_amount: newInstallmentAmount,
        new_total_installments: paidSchedules.length + new_installment_count,
      },
    });
  } catch (error: any) {
    console.error('Error restructuring payment plan:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to restructure payment plan' },
      { status: 500 }
    );
  }
}
