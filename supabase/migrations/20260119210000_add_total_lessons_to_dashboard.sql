-- Add total_lessons to dashboard stats
-- Issue: ProgressOverview component expects total_lessons but SQL function doesn't return it
-- This causes the progress chart to show incorrect percentages

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

  -- If user not found, return empty result
  IF v_tenant_id IS NULL THEN
    RETURN jsonb_build_object(
      'enrollments', '[]'::jsonb,
      'upcoming_sessions', '[]'::jsonb,
      'pending_assignments', '[]'::jsonb,
      'recent_attendance', '[]'::jsonb,
      'stats', jsonb_build_object(
        'total_courses', 0,
        'completed_lessons', 0,
        'in_progress_lessons', 0,
        'total_lessons', 0,
        'pending_assignments', 0,
        'total_attendance', 0,
        'attendance_present', 0,
        'attendance_rate', 0
      ),
      'recent_activity', '[]'::jsonb,
      'weekly_activity', '[]'::jsonb
    );
  END IF;

  -- Build everything in a single SELECT to avoid any variable assignment issues
  SELECT jsonb_build_object(
    'enrollments', (
      SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', e.id,
          'program_id', prod.program_id,
          'course_id', prod.course_id,
          'program_name', prog.name,
          'course_name', c.title,
          'course_description', c.description,
          'course_image', c.image_url,
          'product_title', prod.title,
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
              WHERE m.course_id = prod.course_id
                AND prod.course_id IS NOT NULL
            ), 0
          )
        ) as enrollment_data
        FROM enrollments e
        -- Join through products table (enrollments only have product_id)
        INNER JOIN products prod ON prod.id = e.product_id
        LEFT JOIN programs prog ON prog.id = prod.program_id
        LEFT JOIN courses c ON c.id = prod.course_id
        WHERE e.user_id = p_user_id
          AND e.status IN ('active', 'completed', 'pending')
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
          'end_time', CASE
            WHEN l.duration IS NOT NULL THEN l.start_time + (l.duration || ' minutes')::INTERVAL
            ELSE NULL
          END,
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
        JOIN enrollments e ON e.user_id = p_user_id
          AND e.status IN ('active', 'completed', 'pending')
          AND e.tenant_id = v_tenant_id
        JOIN products prod ON prod.id = e.product_id
          AND prod.course_id = c.id
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
          'status', COALESCE(asub.status, 'pending'),
          'is_overdue', (a.due_date < CURRENT_DATE AND COALESCE(asub.status, 'pending') != 'graded')
        ) as assignment_data,
        a.due_date
        FROM assignments a
        JOIN lessons l ON a.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        JOIN enrollments e ON e.user_id = p_user_id
          AND e.status IN ('active', 'completed', 'pending')
          AND e.tenant_id = v_tenant_id
        JOIN products prod ON prod.id = e.product_id
          AND prod.course_id = c.id
        LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.user_id = p_user_id
        WHERE a.tenant_id = v_tenant_id
          AND a.due_date >= CURRENT_DATE
          AND (asub.status IS NULL OR asub.status IN ('pending', 'submitted'))
        ORDER BY a.id, a.due_date ASC
        LIMIT 5
      ) assignments_subquery
    ),
    'recent_attendance', (
      SELECT COALESCE(jsonb_agg(attendance_data ORDER BY created_at DESC), '[]'::jsonb)
      FROM (
        SELECT DISTINCT ON (att.id) jsonb_build_object(
          'id', att.id,
          'course_id', c.id,
          'course_name', c.title,
          'lesson_id', l.id,
          'lesson_title', l.title,
          'attendance_date', att.created_at,
          'status', att.status,
          'notes', att.notes
        ) as attendance_data,
        att.created_at
        FROM attendance att
        JOIN lessons l ON att.lesson_id = l.id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE att.user_id = p_user_id
          AND att.tenant_id = v_tenant_id
        ORDER BY att.id, att.created_at DESC
        LIMIT 10
      ) attendance_subquery
    ),
    'stats', (
      SELECT jsonb_build_object(
        'total_courses', (
          SELECT COUNT(DISTINCT prod.course_id)
          FROM enrollments e
          INNER JOIN products prod ON prod.id = e.product_id
          WHERE e.user_id = p_user_id
            AND e.status IN ('active', 'completed', 'pending')
            AND e.tenant_id = v_tenant_id
            AND prod.course_id IS NOT NULL
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
        'total_lessons', (
          SELECT COALESCE(SUM(lesson_count), 0)
          FROM (
            SELECT COUNT(DISTINCT l.id) as lesson_count
            FROM enrollments e
            INNER JOIN products prod ON prod.id = e.product_id
            INNER JOIN modules m ON m.course_id = prod.course_id
            INNER JOIN lessons l ON l.module_id = m.id
            WHERE e.user_id = p_user_id
              AND e.status IN ('active', 'completed', 'pending')
              AND e.tenant_id = v_tenant_id
              AND prod.course_id IS NOT NULL
            GROUP BY prod.course_id
          ) course_lessons
        ),
        'pending_assignments', (
          SELECT COUNT(DISTINCT a.id)
          FROM assignments a
          JOIN lessons l ON a.lesson_id = l.id
          JOIN modules m ON l.module_id = m.id
          JOIN courses c ON m.course_id = c.id
          JOIN enrollments e ON e.user_id = p_user_id
            AND e.status IN ('active', 'completed', 'pending')
            AND e.tenant_id = v_tenant_id
          JOIN products prod ON prod.id = e.product_id
            AND prod.course_id = c.id
          LEFT JOIN assignment_submissions asub ON asub.assignment_id = a.id AND asub.user_id = p_user_id
          WHERE a.tenant_id = v_tenant_id
            AND a.due_date >= CURRENT_DATE
            AND (asub.status IS NULL OR asub.status IN ('pending', 'submitted'))
        ),
        'total_attendance', (
          SELECT COUNT(*)
          FROM attendance att
          WHERE att.user_id = p_user_id
            AND att.tenant_id = v_tenant_id
        ),
        'attendance_present', (
          SELECT COUNT(*)
          FROM attendance att
          WHERE att.user_id = p_user_id
            AND att.tenant_id = v_tenant_id
            AND att.status = 'present'
        ),
        'attendance_rate', (
          SELECT CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'present')::DECIMAL / COUNT(*)) * 100)
          END
          FROM attendance att
          WHERE att.user_id = p_user_id
            AND att.tenant_id = v_tenant_id
        ),
        'total_hours_spent', (
          SELECT COALESCE(ROUND(SUM(up.time_spent_seconds) / 3600.0, 1), 0)
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.tenant_id = v_tenant_id
        ),
        'completion_rate', (
          SELECT CASE
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*)) * 100)
          END
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.tenant_id = v_tenant_id
            AND up.status IN ('completed', 'in_progress')
        ),
        'completed_courses', (
          SELECT COUNT(DISTINCT prod.course_id)
          FROM enrollments e
          INNER JOIN products prod ON prod.id = e.product_id
          WHERE e.user_id = p_user_id
            AND e.status = 'completed'
            AND e.tenant_id = v_tenant_id
            AND prod.course_id IS NOT NULL
        ),
        'upcoming_sessions_count', (
          SELECT COUNT(DISTINCT l.id)
          FROM lessons l
          JOIN modules m ON l.module_id = m.id
          JOIN courses c ON m.course_id = c.id
          JOIN enrollments e ON e.user_id = p_user_id
            AND e.status IN ('active', 'completed', 'pending')
            AND e.tenant_id = v_tenant_id
          JOIN products prod ON prod.id = e.product_id
            AND prod.course_id = c.id
          WHERE l.tenant_id = v_tenant_id
            AND l.start_time IS NOT NULL
            AND l.start_time > NOW()
            AND l.start_time < NOW() + INTERVAL '7 days'
        ),
        'next_session_time', (
          SELECT l.start_time
          FROM lessons l
          JOIN modules m ON l.module_id = m.id
          JOIN courses c ON m.course_id = c.id
          JOIN enrollments e ON e.user_id = p_user_id
            AND e.status IN ('active', 'completed', 'pending')
            AND e.tenant_id = v_tenant_id
          JOIN products prod ON prod.id = e.product_id
            AND prod.course_id = c.id
          WHERE l.tenant_id = v_tenant_id
            AND l.start_time IS NOT NULL
            AND l.start_time > NOW()
          ORDER BY l.start_time ASC
          LIMIT 1
        ),
        'next_session_title', (
          SELECT l.title
          FROM lessons l
          JOIN modules m ON l.module_id = m.id
          JOIN courses c ON m.course_id = c.id
          JOIN enrollments e ON e.user_id = p_user_id
            AND e.status IN ('active', 'completed', 'pending')
            AND e.tenant_id = v_tenant_id
          JOIN products prod ON prod.id = e.product_id
            AND prod.course_id = c.id
          WHERE l.tenant_id = v_tenant_id
            AND l.start_time IS NOT NULL
            AND l.start_time > NOW()
          ORDER BY l.start_time ASC
          LIMIT 1
        ),
        'current_streak', (
          SELECT COALESCE(MAX(streak_days), 0)
          FROM (
            SELECT COUNT(*) as streak_days
            FROM (
              SELECT DATE(up.last_accessed_at) as activity_date,
                     DATE(up.last_accessed_at) - ROW_NUMBER() OVER (ORDER BY DATE(up.last_accessed_at))::integer as grp
              FROM user_progress up
              WHERE up.user_id = p_user_id
                AND up.tenant_id = v_tenant_id
                AND up.last_accessed_at >= CURRENT_DATE - INTERVAL '90 days'
                AND DATE(up.last_accessed_at) <= CURRENT_DATE
              GROUP BY DATE(up.last_accessed_at)
              ORDER BY DATE(up.last_accessed_at) DESC
            ) daily_activity
            WHERE activity_date = CURRENT_DATE
               OR activity_date = CURRENT_DATE - grp
            GROUP BY grp
            ORDER BY MIN(activity_date) DESC
            LIMIT 1
          ) current_streak_calc
        ),
        'longest_streak', (
          SELECT COALESCE(MAX(streak_days), 0)
          FROM (
            SELECT COUNT(*) as streak_days
            FROM (
              SELECT DATE(up.last_accessed_at) as activity_date,
                     DATE(up.last_accessed_at) - ROW_NUMBER() OVER (ORDER BY DATE(up.last_accessed_at))::integer as grp
              FROM user_progress up
              WHERE up.user_id = p_user_id
                AND up.tenant_id = v_tenant_id
                AND up.last_accessed_at IS NOT NULL
              GROUP BY DATE(up.last_accessed_at)
            ) daily_activity
            GROUP BY grp
          ) all_streaks
        ),
        'last_activity_date', (
          SELECT MAX(up.last_accessed_at)
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.tenant_id = v_tenant_id
        )
      )
    ),
    'recent_activity', '[]'::jsonb,
    'weekly_activity', '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return empty result
    RAISE WARNING 'Error in get_user_dashboard_v3 for user %: %', p_user_id, SQLERRM;
    RETURN jsonb_build_object(
      'enrollments', '[]'::jsonb,
      'upcoming_sessions', '[]'::jsonb,
      'pending_assignments', '[]'::jsonb,
      'recent_attendance', '[]'::jsonb,
      'stats', jsonb_build_object(
        'total_courses', 0,
        'completed_lessons', 0,
        'in_progress_lessons', 0,
        'total_lessons', 0,
        'pending_assignments', 0,
        'total_attendance', 0,
        'attendance_present', 0,
        'attendance_rate', 0
      ),
      'recent_activity', '[]'::jsonb,
      'weekly_activity', '[]'::jsonb,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3 IS 'Get user dashboard data with total_lessons included in stats - enrollments only have product_id, join through products table to get program/course info.';
