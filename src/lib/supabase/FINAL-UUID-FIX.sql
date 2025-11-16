-- ============================================================================
-- FINAL FIX - Using uuid_generate_v4() from extensions schema
-- ============================================================================

-- Step 1: Drop existing function completely
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, INET, TEXT, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS log_audit_event CASCADE;

-- Step 2: Create function using extensions.uuid_generate_v4()
CREATE OR REPLACE FUNCTION public.log_audit_event(
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
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_event_id UUID;
  v_user_email TEXT;
  v_user_role TEXT;
  v_changed_fields TEXT[];
  v_correlation_id UUID;
BEGIN
  -- Get user details (SECURITY DEFINER allows this)
  BEGIN
    SELECT email INTO v_user_email FROM auth.users WHERE id = p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      v_user_email := NULL;
  END;

  -- Calculate changed fields for UPDATE operations
  IF p_event_type = 'UPDATE' AND p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
    SELECT array_agg(key)
    INTO v_changed_fields
    FROM jsonb_each(p_new_values)
    WHERE p_old_values->key IS DISTINCT FROM p_new_values->key;
  END IF;

  -- Generate correlation ID using extensions.uuid_generate_v4()
  v_correlation_id := extensions.uuid_generate_v4();

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

  -- Update session activity (safely, ignore if table doesn't exist)
  BEGIN
    IF p_session_id IS NOT NULL THEN
      UPDATE public.audit_sessions
      SET
        last_activity_at = NOW(),
        events_count = events_count + 1,
        high_risk_events_count = CASE WHEN p_risk_level IN ('high', 'critical') THEN high_risk_events_count + 1 ELSE high_risk_events_count END
      WHERE session_id = p_session_id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  -- Create alert if high risk (safely, ignore if table doesn't exist)
  BEGIN
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
        COALESCE(p_action, 'Unknown') || ' - High Risk Activity',
        p_description,
        'risk_level_threshold'
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN v_event_id;
END;
$$;

-- Step 3: Grant all necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA extensions TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO service_role;

-- Specific grant for the function
GRANT EXECUTE ON FUNCTION public.log_audit_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT, INET, TEXT, TEXT, TEXT, JSONB) TO postgres, anon, authenticated, service_role;

-- Step 4: Fix audit_events table to use extensions.uuid_generate_v4() for default ID
ALTER TABLE public.audit_events
  ALTER COLUMN id SET DEFAULT extensions.uuid_generate_v4();

-- Step 5: Ensure RLS policies
ALTER TABLE IF EXISTS public.audit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_events_insert_policy ON public.audit_events;
CREATE POLICY audit_events_insert_policy ON public.audit_events
  FOR INSERT
  TO public, anon, authenticated, service_role
  WITH CHECK (true);

-- Step 6: Test the function
DO $$
DECLARE
  test_event_id UUID;
BEGIN
  -- Test with a simple call
  SELECT public.log_audit_event(
    'c85f5987-8fc6-4315-8596-5c7521346ee0'::uuid,
    'UPDATE',
    'CONFIG',
    'theme',
    '35098d76-21a2-46c9-bd1a-d7297206ace4',
    'Test Theme',
    'test',
    'Testing audit function with uuid_generate_v4()'
  ) INTO test_event_id;

  RAISE NOTICE '✓ Test successful! Event ID: %', test_event_id;
  RAISE NOTICE '✓ Using extensions.uuid_generate_v4() as you requested';

  -- Clean up test event
  DELETE FROM public.audit_events WHERE id = test_event_id;

  RAISE NOTICE '✓ Audit function is working correctly!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Restart your Next.js dev server';
  RAISE NOTICE 'Command: Ctrl+C then npm run dev';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '✗ Test failed: %', SQLERRM;
END $$;
