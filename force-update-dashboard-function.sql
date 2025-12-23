-- Force drop and recreate the dashboard function
DROP FUNCTION IF EXISTS public.get_user_dashboard_v3(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_dashboard_v2(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_dashboard(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_dashboard_v3(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;

  -- Build result
  SELECT jsonb_build_object(
    'enrollments', (
      SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', e.id,
          'program_id', prod.program_id,
          'course_id', prod.course_id,
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
                AND up.enrollment_id = e.id
            ), 0
          ),
          'completed_lessons', COALESCE(
            (
              SELECT COUNT(*)
              FROM user_progress up
              JOIN lessons l ON l.id = up.lesson_id
              JOIN modules m ON m.id = l.module_id
              WHERE up.user_id = p_user_id
                AND up.enrollment_id = e.id
                AND up.status = 'completed'
                AND l.is_published = true
                AND m.is_published = true
            ), 0
          ),
          'total_lessons', COALESCE(
            (
              SELECT COUNT(*)
              FROM lessons l
              JOIN modules m ON l.module_id = m.id
              WHERE m.course_id = COALESCE(prod.course_id, c.id)
                AND l.is_published = true
                AND m.is_published = true
            ), 0
          )
        ) as enrollment_data
        FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        LEFT JOIN programs p ON p.id = prod.program_id
        LEFT JOIN courses c ON c.id = prod.course_id
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
          AND e.tenant_id = v_tenant_id
          AND (c.is_active = true OR c.is_active IS NULL)
        ORDER BY e.enrolled_at DESC
        LIMIT 10
      ) enrollments_subquery
    ),
    'upcoming_sessions', (
      SELECT COALESCE(jsonb_agg(session_data ORDER BY session_start_time ASC), '[]'::jsonb)
      FROM (
        SELECT DISTINCT ON (l.id) jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'course_id', c.id,
          'course_name', c.title,
          'start_time', l.start_time,
          'end_time', (l.start_time + (l.duration || ' minutes')::interval),
          'instructor_name', CASE
            WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
            THEN u.first_name || ' ' || u.last_name
            WHEN u.first_name IS NOT NULL
            THEN u.first_name
            ELSE u.email
          END,
          'zoom_meeting_id', l.zoom_meeting_id,
          'daily_room_url', zs.daily_room_url,
          'daily_room_name', zs.daily_room_name,
          'meeting_platform', CASE
            WHEN l.zoom_meeting_id IS NOT NULL THEN 'zoom'
            WHEN zs.daily_room_name IS NOT NULL THEN 'daily'
            ELSE NULL
          END
        ) as session_data,
        l.start_time as session_start_time,
        l.id
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        JOIN enrollments e ON e.user_id = p_user_id AND e.status = 'active' AND e.tenant_id = v_tenant_id
        JOIN products prod ON prod.id = e.product_id AND (
          prod.course_id = c.id
          OR
          EXISTS (
            SELECT 1 FROM program_courses pc
            WHERE pc.program_id = prod.program_id
              AND pc.course_id = c.id
          )
        )
        LEFT JOIN users u ON u.id = c.instructor_id
        LEFT JOIN zoom_sessions zs ON zs.lesson_id = l.id
        WHERE l.tenant_id = v_tenant_id
          AND l.start_time IS NOT NULL
          AND l.start_time > NOW()
          AND (l.zoom_meeting_id IS NOT NULL OR zs.daily_room_name IS NOT NULL)
          AND l.is_published = true
          AND m.is_published = true
          AND c.is_active = true
        ORDER BY l.id, l.start_time ASC
        LIMIT 5
      ) sessions_subquery
    ),
    'recent_attendance', (
      SELECT COALESCE(jsonb_agg(attendance_data ORDER BY att_date DESC), '[]'::jsonb)
      FROM (
        SELECT
          jsonb_build_object(
            'id', a.id,
            'course_id', a.course_id,
            'course_name', c.title,
            'lesson_id', a.lesson_id,
            'lesson_title', l.title,
            'attendance_date', a.attendance_date,
            'status', a.status,
            'notes', a.notes
          ) as attendance_data,
          a.attendance_date as att_date
        FROM attendance a
        JOIN courses c ON c.id = a.course_id
        LEFT JOIN lessons l ON l.id = a.lesson_id
        WHERE a.student_id = p_user_id
          AND a.tenant_id = v_tenant_id
          AND c.is_active = true
        ORDER BY a.attendance_date DESC
        LIMIT 30
      ) attendance_subquery
    ),
    'pending_assignments', '[]'::jsonb,
    'stats', jsonb_build_object(
      'total_courses', (
        SELECT COUNT(DISTINCT prod.course_id)
        FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        LEFT JOIN courses c ON c.id = prod.course_id
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
          AND e.tenant_id = v_tenant_id
          AND prod.course_id IS NOT NULL
          AND (c.is_active = true OR c.is_active IS NULL)
      ),
      'completed_lessons', (
        SELECT COUNT(*)
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE up.user_id = p_user_id
          AND up.status = 'completed'
          AND up.tenant_id = v_tenant_id
          AND l.is_published = true
          AND m.is_published = true
      ),
      'in_progress_lessons', (
        SELECT COUNT(*)
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE up.user_id = p_user_id
          AND up.status = 'in_progress'
          AND up.tenant_id = v_tenant_id
          AND l.is_published = true
          AND m.is_published = true
      ),
      'pending_assignments', 0,
      'total_attendance', (
        SELECT COUNT(*)
        FROM attendance a
        WHERE a.student_id = p_user_id
          AND a.tenant_id = v_tenant_id
      ),
      'attendance_present', (
        SELECT COUNT(*)
        FROM attendance a
        WHERE a.student_id = p_user_id
          AND a.tenant_id = v_tenant_id
          AND a.status = 'present'
      ),
      'attendance_rate', (
        SELECT CASE
          WHEN COUNT(*) > 0 THEN
            ROUND((COUNT(*) FILTER (WHERE status = 'present')::NUMERIC / COUNT(*) * 100), 1)
          ELSE 0
        END
        FROM attendance a
        WHERE a.student_id = p_user_id
          AND a.tenant_id = v_tenant_id
      ),
      'total_hours_spent', COALESCE((
        SELECT SUM(time_spent_seconds) / 3600.0
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON m.id = l.module_id
        WHERE up.user_id = p_user_id
          AND up.tenant_id = v_tenant_id
          AND l.is_published = true
          AND m.is_published = true
      ), 0)
    ),
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(activity_data ORDER BY activity_timestamp DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', up.id,
          'type', 'lesson_progress',
          'lesson_title', l.title,
          'course_name', c.title,
          'status', up.status,
          'timestamp', up.updated_at
        ) as activity_data,
        up.updated_at as activity_timestamp
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE up.user_id = p_user_id
          AND up.tenant_id = v_tenant_id
          AND l.is_published = true
          AND m.is_published = true
          AND c.is_active = true
        ORDER BY up.updated_at DESC
        LIMIT 5
      ) activity_subquery
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS 'Dashboard aggregation V3 - With attendance stats (total, present, rate)';

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
