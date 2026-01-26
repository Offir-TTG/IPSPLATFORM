import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PAYMENT_CONFIG } from './config';

export interface AccessCheckResult {
  hasAccess: boolean;
  reason?: 'payment_overdue' | 'enrollment_inactive' | 'course_not_found';
  gracePeriodEnd?: string;
  overdueAmount?: number;
  overdueDays?: number;
}

/**
 * Checks if user has access to course based on payment status
 *
 * Access is denied if:
 * - No active enrollment found
 * - Enrollment status is not active/completed
 * - Payment is overdue beyond grace period (7 days)
 *
 * @param userId - User ID to check access for
 * @param courseId - Course ID to check access to
 * @param tenantId - Tenant ID for database isolation
 * @returns AccessCheckResult with access status and details
 */
export async function checkCourseAccess(
  userId: string,
  courseId: string,
  tenantId: string
): Promise<AccessCheckResult> {
  const supabase = await createClient();

  // Get enrollment with payment schedules
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      payment_status,
      payment_schedules (
        id,
        status,
        scheduled_date,
        original_due_date,
        amount
      )
    `)
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !enrollment) {
    return { hasAccess: false, reason: 'course_not_found' };
  }

  // Check enrollment status
  if (!['active', 'completed'].includes(enrollment.status)) {
    return { hasAccess: false, reason: 'enrollment_inactive' };
  }

  // Check payment status with grace period
  const now = new Date();
  const GRACE_PERIOD_DAYS = PAYMENT_CONFIG.gracePeriodDays;

  // Find overdue schedules (past grace period)
  const overdueSchedules = (enrollment.payment_schedules as any[]).filter((schedule) => {
    if (schedule.status === 'paid') return false;

    const dueDate = new Date(schedule.original_due_date || schedule.scheduled_date);
    const gracePeriodEnd = new Date(dueDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    return now > gracePeriodEnd;
  });

  if (overdueSchedules.length > 0) {
    const overdueAmount = overdueSchedules.reduce((sum: number, s: any) => sum + parseFloat(s.amount.toString()), 0);
    const oldestOverdue = overdueSchedules[0];
    const dueDate = new Date(oldestOverdue.original_due_date || oldestOverdue.scheduled_date);
    const overdueDays = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      hasAccess: false,
      reason: 'payment_overdue',
      overdueAmount,
      overdueDays,
      gracePeriodEnd: new Date(
        dueDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      ).toISOString(),
    };
  }

  return { hasAccess: true };
}

/**
 * Middleware-style check that returns 402 Payment Required response if access denied
 *
 * Use this in API routes to block access to course content when payment is overdue.
 * Returns null if access is granted, or a NextResponse with error details if denied.
 *
 * @param userId - User ID to check access for
 * @param courseId - Course ID to check access to
 * @param tenantId - Tenant ID for database isolation
 * @returns Response object if access denied, null if access granted
 *
 * @example
 * ```typescript
 * const accessDenied = await requireCourseAccess(user.id, courseId, tenantId);
 * if (accessDenied) return accessDenied;
 *
 * // Continue with course content...
 * ```
 */
export async function requireCourseAccess(
  userId: string,
  courseId: string,
  tenantId: string
): Promise<Response | null> {
  const accessCheck = await checkCourseAccess(userId, courseId, tenantId);

  if (!accessCheck.hasAccess) {
    if (accessCheck.reason === 'payment_overdue') {
      return NextResponse.json(
        {
          error: 'Payment required',
          message: `Your payment is ${accessCheck.overdueDays} days overdue. Please complete payment to continue.`,
          overdueAmount: accessCheck.overdueAmount,
          overdueDays: accessCheck.overdueDays,
          paymentUrl: `/payments`,
        },
        { status: 402 } // 402 Payment Required
      );
    }

    return NextResponse.json(
      { error: 'Access denied', reason: accessCheck.reason },
      { status: 403 }
    );
  }

  return null; // Access granted
}
