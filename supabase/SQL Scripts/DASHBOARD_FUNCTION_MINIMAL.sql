-- MINIMAL VERSION: Starts with just basic data, no complex queries
-- This will help us isolate which part is failing

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

  -- Return minimal dashboard with just enrollments (no progress calculations)
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
          'expires_at', e.expires_at,
          'overall_progress', 0,
          'completed_lessons', 0,
          'total_lessons', 0
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
    'upcoming_sessions', '[]'::jsonb,
    'pending_assignments', '[]'::jsonb,
    'stats', jsonb_build_object(
      'total_courses', 0,
      'completed_lessons', 0,
      'in_progress_lessons', 0,
      'pending_assignments', 0,
      'total_hours_spent', 0
    ),
    'recent_activity', '[]'::jsonb
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS 'Dashboard V3 - Minimal version for debugging';

SELECT 'Minimal function created successfully!' as status;
