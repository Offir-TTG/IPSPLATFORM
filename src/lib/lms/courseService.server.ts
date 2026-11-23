import { createClient } from '@/lib/supabase/server';
import type {
  Course,
  CourseFilter,
  CourseWithModules,
  ApiResponse,
} from '@/types/lms';

// ============================================================================
// SERVER-SIDE COURSE SERVICE
//
// Mirror of `courseService.ts` that uses the request-scoped Supabase server
// client (cookie-bound, so `auth.uid()` resolves correctly) instead of the
// browser singleton. Use this from API routes — the original `courseService`
// imports the browser client which runs as anon on the server and is rejected
// by the SELECT policies on `public.courses`.
// ============================================================================

export const courseService = {
  /**
   * Get all courses with optional filtering.
   */
  async listCourses(filter?: CourseFilter): Promise<ApiResponse<Course[]>> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('courses')
        .select(
          '*, program:programs(id, name, is_active), instructor:users(id, first_name, last_name, email)'
        )
        .order('created_at', { ascending: false });

      if (filter?.tenant_id) {
        query = query.eq('tenant_id', filter.tenant_id);
      }
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
        // Commas, brackets, quotes and wildcards would break the .or() filter.
        const term = filter.search.replace(/[,()"%*\\]/g, ' ').trim();
        if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
      }
      if (filter?.start_date_from) {
        query = query.gte('start_date', filter.start_date_from);
      }
      if (filter?.start_date_to) {
        query = query.lte('start_date', filter.start_date_to);
      }

      query = query.limit(1000);

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as Course[] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get a single course by ID, optionally with its modules.
   */
  async getCourseById(
    id: string,
    includeModules = false
  ): Promise<ApiResponse<Course | CourseWithModules>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('courses')
        .select(
          includeModules
            ? '*, program:programs(id, name, is_active), instructor:users(id, first_name, last_name, email), modules(id, title, description, order, is_published)'
            : '*, program:programs(id, name, is_active), instructor:users(id, first_name, last_name, email)'
        )
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
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
   * Create a new course.
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
    is_published?: boolean;
  }): Promise<ApiResponse<Course>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('courses')
        .insert(courseData)
        .select('*, program:programs(*), instructor:users(*)')
        .single();

      if (error) {
        return { success: false, error: error.message };
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
   * Update a course.
   */
  async updateCourse(
    id: string,
    updates: Partial<Course>
  ): Promise<ApiResponse<Course>> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select('*, program:programs(*), instructor:users(*)')
        .single();

      if (error) {
        return { success: false, error: error.message };
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
   * Delete a course.
   */
  async deleteCourse(id: string): Promise<ApiResponse<void>> {
    try {
      const supabase = await createClient();

      const { error } = await supabase.from('courses').delete().eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Course deleted successfully' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Duplicate a course with all its modules and lessons.
   */
  /**
   * A full copy of a course as a draft: its details (with its own copy of
   * the picture), modules, lessons and lesson content, in the same tenant
   * and program. Zoom/Daily meetings and recordings are not copied: each
   * lesson in the copy needs its own meeting.
   */
  async duplicateCourse(
    id: string,
    newTitle?: string
  ): Promise<ApiResponse<Course>> {
    try {
      const supabase = await createClient();

      const { data: originalCourse, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !originalCourse) {
        return {
          success: false,
          error: fetchError?.message || 'Course not found',
        };
      }

      // Its own copy of the picture, so changing one course's picture
      // never deletes the other's.
      let imageUrl: string | null = originalCourse.image_url ?? null;
      const marker = '/course-images/';
      if (imageUrl && imageUrl.includes(marker)) {
        const from = decodeURIComponent(imageUrl.split(marker)[1].split('?')[0]);
        const ext = from.includes('.') ? from.slice(from.lastIndexOf('.')) : '';
        const to = `courses/copy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        const { error: copyError } = await supabase.storage.from('course-images').copy(from, to);
        imageUrl = copyError ? null : supabase.storage.from('course-images').getPublicUrl(to).data.publicUrl;
      }

      const { data: newCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          tenant_id: originalCourse.tenant_id,
          program_id: originalCourse.program_id,
          instructor_id: originalCourse.instructor_id,
          title: newTitle || `${originalCourse.title} (Copy)`,
          description: originalCourse.description,
          access_tag: originalCourse.access_tag,
          start_date: originalCourse.start_date,
          end_date: originalCourse.end_date,
          is_active: false,
          course_type: originalCourse.course_type,
          is_standalone: originalCourse.is_standalone,
          image_url: imageUrl,
          is_published: false,
          grading_scale_id: originalCourse.grading_scale_id ?? null,
        })
        .select()
        .single();

      if (courseError || !newCourse) {
        return {
          success: false,
          error: courseError?.message || 'Failed to create course copy',
        };
      }

      if (newCourse.program_id) {
        const { data: last } = await supabase
          .from('program_courses')
          .select('order')
          .eq('program_id', newCourse.program_id)
          .order('order', { ascending: false })
          .limit(1);
        await supabase.from('program_courses').insert({
          program_id: newCourse.program_id,
          course_id: newCourse.id,
          is_required: true,
          order: last && last.length > 0 ? last[0].order + 1 : 0,
        });
      }

      // Read everything in three queries, then write one module at a time.
      const { data: modules } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', id)
        .order('order', { ascending: true });
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order', { ascending: true });
      const lessonIds = (lessons || []).map((l: any) => l.id);
      const topics: any[] = lessonIds.length
        ? (await supabase.from('lesson_topics').select('*').in('lesson_id', lessonIds).order('order', { ascending: true })).data || []
        : [];

      const failed: string[] = [];
      for (const module of modules || []) {
        const { data: newModule, error: moduleError } = await supabase
          .from('modules')
          .insert({
            tenant_id: module.tenant_id ?? newCourse.tenant_id,
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
        if (moduleError || !newModule) {
          failed.push(module.title);
          continue;
        }

        const moduleLessons = (lessons || []).filter((l: any) => l.module_id === module.id);
        for (const lesson of moduleLessons) {
          const { data: newLesson, error: lessonError } = await supabase
            .from('lessons')
            .insert({
              tenant_id: lesson.tenant_id ?? newCourse.tenant_id,
              course_id: newCourse.id,
              module_id: newModule.id,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              content_blocks: lesson.content_blocks,
              order: lesson.order,
              start_time: lesson.start_time,
              timezone: lesson.timezone,
              duration: lesson.duration,
              materials: lesson.materials,
              is_published: false,
              status: 'scheduled',
            })
            .select('id')
            .single();
          if (lessonError || !newLesson) {
            failed.push(lesson.title);
            continue;
          }
          const lessonTopics = topics
            .filter((x: any) => x.lesson_id === lesson.id)
            .map(({ id: _id, lesson_id: _lesson, created_at: _c, updated_at: _u, search_vector: _s, ...rest }: any) => ({
              ...rest,
              lesson_id: newLesson.id,
            }));
          if (lessonTopics.length > 0) {
            const { error: topicsError } = await supabase.from('lesson_topics').insert(lessonTopics);
            if (topicsError) failed.push(lesson.title);
          }
        }
      }

      return {
        success: true,
        data: newCourse as Course,
        message: failed.length
          ? `Course duplicated, but some parts were not copied: ${failed.join(', ')}`
          : 'Course duplicated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async publishCourse(id: string): Promise<ApiResponse<Course>> {
    return this.updateCourse(id, { is_active: true });
  },

  async unpublishCourse(id: string): Promise<ApiResponse<Course>> {
    return this.updateCourse(id, { is_active: false });
  },
};

export default courseService;
