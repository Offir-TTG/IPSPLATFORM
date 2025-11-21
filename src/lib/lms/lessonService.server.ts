import { createClient, createAdminClient } from '@/lib/supabase/server';
import type {
  Lesson,
  LessonCreateInput,
  LessonUpdateInput,
  BulkLessonCreateInput,
  LessonWithTopics,
  ApiResponse,
  BulkOperationResult,
  BulkReorderRequest,
} from '@/types/lms';

// ============================================================================
// SERVER-SIDE LESSON SERVICE
// ============================================================================

export const lessonService = {
  /**
   * Get lessons with optional filters
   */
  async getLessons(
    filter: { course_id?: string; module_id?: string },
    includeTopics = false
  ): Promise<ApiResponse<Lesson[]>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('lessons')
        .select(includeTopics ? '*, lesson_topics(*)' : '*');

      if (filter.course_id) {
        query = query.eq('course_id', filter.course_id);
      }
      if (filter.module_id) {
        query = query.eq('module_id', filter.module_id);
      }

      query = query.order('order', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Lesson[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get a single lesson by ID
   */
  async getLessonById(id: string, includeTopics = false): Promise<ApiResponse<Lesson | LessonWithTopics>> {
    try {
      const supabase = await createClient();

      // Explicitly list all columns to avoid PostgREST schema cache issues
      const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

      let query = supabase
        .from('lessons')
        .select(
          includeTopics
            ? `${lessonsColumns}, lesson_topics(*), module:modules(*), course:courses(*)`
            : `${lessonsColumns}, module:modules(*), course:courses(*)`
        )
        .eq('id', id)
        .single();

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Lesson | LessonWithTopics,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create a single lesson
   */
  async createLesson(lessonData: LessonCreateInput): Promise<ApiResponse<Lesson>> {
    try {
      const supabase = await createClient();

      // Explicitly list all columns to avoid PostgREST schema cache issues
      const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select(lessonsColumns)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Lesson,
        message: 'Lesson created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Bulk create lessons
   */
  async bulkCreateLessons(config: BulkLessonCreateInput): Promise<ApiResponse<BulkOperationResult>> {
    try {
      const supabase = await createClient();

      // Generate lessons
      const lessons: LessonCreateInput[] = [];
      for (let i = 0; i < config.count; i++) {
        const n = config.starting_order + i;

        // Calculate start time if needed
        let startTime = config.start_time_base;
        if (config.time_increment_minutes && i > 0) {
          const baseDate = new Date(config.start_time_base);
          baseDate.setMinutes(baseDate.getMinutes() + (config.time_increment_minutes * i));
          startTime = baseDate.toISOString();
        }

        lessons.push({
          course_id: config.course_id,
          module_id: config.module_id,
          title: config.title_pattern.replace(/\{n\}/g, n.toString()),
          description: config.description_template
            ? config.description_template.replace(/\{n\}/g, n.toString())
            : undefined,
          content: config.content_template
            ? config.content_template.replace(/\{n\}/g, n.toString())
            : undefined,
          order: n,
          start_time: startTime,
          duration: config.duration || 60,
          materials: config.materials || [],
          is_published: config.is_published || false,
          status: config.status || 'scheduled',
        });
      }

      // Insert all lessons
      // Explicitly list all columns to avoid PostgREST schema cache issues
      const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessons)
        .select(lessonsColumns);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Auto-create Zoom meetings if requested
      let zoomCreatedCount = 0;
      let zoomFailedCount = 0;

      if (config.create_zoom_meetings && data.length > 0) {
        const { ZoomService } = await import('@/lib/zoom/zoomService');
        // Get tenant_id from the first lesson
        const tenantId = data[0].tenant_id;
        if (!tenantId) {
          console.error('[bulkCreateLessons] No tenant_id found on lessons');
          return {
            success: false,
            error: 'No tenant context found for creating Zoom meetings',
          };
        }
        const zoomService = new ZoomService(tenantId);

        for (const lesson of data) {
          try {
            const zoomResult = await zoomService.createMeetingForLesson(lesson.id);
            if (zoomResult.success) {
              zoomCreatedCount++;
            } else {
              zoomFailedCount++;
              console.error(`Failed to create Zoom meeting for lesson ${lesson.id}:`, zoomResult.error);
            }
          } catch (err) {
            zoomFailedCount++;
            console.error(`Error creating Zoom meeting for lesson ${lesson.id}:`, err);
          }
        }
      }

      const message = config.create_zoom_meetings
        ? `Successfully created ${data.length} lessons (${zoomCreatedCount} Zoom meetings created, ${zoomFailedCount} failed)`
        : `Successfully created ${data.length} lessons`;

      return {
        success: true,
        data: {
          success: true,
          created_count: data.length,
          failed_count: 0,
          created_ids: data.map((l: Lesson) => l.id),
          zoom_created_count: zoomCreatedCount,
          zoom_failed_count: zoomFailedCount,
        },
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update a lesson
   */
  async updateLesson(id: string, updates: LessonUpdateInput): Promise<ApiResponse<Lesson>> {
    try {
      const supabase = await createClient();

      // Check if this lesson has a Zoom meeting and if we're updating Zoom-relevant fields
      const zoomRelevantFields = ['start_time', 'duration', 'timezone', 'title'];
      const hasZoomRelevantUpdates = zoomRelevantFields.some(field => field in updates);

      let zoomSessionExists = false;
      let zoomMeetingId = null;

      if (hasZoomRelevantUpdates) {
        // Check if there's a Zoom session for this lesson
        const { data: zoomSession } = await supabase
          .from('zoom_sessions')
          .select('zoom_meeting_id')
          .eq('lesson_id', id)
          .maybeSingle();

        if (zoomSession?.zoom_meeting_id) {
          zoomSessionExists = true;
          zoomMeetingId = zoomSession.zoom_meeting_id;
        }
      }

      // Update the lesson in the database
      // Explicitly list all columns to avoid PostgREST schema cache issues
      const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select(lessonsColumns)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Auto-sync to Zoom if a Zoom meeting exists and relevant fields were updated
      let zoomSyncMessage = '';
      if (zoomSessionExists && hasZoomRelevantUpdates) {
        try {
          console.log('[updateLesson] Auto-syncing changes to Zoom meeting:', zoomMeetingId);
          const { ZoomService } = await import('@/lib/zoom/zoomService');
          // Get tenant_id from the updated lesson
          const tenantId = (data as any).tenant_id;
          if (!tenantId) {
            console.error('[updateLesson] No tenant_id found on lesson');
            zoomSyncMessage = ' (Zoom sync skipped: no tenant context)';
          } else {
            const zoomService = new ZoomService(tenantId);

            // Build update options for Zoom
            const zoomUpdateOptions: any = {};
            if (updates.start_time) zoomUpdateOptions.start_time = updates.start_time;
            if (updates.duration) zoomUpdateOptions.duration = updates.duration;
            if (updates.timezone) zoomUpdateOptions.timezone = updates.timezone;
            if (updates.title) zoomUpdateOptions.topic = updates.title;

            const zoomResult = await zoomService.updateMeetingForLesson(id, zoomUpdateOptions);

            if (!zoomResult.success) {
              console.error('[updateLesson] Failed to sync to Zoom:', zoomResult.error);
              zoomSyncMessage = ` (Warning: Zoom sync failed - ${zoomResult.error})`;
            } else {
              console.log('[updateLesson] Successfully synced changes to Zoom');
              zoomSyncMessage = ' and synced to Zoom meeting';
            }
          }
        } catch (zoomError) {
          // Don't fail the lesson update if Zoom service is unavailable
          console.error('[updateLesson] Error syncing to Zoom:', zoomError);
          const errorMsg = zoomError instanceof Error ? zoomError.message : 'Unknown error';
          zoomSyncMessage = ` (Warning: Zoom sync failed - ${errorMsg})`;
        }
      }

      return {
        success: true,
        data: data as Lesson,
        message: `Lesson updated successfully${zoomSyncMessage}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('[lessonService.deleteLesson] Starting delete for:', id);
      const supabase = createAdminClient();

      // Get the lesson to access tenant_id
      const { data: lesson, error: lessonFetchError } = await supabase
        .from('lessons')
        .select('tenant_id')
        .eq('id', id)
        .single();

      if (lessonFetchError || !lesson) {
        console.log('[lessonService.deleteLesson] Error fetching lesson:', lessonFetchError);
        return {
          success: false,
          error: 'Lesson not found',
        };
      }

      const tenantId = lesson.tenant_id;

      // First, get zoom session info before deleting
      console.log('[lessonService.deleteLesson] Checking for zoom_sessions...');
      const { data: zoomSessions, error: zoomFetchError } = await supabase
        .from('zoom_sessions')
        .select('zoom_meeting_id')
        .eq('lesson_id', id);

      if (zoomFetchError) {
        console.log('[lessonService.deleteLesson] Error fetching zoom sessions:', zoomFetchError);
      }

      // Delete Zoom meetings from Zoom API if they exist
      let zoomDeletedCount = 0;
      let zoomFailedCount = 0;
      if (zoomSessions && zoomSessions.length > 0) {
        console.log('[lessonService.deleteLesson] Found', zoomSessions.length, 'Zoom meetings to delete');
        try {
          const { ZoomService } = await import('@/lib/zoom/zoomService');
          const zoomService = new ZoomService(tenantId);
          const zoomClient = await (zoomService as any).getZoomClient();

          for (const session of zoomSessions) {
            if (session.zoom_meeting_id) {
              try {
                console.log('[lessonService.deleteLesson] Deleting Zoom meeting:', session.zoom_meeting_id);
                await zoomClient.deleteMeeting(session.zoom_meeting_id);
                console.log('[lessonService.deleteLesson] Successfully deleted Zoom meeting:', session.zoom_meeting_id);
                zoomDeletedCount++;
              } catch (zoomDeleteError) {
                // Log but don't fail the entire delete operation if Zoom API fails
                console.error('[lessonService.deleteLesson] Failed to delete Zoom meeting:', session.zoom_meeting_id, zoomDeleteError);
                zoomFailedCount++;
              }
            }
          }
        } catch (zoomServiceError) {
          // Log but don't fail if Zoom service is not configured
          console.error('[lessonService.deleteLesson] Zoom service error:', zoomServiceError);
          zoomFailedCount = zoomSessions.length;
        }
      }

      // Delete zoom sessions from database
      console.log('[lessonService.deleteLesson] Deleting zoom_sessions from database...');
      const { data: deletedZoom, error: zoomError } = await supabase
        .from('zoom_sessions')
        .delete()
        .eq('lesson_id', id)
        .select();
      console.log('[lessonService.deleteLesson] Deleted zoom_sessions:', deletedZoom?.length || 0);
      if (zoomError) console.log('[lessonService.deleteLesson] Zoom sessions error:', zoomError);

      // Delete lesson topics
      console.log('[lessonService.deleteLesson] Deleting lesson_topics...');
      const { data: deletedTopics, error: topicsError } = await supabase
        .from('lesson_topics')
        .delete()
        .eq('lesson_id', id)
        .select();
      console.log('[lessonService.deleteLesson] Deleted lesson_topics:', deletedTopics?.length || 0);
      if (topicsError) console.log('[lessonService.deleteLesson] Topics error:', topicsError);

      // Then delete the lesson
      console.log('[lessonService.deleteLesson] Deleting lesson...');
      const { data: deletedLesson, error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)
        .select();

      console.log('[lessonService.deleteLesson] Delete result - data:', deletedLesson, 'error:', error);

      if (error) {
        console.log('[lessonService.deleteLesson] Lesson delete error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Build message with Zoom deletion status
      let message = 'Lesson deleted successfully';
      if (zoomDeletedCount > 0 || zoomFailedCount > 0) {
        if (zoomDeletedCount > 0 && zoomFailedCount === 0) {
          message += ` (${zoomDeletedCount} Zoom meeting${zoomDeletedCount > 1 ? 's' : ''} deleted)`;
        } else if (zoomDeletedCount > 0 && zoomFailedCount > 0) {
          message += ` (${zoomDeletedCount} Zoom meeting${zoomDeletedCount > 1 ? 's' : ''} deleted, ${zoomFailedCount} failed)`;
        } else if (zoomFailedCount > 0) {
          message += ` (Warning: Failed to delete ${zoomFailedCount} Zoom meeting${zoomFailedCount > 1 ? 's' : ''})`;
        }
      }

      return {
        success: true,
        message,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Reorder lessons (drag and drop)
   */
  async reorderLessons(request: BulkReorderRequest): Promise<ApiResponse<void>> {
    try {
      const supabase = await createClient();

      // Update order for all lessons
      const updates = request.items.map((item) =>
        supabase
          .from('lessons')
          .update({ order: item.order })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      return {
        success: true,
        message: 'Lessons reordered successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Publish a lesson
   */
  async publishLesson(id: string): Promise<ApiResponse<Lesson>> {
    return this.updateLesson(id, { is_published: true });
  },

  /**
   * Unpublish a lesson
   */
  async unpublishLesson(id: string): Promise<ApiResponse<Lesson>> {
    return this.updateLesson(id, { is_published: false });
  },

  /**
   * Update lesson status (scheduled, live, completed)
   */
  async updateLessonStatus(id: string, status: 'scheduled' | 'live' | 'completed'): Promise<ApiResponse<Lesson>> {
    return this.updateLesson(id, { status });
  },

  /**
   * Duplicate a lesson with all its topics
   */
  async duplicateLesson(id: string, newModuleId?: string): Promise<ApiResponse<Lesson>> {
    try {
      const supabase = await createClient();

      // Get original lesson with topics
      const { data: originalLesson, error: fetchError } = await supabase
        .from('lessons')
        .select('*, lesson_topics(*)')
        .eq('id', id)
        .single();

      if (fetchError || !originalLesson) {
        return {
          success: false,
          error: fetchError?.message || 'Lesson not found',
        };
      }

      // Create new lesson
      const { data: newLesson, error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: originalLesson.course_id,
          module_id: newModuleId || originalLesson.module_id,
          title: `${originalLesson.title} (Copy)`,
          description: originalLesson.description,
          content: originalLesson.content,
          order: originalLesson.order,
          start_time: originalLesson.start_time,
          duration: originalLesson.duration,
          materials: originalLesson.materials,
          is_published: false,
          status: 'scheduled',
        })
        .select()
        .single();

      if (lessonError || !newLesson) {
        return {
          success: false,
          error: lessonError?.message || 'Failed to create lesson copy',
        };
      }

      // Duplicate topics
      if (originalLesson.lesson_topics && originalLesson.lesson_topics.length > 0) {
        const topicsToInsert = originalLesson.lesson_topics.map((topic: any) => ({
          lesson_id: newLesson.id,
          title: topic.title,
          content_type: topic.content_type,
          content: topic.content,
          order: topic.order,
          duration_minutes: topic.duration_minutes,
          is_required: topic.is_required,
        }));

        await supabase.from('lesson_topics').insert(topicsToInsert);
      }

      return {
        success: true,
        data: newLesson as Lesson,
        message: 'Lesson duplicated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export default lessonService;