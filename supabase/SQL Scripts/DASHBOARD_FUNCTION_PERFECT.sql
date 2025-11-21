-- PERFECT DASHBOARD FUNCTION
-- Created based on your actual database schema
-- Key findings from schema analysis:
--   ✓ enrollments.user_id EXISTS (not student_id)
--   ✗ enrollments.expires_at DOES NOT EXIST
--   ✓ user_progress.enrollment_id EXISTS (not course_id)
--   ✓ user_progress.time_spent_seconds EXISTS (not minutes)
--   ✓ lessons.duration EXISTS, end_time DOES NOT EXIST (must calculate)
--   ✓ lessons.module_id AND course_id both exist

DROP FUNCTION IF EXISTS public.get_user_dashboard_v3(UUID) CASCADE;

CREATE FUNCTION public.get_user_dashboard_v3(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_enrollments JSONB;
  v_sessions JSONB;
  v_assignments JSONB;
  v_stats JSONB;
  v_activity JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_user_id;

  -- ============================================================================
  -- ENROLLMENTS WITH PROGRESS
  -- ============================================================================
  SELECT COALESCE(jsonb_agg(enrollment_data ORDER BY enrolled_at DESC), '[]'::jsonb) INTO v_enrollments
  FROM (
    SELECT jsonb_build_object(
      'id', e.id,
      'program_id', e.program_id,
      'course_id', e.course_id,
      'program_name', p.name,
      'course_name', c.title,
      'course_description', c.description,
      'course_image', c.image_url,
      'enrolled_at', e.enrolled_at,
      'completed_at', e.completed_at,
      'status', e.status,
      'payment_status', e.payment_status,
      'contract_signed', COALESCE(e.contract_signed, false),

      -- Calculate overall progress from user_progress
      'overall_progress', COALESCE((
        SELECT ROUND(AVG(up.progress_percentage))
        FROM user_progress up
        WHERE up.enrollment_id = e.id
          AND up.user_id = p_user_id
          AND up.progress_percentage IS NOT NULL
      ), 0),

      -- Count completed lessons
      'completed_lessons', COALESCE((
        SELECT COUNT(*)
        FROM user_progress up
        WHERE up.enrollment_id = e.id
          AND up.user_id = p_user_id
          AND up.status = 'completed'
      ), 0),

      -- Count total lessons for this course
      'total_lessons', COALESCE((
        SELECT COUNT(*)
        FROM lessons l
        LEFT JOIN modules m ON l.module_id = m.id
        WHERE COALESCE(m.course_id, l.course_id) = e.course_id
          AND l.tenant_id = v_tenant_id
      ), 0),

      -- Time spent in hours (convert from seconds)
      'time_spent_hours', COALESCE((
        SELECT ROUND((SUM(up.time_spent_seconds) / 3600.0)::numeric, 1)
        FROM user_progress up
        WHERE up.enrollment_id = e.id
          AND up.user_id = p_user_id
          AND up.time_spent_seconds IS NOT NULL
      ), 0),

      -- Last accessed
      'last_accessed', (
        SELECT MAX(up.last_accessed_at)
        FROM user_progress up
        WHERE up.enrollment_id = e.id
          AND up.user_id = p_user_id
      )
    ) as enrollment_data,
    e.enrolled_at
    FROM enrollments e
    LEFT JOIN programs p ON p.id = e.program_id AND p.tenant_id = v_tenant_id
    LEFT JOIN courses c ON c.id = e.course_id AND c.tenant_id = v_tenant_id
    WHERE e.user_id = p_user_id
      AND e.tenant_id = v_tenant_id
      AND e.status = 'active'
    ORDER BY e.enrolled_at DESC
    LIMIT 10
  ) enrollments_subquery;

  -- ============================================================================
  -- UPCOMING SESSIONS
  -- ============================================================================
  SELECT COALESCE(jsonb_agg(session_data ORDER BY start_time ASC), '[]'::jsonb) INTO v_sessions
  FROM (
    SELECT jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'description', l.description,
      'course_name', c.title,
      'course_id', c.id,
      'start_time', l.start_time,
      -- Calculate end_time from duration
      'end_time', CASE
        WHEN l.duration IS NOT NULL THEN (l.start_time + (l.duration || ' minutes')::interval)
        ELSE l.start_time + interval '60 minutes'
      END,
      'duration', l.duration,
      'instructor_name', CASE
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
        THEN u.first_name || ' ' || u.last_name
        WHEN u.first_name IS NOT NULL
        THEN u.first_name
        ELSE u.email
      END,
      'instructor_email', u.email,
      'zoom_meeting_id', l.zoom_meeting_id,
      'zoom_join_url', l.zoom_join_url,
      'status', COALESCE(up.status, 'not_started')
    ) as session_data,
    l.start_time
    FROM lessons l
    LEFT JOIN modules m ON l.module_id = m.id
    LEFT JOIN courses c ON COALESCE(m.course_id, l.course_id) = c.id
    JOIN enrollments e ON e.course_id = c.id
      AND e.user_id = p_user_id
      AND e.status = 'active'
      AND e.tenant_id = v_tenant_id
    LEFT JOIN users u ON u.id = c.instructor_id
    LEFT JOIN user_progress up ON up.lesson_id = l.id
      AND up.user_id = p_user_id
      AND up.enrollment_id = e.id
    WHERE l.tenant_id = v_tenant_id
      AND l.start_time IS NOT NULL
      AND l.start_time > NOW()
      AND l.zoom_meeting_id IS NOT NULL
    ORDER BY l.start_time ASC
    LIMIT 5
  ) sessions_subquery;

  -- ============================================================================
  -- PENDING ASSIGNMENTS (lessons not completed)
  -- ============================================================================
  SELECT COALESCE(jsonb_agg(assignment_data ORDER BY due_date ASC NULLS LAST), '[]'::jsonb) INTO v_assignments
  FROM (
    SELECT jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'course_name', c.title,
      'due_date', l.start_time,
      'status', COALESCE(up.status, 'not_started'),
      'progress', COALESCE(up.progress_percentage, 0)
    ) as assignment_data,
    l.start_time as due_date
    FROM lessons l
    LEFT JOIN modules m ON l.module_id = m.id
    LEFT JOIN courses c ON COALESCE(m.course_id, l.course_id) = c.id
    JOIN enrollments e ON e.course_id = c.id
      AND e.user_id = p_user_id
      AND e.status = 'active'
      AND e.tenant_id = v_tenant_id
    LEFT JOIN user_progress up ON up.lesson_id = l.id
      AND up.user_id = p_user_id
      AND up.enrollment_id = e.id
    WHERE l.tenant_id = v_tenant_id
      AND COALESCE(up.status, 'not_started') != 'completed'
      AND (l.start_time IS NULL OR l.start_time <= NOW() + interval '7 days')
    ORDER BY l.start_time ASC NULLS LAST
    LIMIT 5
  ) assignments_subquery;

  -- ============================================================================
  -- STATS
  -- ============================================================================
  v_stats := jsonb_build_object(
    'total_courses', COALESCE((
      SELECT COUNT(DISTINCT course_id)
      FROM enrollments
      WHERE user_id = p_user_id
        AND status = 'active'
        AND tenant_id = v_tenant_id
    ), 0),

    'completed_lessons', COALESCE((
      SELECT COUNT(*)
      FROM user_progress up
      JOIN enrollments e ON e.id = up.enrollment_id
      WHERE up.user_id = p_user_id
        AND up.status = 'completed'
        AND e.status = 'active'
        AND up.tenant_id = v_tenant_id
    ), 0),

    'in_progress_lessons', COALESCE((
      SELECT COUNT(*)
      FROM user_progress up
      JOIN enrollments e ON e.id = up.enrollment_id
      WHERE up.user_id = p_user_id
        AND up.status = 'in_progress'
        AND e.status = 'active'
        AND up.tenant_id = v_tenant_id
    ), 0),

    'pending_assignments', COALESCE((
      SELECT COUNT(*)
      FROM lessons l
      LEFT JOIN modules m ON l.module_id = m.id
      LEFT JOIN courses c ON COALESCE(m.course_id, l.course_id) = c.id
      JOIN enrollments e ON e.course_id = c.id
        AND e.user_id = p_user_id
        AND e.status = 'active'
        AND e.tenant_id = v_tenant_id
      LEFT JOIN user_progress up ON up.lesson_id = l.id
        AND up.user_id = p_user_id
        AND up.enrollment_id = e.id
      WHERE l.tenant_id = v_tenant_id
        AND COALESCE(up.status, 'not_started') != 'completed'
    ), 0),

    'total_hours_spent', COALESCE((
      SELECT ROUND((SUM(up.time_spent_seconds) / 3600.0)::numeric, 1)
      FROM user_progress up
      JOIN enrollments e ON e.id = up.enrollment_id
      WHERE up.user_id = p_user_id
        AND e.status = 'active'
        AND up.tenant_id = v_tenant_id
        AND up.time_spent_seconds IS NOT NULL
    ), 0)
  );

  -- ============================================================================
  -- RECENT ACTIVITY
  -- ============================================================================
  SELECT COALESCE(jsonb_agg(activity_data ORDER BY timestamp DESC), '[]'::jsonb) INTO v_activity
  FROM (
    SELECT jsonb_build_object(
      'id', up.id,
      'type', CASE
        WHEN up.completed_at IS NOT NULL THEN 'completed'
        WHEN up.started_at IS NOT NULL THEN 'started'
        ELSE 'accessed'
      END,
      'lesson_title', l.title,
      'course_name', c.title,
      'timestamp', COALESCE(up.completed_at, up.started_at, up.last_accessed_at),
      'progress', up.progress_percentage
    ) as activity_data,
    COALESCE(up.completed_at, up.started_at, up.last_accessed_at) as timestamp
    FROM user_progress up
    JOIN enrollments e ON e.id = up.enrollment_id
    LEFT JOIN lessons l ON l.id = up.lesson_id
    LEFT JOIN modules m ON l.module_id = m.id
    LEFT JOIN courses c ON COALESCE(m.course_id, l.course_id) = c.id
    WHERE up.user_id = p_user_id
      AND e.status = 'active'
      AND up.tenant_id = v_tenant_id
      AND (up.completed_at IS NOT NULL OR up.started_at IS NOT NULL OR up.last_accessed_at IS NOT NULL)
    ORDER BY COALESCE(up.completed_at, up.started_at, up.last_accessed_at) DESC
    LIMIT 10
  ) activity_subquery;

  -- ============================================================================
  -- BUILD FINAL RESULT
  -- ============================================================================
  v_result := jsonb_build_object(
    'enrollments', v_enrollments,
    'upcoming_sessions', v_sessions,
    'pending_assignments', v_assignments,
    'stats', v_stats,
    'recent_activity', v_activity
  );

  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS
'Perfect dashboard function v3 - matches actual database schema
- Uses enrollment_id for progress tracking
- Calculates end_time from duration
- Uses time_spent_seconds (not minutes)
- No expires_at field (does not exist)
- Handles both module_id and course_id in lessons';

-- Success message
SELECT '✓ Perfect dashboard function created!' as status,
       'Test with: SELECT get_user_dashboard_v3(''d7cb0921-4af6-4641-bdbd-c14c59eba9dc'');' as test_command;
