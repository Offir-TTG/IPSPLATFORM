-- Fix get_user_dashboard function to use first_name and last_name instead of full_name

CREATE OR REPLACE FUNCTION get_user_dashboard(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_enrollments JSONB;
  v_upcoming_sessions JSONB;
  v_pending_assignments JSONB;
  v_stats JSONB;
  v_recent_activity JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;

  -- Get active enrollments with progress
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'program_id', e.program_id,
      'course_id', e.course_id,
      'program_name', p.name,
      'course_name', c.title,
      'course_description', c.description,
      'course_image', c.image_url,
      'enrolled_at', e.enrolled_at,
      'completed_at', e.completed_at,
      'overall_progress', COALESCE(
        (
          SELECT ROUND(AVG(progress_percentage))
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.course_id = e.course_id
        ), 0
      ),
      'completed_lessons', COALESCE(
        (
          SELECT COUNT(*)
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.course_id = e.course_id
            AND up.status = 'completed'
        ), 0
      ),
      'total_lessons', COALESCE(
        (
          SELECT COUNT(*)
          FROM lessons l
          WHERE l.course_id = e.course_id
        ), 0
      )
    )
  ), '[]'::jsonb) INTO v_enrollments
  FROM enrollments e
  LEFT JOIN programs p ON p.id = e.program_id
  LEFT JOIN courses c ON c.id = e.course_id
  WHERE e.user_id = p_user_id
    AND e.status = 'active'
    AND e.tenant_id = v_tenant_id
  ORDER BY e.enrolled_at DESC
  LIMIT 10;

  -- Get upcoming sessions (lessons with zoom_config and future start times)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'course_name', c.title,
      'start_time', l.start_time,
      'end_time', l.end_time,
      'instructor_name', CASE
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
        THEN u.first_name || ' ' || u.last_name
        WHEN u.first_name IS NOT NULL
        THEN u.first_name
        ELSE u.email
      END,
      'zoom_meeting_id', l.zoom_meeting_id
    ) ORDER BY l.start_time ASC
  ), '[]'::jsonb) INTO v_upcoming_sessions
  FROM lessons l
  INNER JOIN courses c ON c.id = l.course_id
  INNER JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
  LEFT JOIN users u ON u.id = c.instructor_id
  WHERE l.tenant_id = v_tenant_id
    AND l.start_time IS NOT NULL
    AND l.start_time > NOW()
    AND l.zoom_meeting_id IS NOT NULL
  LIMIT 5;

  -- Get pending assignments
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'title', a.title,
      'course_name', c.title,
      'due_date', a.due_date,
      'max_score', a.max_score,
      'status', COALESCE(ua.status, 'pending'),
      'is_overdue', CASE
        WHEN a.due_date < NOW() AND COALESCE(ua.status, 'pending') != 'submitted'
        THEN true
        ELSE false
      END
    ) ORDER BY a.due_date ASC
  ), '[]'::jsonb) INTO v_pending_assignments
  FROM assignments a
  INNER JOIN courses c ON c.id = a.course_id
  INNER JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
  LEFT JOIN user_assignments ua ON ua.assignment_id = a.id AND ua.user_id = p_user_id
  WHERE a.tenant_id = v_tenant_id
    AND COALESCE(ua.status, 'pending') IN ('pending', 'submitted')
  LIMIT 10;

  -- Calculate stats
  SELECT jsonb_build_object(
    'total_courses', COUNT(DISTINCT e.course_id),
    'completed_lessons', (
      SELECT COUNT(*)
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.status = 'completed'
        AND up.tenant_id = v_tenant_id
    ),
    'in_progress_lessons', (
      SELECT COUNT(*)
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.status = 'in_progress'
        AND up.tenant_id = v_tenant_id
    ),
    'pending_assignments', (
      SELECT COUNT(*)
      FROM assignments a
      INNER JOIN courses c ON c.id = a.course_id
      INNER JOIN enrollments e2 ON e2.course_id = c.id AND e2.user_id = p_user_id AND e2.status = 'active'
      LEFT JOIN user_assignments ua ON ua.assignment_id = a.id AND ua.user_id = p_user_id
      WHERE a.tenant_id = v_tenant_id
        AND COALESCE(ua.status, 'pending') = 'pending'
    ),
    'total_hours_spent', COALESCE((
      SELECT SUM(time_spent_minutes) / 60.0
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.tenant_id = v_tenant_id
    ), 0)
  ) INTO v_stats
  FROM enrollments e
  WHERE e.user_id = p_user_id
    AND e.status = 'active'
    AND e.tenant_id = v_tenant_id;

  -- Get recent activity (last 5 actions)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', up.id,
      'type', 'lesson_progress',
      'lesson_title', l.title,
      'course_name', c.title,
      'status', up.status,
      'timestamp', up.updated_at
    ) ORDER BY up.updated_at DESC
  ), '[]'::jsonb) INTO v_recent_activity
  FROM user_progress up
  INNER JOIN lessons l ON l.id = up.lesson_id
  INNER JOIN courses c ON c.id = up.course_id
  WHERE up.user_id = p_user_id
    AND up.tenant_id = v_tenant_id
  ORDER BY up.updated_at DESC
  LIMIT 5;

  -- Build final result
  v_result := jsonb_build_object(
    'enrollments', v_enrollments,
    'upcoming_sessions', v_upcoming_sessions,
    'pending_assignments', v_pending_assignments,
    'stats', v_stats,
    'recent_activity', v_recent_activity
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
