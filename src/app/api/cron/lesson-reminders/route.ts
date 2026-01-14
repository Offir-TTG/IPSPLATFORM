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
        program_id,
        start_time,
        end_time,
        zoom_meeting_id,
        tenant_id,
        courses (
          id,
          title
        ),
        programs (
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

        // Get all active students enrolled in this course/program
        const enrollmentQuery = supabase
          .from('enrollments')
          .select(`
            id,
            user_id,
            course_id,
            program_id,
            tenant_id,
            users (
              id,
              email,
              first_name,
              last_name,
              preferred_language
            )
          `)
          .eq('tenant_id', lesson.tenant_id)
          .eq('status', 'active');

        if (lesson.course_id) {
          enrollmentQuery.eq('course_id', lesson.course_id);
        } else if (lesson.program_id) {
          enrollmentQuery.eq('program_id', lesson.program_id);
        }

        const { data: enrollments, error: enrollError } = await enrollmentQuery;

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
              lessonEndTime: lesson.end_time,
              courseId: lesson.course_id,
              programId: lesson.program_id,
              courseName: (lesson.courses as any)?.title || '',
              programName: (lesson.programs as any)?.title || '',
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

        // Process all events in batch for this lesson
        const result = await processBatchTriggerEvents(triggerEvents) as any;

        console.log(`[Cron] Lesson ${lesson.id}: Processed ${result.processed} events, queued ${result.queued} emails`);

        totalProcessed += result.processed;
        totalEmailsQueued += result.queued;

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
