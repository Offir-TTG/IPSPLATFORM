/**
 * Cron Job: Check Overdue Payments
 *
 * Runs daily at 2 AM to suspend enrollments with payments overdue beyond grace period.
 * Checks for schedules that are past the 7-day grace period and suspends enrollments.
 *
 * Schedule: 0 2 * * * (Daily at 2:00 AM)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { PAYMENT_CONFIG } from '@/lib/payments/config';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('[CRON - Overdue Check] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON - Overdue Check] Starting overdue payment check...');

    const supabase = createAdminClient();
    const GRACE_PERIOD_DAYS = PAYMENT_CONFIG.gracePeriodDays;

    // Calculate grace period cutoff date
    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

    console.log(`[CRON - Overdue Check] Grace period cutoff: ${gracePeriodDate.toISOString()}`);

    // Find schedules with payments overdue beyond grace period
    // Check both original_due_date and scheduled_date for compatibility
    const { data: overdueSchedules, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, tenant_id, scheduled_date, original_due_date, amount')
      .in('status', ['pending', 'failed'])
      .or(`original_due_date.lt.${gracePeriodDate.toISOString()},scheduled_date.lt.${gracePeriodDate.toISOString()}`);

    if (scheduleError) {
      console.error('[CRON - Overdue Check] Error querying schedules:', scheduleError);
      return NextResponse.json(
        { error: 'Query failed', details: scheduleError.message },
        { status: 500 }
      );
    }

    if (!overdueSchedules || overdueSchedules.length === 0) {
      console.log('[CRON - Overdue Check] No overdue payments found');
      return NextResponse.json({
        suspended: 0,
        message: 'No overdue payments',
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`[CRON - Overdue Check] Found ${overdueSchedules.length} overdue schedules`);

    // Get unique enrollment IDs
    const enrollmentIds = [...new Set(overdueSchedules.map(s => s.enrollment_id))];

    console.log(`[CRON - Overdue Check] Suspending ${enrollmentIds.length} enrollments`);

    // Suspend enrollments that are not already suspended
    const { data: suspendedEnrollments, error: suspendError } = await supabase
      .from('enrollments')
      .update({
        status: 'suspended',
        suspended_reason: 'payment_overdue',
        updated_at: new Date().toISOString(),
      })
      .in('id', enrollmentIds)
      .neq('status', 'suspended') // Only suspend if not already suspended
      .select('id, user_id, tenant_id');

    if (suspendError) {
      console.error('[CRON - Overdue Check] Failed to suspend enrollments:', suspendError);
      return NextResponse.json(
        { error: 'Suspension failed', details: suspendError.message },
        { status: 500 }
      );
    }

    const suspendedCount = suspendedEnrollments?.length || 0;

    console.log(`[CRON - Overdue Check] Successfully suspended ${suspendedCount} enrollments`);

    // Trigger suspension notification emails
    if (suspendedEnrollments && suspendedEnrollments.length > 0) {
      try {
        const { processTriggerEvent } = await import('@/lib/email/triggerEngine');

        for (const enrollment of suspendedEnrollments) {
          try {
            // Get enrollment details with product info
            const { data: fullEnrollment } = await supabase
              .from('enrollments')
              .select(`
                *,
                products (
                  id,
                  title,
                  type
                )
              `)
              .eq('id', enrollment.id)
              .single();

            if (fullEnrollment) {
              // Get user details
              const { data: userData } = await supabase
                .from('users')
                .select('email, first_name, last_name, preferred_language')
                .eq('id', enrollment.user_id)
                .single();

              if (userData) {
                await processTriggerEvent({
                  eventType: 'enrollment.suspended',
                  tenantId: enrollment.tenant_id,
                  eventData: {
                    enrollmentId: enrollment.id,
                    userId: enrollment.user_id,
                    productId: fullEnrollment.product_id,
                    productName: fullEnrollment.products?.title || '',
                    productType: fullEnrollment.products?.type || '',
                    suspendedReason: 'payment_overdue',
                    gracePeriodDays: GRACE_PERIOD_DAYS,
                    email: userData.email,
                    userName: userData.first_name,
                    languageCode: userData.preferred_language || 'en',
                  },
                  userId: enrollment.user_id,
                  metadata: {
                    automatedSuspension: true,
                  },
                });
              }
            }
          } catch (notificationError) {
            console.error(`[CRON - Overdue Check] Error sending notification for enrollment ${enrollment.id}:`, notificationError);
            // Continue with other notifications
          }
        }
      } catch (triggerError) {
        console.error('[CRON - Overdue Check] Error processing suspension notifications:', triggerError);
        // Don't fail cron if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      suspended: suspendedCount,
      total_overdue: overdueSchedules.length,
      message: `Suspended ${suspendedCount} enrollments with overdue payments`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CRON - Overdue Check] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
