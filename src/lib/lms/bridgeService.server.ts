/**
 * Instructor Bridge Service
 * Handles routing instructors to the correct Zoom meeting based on current time
 */

import { createClient } from '@/lib/supabase/server';

export interface BridgeLink {
  id: string;
  tenant_id: string;
  course_id: string;
  instructor_id: string | null;
  bridge_slug: string;
  is_active: boolean;
  grace_before_minutes: number;
  grace_after_minutes: number;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface CurrentLesson {
  lesson_id: string;
  lesson_title: string;
  lesson_start_time: string;
  zoom_start_url: string;
  zoom_join_url: string;
  zoom_meeting_id: string;
  is_current: boolean;
  is_upcoming: boolean;
  minutes_until_start?: number;
}

export const bridgeService = {
  /**
   * Get bridge link by slug
   */
  async getBridgeLinkBySlug(slug: string): Promise<{ success: boolean; data?: BridgeLink; error?: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('instructor_bridge_links')
        .select('*')
        .eq('bridge_slug', slug)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, error: 'Bridge link not found' };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get current or next lesson for a bridge link
   * Finds the lesson that is currently live or upcoming within a time window
   */
  async getCurrentLessonForBridge(
    bridgeSlug: string,
    graceBefore?: number, // Minutes before scheduled start (defaults to bridge setting)
    graceAfter?: number // Minutes after scheduled start (defaults to bridge setting)
  ): Promise<{ success: boolean; data?: CurrentLesson; error?: string; nextLesson?: any }> {
    try {
      const supabase = await createClient();

      // Get bridge link
      const bridgeResult = await this.getBridgeLinkBySlug(bridgeSlug);
      if (!bridgeResult.success || !bridgeResult.data) {
        return { success: false, error: 'Bridge link not found' };
      }

      const bridgeLink = bridgeResult.data;

      // Use bridge settings or provided overrides
      const graceBeforeMinutes = graceBefore ?? bridgeLink.grace_before_minutes;
      const graceAfterMinutes = graceAfter ?? bridgeLink.grace_after_minutes;

      const now = new Date();
      const windowStart = new Date(now.getTime() - graceBeforeMinutes * 60 * 1000);
      const windowEnd = new Date(now.getTime() + graceAfterMinutes * 60 * 1000);

      // Get module IDs for this course
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', bridgeLink.course_id);

      if (!modules || modules.length === 0) {
        return { success: false, error: 'No modules found in this course' };
      }

      const moduleIds = modules.map(m => m.id);

      // Find lessons in the time window with their Zoom sessions
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          start_time,
          duration,
          module_id,
          zoom_sessions (
            id,
            zoom_meeting_id,
            join_url,
            start_url
          )
        `)
        .in('module_id', moduleIds)
        .gte('start_time', windowStart.toISOString())
        .lte('start_time', windowEnd.toISOString())
        .not('zoom_sessions', 'is', null)
        .order('start_time', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!lessons || lessons.length === 0) {
        // Find the next upcoming lesson in this course
        const { data: upcomingLessons } = await supabase
          .from('lessons')
          .select('id, title, start_time')
          .in('module_id', moduleIds)
          .gt('start_time', now.toISOString())
          .order('start_time', { ascending: true })
          .limit(1);

        return {
          success: false,
          error: 'No active session right now',
          nextLesson: upcomingLessons && upcomingLessons[0] ? upcomingLessons[0] : null,
        };
      }

      // Get the first lesson (earliest in the window)
      const lesson = lessons[0];
      const zoomSession = lesson.zoom_sessions?.[0];

      if (!zoomSession) {
        return { success: false, error: 'No Zoom meeting configured for this lesson' };
      }

      const lessonStart = new Date(lesson.start_time);
      const minutesUntilStart = Math.floor((lessonStart.getTime() - now.getTime()) / (60 * 1000));
      const isCurrent = minutesUntilStart <= 0 && minutesUntilStart >= -graceAfterMinutes;
      const isUpcoming = minutesUntilStart > 0 && minutesUntilStart <= graceBeforeMinutes;

      // Update last_used_at timestamp
      await supabase
        .from('instructor_bridge_links')
        .update({ last_used_at: now.toISOString() })
        .eq('bridge_slug', bridgeSlug);

      return {
        success: true,
        data: {
          lesson_id: lesson.id,
          lesson_title: lesson.title,
          lesson_start_time: lesson.start_time,
          zoom_start_url: zoomSession.start_url,
          zoom_join_url: zoomSession.join_url,
          zoom_meeting_id: zoomSession.zoom_meeting_id,
          is_current: isCurrent,
          is_upcoming: isUpcoming,
          minutes_until_start: minutesUntilStart > 0 ? minutesUntilStart : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Create a new bridge link
   */
  async createBridgeLink(params: {
    course_id: string;
    instructor_id?: string;
    custom_slug?: string;
    grace_before_minutes?: number;
    grace_after_minutes?: number;
  }): Promise<{ success: boolean; data?: BridgeLink; error?: string }> {
    try {
      const supabase = await createClient();

      // Get tenant_id from course
      const { data: course } = await supabase
        .from('courses')
        .select('tenant_id')
        .eq('id', params.course_id)
        .single();

      if (!course) {
        return { success: false, error: 'Course not found' };
      }

      // Generate slug if not provided
      const slug = params.custom_slug || `bridge-${Math.random().toString(36).substring(2, 10)}`;

      const { data, error } = await supabase
        .from('instructor_bridge_links')
        .insert({
          tenant_id: course.tenant_id,
          course_id: params.course_id,
          instructor_id: params.instructor_id || null,
          bridge_slug: slug,
          is_active: true,
          grace_before_minutes: params.grace_before_minutes ?? 15,
          grace_after_minutes: params.grace_after_minutes ?? 30,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Deactivate a bridge link
   */
  async deactivateBridgeLink(slug: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('instructor_bridge_links')
        .update({ is_active: false })
        .eq('bridge_slug', slug);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
