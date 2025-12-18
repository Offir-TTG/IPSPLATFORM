const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const fixedDashboardFunction = `
-- Fix dashboard stats to show COURSE status instead of LESSON status
-- Completed: enrollments with status='completed'
-- In Progress: active enrollments with at least one user_progress record

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
              WHERE m.course_id = e.course_id
            ), 0
          )
        ) as enrollment_data
        FROM enrollments e
        LEFT JOIN programs p ON p.id = e.program_id
        LEFT JOIN courses c ON c.id = e.course_id
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
        SELECT jsonb_build_object(
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
        ) as session_data,
        l.start_time
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
        LEFT JOIN users u ON u.id = c.instructor_id
        WHERE l.tenant_id = v_tenant_id
          AND l.start_time IS NOT NULL
          AND l.start_time > NOW()
          AND l.zoom_meeting_id IS NOT NULL
        LIMIT 5
      ) sessions_subquery
    ),
    'pending_assignments', '[]'::jsonb,
    'stats', jsonb_build_object(
      -- Total active courses (unchanged)
      'total_courses', (
        SELECT COUNT(DISTINCT e.id)
        FROM enrollments e
        LEFT JOIN products p ON e.product_id = p.id
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
          AND e.tenant_id = v_tenant_id
          AND (p.course_id IS NOT NULL OR p.program_id IS NOT NULL)
      ),
      -- Completed COURSES: enrollments with status='completed'
      'completed_lessons', (
        SELECT COUNT(DISTINCT e.id)
        FROM enrollments e
        LEFT JOIN products p ON e.product_id = p.id
        WHERE e.user_id = p_user_id
          AND e.status = 'completed'
          AND e.tenant_id = v_tenant_id
          AND (p.course_id IS NOT NULL OR p.program_id IS NOT NULL)
      ),
      -- In Progress COURSES: active enrollments that have at least one user_progress record
      'in_progress_lessons', (
        SELECT COUNT(DISTINCT e.id)
        FROM enrollments e
        LEFT JOIN products p ON e.product_id = p.id
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
          AND e.tenant_id = v_tenant_id
          AND (p.course_id IS NOT NULL OR p.program_id IS NOT NULL)
          AND EXISTS (
            SELECT 1 FROM user_progress up
            WHERE up.enrollment_id = e.id
              AND up.user_id = p_user_id
          )
      ),
      'pending_assignments', 0,
      'total_hours_spent', COALESCE((
        SELECT SUM(time_spent_seconds) / 3600.0
        FROM user_progress
        WHERE user_id = p_user_id
          AND tenant_id = v_tenant_id
      ), 0)
    ),
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(activity_data ORDER BY updated_at DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', up.id,
          'type', 'lesson_progress',
          'lesson_title', l.title,
          'course_name', c.title,
          'status', up.status,
          'timestamp', up.updated_at
        ) as activity_data,
        up.updated_at
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE up.user_id = p_user_id
          AND up.tenant_id = v_tenant_id
        ORDER BY up.updated_at DESC
        LIMIT 5
      ) activity_subquery
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS 'Dashboard aggregation - V3 with COURSE status counts (not lesson status)';
`;

async function fixDashboard() {
  console.log('Fixing dashboard function to count COURSE status instead of LESSON status...\n');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: fixedDashboardFunction });

    if (error) {
      // Try direct execution
      const { error: execError } = await supabase.from('_sql').insert({ query: fixedDashboardFunction });

      if (execError) {
        console.error('Could not execute SQL directly. Please run the SQL manually.');
        console.error('\nSQL to run:');
        console.error(fixedDashboardFunction);
        return;
      }
    }

    console.log('✓ Dashboard function updated successfully!');
    console.log('\nNow the stats will show:');
    console.log('  - total_courses: Active enrollments (programs or courses)');
    console.log('  - completed_lessons: Enrollments with status=completed (COURSES, not lessons)');
    console.log('  - in_progress_lessons: Active enrollments with progress (COURSES, not lessons)');
    console.log('  - pending_assignments: 0');

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log(fixedDashboardFunction);
  }
}

fixDashboard();
