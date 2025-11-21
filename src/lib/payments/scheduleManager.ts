/**
 * Schedule Manager
 * Manages payment schedules with admin controls for adjustments
 */

import { createClient } from '@/lib/supabase/server';
import type { PaymentSchedule, AdjustmentRecord } from '@/types/payments';

/**
 * Adjust a payment schedule date
 */
export async function adjustScheduleDate(
  scheduleId: string,
  tenantId: string,
  newDate: Date,
  adminId: string,
  adminName: string,
  reason: string
): Promise<PaymentSchedule> {
  const supabase = await createClient();

  // Get current schedule
  const { data: schedule, error: fetchError } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .single();

  if (fetchError || !schedule) {
    throw new Error('Payment schedule not found');
  }

  // Can't adjust paid or cancelled schedules
  if (['paid', 'cancelled', 'refunded'].includes(schedule.status)) {
    throw new Error(`Cannot adjust schedule with status: ${schedule.status}`);
  }

  // Create adjustment record
  const adjustmentRecord: AdjustmentRecord = {
    timestamp: new Date().toISOString(),
    admin_id: adminId,
    admin_name: adminName,
    action: 'adjust_date',
    old_date: schedule.scheduled_date,
    new_date: newDate.toISOString(),
    reason,
  };

  // Update schedule
  const { data, error } = await supabase
    .from('payment_schedules')
    .update({
      scheduled_date: newDate.toISOString(),
      status: 'adjusted',
      adjusted_by: adminId,
      adjustment_reason: reason,
      adjustment_history: [...schedule.adjustment_history, adjustmentRecord],
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error adjusting schedule:', error);
    throw new Error(`Failed to adjust schedule: ${error.message}`);
  }

  console.log(`[ScheduleManager] Adjusted schedule ${scheduleId}: ${schedule.scheduled_date} → ${newDate.toISOString()}`);

  return data;
}

/**
 * Pause all future payments for an enrollment
 */
export async function pauseEnrollmentPayments(
  enrollmentId: string,
  tenantId: string,
  adminId: string,
  adminName: string,
  reason: string
): Promise<{ pausedCount: number; schedules: PaymentSchedule[] }> {
  const supabase = await createClient();

  // Get all pending schedules for this enrollment
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'adjusted']);

  if (!schedules || schedules.length === 0) {
    return { pausedCount: 0, schedules: [] };
  }

  const now = new Date().toISOString();

  // Create adjustment record for pause
  const adjustmentRecord: AdjustmentRecord = {
    timestamp: now,
    admin_id: adminId,
    admin_name: adminName,
    action: 'pause',
    reason,
  };

  // Update all schedules to paused
  const { data: updatedSchedules, error } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paused',
      paused_at: now,
      paused_by: adminId,
      paused_reason: reason,
      adjustment_history: supabase.raw(`adjustment_history || ?::jsonb`, [JSON.stringify(adjustmentRecord)]),
      updated_at: now,
    })
    .eq('enrollment_id', enrollmentId)
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'adjusted'])
    .select();

  if (error) {
    console.error('Error pausing schedules:', error);
    throw new Error(`Failed to pause schedules: ${error.message}`);
  }

  console.log(`[ScheduleManager] Paused ${updatedSchedules?.length || 0} schedules for enrollment ${enrollmentId}`);

  return {
    pausedCount: updatedSchedules?.length || 0,
    schedules: updatedSchedules || [],
  };
}

/**
 * Resume paused payments
 */
export async function resumeEnrollmentPayments(
  enrollmentId: string,
  tenantId: string,
  adminId: string,
  adminName: string,
  newStartDate?: Date
): Promise<{ resumedCount: number; schedules: PaymentSchedule[] }> {
  const supabase = await createClient();

  // Get all paused schedules
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('tenant_id', tenantId)
    .eq('status', 'paused')
    .order('payment_number', { ascending: true });

  if (!schedules || schedules.length === 0) {
    return { resumedCount: 0, schedules: [] };
  }

  const now = new Date().toISOString();

  // Create adjustment record
  const adjustmentRecord: AdjustmentRecord = {
    timestamp: now,
    admin_id: adminId,
    admin_name: adminName,
    action: 'resume',
    reason: 'Payments resumed',
  };

  // If new start date provided, reschedule all payments
  if (newStartDate) {
    // Calculate new dates based on original frequency
    const updates = schedules.map((schedule, index) => {
      const daysSinceFirst = index * 30; // Approximate 30 days between payments
      const newDate = new Date(newStartDate);
      newDate.setDate(newDate.getDate() + daysSinceFirst);

      return {
        id: schedule.id,
        scheduled_date: newDate.toISOString(),
      };
    });

    // Update each schedule
    for (const update of updates) {
      await supabase
        .from('payment_schedules')
        .update({
          status: 'pending',
          scheduled_date: update.scheduled_date,
          resumed_at: now,
          resumed_by: adminId,
          adjustment_history: supabase.raw(`adjustment_history || ?::jsonb`, [JSON.stringify(adjustmentRecord)]),
          updated_at: now,
        })
        .eq('id', update.id)
        .eq('tenant_id', tenantId);
    }
  } else {
    // Just resume with existing dates
    await supabase
      .from('payment_schedules')
      .update({
        status: 'pending',
        resumed_at: now,
        resumed_by: adminId,
        adjustment_history: supabase.raw(`adjustment_history || ?::jsonb`, [JSON.stringify(adjustmentRecord)]),
        updated_at: now,
      })
      .eq('enrollment_id', enrollmentId)
      .eq('tenant_id', tenantId)
      .eq('status', 'paused');
  }

  // Fetch updated schedules
  const { data: updatedSchedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('tenant_id', tenantId)
    .in('id', schedules.map(s => s.id));

  console.log(`[ScheduleManager] Resumed ${schedules.length} schedules for enrollment ${enrollmentId}`);

  return {
    resumedCount: schedules.length,
    schedules: updatedSchedules || [],
  };
}

/**
 * Get payment schedules for an enrollment
 */
export async function getEnrollmentSchedules(
  enrollmentId: string,
  tenantId: string
): Promise<PaymentSchedule[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .eq('tenant_id', tenantId)
    .order('payment_number', { ascending: true });

  if (error) {
    console.error('Error fetching schedules:', error);
    throw new Error(`Failed to fetch schedules: ${error.message}`);
  }

  return data || [];
}

/**
 * Get upcoming payments (due in next N days)
 */
export async function getUpcomingPayments(
  tenantId: string,
  daysAhead: number = 30
): Promise<PaymentSchedule[]> {
  const supabase = await createClient();

  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'pending')
    .gte('scheduled_date', now.toISOString())
    .lte('scheduled_date', futureDate.toISOString())
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming payments:', error);
    throw new Error(`Failed to fetch upcoming payments: ${error.message}`);
  }

  return data || [];
}

/**
 * Get overdue payments
 */
export async function getOverduePayments(
  tenantId: string
): Promise<PaymentSchedule[]> {
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('tenant_id', tenantId)
    .in('status', ['pending', 'adjusted'])
    .lt('scheduled_date', now)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching overdue payments:', error);
    throw new Error(`Failed to fetch overdue payments: ${error.message}`);
  }

  return data || [];
}

/**
 * Mark schedule as paid
 */
export async function markSchedulePaid(
  scheduleId: string,
  tenantId: string,
  paymentId: string,
  stripePaymentIntentId?: string
): Promise<PaymentSchedule> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      payment_id: paymentId,
      stripe_payment_intent_id: stripePaymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error marking schedule paid:', error);
    throw new Error(`Failed to mark schedule paid: ${error.message}`);
  }

  console.log(`[ScheduleManager] Marked schedule ${scheduleId} as paid`);

  return data;
}

/**
 * Mark schedule as failed
 */
export async function markScheduleFailed(
  scheduleId: string,
  tenantId: string,
  errorMessage: string
): Promise<PaymentSchedule> {
  const supabase = await createClient();

  // Get current schedule
  const { data: schedule } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .single();

  if (!schedule) {
    throw new Error('Payment schedule not found');
  }

  // Calculate next retry date (3 days from now)
  const nextRetry = new Date();
  nextRetry.setDate(nextRetry.getDate() + 3);

  const { data, error } = await supabase
    .from('payment_schedules')
    .update({
      status: 'failed',
      retry_count: schedule.retry_count + 1,
      next_retry_date: nextRetry.toISOString(),
      last_error: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error marking schedule failed:', error);
    throw new Error(`Failed to mark schedule failed: ${error.message}`);
  }

  console.log(`[ScheduleManager] Marked schedule ${scheduleId} as failed (retry #${schedule.retry_count + 1})`);

  return data;
}
