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
import { runCron } from '@/lib/cron/withCronLogging';
import { fetchAllPages, loadEnrollmentsById } from '@/lib/payments/batch';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error('[CRON - Overdue Check] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCron('check-overdue-payments', async ({ dryRun }) => {
    console.log('[CRON - Overdue Check] Starting overdue payment check...', { dryRun });

    const supabase = createAdminClient();
    const GRACE_PERIOD_DAYS = PAYMENT_CONFIG.gracePeriodDays;

    // Calculate grace period cutoff date
    const gracePeriodDate = new Date();
    gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

    console.log(`[CRON - Overdue Check] Grace period cutoff: ${gracePeriodDate.toISOString()}`);

    // Find schedules with payments overdue beyond grace period
    // Check both original_due_date and scheduled_date for compatibility
    // The current due date decides: when an admin moves a date to give the
    // client more time, the original date no longer counts (it used to, so
    // the client was suspended anyway). Read page by page: a plain query
    // stops at 1,000 rows. Only enrollments still collecting matter.
    const { data: overdueRows, error: scheduleError } = await fetchAllPages<any>((from, to) =>
      supabase
        .from('payment_schedules')
        .select('enrollment_id, tenant_id, scheduled_date, amount')
        .in('status', ['pending', 'failed', 'overdue', 'adjusted', 'processing'])
        .lt('scheduled_date', gracePeriodDate.toISOString())
        .order('enrollment_id', { ascending: true })
        .range(from, to),
    );

    if (scheduleError) {
      throw new Error(`Query failed: ${scheduleError}`);
    }

    // Active enrollments only (read separately; no join is possible).
    const { data: enrollmentsById, error: enrollmentError } = await loadEnrollmentsById<{ id: string; status: string }>(
      supabase,
      overdueRows.map((r) => r.enrollment_id),
      'id, status',
    );
    if (enrollmentError) {
      throw new Error(`Query failed: ${enrollmentError}`);
    }
    const overdueSchedules = overdueRows.filter((r) => enrollmentsById.get(r.enrollment_id)?.status === 'active');

    if (!overdueSchedules || overdueSchedules.length === 0) {
      console.log('[CRON - Overdue Check] No overdue payments found');
      return {
        success: true,
        suspended: 0,
        message: 'No overdue payments',
      };
    }

    console.log(`[CRON - Overdue Check] Found ${overdueSchedules.length} overdue schedules`);

    // Get unique enrollment IDs
    const enrollmentIds = [...new Set(overdueSchedules.map(s => s.enrollment_id))];

    console.log(`[CRON - Overdue Check] Suspending ${enrollmentIds.length} enrollments`);

    if (dryRun) {
      return {
        success: true,
        dry_run: true,
        would_suspend: enrollmentIds.length,
        total_overdue: overdueSchedules.length,
        message: `Dry-run enabled; would suspend ${enrollmentIds.length} enrollments`,
      };
    }

    // Suspend in chunks: thousands of ids in one request is too long a URL.
    const suspendedEnrollments: { id: string; user_id: string; tenant_id: string }[] = [];
    for (let i = 0; i < enrollmentIds.length; i += 200) {
      const { data, error: suspendError } = await supabase
        .from('enrollments')
        .update({
          status: 'suspended',
          payment_status: 'overdue', // marks a payment suspension (no reason column exists)
          updated_at: new Date().toISOString(),
        })
        .in('id', enrollmentIds.slice(i, i + 200))
        // Only active ones: a cancelled or completed enrollment must never be
        // turned into "suspended".
        .eq('status', 'active')
        .select('id, user_id, tenant_id');
      if (suspendError) {
        throw new Error(`Suspension failed: ${suspendError.message}`);
      }
      suspendedEnrollments.push(...(data ?? []));
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

      // The automatic reminder "Enrollment suspended", when it's on.
      const { fireEvent } = await import('@/lib/messaging/engine');
      const byTenant = new Map<string, typeof suspendedEnrollments>();
      for (const e of suspendedEnrollments) byTenant.set(e.tenant_id, [...(byTenant.get(e.tenant_id) ?? []), e]);
      for (const [tenantId, list] of byTenant) {
        const { data: rows } = await supabase
          .from('enrollments')
          .select('id, product_id, product:products!enrollments_product_id_fkey(title)')
          .in('id', list.map((e) => e.id));
        const info = new Map((rows ?? []).map((r: any) => [r.id, r]));
        await fireEvent(
          tenantId,
          'enrollment.suspended',
          list
            .filter((e) => e.user_id)
            .map((e) => {
              const r: any = info.get(e.id);
              const product = Array.isArray(r?.product) ? r.product[0] : r?.product;
              return { subjectType: 'enrollment', subjectId: e.id, userId: e.user_id, productId: r?.product_id ?? null, context: { product: product?.title ?? '', enrollmentId: e.id } };
            }),
        );
      }
    }

    return {
      success: true,
      suspended: suspendedCount,
      total_overdue: overdueSchedules.length,
      message: `Suspended ${suspendedCount} enrollments with overdue payments`,
    };
  });
}
