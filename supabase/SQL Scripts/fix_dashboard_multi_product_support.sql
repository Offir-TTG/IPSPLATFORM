-- Fix dashboard function to support multi-product enrollments
-- Issue: Enrollments with product_id (but no program_id/course_id) don't show up
-- Solution: Join through products table to get program/course information

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
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;

  -- Build everything in a single SELECT to avoid any variable assignment issues
  SELECT jsonb_build_object(
    'enrollments', (
      SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', e.id,
          'program_id', COALESCE(e.program_id, prod.program_id),
          'course_id', COALESCE(e.course_id, prod.course_id),
          'program_name', COALESCE(p.name, prog_via_product.name),
          'course_name', COALESCE(c.title, course_via_product.title),
          'course_description', COALESCE(c.description, course_via_product.description),
          'course_image', COALESCE(c.image_url, course_via_product.image_url),
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
              WHERE up.user_id = p_user_id
                AND up.enrollment_id = e.id
                AND up.status = 'completed'
            ), 0
          ),
          'total_lessons', COALESCE(
            (
              SELECT COUNT(*)
              FROM lessons l
              JOIN modules m ON l.module_id = m.id
              WHERE m.course_id = COALESCE(e.course_id, prod.course_id)
            ), 0
          )
        ) as enrollment_data
        FROM enrollments e
        -- Direct joins (for OLD system enrollments)
        LEFT JOIN programs p ON p.id = e.program_id
        LEFT JOIN courses c ON c.id = e.course_id
        -- Joins through products table (for NEW system enrollments)
        LEFT JOIN products prod ON prod.id = e.product_id
        LEFT JOIN programs prog_via_product ON prog_via_product.id = prod.program_id
        LEFT JOIN courses course_via_product ON course_via_product.id = prod.course_id
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
          AND e.tenant_id = v_tenant_id
        ORDER BY e.enrolled_at DESC
        LIMIT 10
      ) enrollments_subquery
    ),
    'upcoming_sessions', (
      SELECT COALESCE(jsonb_agg(session_data ORDER BY start_time ASC), '[]'::jsonb)
      FROM (
        SELECT DISTINCT ON (l.id) jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'course_id', c.id,
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
          'zoom_meeting_id', l.zoom_meeting_id,
          'daily_room_url', l.daily_room_url,
          'daily_room_name', l.daily_room_name,
          'meeting_platform', l.meeting_platform
        ) as session_data,
        l.start_time
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        -- Support both OLD and NEW enrollment systems
        JOIN enrollments e ON (
          (e.course_id = c.id) OR
          (EXISTS (
            SELECT 1 FROM products prod
            WHERE prod.id = e.product_id
            AND prod.course_id = c.id
          ))
        )
        AND e.user_id = p_user_id
        AND e.status = 'active'
        LEFT JOIN users u ON u.id = c.instructor_id
        WHERE l.tenant_id = v_tenant_id
          AND l.start_time IS NOT NULL
          AND l.start_time > NOW()
          AND (
            l.zoom_meeting_id IS NOT NULL OR
            l.daily_room_url IS NOT NULL OR
            l.meeting_platform IS NOT NULL
          )
        ORDER BY l.id, l.start_time ASC
        LIMIT 5
      ) sessions_subquery
    ),
    'pending_assignments', (
      SELECT COALESCE(jsonb_agg(assignment_data ORDER BY due_date ASC), '[]'::jsonb)
      FROM (
        SELECT DISTINCT ON (a.id) jsonb_build_object(
          'id', a.id,
          'title', a.title,
          'course_name', c.title,
          'due_date', a.due_date,
          'max_score', a.max_score,
          'status', COALESCE(us.status, 'pending'),
          'is_overdue', (a.due_date < CURRENT_DATE AND COALESCE(us.status, 'pending') != 'graded')
        ) as assignment_data,
        a.due_date
        FROM assignments a
        JOIN modules m ON a.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        -- Support both OLD and NEW enrollment systems
        JOIN enrollments e ON (
          (e.course_id = c.id) OR
          (EXISTS (
            SELECT 1 FROM products prod
            WHERE prod.id = e.product_id
            AND prod.course_id = c.id
          ))
        )
        AND e.user_id = p_user_id
        AND e.status = 'active'
        LEFT JOIN user_submissions us ON us.assignment_id = a.id AND us.user_id = p_user_id
        WHERE a.tenant_id = v_tenant_id
          AND a.due_date >= CURRENT_DATE
          AND (us.status IS NULL OR us.status IN ('pending', 'submitted'))
        ORDER BY a.id, a.due_date ASC
        LIMIT 5
      ) assignments_subquery
    ),
    'recent_attendance', (
      SELECT COALESCE(jsonb_agg(attendance_data ORDER BY attendance_date DESC), '[]'::jsonb)
      FROM (
        SELECT DISTINCT ON (ua.id) jsonb_build_object(
          'id', ua.id,
          'course_id', c.id,
          'course_name', c.title,
          'lesson_id', l.id,
          'lesson_title', l.title,
          'attendance_date', ua.attendance_date,
          'status', ua.status,
          'notes', ua.notes
        ) as attendance_data,
        ua.attendance_date
        FROM user_attendance ua
        JOIN lessons l ON ua.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE ua.user_id = p_user_id
          AND ua.tenant_id = v_tenant_id
        ORDER BY ua.id, ua.attendance_date DESC
        LIMIT 10
      ) attendance_subquery
    ),
    'stats', (
      SELECT jsonb_build_object(
        'total_courses', (
          SELECT COUNT(DISTINCT COALESCE(e.course_id, prod.course_id))
          FROM enrollments e
          LEFT JOIN products prod ON prod.id = e.product_id
          WHERE e.user_id = p_user_id
            AND e.status = 'active'
            AND e.tenant_id = v_tenant_id
        ),
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
          SELECT COUNT(DISTINCT a.id)
          FROM assignments a
          JOIN modules m ON a.module_id = m.id
          JOIN courses c ON m.course_id = c.id
          -- Support both OLD and NEW enrollment systems
          JOIN enrollments e ON (
            (e.course_id = c.id) OR
            (EXISTS (
              SELECT 1 FROM products prod
              WHERE prod.id = e.product_id
              AND prod.course_id = c.id
            ))
          )
          AND e.user_id = p_user_id
          AND e.status = 'active'
          LEFT JOIN user_submissions us ON us.assignment_id = a.id AND us.user_id = p_user_id
          WHERE a.tenant_id = v_tenant_id
            AND a.due_date >= CURRENT_DATE
            AND (us.status IS NULL OR us.status IN ('pending', 'submitted'))
        ),
        'total_attendance', (
          SELECT COUNT(*)
          FROM user_attendance ua
          WHERE ua.user_id = p_user_id
            AND ua.tenant_id = v_tenant_id
        ),
        'attendance_present', (
          SELECT COUNT(*)
          FROM user_attendance ua
          WHERE ua.user_id = p_user_id
            AND ua.tenant_id = v_tenant_id
            AND ua.status = 'present'
        ),
        'attendance_rate', (
          SELECT CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / COUNT(*)) * 100)
          END
          FROM user_attendance ua
          WHERE ua.user_id = p_user_id
            AND ua.tenant_id = v_tenant_id
        ),
        'total_hours_spent', 0,
        'completion_rate', 0,
        'completed_courses', 0,
        'upcoming_sessions_count', 0,
        'next_session_time', NULL,
        'next_session_title', NULL,
        'current_streak', 0,
        'longest_streak', 0,
        'last_activity_date', NULL
      )
    ),
    'recent_activity', '[]'::jsonb,
    'weekly_activity', '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3 IS 'Get user dashboard data with support for both OLD (direct program_id/course_id) and NEW (product_id) enrollment systems';
