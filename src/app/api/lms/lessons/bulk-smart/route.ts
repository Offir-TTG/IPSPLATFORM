/**
 * Smart Bulk Lesson Creation API
 * Handles intelligent lesson series creation with proper Zoom integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { lessonService } from '@/lib/lms/lessonService.server';
import { ZoomService } from '@/lib/zoom/zoomService';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      course_id,
      module_id,
      series_name,
      lesson_dates, // Array of ISO date strings (optional if using calculated dates)
      // New fields for automatic date calculation
      start_date, // First lesson date (ISO string or date)
      start_time, // Time of day (e.g., "19:00")
      number_of_sessions, // How many lessons
      recurrence_pattern, // 'weekly' or 'daily'
      day_of_week, // 0-6 (Sunday=0) for weekly pattern
      // Original fields
      title_pattern,
      duration_minutes,
      timezone,
      starting_order,
      create_zoom_meetings,
      zoom_topic_pattern,
      zoom_agenda,
      zoom_recurring,
      recurrence_type,
      // Zoom Security Settings
      zoom_passcode,
      zoom_waiting_room,
      zoom_join_before_host,
      zoom_mute_upon_entry,
      zoom_require_authentication,
      // Zoom Video/Audio Settings
      zoom_host_video,
      zoom_participant_video,
      zoom_audio,
      // Zoom Recording Settings
      zoom_auto_recording,
      zoom_record_speaker_view,
      zoom_recording_disclaimer,
    } = body;

    // Calculate lesson dates if not provided
    let calculatedDates = lesson_dates;

    if (!calculatedDates || calculatedDates.length === 0) {
      // Use automatic date calculation
      if (!start_date || !start_time || !number_of_sessions || !recurrence_pattern) {
        return NextResponse.json(
          { success: false, error: 'Either lesson_dates or (start_date, start_time, number_of_sessions, recurrence_pattern) must be provided' },
          { status: 400 }
        );
      }

      calculatedDates = [];
      const tz = timezone || 'UTC';

      // Parse start date and time components
      const [year, month, day] = start_date.split('-').map(Number);
      const [hours, minutes] = start_time.split(':').map(Number);

      for (let i = 0; i < number_of_sessions; i++) {
        // Calculate which date this session falls on
        let sessionDate = new Date(year, month - 1, day);

        if (recurrence_pattern === 'weekly') {
          sessionDate.setDate(sessionDate.getDate() + (i * 7));
        } else if (recurrence_pattern === 'daily') {
          sessionDate.setDate(sessionDate.getDate() + i);
        }

        // Create ISO string in the format YYYY-MM-DDTHH:mm:ss
        // This represents the LOCAL time in the target timezone
        const localTimeString = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}-${String(sessionDate.getDate()).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

        // Create a date from this string (will be interpreted as local server time)
        const localDate = new Date(localTimeString);

        // Now we need to adjust for the timezone difference
        // Get how this date/time appears in the target timezone vs UTC
        const tzTime = new Date(localDate.toLocaleString('en-US', { timeZone: tz })).getTime();
        const utcTime = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' })).getTime();
        const offset = utcTime - tzTime;

        // Apply the offset to convert from "local time in target TZ" to UTC
        const utcDate = new Date(localDate.getTime() + offset);

        calculatedDates.push(utcDate.toISOString());
      }
    }

    // Validation
    if (!course_id || !module_id || !series_name || !calculatedDates || calculatedDates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (create_zoom_meetings && !zoom_topic_pattern) {
      return NextResponse.json(
        { success: false, error: 'Zoom topic pattern is required when creating Zoom meetings' },
        { status: 400 }
      );
    }

    // Fetch course name and tenant_id for Zoom topic pattern
    const supabase = createAdminClient();
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('title, tenant_id')
      .eq('id', course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const courseName = course.title || '';
    const tenantId = course.tenant_id;

    // Create all lessons
    const createdLessons = [];
    let order = starting_order;

    for (let i = 0; i < calculatedDates.length; i++) {
      const lessonNumber = i + 1;
      const startTime = calculatedDates[i];

      // Format date for this lesson
      let dateStr = '';
      let dateShortStr = '';
      let dateLongStr = '';
      let timeStr = '';
      if (startTime) {
        try {
          const startDate = new Date(startTime);
          const tz = timezone || 'UTC';

          // Full date: YYYY-MM-DD
          dateStr = startDate.toLocaleDateString('en-CA', { timeZone: tz }); // ISO format YYYY-MM-DD

          // Short date: DD/MM
          dateShortStr = startDate.toLocaleDateString('he-IL', {
            day: '2-digit',
            month: '2-digit',
            timeZone: tz
          });

          // Long date: Day name, DD Month YYYY
          dateLongStr = startDate.toLocaleDateString('he-IL', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: tz
          });

          // Time: HH:MM
          timeStr = startDate.toLocaleTimeString('he-IL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: tz
          });
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }

      // Generate lesson title from pattern with date tokens
      const lessonTitle = title_pattern
        .replace('{n}', lessonNumber.toString())
        .replace('{series_name}', series_name)
        .replace('{date}', dateStr)
        .replace('{date_short}', dateShortStr)
        .replace('{date_long}', dateLongStr)
        .replace('{time}', timeStr);

      // Create the lesson with all Zoom configuration
      const lessonResult = await lessonService.createLesson({
        course_id,
        module_id,
        title: lessonTitle,
        description: `${series_name} - ${lessonNumber}`,
        start_time: startTime,
        duration: duration_minutes,
        timezone: timezone || 'UTC',
        order,
        is_published: false, // Start as draft

        // Zoom Security Settings
        zoom_passcode: zoom_passcode || null,
        zoom_waiting_room: zoom_waiting_room ?? true,
        zoom_join_before_host: zoom_join_before_host ?? false,
        zoom_mute_upon_entry: zoom_mute_upon_entry ?? false,
        zoom_require_authentication: zoom_require_authentication ?? false,

        // Zoom Video/Audio Settings
        zoom_host_video: zoom_host_video ?? true,
        zoom_participant_video: zoom_participant_video ?? true,
        zoom_audio: zoom_audio || 'both',

        // Zoom Recording Settings
        zoom_auto_recording: zoom_auto_recording || 'none',
        zoom_record_speaker_view: zoom_record_speaker_view ?? false,
        zoom_recording_disclaimer: zoom_recording_disclaimer ?? false,
      });

      if (!lessonResult.success || !lessonResult.data) {
        console.error(`Failed to create lesson ${lessonNumber}:`, lessonResult.error);
        continue;
      }

      createdLessons.push(lessonResult.data);
      order++;
    }

    if (createdLessons.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create any lessons' },
        { status: 500 }
      );
    }

    // Create Zoom meetings if requested
    let zoomSuccessCount = 0;
    let zoomFailCount = 0;

    if (create_zoom_meetings) {
      const zoomService = new ZoomService(tenantId);

      // If recurring Zoom meeting, create one recurring meeting for all
      if (zoom_recurring && recurrence_type === 'weekly' && createdLessons.length > 1) {
        try {
          // For now, create individual meetings
          // TODO: Implement Zoom recurring meeting API
          for (let i = 0; i < createdLessons.length; i++) {
            const lesson = createdLessons[i];
            const lessonNumber = i + 1;

            // Format date for this lesson
            let dateStr = '';
            if (lesson.start_time) {
              try {
                const startDate = new Date(lesson.start_time);
                const dateOptions: Intl.DateTimeFormatOptions = {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: timezone || 'UTC'
                };
                dateStr = startDate.toLocaleString('he-IL', dateOptions);
              } catch (e) {
                console.error('Error formatting date:', e);
              }
            }

            const zoomTopic = zoom_topic_pattern
              .replace('{n}', lessonNumber.toString())
              .replace('{series_name}', series_name)
              .replace('{course_name}', courseName)
              .replace('{date}', dateStr);

            try {
              const zoomResult = await zoomService.createMeetingForLesson(
                lesson.id,
                {
                  topic: zoomTopic,
                  agenda: zoom_agenda || undefined,
                  start_time: lesson.start_time,
                  duration: duration_minutes,
                  timezone: timezone,
                  password: zoom_passcode || undefined,
                  settings: {
                    host_video: zoom_host_video,
                    participant_video: zoom_participant_video,
                    join_before_host: zoom_join_before_host,
                    mute_upon_entry: zoom_mute_upon_entry,
                    waiting_room: zoom_waiting_room,
                    auto_recording: zoom_auto_recording,
                    audio: zoom_audio,
                    recording_play_on_active_speaker: zoom_record_speaker_view,
                    meeting_authentication: zoom_require_authentication,
                  },
                }
              );

              if (zoomResult.success) {
                zoomSuccessCount++;
              } else {
                zoomFailCount++;
                console.error(`Failed to create Zoom meeting for lesson ${lesson.id}:`, zoomResult.error);
              }
            } catch (err) {
              zoomFailCount++;
              console.error(`Error creating Zoom meeting for lesson ${lesson.id}:`, err);
            }
          }
        } catch (error) {
          console.error('Error creating recurring Zoom meetings:', error);
          zoomFailCount = createdLessons.length;
        }
      } else {
        // Create individual Zoom meetings
        for (let i = 0; i < createdLessons.length; i++) {
          const lesson = createdLessons[i];
          const lessonNumber = i + 1;

          // Format date for this lesson
          let dateStr = '';
          if (lesson.start_time) {
            try {
              const startDate = new Date(lesson.start_time);
              const dateOptions: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: timezone || 'UTC'
              };
              dateStr = startDate.toLocaleString('he-IL', dateOptions);
            } catch (e) {
              console.error('Error formatting date:', e);
            }
          }

          const zoomTopic = zoom_topic_pattern
            .replace('{n}', lessonNumber.toString())
            .replace('{series_name}', series_name)
            .replace('{course_name}', courseName)
            .replace('{date}', dateStr);

          try {
            const zoomResult = await zoomService.createMeetingForLesson(
              lesson.id,
              {
                topic: zoomTopic,
                agenda: zoom_agenda || undefined,
                start_time: lesson.start_time,
                duration: duration_minutes,
                timezone: timezone,
                password: zoom_passcode || undefined,
                settings: {
                  host_video: zoom_host_video,
                  participant_video: zoom_participant_video,
                  join_before_host: zoom_join_before_host,
                  mute_upon_entry: zoom_mute_upon_entry,
                  waiting_room: zoom_waiting_room,
                  auto_recording: zoom_auto_recording,
                  audio: zoom_audio,
                  recording_play_on_active_speaker: zoom_record_speaker_view,
                  meeting_authentication: zoom_require_authentication,
                },
              }
            );

            if (zoomResult.success) {
              zoomSuccessCount++;
            } else {
              zoomFailCount++;
              console.error(`Failed to create Zoom meeting for lesson ${lesson.id}:`, zoomResult.error);
            }
          } catch (err) {
            zoomFailCount++;
            console.error(`Error creating Zoom meeting for lesson ${lesson.id}:`, err);
          }
        }
      }
    }

    // Re-fetch lessons to get updated Zoom meeting IDs
    let finalLessons = createdLessons;
    if (create_zoom_meetings && zoomSuccessCount > 0) {
      const supabase = createAdminClient();
      const lessonIds = createdLessons.map(l => l.id);
      const { data: updatedLessons } = await supabase
        .from('lessons')
        .select('*')
        .in('id', lessonIds)
        .order('order', { ascending: true });

      if (updatedLessons && updatedLessons.length > 0) {
        finalLessons = updatedLessons;
      }
    }

    // Build success message
    let message = `Successfully created ${createdLessons.length} lessons`;
    if (create_zoom_meetings) {
      if (zoomSuccessCount > 0) {
        message += ` with ${zoomSuccessCount} Zoom meetings`;
      }
      if (zoomFailCount > 0) {
        message += ` (${zoomFailCount} Zoom meetings failed)`;
      }
    }

    return NextResponse.json({
      success: true,
      data: finalLessons,
      message,
      stats: {
        lessons_created: createdLessons.length,
        zoom_success: zoomSuccessCount,
        zoom_failed: zoomFailCount,
      },
    });
  } catch (error) {
    console.error('Smart bulk lesson creation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create lesson series',
      },
      { status: 500 }
    );
  }
}
