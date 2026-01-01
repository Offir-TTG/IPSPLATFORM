-- ============================================================================
-- MIGRATE INSTRUCTOR BRIDGE LINKS TO COURSE LEVEL
-- ============================================================================
-- Date: 2025-01-31
-- Purpose: Migrate instructor bridge links from program-level to course-level
--          The database schema already has course_id, but this ensures all
--          columns exist and updates the database function to work at course level
-- ============================================================================

-- Add missing columns if they don't exist
ALTER TABLE public.instructor_bridge_links
ADD COLUMN IF NOT EXISTS grace_before_minutes INTEGER DEFAULT 15;

ALTER TABLE public.instructor_bridge_links
ADD COLUMN IF NOT EXISTS grace_after_minutes INTEGER DEFAULT 30;

ALTER TABLE public.instructor_bridge_links
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Add comments for new columns
COMMENT ON COLUMN public.instructor_bridge_links.grace_before_minutes IS
'Minutes before scheduled lesson start that instructor can access the meeting';

COMMENT ON COLUMN public.instructor_bridge_links.grace_after_minutes IS
'Minutes after scheduled lesson start that instructor can still access the meeting';

COMMENT ON COLUMN public.instructor_bridge_links.last_used_at IS
'Timestamp of when the bridge link was last accessed';

-- Drop old program-level database function if it exists
DROP FUNCTION IF EXISTS public.get_current_lesson_for_bridge(TEXT, TIMESTAMPTZ);

-- Create new course-level database function
CREATE OR REPLACE FUNCTION public.get_current_lesson_for_bridge_by_course(
  bridge_slug_param TEXT,
  now_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  lesson_id UUID,
  lesson_title TEXT,
  lesson_start_time TIMESTAMPTZ,
  zoom_start_url TEXT,
  zoom_join_url TEXT,
  zoom_meeting_id TEXT,
  is_current BOOLEAN,
  is_upcoming BOOLEAN,
  minutes_until_start INTEGER
) AS $$
DECLARE
  v_course_id UUID;
  v_grace_before INTEGER;
  v_grace_after INTEGER;
  v_window_start TIMESTAMPTZ;
  v_window_end TIMESTAMPTZ;
BEGIN
  -- Get bridge link configuration
  SELECT
    b.course_id,
    b.grace_before_minutes,
    b.grace_after_minutes,
    now_param - (b.grace_before_minutes || ' minutes')::INTERVAL,
    now_param + (b.grace_after_minutes || ' minutes')::INTERVAL
  INTO
    v_course_id,
    v_grace_before,
    v_grace_after,
    v_window_start,
    v_window_end
  FROM public.instructor_bridge_links b
  WHERE b.bridge_slug = bridge_slug_param
    AND b.is_active = true;

  -- If no active bridge found, return empty
  IF v_course_id IS NULL THEN
    RETURN;
  END IF;

  -- Find lessons within the grace period window for this course
  RETURN QUERY
  SELECT
    l.id AS lesson_id,
    l.title AS lesson_title,
    l.start_time AS lesson_start_time,
    zs.start_url AS zoom_start_url,
    zs.join_url AS zoom_join_url,
    zs.zoom_meeting_id,
    -- is_current: lesson has started but within grace after period
    (l.start_time <= now_param AND l.start_time >= now_param - (v_grace_after || ' minutes')::INTERVAL) AS is_current,
    -- is_upcoming: lesson hasn't started but within grace before period
    (l.start_time > now_param AND l.start_time <= now_param + (v_grace_before || ' minutes')::INTERVAL) AS is_upcoming,
    -- minutes until start (negative if already started)
    EXTRACT(EPOCH FROM (l.start_time - now_param))::INTEGER / 60 AS minutes_until_start
  FROM public.lessons l
  INNER JOIN public.modules m ON m.id = l.module_id
  INNER JOIN public.zoom_sessions zs ON zs.lesson_id = l.id
  WHERE m.course_id = v_course_id
    AND l.start_time IS NOT NULL
    AND l.start_time >= v_window_start
    AND l.start_time <= v_window_end
    AND zs.start_url IS NOT NULL
  ORDER BY l.start_time ASC
  LIMIT 1;  -- Return only the earliest lesson in the window
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for the function
COMMENT ON FUNCTION public.get_current_lesson_for_bridge_by_course IS
'Returns the current or upcoming lesson for a course-level instructor bridge link based on grace period';

-- Grant execute permission to authenticated users (needed for bridge access)
GRANT EXECUTE ON FUNCTION public.get_current_lesson_for_bridge_by_course TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_lesson_for_bridge_by_course TO anon;

-- Update last_used_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_bridge_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_used_at (if it doesn't exist)
DROP TRIGGER IF EXISTS trigger_update_bridge_last_used ON public.instructor_bridge_links;

CREATE TRIGGER trigger_update_bridge_last_used
  BEFORE UPDATE ON public.instructor_bridge_links
  FOR EACH ROW
  WHEN (OLD.last_used_at IS DISTINCT FROM NEW.last_used_at)
  EXECUTE FUNCTION public.update_bridge_last_used();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- 1. Added grace period columns (grace_before_minutes, grace_after_minutes)
-- 2. Added last_used_at column for tracking usage
-- 3. Dropped old program-level function
-- 4. Created new course-level function that queries modules for single course
-- 5. Added trigger to auto-update last_used_at timestamp
-- ============================================================================
