import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { processBatchTriggerEvents } from '@/lib/email/triggerEngine';

/**
 * Cron job for lesson reminders
 *
 * Runs every 15 minutes via Vercel Cron
 * Checks for upcoming lessons and triggers reminder emails based on configured triggers
 *
 * Reminder Scenarios:
 * - 24 hours before lesson start
 * - 30 minutes before lesson start
 * - Custom delay_minutes configured in triggers
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/lesson-reminders",
 *     "schedule": "0/15 * * * *"
 *   }]
 * }
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds for cron job

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting lesson reminder job...');

    const supabase = createAdminClient();

    // Calculate time windows for reminders
    // Look ahead 25 hours to catch 24-hour reminders + buffer
    const now = new Date();
    const lookAheadTime = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours ahead

    // Get all upcoming lessons within the look-ahead window
    const { data: upcomingLessons, error: lessonsError } = await supabase
      .from('lessons')
      .select(`
        id,
        title,
        description,
        course_id,
        start_time,
        zoom_meeting_id,
        tenant_id,
        courses (
          id,
          title
        )
      `)
      .gte('start_time', now.toISOString())
      .lte('start_time', lookAheadTime.toISOString())
      .order('start_time', { ascending: true });

    if (lessonsError) {
      console.error('[Cron] Error fetching lessons:', lessonsError);
      return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
    }

    if (!upcomingLessons || upcomingLessons.length === 0) {
      console.log('[Cron] No upcoming lessons found');
      return NextResponse.json({
        success: true,
        message: 'No upcoming lessons',
        processed: 0
      });
    }

    console.log(`[Cron] Found ${upcomingLessons.length} upcoming lessons`);

    let totalProcessed = 0;
    let totalEmailsQueued = 0;

    // Process each lesson
    for (const lesson of upcomingLessons) {
      try {
        // Calculate time until lesson starts (in minutes)
        const startTime = new Date(lesson.start_time);
        const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));

        console.log(`[Cron] Processing lesson: ${lesson.title} (starts in ${minutesUntilStart} minutes)`);

        // Get all active students enrolled in this course
        // Step 1: Find products for this course
        const { data: products, error: productError } = await supabase
          .from('products')
          .select('id')
          .eq('course_id', lesson.course_id)
          .eq('tenant_id', lesson.tenant_id);

        if (productError || !products || products.length === 0) {
          console.log(`[Cron] No products found for course ${lesson.course_id}`);
          continue;
        }

        const productIds = products.map(p => p.id);

        // Step 2: Get enrollments for these products
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            id,
            user_id,
            product_id,
            tenant_id,
            users!enrollments_user_id_fkey (
              id,
              email,
              first_name,
              last_name,
              preferred_language
            )
          `)
          .in('product_id', productIds)
          .eq('tenant_id', lesson.tenant_id)
          .eq('status', 'active');

        if (enrollError) {
          console.error(`[Cron] Error fetching enrollments for lesson ${lesson.id}:`, enrollError);
          continue;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log(`[Cron] No active enrollments for lesson ${lesson.id}`);
          continue;
        }

        console.log(`[Cron] Found ${enrollments.length} enrolled students for lesson ${lesson.id}`);

        // Create trigger events for each student
        const triggerEvents = enrollments
          .filter(e => e.users) // Only process if user data exists
          .map(enrollment => ({
            eventType: 'lesson.reminder' as const,
            tenantId: lesson.tenant_id,
            eventData: {
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              lessonDescription: lesson.description,
              lessonStartTime: lesson.start_time,
              courseId: lesson.course_id,
              courseName: (lesson.courses as any)?.title || '',
              zoomMeetingId: lesson.zoom_meeting_id,
              minutesUntilStart: minutesUntilStart,
              enrollmentId: enrollment.id,
              userId: enrollment.user_id,
              email: (enrollment.users as any).email,
              userName: (enrollment.users as any).first_name,
              languageCode: (enrollment.users as any).preferred_language || 'en',
            },
            userId: enrollment.user_id,
            metadata: {
              cronJob: 'lesson-reminders',
              lessonStartTime: lesson.start_time,
              minutesUntilStart,
              processedAt: now.toISOString(),
            },
          }));

        console.log(`[Cron] Created ${triggerEvents.length} trigger events for lesson ${lesson.id}`);
        if (triggerEvents.length > 0) {
          console.log(`[Cron] Sample event data:`, JSON.stringify(triggerEvents[0], null, 2));
        }

        // Process all events in batch for this lesson
        const results = await processBatchTriggerEvents(triggerEvents);

        // Count successful events and queued emails
        const processed = results.filter(r => r.success && !r.skipped).length;
        const queued = results.filter(r => r.emailQueueId).length;

        console.log(`[Cron] Lesson ${lesson.id}: Processed ${processed} events, queued ${queued} emails`);
        if (results.length > 0 && results.length <= 3) {
          console.log(`[Cron] Result details:`, JSON.stringify(results, null, 2));
        }

        totalProcessed += processed;
        totalEmailsQueued += queued;

      } catch (lessonError) {
        console.error(`[Cron] Error processing lesson ${lesson.id}:`, lessonError);
        // Continue with next lesson
      }
    }

    const summary = {
      success: true,
      message: 'Lesson reminder job completed',
      lessonsFound: upcomingLessons.length,
      eventsProcessed: totalProcessed,
      emailsQueued: totalEmailsQueued,
      completedAt: new Date().toISOString(),
    };

    console.log('[Cron] Job summary:', summary);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('[Cron] Fatal error in lesson reminder job:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}
