-- EMERGENCY MINIMAL DASHBOARD FUNCTION
-- This version makes ZERO assumptions about schema
-- It will work even with missing tables/fields
-- Returns basic structure so dashboard can at least load

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
  -- Safely get tenant_id
  BEGIN
    SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_user_id;
  EXCEPTION WHEN OTHERS THEN
    v_tenant_id := NULL;
  END;

  -- Return absolute minimum structure
  v_result := jsonb_build_object(
    'enrollments', '[]'::jsonb,
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
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS 'Emergency minimal dashboard - returns empty structure to unblock UI';

SELECT 'Emergency function created! Dashboard will load with empty state.' as status;
