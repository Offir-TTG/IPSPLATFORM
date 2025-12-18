import { supabase } from '@/lib/supabase/client';
import type {
  Course,
  CourseFilter,
  CourseWithModules,
  ApiResponse,
  PaginatedResponse,
} from '@/types/lms';

// ============================================================================
// COURSE SERVICE
// ============================================================================

export const courseService = {
  /**
   * Get all courses with optional filtering
   */
  async listCourses(filter?: CourseFilter): Promise<ApiResponse<Course[]>> {
    try {
      

      let query = supabase
        .from('courses')
        .select('*, program:programs(*), instructor:users(*)')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter?.program_id) {
        query = query.eq('program_id', filter.program_id);
      }

      if (filter?.instructor_id) {
        query = query.eq('instructor_id', filter.instructor_id);
      }

      if (filter?.is_active !== undefined) {
        query = query.eq('is_active', filter.is_active);
      }

      if (filter?.search) {
        query = query.or(
          `title.ilike.%${filter.search}%,description.ilike.%${filter.search}%`
        );
      }

      if (filter?.start_date_from) {
        query = query.gte('start_date', filter.start_date_from);
      }

      if (filter?.start_date_to) {
        query = query.lte('start_date', filter.start_date_to);
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
        data: data as Course[],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get a single course by ID with full hierarchy
   */
  async getCourseById(id: string, includeModules = false): Promise<ApiResponse<Course | CourseWithModules>> {
    try {
      

      let query = supabase
        .from('courses')
        .select(
          includeModules
            ? '*, program:programs(*), instructor:users(*), modules(*, lessons(*, lesson_topics(*)))'
            : '*, program:programs(*), instructor:users(*)'
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
        data: data as unknown as Course | CourseWithModules,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create a new course
   */
  async createCourse(courseData: {
    tenant_id?: string;
    program_id: string | null;
    instructor_id?: string;
    title: string;
    description?: string;
    access_tag?: string;
    start_date: string;
    end_date?: string;
    is_active?: boolean;
    course_type: 'course' | 'lecture' | 'workshop' | 'webinar' | 'session';
    is_standalone?: boolean;
    image_url?: string | null;
  }): Promise<ApiResponse<Course>> {
    try {
      

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select('*, program:programs(*), instructor:users(*)')
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Course,
        message: 'Course created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Update a course
   */
  async updateCourse(
    id: string,
    updates: Partial<Course>
  ): Promise<ApiResponse<Course>> {
    try {
      

      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select('*, program:programs(*), instructor:users(*)')
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data as Course,
        message: 'Course updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Delete a course
   */
  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    try {
      

      const { error } = await supabase.from('courses').delete().eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Course deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Duplicate a course with all its modules and lessons
   */
  async duplicateCourse(
    id: string,
    newTitle?: string
  ): Promise<ApiResponse<Course>> {
    try {
      

      // Get original course with all hierarchy
      const { data: originalCourse, error: fetchError } = await supabase
        .from('courses')
        .select('*, modules(*, lessons(*, lesson_topics(*)))')
        .eq('id', id)
        .single();

      if (fetchError || !originalCourse) {
        return {
          success: false,
          error: fetchError?.message || 'Course not found',
        };
      }

      // Create new course
      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          program_id: originalCourse.program_id,
          instructor_id: originalCourse.instructor_id,
          title: newTitle || `${originalCourse.title} (Copy)`,
          description: originalCourse.description,
          access_tag: originalCourse.access_tag,
          start_date: originalCourse.start_date,
          end_date: originalCourse.end_date,
          is_active: false, // Duplicates start as inactive
          course_type: originalCourse.course_type,
          is_standalone: originalCourse.is_standalone,
        })
        .select()
        .single();

      if (courseError || !newCourse) {
        return {
          success: false,
          error: courseError?.message || 'Failed to create course copy',
        };
      }

      // Duplicate modules and lessons (if any)
      if (originalCourse.modules && originalCourse.modules.length > 0) {
        for (const module of originalCourse.modules) {
          const { data: newModule } = await supabase
            .from('modules')
            .insert({
              course_id: newCourse.id,
              title: module.title,
              description: module.description,
              order: module.order,
              is_published: false,
              is_optional: module.is_optional,
              duration_minutes: module.duration_minutes,
            })
            .select()
            .single();

          // Duplicate lessons
          if (newModule && module.lessons && module.lessons.length > 0) {
            for (const lesson of module.lessons) {
              const { data: newLesson } = await supabase
                .from('lessons')
                .insert({
                  course_id: newCourse.id,
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
        }
      }

      return {
        success: true,
        data: newCourse as Course,
        message: 'Course duplicated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Publish a course (make it visible to students)
   */
  async publishCourse(id: string): Promise<ApiResponse<Course>> {
    return this.updateCourse(id, { is_active: true });
  },

  /**
   * Unpublish a course
   */
  async unpublishCourse(id: string): Promise<ApiResponse<Course>> {
    return this.updateCourse(id, { is_active: false });
  },
};

export default courseService;
