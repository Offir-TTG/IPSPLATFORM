import { supabase } from '@/lib/supabase/client';
import type {
  Lesson,
  LessonWithTopics,
  LessonFilter,
  ApiResponse,
  BulkOperationResult,
  BulkReorderRequest,
} from '@/types/lms';

// ============================================================================
// LESSON SERVICE
// ============================================================================

export const lessonService = {
  /**
   * Get all lessons for a course or module
   */
  async getLessons(filter: LessonFilter, includeTopics = false): Promise<ApiResponse<Lesson[]>> {
    try {
      

      let query = supabase
        .from('lessons')
        .select(
          includeTopics
            ? '*, module:modules(*), lesson_topics(*)'
            : '*, module:modules(*)'
        )
        .order('order', { ascending: true });

      // Apply filters
      if (filter.course_id) {
        query = query.eq('course_id', filter.course_id);
      }

      if (filter.module_id) {
        query = query.eq('module_id', filter.module_id);
      }

      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      if (filter.is_published !== undefined) {
        query = query.eq('is_published', filter.is_published);
      }

      if (filter.start_time_from) {
        query = query.gte('start_time', filter.start_time_from);
      }

      if (filter.start_time_to) {
        query = query.lte('start_time', filter.start_time_to);
      }

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
      

      let query = supabase
        .from('lessons')
        .select(
          includeTopics
            ? '*, course:courses(*), module:modules(*), lesson_topics(*)'
            : '*, course:courses(*), module:modules(*)'
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
        data: data as unknown as Lesson | LessonWithTopics,
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
  async createLesson(lessonData: {
    course_id: string;
    module_id?: string;
    title: string;
    description?: string;
    content?: string;
    order: number;
    start_time: string;
    duration: number;
    materials?: any[];
    is_published?: boolean;
    status?: string;
  }): Promise<ApiResponse<Lesson>> {
    try {
      

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
   * Bulk create lessons (e.g., "Add 10 Lessons")
   */
  async bulkCreateLessons(config: {
    course_id: string;
    module_id?: string;
    count: number;
    title_pattern: string;
    description_template?: string;
    starting_order: number;
    base_start_time: string;
    duration: number;
    interval_days?: number; // Days between lessons
  }): Promise<ApiResponse<BulkOperationResult>> {
    try {
      

      // Generate lessons
      const lessons: any[] = [];
      const baseDate = new Date(config.base_start_time);

      for (let i = 0; i < config.count; i++) {
        const n = config.starting_order + i;

        // Calculate start time with interval
        const lessonDate = new Date(baseDate);
        if (config.interval_days) {
          lessonDate.setDate(baseDate.getDate() + i * config.interval_days);
        }

        lessons.push({
          course_id: config.course_id,
          module_id: config.module_id,
          title: config.title_pattern.replace(/\{n\}/g, n.toString()),
          description: config.description_template
            ? config.description_template.replace(/\{n\}/g, n.toString())
            : undefined,
          order: n,
          start_time: lessonDate.toISOString(),
          duration: config.duration,
          materials: [],
          is_published: false,
          status: 'scheduled',
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
  async updateLesson(id: string, updates: Partial<Lesson>): Promise<ApiResponse<Lesson>> {
    try {
      

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
   * Duplicate a lesson with all its topics
   */
  async duplicateLesson(id: string, newModuleId?: string): Promise<ApiResponse<Lesson>> {
    try {
      

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
      if (originalLesson.topics && originalLesson.topics.length > 0) {
        const topicsToInsert = originalLesson.topics.map((topic: any) => ({
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
