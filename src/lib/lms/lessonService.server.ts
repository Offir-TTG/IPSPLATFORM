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
        data: data as unknown as Lesson[],
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
        data: data as unknown as (Lesson | LessonWithTopics),
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

      // Get user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!tenantUser) {
        return {
          success: false,
          error: 'User not associated with any tenant',
        };
      }

      // Add tenant_id to lesson data
      const insertData = {
        ...lessonData,
        tenant_id: tenantUser.tenant_id,
      };

      // Explicitly list all columns to avoid PostgREST schema cache issues
      const lessonsColumns = 'id, course_id, module_id, tenant_id, title, description, content, order, start_time, duration, timezone, zoom_meeting_id, zoom_join_url, zoom_start_url, recording_url, materials, status, is_published, content_blocks, created_at, updated_at, zoom_passcode, zoom_waiting_room, zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication, zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording, zoom_record_speaker_view, zoom_recording_disclaimer';

      const { data, error } = await supabase
        .from('lessons')
        .insert(insertData)
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
        data: data as unknown as Lesson,
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
          status: (config.status || 'scheduled') as 'scheduled' | 'live' | 'completed' | 'cancelled',
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

      // Check if this lesson has a Zoom meeting or Daily.co room and if we're updating relevant fields
      const relevantFields = ['start_time', 'duration', 'timezone', 'title'];
      const hasRelevantUpdates = relevantFields.some(field => field in updates);

      let zoomSessionExists = false;
      let zoomMeetingId = null;
      let dailySessionExists = false;
      let dailyRoomName = null;

      if (hasRelevantUpdates) {
        // Check if there's a Zoom or Daily.co session for this lesson
        const { data: session } = await supabase
          .from('zoom_sessions')
          .select('zoom_meeting_id, daily_room_name, platform')
          .eq('lesson_id', id)
          .maybeSingle();

        if (session) {
          if (session.platform === 'zoom' && session.zoom_meeting_id) {
            zoomSessionExists = true;
            zoomMeetingId = session.zoom_meeting_id;
          } else if (session.platform === 'daily' && session.daily_room_name) {
            dailySessionExists = true;
            dailyRoomName = session.daily_room_name;
          }
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
      let syncMessage = '';

      if (zoomSessionExists && hasRelevantUpdates) {
        try {
          console.log('[updateLesson] Auto-syncing changes to Zoom meeting:', zoomMeetingId);
          const { ZoomService } = await import('@/lib/zoom/zoomService');
          // Get tenant_id from the updated lesson
          const tenantId = (data as any).tenant_id;
          if (!tenantId) {
            console.error('[updateLesson] No tenant_id found on lesson');
            syncMessage = ' (Zoom sync skipped: no tenant context)';
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
              syncMessage = ` (Warning: Zoom sync failed - ${zoomResult.error})`;
            } else {
              console.log('[updateLesson] Successfully synced changes to Zoom');
              syncMessage = ' and synced to Zoom meeting';
            }
          }
        } catch (zoomError) {
          // Don't fail the lesson update if Zoom service is unavailable
          console.error('[updateLesson] Error syncing to Zoom:', zoomError);
          const errorMsg = zoomError instanceof Error ? zoomError.message : 'Unknown error';
          syncMessage = ` (Warning: Zoom sync failed - ${errorMsg})`;
        }
      } else if (dailySessionExists && hasRelevantUpdates) {
        // For Daily.co: Since room names can't be changed, we need to delete the old room and create a new one
        try {
          console.log('[updateLesson] Recreating Daily.co room with updated lesson data:', dailyRoomName);
          const { dailyService } = await import('@/lib/daily/dailyService');

          // Get tenant_id and course info from the updated lesson
          const tenantId = (data as any).tenant_id;
          const courseId = (data as any).course_id;

          if (!tenantId || !courseId) {
            console.error('[updateLesson] Missing tenant_id or course_id');
            syncMessage = ' (Daily.co sync skipped: missing context)';
          } else {
            // Get course info for room name generation
            const { data: course } = await supabase
              .from('courses')
              .select('title')
              .eq('id', courseId)
              .single();

            const courseName = course?.title || 'course';
            const lessonTitle = (data as any).title || 'lesson';

            // Format date if available
            let dateStr = '';
            if (updates.start_time || (data as any).start_time) {
              try {
                const startTime = updates.start_time || (data as any).start_time;
                const startDate = new Date(startTime);
                const tz = updates.timezone || (data as any).timezone || 'UTC';
                dateStr = startDate.toLocaleDateString('en-CA', { timeZone: tz });
              } catch (e) {
                console.error('[updateLesson] Error formatting date:', e);
              }
            }

            // Build new room name with updated data
            // For non-Latin names, use a hash-based approach to create readable names
            const createSlug = (text: string): string => {
              // First try to keep alphanumeric (works for Latin text)
              let slug = text
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');

              // If slug is empty (non-Latin characters), create a hash
              if (!slug || slug.length < 3) {
                const hash = Buffer.from(text).toString('base64')
                  .replace(/[^a-z0-9]/gi, '')
                  .toLowerCase()
                  .substring(0, 8);
                slug = hash;
              }

              return slug;
            };

            let newRoomName = [
              courseName ? createSlug(courseName) : '',
              lessonTitle ? createSlug(lessonTitle) : '',
              dateStr
            ]
              .filter(Boolean)
              .join('-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            newRoomName = `${newRoomName}-${id.substring(0, 8)}`;

            // Only recreate if the room name would be different
            if (newRoomName !== dailyRoomName) {
              console.log('[updateLesson] New room name differs, recreating:', { old: dailyRoomName, new: newRoomName });

              // Get integration settings for expiry hours
              const { data: integration } = await supabase
                .from('integrations')
                .select('settings')
                .eq('integration_key', 'daily')
                .single();

              const defaultExpiryHours = integration?.settings?.default_expiry_hours || (24 * 180);

              // Delete old room
              try {
                await dailyService.deleteRoom(dailyRoomName);
                console.log('[updateLesson] Old Daily.co room deleted');
              } catch (deleteError) {
                console.warn('[updateLesson] Failed to delete old Daily.co room (might not exist):', deleteError);
              }

              // Create new room with updated name
              const newRoom = await dailyService.createRoom(newRoomName, {
                privacy: 'private',
                expiresInHours: defaultExpiryHours,
                enableRecording: false,
              });

              console.log('[updateLesson] New Daily.co room created:', newRoom.url);

              // Update zoom_sessions record with new room info
              const { error: updateError } = await supabase
                .from('zoom_sessions')
                .update({
                  daily_room_name: newRoom.name,
                  daily_room_url: newRoom.url,
                  daily_room_id: newRoom.id,
                })
                .eq('lesson_id', id)
                .eq('platform', 'daily');

              if (updateError) {
                console.error('[updateLesson] Failed to update zoom_sessions with new room info:', updateError);
                syncMessage = ' (Warning: Daily.co room created but database update failed)';
              } else {
                syncMessage = ' and recreated Daily.co room';
              }
            } else {
              console.log('[updateLesson] Room name unchanged, no recreation needed');
              syncMessage = ' (Daily.co room unchanged)';
            }
          }
        } catch (dailyError) {
          // Don't fail the lesson update if Daily.co service is unavailable
          console.error('[updateLesson] Error recreating Daily.co room:', dailyError);
          const errorMsg = dailyError instanceof Error ? dailyError.message : 'Unknown error';
          syncMessage = ` (Warning: Daily.co room recreation failed - ${errorMsg})`;
        }
      }

      return {
        success: true,
        data: data as unknown as Lesson,
        message: `Lesson updated successfully${syncMessage}`,
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

      // First, get session info before deleting (includes both Zoom and Daily.co)
      console.log('[lessonService.deleteLesson] Checking for zoom_sessions...');
      const { data: sessions, error: sessionFetchError } = await supabase
        .from('zoom_sessions')
        .select('zoom_meeting_id, daily_room_name, platform')
        .eq('lesson_id', id);

      if (sessionFetchError) {
        console.log('[lessonService.deleteLesson] Error fetching sessions:', sessionFetchError);
      }

      // Delete Zoom meetings from Zoom API if they exist
      let zoomDeletedCount = 0;
      let zoomFailedCount = 0;
      if (sessions && sessions.length > 0) {
        const zoomSessions = sessions.filter(s => s.platform === 'zoom' && s.zoom_meeting_id);
        if (zoomSessions.length > 0) {
          console.log('[lessonService.deleteLesson] Found', zoomSessions.length, 'Zoom meetings to delete');
          try {
            const { ZoomService } = await import('@/lib/zoom/zoomService');
            const zoomService = new ZoomService(tenantId);
            const zoomClient = await (zoomService as any).getZoomClient();

            for (const session of zoomSessions) {
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
          } catch (zoomServiceError) {
            // Log but don't fail if Zoom service is not configured
            console.error('[lessonService.deleteLesson] Zoom service error:', zoomServiceError);
            zoomFailedCount = zoomSessions.length;
          }
        }
      }

      // Delete Daily.co rooms from Daily.co API if they exist
      let dailyDeletedCount = 0;
      let dailyFailedCount = 0;
      if (sessions && sessions.length > 0) {
        const dailySessions = sessions.filter(s => s.platform === 'daily' && s.daily_room_name);
        if (dailySessions.length > 0) {
          console.log('[lessonService.deleteLesson] Found', dailySessions.length, 'Daily.co rooms to delete');
          try {
            const { dailyService } = await import('@/lib/daily/dailyService');

            for (const session of dailySessions) {
              try {
                console.log('[lessonService.deleteLesson] Deleting Daily.co room:', session.daily_room_name);
                await dailyService.deleteRoom(session.daily_room_name);
                console.log('[lessonService.deleteLesson] Successfully deleted Daily.co room:', session.daily_room_name);
                dailyDeletedCount++;
              } catch (dailyDeleteError) {
                // Log but don't fail the entire delete operation if Daily.co API fails
                console.error('[lessonService.deleteLesson] Failed to delete Daily.co room:', session.daily_room_name, dailyDeleteError);
                dailyFailedCount++;
              }
            }
          } catch (dailyServiceError) {
            // Log but don't fail if Daily.co service is not configured
            console.error('[lessonService.deleteLesson] Daily.co service error:', dailyServiceError);
            dailyFailedCount = dailySessions.length;
          }
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

      // Build message with Zoom and Daily.co deletion status
      let message = 'Lesson deleted successfully';
      const messageParts: string[] = [];

      // Zoom status
      if (zoomDeletedCount > 0 && zoomFailedCount === 0) {
        messageParts.push(`${zoomDeletedCount} Zoom meeting${zoomDeletedCount > 1 ? 's' : ''} deleted`);
      } else if (zoomDeletedCount > 0 && zoomFailedCount > 0) {
        messageParts.push(`${zoomDeletedCount} Zoom meeting${zoomDeletedCount > 1 ? 's' : ''} deleted, ${zoomFailedCount} failed`);
      } else if (zoomFailedCount > 0) {
        messageParts.push(`Warning: Failed to delete ${zoomFailedCount} Zoom meeting${zoomFailedCount > 1 ? 's' : ''}`);
      }

      // Daily.co status
      if (dailyDeletedCount > 0 && dailyFailedCount === 0) {
        messageParts.push(`${dailyDeletedCount} Daily.co room${dailyDeletedCount > 1 ? 's' : ''} deleted`);
      } else if (dailyDeletedCount > 0 && dailyFailedCount > 0) {
        messageParts.push(`${dailyDeletedCount} Daily.co room${dailyDeletedCount > 1 ? 's' : ''} deleted, ${dailyFailedCount} failed`);
      } else if (dailyFailedCount > 0) {
        messageParts.push(`Warning: Failed to delete ${dailyFailedCount} Daily.co room${dailyFailedCount > 1 ? 's' : ''}`);
      }

      if (messageParts.length > 0) {
        message += ` (${messageParts.join(', ')})`;
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

      // Get user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      const { data: tenantUser, error: tenantError } = await supabase
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!tenantUser) {
        return {
          success: false,
          error: 'User not associated with any tenant',
        };
      }

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
          tenant_id: tenantUser.tenant_id,
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
          tenant_id: tenantUser.tenant_id,
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