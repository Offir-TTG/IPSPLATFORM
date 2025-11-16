import { createClient } from '@/lib/supabase/server';
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

      let query = supabase
        .from('lessons')
        .select(
          includeTopics
            ? '*, lesson_topics(*), module:modules(*), course:courses(*)'
            : '*, module:modules(*), course:courses(*)'
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

      const { data, error } = await supabase
        .from('lessons')
        .insert(lessonData)
        .select()
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
      const { data, error } = await supabase
        .from('lessons')
        .insert(lessons)
        .select();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: {
          success: true,
          created_count: data.length,
          failed_count: 0,
          created_ids: data.map((l: Lesson) => l.id),
        },
        message: `Successfully created ${data.length} lessons`,
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

      const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
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
        message: 'Lesson updated successfully',
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
      const supabase = await createClient();

      // First delete any topics
      await supabase.from('lesson_topics').delete().eq('lesson_id', id);

      // Then delete the lesson
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Lesson deleted successfully',
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