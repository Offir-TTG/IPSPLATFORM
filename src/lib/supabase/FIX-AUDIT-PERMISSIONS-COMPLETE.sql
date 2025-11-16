-- ============================================================================
-- COMPLETE FIX FOR AUDIT LOGGING PERMISSION ERRORS
-- Run this in Supabase SQL Editor to fix "permission denied for table users"
-- ============================================================================

-- 0. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Grant service role full access to bypass RLS
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant all permissions on public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant read access to auth schema (needed for log_audit_event function)
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO service_role;

-- 2. Make log_audit_event function run with elevated privileges
DROP FUNCTION IF EXISTS log_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, INET, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_resource_name TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'success',
  p_risk_level TEXT DEFAULT 'low',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public, auth
AS $$
DECLARE
  v_event_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_changed_fields TEXT[];
  v_correlation_id UUID;
BEGIN
  -- Get user details (now has permission due to SECURITY DEFINER)
  SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;

  -- Calculate changed fields for UPDATE operations
  IF p_event_type = 'UPDATE' AND p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM jsonb_each(p_new_values)
    WHERE p_old_values->key IS DISTINCT FROM p_new_values->key;
  END IF;

  -- Generate correlation ID for this operation
  v_correlation_id := uuid_generate_v4();

  -- Insert audit event
  INSERT INTO public.audit_events (
    user_id,
    user_email,
    user_role,
    session_id,
    ip_address,
    user_agent,
    event_type,
    event_category,
    resource_type,
    resource_id,
    resource_name,
    action,
    description,
    old_values,
    new_values,
    changed_fields,
    correlation_id,
    status,
    risk_level,
    metadata
  ) VALUES (
    p_user_id,
    v_user_email,
    v_user_role,
    p_session_id,
    p_ip_address,
    p_user_agent,
    p_event_type,
    p_event_category,
    p_resource_type,
    p_resource_id,
    p_resource_name,
    p_action,
    p_description,
    p_old_values,
    p_new_values,
    v_changed_fields,
    v_correlation_id,
    p_status,
    p_risk_level,
    p_metadata
  ) RETURNING id INTO v_event_id;

  -- Update session activity
  IF p_session_id IS NOT NULL THEN
    UPDATE public.audit_sessions
    SET
      last_activity_at = NOW(),
      events_count = events_count + 1,
      high_risk_events_count = CASE WHEN p_risk_level IN ('high', 'critical') THEN high_risk_events_count + 1 ELSE high_risk_events_count END
    WHERE session_id = p_session_id;
  END IF;

  -- Create alert if high risk
  IF p_risk_level IN ('high', 'critical') THEN
    INSERT INTO public.audit_alerts (
      alert_type,
      severity,
      event_id,
      user_id,
      user_email,
      title,
      description,
      detection_rule
    ) VALUES (
      CASE
        WHEN p_risk_level = 'critical' THEN 'security'
        ELSE 'unusual_activity'
      END,
      p_risk_level,
      v_event_id,
      p_user_id,
      v_user_email,
      p_action || ' - High Risk Activity',
      p_description,
      'risk_level_threshold'
    );
  END IF;

  RETURN v_event_id;
END;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION log_audit_event TO postgres, anon, authenticated, service_role;

-- 3. Ensure audit_events table allows inserts from service role
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS audit_events_insert_policy ON public.audit_events;

-- Create new insert policy that allows service role to insert
CREATE POLICY audit_events_insert_policy ON public.audit_events
  FOR INSERT
  TO public, anon, authenticated, service_role
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, test by:
-- 1. Restart your Next.js dev server (Ctrl+C and npm run dev)
-- 2. Go to Admin → Settings → Theme
-- 3. Update a theme
-- 4. Check that audit events are logged without errors
-- ============================================================================
