import { createClient } from '@/lib/supabase/server';
import type {
  Module,
  ModuleCreateInput,
  ModuleUpdateInput,
  BulkModuleCreateInput,
  ModuleWithLessons,
  ApiResponse,
  BulkOperationResult,
  BulkReorderRequest,
} from '@/types/lms';

// ============================================================================
// SERVER-SIDE MODULE SERVICE
// ============================================================================

export const moduleService = {
  /**
   * Get all modules for a course
   */
  async getModulesByCourse(courseId: string, includeLessons = false): Promise<ApiResponse<Module[]>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('modules')
        .select(
          includeLessons
            ? '*, lessons(*, lesson_topics(*))'
            : '*'
        )
        .eq('course_id', courseId)
        .order('order', { ascending: true });

      const { data, error } = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as unknown as Module[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get a single module by ID
   */
  async getModuleById(id: string, includeLessons = false): Promise<ApiResponse<Module | ModuleWithLessons>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('modules')
        .select(
          includeLessons
            ? '*, course:courses(*), lessons(*, lesson_topics(*))'
            : '*, course:courses(*)'
        )
        .eq('id', id)
        .single();

      const { data, error} = await query;

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as unknown as Module | ModuleWithLessons,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create a single module
   */
  async createModule(moduleData: ModuleCreateInput): Promise<ApiResponse<Module>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('modules')
        .insert(moduleData)
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
        data: data as Module,
        message: 'Module created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Bulk create modules (e.g., "Add 10 Modules")
   */
  async bulkCreateModules(config: BulkModuleCreateInput): Promise<ApiResponse<BulkOperationResult>> {
    try {
      const supabase = await createClient();

      // Generate modules
      const modules: ModuleCreateInput[] = [];
      for (let i = 0; i < config.count; i++) {
        const n = config.starting_order + i;
        modules.push({
          course_id: config.course_id,
          title: config.title_pattern.replace(/\{n\}/g, n.toString()),
          description: config.description_template
            ? config.description_template.replace(/\{n\}/g, n.toString())
            : undefined,
          order: n,
          is_published: config.is_published || false,
          is_optional: config.is_optional || false,
          duration_minutes: config.duration_minutes,
        });
      }

      // Insert all modules
      const { data, error } = await supabase
        .from('modules')
        .insert(modules)
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
          created_ids: data.map((m: Module) => m.id),
        },
        message: `Successfully created ${data.length} modules`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update a module
   */
  async updateModule(id: string, updates: ModuleUpdateInput): Promise<ApiResponse<Module>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('modules')
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
        data: data as Module,
        message: 'Module updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete a module
   */
  async deleteModule(id: string): Promise<ApiResponse<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('modules')
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
        message: 'Module deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Reorder modules (drag and drop)
   */
  async reorderModules(request: BulkReorderRequest): Promise<ApiResponse<void>> {
    try {
      const supabase = await createClient();

      // Update order for all modules
      const updates = request.items.map((item) =>
        supabase
          .from('modules')
          .update({ order: item.order })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      return {
        success: true,
        message: 'Modules reordered successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Publish a module (make it visible to students)
   */
  async publishModule(id: string): Promise<ApiResponse<Module>> {
    return this.updateModule(id, { is_published: true });
  },

  /**
   * Unpublish a module
   */
  async unpublishModule(id: string): Promise<ApiResponse<Module>> {
    return this.updateModule(id, { is_published: false });
  },

  /**
   * Duplicate a module with all its lessons
   */
  async duplicateModule(id: string, newCourseId?: string): Promise<ApiResponse<Module>> {
    try {
      const supabase = await createClient();

      // Get original module with lessons
      const { data: originalModule, error: fetchError } = await supabase
        .from('modules')
        .select('*, lessons(*, lesson_topics(*))')
        .eq('id', id)
        .single();

      if (fetchError || !originalModule) {
        return {
          success: false,
          error: fetchError?.message || 'Module not found',
        };
      }

      // Create new module
      const { data: newModule, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_id: newCourseId || originalModule.course_id,
          title: `${originalModule.title} (Copy)`,
          description: originalModule.description,
          order: originalModule.order,
          is_published: false,
          is_optional: originalModule.is_optional,
          duration_minutes: originalModule.duration_minutes,
        })
        .select()
        .single();

      if (moduleError || !newModule) {
        return {
          success: false,
          error: moduleError?.message || 'Failed to create module copy',
        };
      }

      // Duplicate lessons
      if (originalModule.lessons && originalModule.lessons.length > 0) {
        for (const lesson of originalModule.lessons) {
          const { data: newLesson } = await supabase
            .from('lessons')
            .insert({
              course_id: newModule.course_id,
              module_id: newModule.id,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              order: lesson.order,
              start_time: lesson.start_time,
              duration: lesson.duration,
              materials: lesson.materials,
              is_published: false,
              status: 'scheduled',
            })
            .select()
            .single();

          // Duplicate topics
          if (newLesson && lesson.topics && lesson.topics.length > 0) {
            const topicsToInsert = lesson.topics.map((topic: any) => ({
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
        }
      }

      return {
        success: true,
        data: newModule as Module,
        message: 'Module duplicated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export default moduleService;