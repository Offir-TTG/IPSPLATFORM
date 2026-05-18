/**
 * Zoom Service Layer
 * Business logic for Zoom meeting management, recording processing, and instructor bridge
 */

import { createAdminClient } from '@/lib/supabase/server';
import { ZoomClient } from './client';
import { utcToWallTime } from '@/lib/datetime/timezone';

/**
 * Zoom's API has a quirk: when both `start_time` (with `Z` UTC suffix) and
 * `timezone` are provided, Zoom strips the `Z` and treats the time portion as
 * a wall-clock value in the supplied `timezone`. To get the meeting scheduled
 * at the correct absolute moment, we must send the **wall-clock-in-timezone**
 * form (no `Z`, no offset) and let Zoom interpret it with the `timezone` field.
 *
 * Caller hands us UTC ISO; this helper converts it to `YYYY-MM-DDTHH:mm:ss`
 * (no offset) suitable for the Zoom API body.
 */
function toZoomWallClock(utcIso: string, timezone: string): string {
  const wall = utcToWallTime(utcIso, timezone); // "YYYY-MM-DDTHH:mm"
  return `${wall}:00`; // append seconds → "YYYY-MM-DDTHH:mm:ss"
}

// ============================================================================
// TYPES
// ============================================================================

export interface ZoomSession {
  id: string;
  tenant_id: string;
  lesson_id: string;
  zoom_meeting_id: string;
  zoom_meeting_uuid: string;
  join_url: string;
  start_url: string;
  scheduled_start: string;
  duration_minutes: number;
  recording_status: 'none' | 'pending' | 'ready' | 'failed';
  recording_files: any[];
  recording_play_url: string | null;
  recording_download_url: string | null;
  storage_location: 'zoom' | 'supabase' | 'external';
  created_at: string;
  updated_at: string;
}

export interface BridgeLesson {
  lesson_id: string;
  lesson_title: string;
  lesson_start_time: string;
  zoom_start_url: string;
  zoom_join_url: string;
  is_current: boolean;
}

export interface CreateMeetingOptions {
  topic: string;
  type: 2 | 8; // 2 = scheduled, 8 = recurring
  agenda?: string;
  start_time: string;
  duration: number;
  timezone?: string;
  password?: string;
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    waiting_room?: boolean;
    auto_recording?: 'local' | 'cloud' | 'none';
    approval_type?: number; // 0=automatically approve, 1=manually approve, 2=no registration required
    audio?: 'both' | 'telephony' | 'voip';
    recording_play_on_active_speaker?: boolean;
    meeting_authentication?: boolean;
  };
}

// ============================================================================
// ZOOM SERVICE
// ============================================================================

export class ZoomService {
  private zoomClient: ZoomClient | null = null;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Get ZoomClient instance with credentials from database
   */
  private async getZoomClient(): Promise<ZoomClient> {
    if (this.zoomClient) {
      return this.zoomClient;
    }

    const supabase = createAdminClient();

    // Query integrations filtered by tenant_id
    // Using admin client to bypass RLS, but still filter by tenant_id for security
    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'zoom')
      .eq('tenant_id', this.tenantId)
      .eq('is_enabled', true)
      .single();

    if (error || !integration) {
      console.error('[ZoomService] Integration query error:', error);
      throw new Error('Zoom integration is not enabled or not configured for this tenant');
    }

    const credentials = integration.credentials;
    const settings = integration.settings;

    if (!credentials.account_id || !credentials.client_id || !credentials.client_secret) {
      throw new Error('Zoom credentials are incomplete. Please configure the integration in the admin panel.');
    }

    this.zoomClient = new ZoomClient(credentials, settings);
    return this.zoomClient;
  }

  /**
   * Create a Zoom meeting for a lesson
   */
  async createMeetingForLesson(
    lessonId: string,
    options?: Partial<CreateMeetingOptions>
  ): Promise<{
    success: boolean;
    data?: ZoomSession;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      // Get lesson details with tenant_id
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          module:modules!inner(
            *,
            course:courses!inner(
              *,
              tenant_id
            )
          )
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        console.error('Error fetching lesson:', lessonError);
        return { success: false, error: 'Lesson not found' };
      }

      // Check if Zoom meeting already exists
      const { data: existingSession } = await supabase
        .from('zoom_sessions')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (existingSession) {
        return { success: false, error: 'Zoom meeting already exists for this lesson' };
      }

      // Get tenant_id from module (fallback to course if needed)
      const tenantId = (lesson as any).module?.tenant_id || (lesson as any).module?.course?.tenant_id;
      if (!tenantId) {
        console.error('Could not get tenant_id from lesson:', lesson);
        return { success: false, error: 'Could not determine tenant for lesson' };
      }

      // Build comprehensive topic with lesson number, title, and date
      let topic = options?.topic;
      if (!topic) {
        const lessonNumber = lesson.lesson_number || lesson.order || '';
        const lessonTitle = lesson.title || 'Live Session';
        const courseName = (lesson as any).module?.course?.title || '';

        // Format date from start_time if available
        let dateStr = '';
        if (lesson.start_time) {
          try {
            const startDate = new Date(lesson.start_time);
            const options: Intl.DateTimeFormatOptions = {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: lesson.timezone || 'UTC'
            };
            dateStr = startDate.toLocaleString('he-IL', options);
          } catch (e) {
            console.error('Error formatting date:', e);
          }
        }

        // Build topic: "Course Name - Lesson #X: Lesson Title - Date"
        const parts = [];
        if (courseName) parts.push(courseName);
        if (lessonNumber) {
          parts.push(`שיעור ${lessonNumber}${lessonTitle ? ': ' + lessonTitle : ''}`);
        } else if (lessonTitle) {
          parts.push(lessonTitle);
        }
        if (dateStr) parts.push(dateStr);

        topic = parts.join(' - ') || 'Live Session';
      }

      // Create Zoom meeting with provided options or defaults.
      // Convert UTC ISO → wall-clock-in-timezone for Zoom (see
      // `toZoomWallClock` for why).
      const meetingType: 2 | 8 = (options?.type ?? 2) as 2 | 8; // 2 = scheduled meeting
      const meetingTimezone = options?.timezone || lesson.timezone || 'UTC';
      const meetingStartUTC = options?.start_time || lesson.start_time;
      const meetingOptions: CreateMeetingOptions = {
        topic,
        type: meetingType,
        agenda: options?.agenda,
        start_time: meetingStartUTC ? toZoomWallClock(meetingStartUTC, meetingTimezone) : meetingStartUTC,
        duration: options?.duration || lesson.duration || 60,
        timezone: meetingTimezone,
        password: options?.password,
        settings: {
          host_video: options?.settings?.host_video ?? true,
          participant_video: options?.settings?.participant_video ?? true,
          join_before_host: options?.settings?.join_before_host ?? false,
          mute_upon_entry: options?.settings?.mute_upon_entry ?? false,
          waiting_room: options?.settings?.waiting_room ?? true,
          auto_recording: options?.settings?.auto_recording ?? 'none',
          audio: options?.settings?.audio ?? 'both',
          recording_play_on_active_speaker: options?.settings?.recording_play_on_active_speaker ?? false,
          meeting_authentication: options?.settings?.meeting_authentication ?? false,
        },
      };

      const zoomClient = await this.getZoomClient();
      const meeting = await zoomClient.createMeeting(meetingOptions);

      // Store zoom session in database
      const { data: zoomSession, error: insertError } = await supabase
        .from('zoom_sessions')
        .insert({
          tenant_id: tenantId,
          lesson_id: lessonId,
          zoom_meeting_id: meeting.id.toString(),
          zoom_meeting_uuid: (meeting as any).uuid || meeting.id.toString(),
          join_url: meeting.join_url,
          start_url: meeting.start_url,
          scheduled_start: lesson.start_time,
          duration_minutes: lesson.duration || 60,
          recording_status: 'none',
          storage_location: 'zoom',
        })
        .select()
        .single();

      if (insertError) {
        // Attempt to delete the Zoom meeting if DB insert fails
        await zoomClient.deleteMeeting(meeting.id);
        return { success: false, error: 'Failed to store Zoom session' };
      }

      // Update lesson with Zoom info (for backward compatibility)
      await supabase
        .from('lessons')
        .update({
          zoom_meeting_id: meeting.id.toString(),
          zoom_join_url: meeting.join_url,
          zoom_start_url: meeting.start_url,
        })
        .eq('id', lessonId);

      return { success: true, data: zoomSession };
    } catch (error) {
      console.error('Error creating Zoom meeting for lesson:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Process recording webhook from Zoom
   */
  async processRecordingWebhook(payload: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      const meetingUuid = payload.object?.uuid;
      const recordingFiles = payload.object?.recording_files || [];

      if (!meetingUuid) {
        return { success: false, error: 'Missing meeting UUID in webhook payload' };
      }

      // Find zoom session by meeting UUID
      const { data: zoomSession, error: sessionError } = await supabase
        .from('zoom_sessions')
        .select('*')
        .eq('zoom_meeting_uuid', meetingUuid)
        .single();

      if (sessionError || !zoomSession) {
        console.error('Zoom session not found for meeting UUID:', meetingUuid);
        return { success: false, error: 'Zoom session not found' };
      }

      // Extract recording URLs
      const playUrl = payload.object?.share_url || payload.object?.play_url;
      const downloadUrl = recordingFiles.find((f: any) => f.file_type === 'MP4')?.download_url;

      // Update zoom session with recording info
      const { error: updateError } = await supabase
        .from('zoom_sessions')
        .update({
          recording_status: 'ready',
          recording_files: recordingFiles,
          recording_play_url: playUrl,
          recording_download_url: downloadUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', zoomSession.id);

      if (updateError) {
        return { success: false, error: 'Failed to update recording status' };
      }

      // Update lesson with recording URL (for backward compatibility)
      await supabase
        .from('lessons')
        .update({
          recording_url: playUrl || downloadUrl,
          status: 'completed',
        })
        .eq('id', zoomSession.lesson_id);

      return { success: true };
    } catch (error) {
      console.error('Error processing recording webhook:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Pull recording info for a specific lesson directly from Zoom's API.
   *
   * Use case: a `recording.completed` webhook was missed (e.g. local dev
   * without an exposed tunnel, prod outage, app reconfigured) but Zoom
   * has the recording. Admin can call this to backfill `zoom_sessions`
   * and `lessons.recording_url` without re-running the meeting.
   *
   * Mirrors `processRecordingWebhook` but the recording payload comes
   * from `GET /meetings/{meetingId}/recordings` instead of the webhook
   * envelope. Same downstream writes: `zoom_sessions.*` + the legacy
   * `lessons.recording_url` mirror that the user-portal reads.
   */
  async syncLessonRecording(lessonId: string): Promise<{
    success: boolean;
    error?: string;
    /** Machine-readable code so the UI can pick a localized message
     *  instead of surfacing Zoom's raw English error text. */
    errorCode?: 'no_session' | 'no_meeting_id' | 'no_recording' | 'api_error' | 'db_error';
    data?: {
      recordingUrl: string | null;
      recordingStatus: string;
      filesFound: number;
    };
  }> {
    try {
      const supabase = createAdminClient();

      // Find the zoom_session row for this lesson — it carries the
      // numeric meeting_id we need to query Zoom's API.
      const { data: zoomSession, error: sessionError } = await supabase
        .from('zoom_sessions')
        .select('id, lesson_id, zoom_meeting_id')
        .eq('lesson_id', lessonId)
        .single();

      if (sessionError || !zoomSession) {
        return { success: false, error: 'No Zoom session found for this lesson', errorCode: 'no_session' };
      }

      const meetingId = zoomSession.zoom_meeting_id;
      if (!meetingId) {
        return { success: false, error: 'Zoom session has no meeting id', errorCode: 'no_meeting_id' };
      }

      // Ask Zoom for the recordings on this meeting.
      const zoomClient = await this.getZoomClient();
      let recordingsResp;
      try {
        recordingsResp = await zoomClient.getRecordings(meetingId);
      } catch (apiError: any) {
        // Detect "no recording exists" via Zoom's own signals so we can
        // surface a localized message instead of the raw English error.
        //   - HTTP 404      → meeting or recording absent
        //   - zoomCode 3301 → "There is no recording for this meeting"
        //   - zoomCode 3001 → "Meeting does not exist"
        // Fall back to text matching for anything unusual the SDK returns.
        const msg = String(apiError?.message || 'Failed to fetch recordings from Zoom');
        const status: number | undefined = apiError?.status;
        const zoomCode: number | undefined = apiError?.zoomCode;
        const isNoRecording =
          status === 404 ||
          zoomCode === 3301 ||
          zoomCode === 3001 ||
          /no recording/i.test(msg) ||
          /not found/i.test(msg) ||
          /does ?n[o']t exist/i.test(msg);

        console.log('[syncLessonRecording] zoom error:', {
          status,
          zoomCode,
          msg,
          classified: isNoRecording ? 'no_recording' : 'api_error',
        });

        return {
          success: false,
          error: msg,
          errorCode: isNoRecording ? 'no_recording' : 'api_error',
        };
      }

      const recordingFiles = (recordingsResp as any)?.recording_files || [];
      const playUrl = (recordingsResp as any)?.share_url || (recordingsResp as any)?.play_url || null;
      const mp4 = recordingFiles.find((f: any) => f.file_type === 'MP4');
      const downloadUrl = mp4?.download_url || null;

      if (!playUrl && !downloadUrl) {
        // Recording exists in API response but no usable URL — mark
        // status appropriately so the UI shows the right "not ready"
        // message instead of silently failing.
        await supabase
          .from('zoom_sessions')
          .update({
            recording_status: 'processing',
            recording_files: recordingFiles,
            updated_at: new Date().toISOString(),
          })
          .eq('id', zoomSession.id);

        return {
          success: true,
          data: { recordingUrl: null, recordingStatus: 'processing', filesFound: recordingFiles.length },
        };
      }

      // Update zoom_session with recording info.
      const { error: updateError } = await supabase
        .from('zoom_sessions')
        .update({
          recording_status: 'ready',
          recording_files: recordingFiles,
          recording_play_url: playUrl,
          recording_download_url: downloadUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', zoomSession.id);

      if (updateError) {
        return {
          success: false,
          error: 'Failed to update zoom session: ' + updateError.message,
          errorCode: 'db_error',
        };
      }

      // Mirror to lessons.recording_url so the user-portal reader sees it.
      const recordingUrl = playUrl || downloadUrl;
      await supabase
        .from('lessons')
        .update({
          recording_url: recordingUrl,
          status: 'completed',
        })
        .eq('id', lessonId);

      return {
        success: true,
        data: { recordingUrl, recordingStatus: 'ready', filesFound: recordingFiles.length },
      };
    } catch (error: any) {
      console.error('Error syncing lesson recording:', error);
      return { success: false, error: error?.message || 'Internal server error' };
    }
  }

  /**
   * Get current or next lesson for instructor bridge
   */
  async getCurrentLessonForBridge(bridgeSlug: string): Promise<{
    success: boolean;
    data?: BridgeLesson;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      // Call the database function
      const { data, error } = await supabase
        .rpc('get_current_lesson_for_bridge', {
          bridge_slug_param: bridgeSlug,
          now_param: new Date().toISOString(),
        })
        .single();

      if (error || !data) {
        return { success: false, error: 'No active or upcoming lesson found' };
      }

      return { success: true, data: data as BridgeLesson };
    } catch (error) {
      console.error('Error getting current lesson for bridge:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Generate a unique bridge slug for course and instructor
   */
  generateBridgeSlug(courseName: string, instructorName: string): string {
    // Clean and format the slug
    const cleanCourse = courseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const cleanInstructor = instructorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    return `${cleanCourse}-${cleanInstructor}-${randomSuffix}`;
  }

  /**
   * Create instructor bridge link for a course
   */
  async createInstructorBridgeLink(
    courseId: string,
    instructorId: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      // Get course and instructor details
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, tenant_id')
        .eq('id', courseId)
        .single();

      if (courseError || !course) {
        return { success: false, error: 'Course not found' };
      }

      const { data: instructor, error: instructorError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', instructorId)
        .single();

      if (instructorError || !instructor) {
        return { success: false, error: 'Instructor not found' };
      }

      // Check if bridge link already exists
      const { data: existingBridge } = await supabase
        .from('instructor_bridge_links')
        .select('*')
        .eq('course_id', courseId)
        .eq('instructor_id', instructorId)
        .single();

      if (existingBridge) {
        return { success: true, data: existingBridge };
      }

      // Generate unique slug
      const slug = this.generateBridgeSlug(
        course.title,
        `${instructor.first_name} ${instructor.last_name}`
      );

      // Create bridge link
      const { data: bridgeLink, error: insertError } = await supabase
        .from('instructor_bridge_links')
        .insert({
          tenant_id: course.tenant_id,
          course_id: courseId,
          instructor_id: instructorId,
          bridge_slug: slug,
          is_active: true,
          grace_before_minutes: 15,
          grace_after_minutes: 30,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Database error creating bridge link:', insertError);
        return {
          success: false,
          error: insertError.message || 'Failed to create bridge link'
        };
      }

      return { success: true, data: bridgeLink };
    } catch (error) {
      console.error('Error creating instructor bridge link:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get Zoom session for a lesson
   */
  async getZoomSessionForLesson(lessonId: string): Promise<{
    success: boolean;
    data?: ZoomSession;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('zoom_sessions')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (error || !data) {
        return { success: false, error: 'Zoom session not found' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting Zoom session:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Update a Zoom meeting for a lesson
   */
  async updateMeetingForLesson(
    lessonId: string,
    options?: Partial<CreateMeetingOptions>
  ): Promise<{
    success: boolean;
    data?: ZoomSession;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      // Get existing Zoom session
      const { data: zoomSession, error: sessionError } = await supabase
        .from('zoom_sessions')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (sessionError || !zoomSession) {
        return { success: false, error: 'Zoom session not found' };
      }

      // Get lesson details
      // Explicitly list all columns to avoid PostgREST schema cache issues
      const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(lessonsColumns)
        .eq('id', lessonId)
        .single();

      if (lessonError || !lesson) {
        return { success: false, error: 'Lesson not found' };
      }

      // Build update params
      const updateParams: any = {};

      if (options?.topic) {
        updateParams.topic = options.topic;
      }

      if (options?.agenda !== undefined) {
        updateParams.agenda = options.agenda;
      }

      // Zoom expects wall-clock-in-timezone, not UTC ISO. Convert here.
      // The lesson's stored timezone is the source of truth for the
      // conversion target (falling back to the caller-supplied timezone,
      // which is what the form sends — they match in normal cases).
      const zoomTimezone = options?.timezone || lesson.timezone || 'UTC';
      if (options?.start_time) {
        updateParams.start_time = toZoomWallClock(options.start_time, zoomTimezone);
      }

      if (options?.duration) {
        updateParams.duration = options.duration;
      }

      if (options?.timezone) {
        updateParams.timezone = options.timezone;
      }

      if (options?.password !== undefined) {
        updateParams.password = options.password;
      }

      if (options?.settings) {
        updateParams.settings = options.settings;
      }

      console.log('[updateMeetingForLesson] Updating Zoom meeting:', zoomSession.zoom_meeting_id);
      console.log('[updateMeetingForLesson] Update params:', JSON.stringify(updateParams, null, 2));

      // Update the Zoom meeting via API
      const zoomClient = await this.getZoomClient();
      await zoomClient.updateMeeting(zoomSession.zoom_meeting_id, updateParams);

      console.log('[updateMeetingForLesson] Zoom meeting updated successfully');

      // Update zoom session in database
      const dbUpdate: any = {};
      if (options?.start_time) {
        dbUpdate.scheduled_start = options.start_time;
      }
      if (options?.duration) {
        dbUpdate.duration_minutes = options.duration;
      }
      dbUpdate.updated_at = new Date().toISOString();

      const { data: updatedSession, error: updateError } = await supabase
        .from('zoom_sessions')
        .update(dbUpdate)
        .eq('id', zoomSession.id)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: 'Failed to update Zoom session in database' };
      }

      // Update lesson with new Zoom info (for backward compatibility).
      //
      // Defensive guard: only write back fields that actually differ from
      // the row we already read. `lessonService.updateLesson` writes the
      // canonical values *before* this Zoom sync runs, so by the time we
      // reach this code, `options?.start_time` and the freshly-read
      // `lesson.start_time` are typically the same string. A redundant
      // update is wasteful and used to be a source of timezone drift —
      // skipping the no-op write removes that risk entirely.
      if (options?.start_time || options?.duration) {
        const writeBack: { start_time?: string; duration?: number } = {};
        const desiredStart = options?.start_time || lesson.start_time;
        const desiredDuration = options?.duration || lesson.duration;
        if (
          options?.start_time &&
          new Date(desiredStart).getTime() !== new Date(lesson.start_time).getTime()
        ) {
          writeBack.start_time = desiredStart;
        }
        if (options?.duration && desiredDuration !== lesson.duration) {
          writeBack.duration = desiredDuration;
        }
        if (Object.keys(writeBack).length > 0) {
          await supabase
            .from('lessons')
            .update(writeBack)
            .eq('id', lessonId);
        }
      }

      return { success: true, data: updatedSession };
    } catch (error) {
      console.error('Error updating Zoom meeting for lesson:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return { success: false, error: errorMessage };
    }
  }
}

// Note: ZoomService requires tenant_id parameter, so no singleton export
// Create instances as needed: new ZoomService(tenantId)
