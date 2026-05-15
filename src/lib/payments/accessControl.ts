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

  // Enrollments link to products, not courses. Find an enrollment whose
  // product points at this course (standalone) OR whose product points at a
  // program that contains this course.
  //
  // NOTE: payment_schedules is fetched as a separate query — PostgREST
  // doesn't have a discoverable FK relationship between enrollments and
  // payment_schedules in its schema cache, so embedding here returns
  // "Could not find a relationship" and zero rows.
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      payment_status,
      products!inner (
        id,
        type,
        course_id,
        program_id
      )
    `)
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .in('status', ['active', 'completed', 'pending']);

  if (error || !enrollments || enrollments.length === 0) {
    return { hasAccess: false, reason: 'course_not_found' };
  }

  // Look for a matching enrollment: direct course product, then program path.
  let enrollment: typeof enrollments[number] | null = null;
  for (const enr of enrollments) {
    const product: any = Array.isArray(enr.products) ? enr.products[0] : enr.products;
    if (!product) continue;
    if (product.type === 'course' && product.course_id === courseId) {
      enrollment = enr;
      break;
    }
  }

  if (!enrollment) {
    // Fall back to program path.
    const programEnrollments = enrollments.filter((enr) => {
      const product: any = Array.isArray(enr.products) ? enr.products[0] : enr.products;
      return product?.type === 'program' && product.program_id;
    });

    if (programEnrollments.length > 0) {
      const programIds = programEnrollments.map((enr) => {
        const product: any = Array.isArray(enr.products) ? enr.products[0] : enr.products;
        return product.program_id;
      });

      const { data: programMatch } = await supabase
        .from('program_courses')
        .select('program_id')
        .eq('course_id', courseId)
        .in('program_id', programIds)
        .maybeSingle();

      if (programMatch) {
        enrollment = programEnrollments.find((enr) => {
          const product: any = Array.isArray(enr.products) ? enr.products[0] : enr.products;
          return product.program_id === programMatch.program_id;
        }) ?? null;
      }
    }
  }

  if (!enrollment) {
    return { hasAccess: false, reason: 'course_not_found' };
  }

  // Check enrollment status (defensive — query already filtered, but the
  // grace-period logic below relies on 'active'/'completed' semantics).
  if (!['active', 'completed'].includes(enrollment.status)) {
    return { hasAccess: false, reason: 'enrollment_inactive' };
  }

  // Fetch payment schedules separately — see note above re: missing
  // PostgREST relationship between enrollments and payment_schedules.
  const { data: paymentSchedules } = await supabase
    .from('payment_schedules')
    .select('id, status, scheduled_date, original_due_date, amount')
    .eq('enrollment_id', enrollment.id);

  // Check payment status with grace period
  const now = new Date();
  const GRACE_PERIOD_DAYS = PAYMENT_CONFIG.gracePeriodDays;

  // Find overdue schedules (past grace period). For free courses paymentSchedules
  // is an empty array, so this correctly yields hasAccess: true.
  const overdueSchedules = (paymentSchedules ?? []).filter((schedule: any) => {
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
