/**
 * Zoom Service Layer
 * Business logic for Zoom meeting management, recording processing, and instructor bridge
 */

import { createAdminClient } from '@/lib/supabase/server';
import { ZoomClient } from './client';

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
  type?: 2 | 8; // 2 = scheduled, 8 = recurring
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

  constructor() {
    // Don't initialize ZoomClient here - do it lazily when needed
  }

  /**
   * Get ZoomClient instance with credentials from database
   */
  private async getZoomClient(): Promise<ZoomClient> {
    if (this.zoomClient) {
      return this.zoomClient;
    }

    const supabase = createAdminClient();

    const { data: integration, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('integration_key', 'zoom')
      .eq('is_enabled', true)
      .single();

    if (error || !integration) {
      throw new Error('Zoom integration is not enabled or not configured');
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

      // Create Zoom meeting with provided options or defaults
      const meetingOptions: CreateMeetingOptions = {
        topic,
        type: options?.type ?? 2, // 2 = scheduled meeting
        agenda: options?.agenda,
        start_time: options?.start_time || lesson.start_time,
        duration: options?.duration || lesson.duration || 60,
        timezone: options?.timezone || lesson.timezone || 'UTC',
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

      return { success: true, data };
    } catch (error) {
      console.error('Error getting current lesson for bridge:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Generate a unique bridge slug for program and instructor
   */
  generateBridgeSlug(programName: string, instructorName: string): string {
    // Clean and format the slug
    const cleanProgram = programName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const cleanInstructor = instructorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Add random suffix to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);

    return `${cleanProgram}-${cleanInstructor}-${randomSuffix}`;
  }

  /**
   * Create instructor bridge link for a program
   */
  async createInstructorBridgeLink(
    programId: string,
    instructorId: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const supabase = createAdminClient();

      // Get program and instructor details
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('name, tenant_id')
        .eq('id', programId)
        .single();

      if (programError || !program) {
        return { success: false, error: 'Program not found' };
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
        .eq('program_id', programId)
        .eq('instructor_id', instructorId)
        .single();

      if (existingBridge) {
        return { success: true, data: existingBridge };
      }

      // Generate unique slug
      const slug = this.generateBridgeSlug(
        program.name,
        `${instructor.first_name} ${instructor.last_name}`
      );

      // Create bridge link
      const { data: bridgeLink, error: insertError } = await supabase
        .from('instructor_bridge_links')
        .insert({
          tenant_id: program.tenant_id,
          program_id: programId,
          instructor_id: instructorId,
          bridge_slug: slug,
          is_active: true,
          grace_before_minutes: 15,
          grace_after_minutes: 30,
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, error: 'Failed to create bridge link' };
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

      if (options?.start_time) {
        updateParams.start_time = options.start_time;
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

      // Update lesson with new Zoom info (for backward compatibility)
      if (options?.start_time || options?.duration) {
        await supabase
          .from('lessons')
          .update({
            start_time: options?.start_time || lesson.start_time,
            duration: options?.duration || lesson.duration,
          })
          .eq('id', lessonId);
      }

      return { success: true, data: updatedSession };
    } catch (error) {
      console.error('Error updating Zoom meeting for lesson:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const zoomService = new ZoomService();
