-- =====================================================
-- Email Trigger System - Database Functions
-- =====================================================
-- These functions support the automated email trigger system
-- Called by triggerEngine.ts to evaluate and queue triggered emails

-- =====================================================
-- Drop existing functions if they exist
-- =====================================================
DROP FUNCTION IF EXISTS find_matching_triggers(UUID, TEXT);
DROP FUNCTION IF EXISTS evaluate_trigger_conditions(JSONB, JSONB);
DROP FUNCTION IF EXISTS queue_triggered_email(UUID, UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB, TIMESTAMP WITH TIME ZONE, TEXT);

-- =====================================================
-- 1. find_matching_triggers
-- =====================================================
-- Finds all active email triggers for a given event type and tenant
-- Returns triggers with their template information

CREATE OR REPLACE FUNCTION find_matching_triggers(
  p_tenant_id UUID,
  p_trigger_event TEXT
)
RETURNS TABLE (
  id UUID,
  trigger_name TEXT,
  trigger_event TEXT,
  template_id UUID,
  template_key TEXT,
  conditions JSONB,
  delay_minutes INTEGER,
  send_time TIME,
  send_days_before INTEGER,
  priority TEXT,
  recipient_field TEXT,
  recipient_user_id UUID,
  recipient_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    et.id,
    et.trigger_name,
    et.trigger_event,
    et.template_id,
    tmp.template_key,
    et.conditions,
    et.delay_minutes,
    et.send_time,
    et.send_days_before,
    et.priority,
    et.recipient_field,
    et.recipient_user_id,
    et.recipient_email
  FROM email_triggers et
  INNER JOIN email_templates tmp ON et.template_id = tmp.id
  WHERE et.tenant_id = p_tenant_id
    AND et.trigger_event = p_trigger_event
    AND et.is_enabled = true
    AND tmp.is_active = true
  ORDER BY
    CASE et.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END,
    et.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. evaluate_trigger_conditions
-- =====================================================
-- Evaluates if trigger conditions match the event data
-- Returns true if conditions are null/empty OR all conditions match

CREATE OR REPLACE FUNCTION evaluate_trigger_conditions(
  p_conditions JSONB,
  p_event_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_condition_key TEXT;
  v_condition_value JSONB;
  v_event_value JSONB;
  v_operator TEXT;
  v_expected_value JSONB;
BEGIN
  -- If no conditions specified, always match
  IF p_conditions IS NULL OR p_conditions = '{}'::jsonb THEN
    RETURN true;
  END IF;

  -- Iterate through each condition
  FOR v_condition_key, v_condition_value IN
    SELECT key, value FROM jsonb_each(p_conditions)
  LOOP
    -- Extract operator and expected value from condition
    -- Format: {"field": {"operator": "eq", "value": "expected"}}
    v_operator := v_condition_value->>'operator';
    v_expected_value := v_condition_value->'value';

    -- Get actual value from event data
    v_event_value := p_event_data->v_condition_key;

    -- Evaluate based on operator
    CASE v_operator
      WHEN 'eq' THEN  -- equals
        IF v_event_value IS NULL OR v_event_value != v_expected_value THEN
          RETURN false;
        END IF;

      WHEN 'ne' THEN  -- not equals
        IF v_event_value IS NULL OR v_event_value = v_expected_value THEN
          RETURN false;
        END IF;

      WHEN 'gt' THEN  -- greater than
        IF v_event_value IS NULL OR (v_event_value::text::numeric) <= (v_expected_value::text::numeric) THEN
          RETURN false;
        END IF;

      WHEN 'gte' THEN  -- greater than or equal
        IF v_event_value IS NULL OR (v_event_value::text::numeric) < (v_expected_value::text::numeric) THEN
          RETURN false;
        END IF;

      WHEN 'lt' THEN  -- less than
        IF v_event_value IS NULL OR (v_event_value::text::numeric) >= (v_expected_value::text::numeric) THEN
          RETURN false;
        END IF;

      WHEN 'lte' THEN  -- less than or equal
        IF v_event_value IS NULL OR (v_event_value::text::numeric) > (v_expected_value::text::numeric) THEN
          RETURN false;
        END IF;

      WHEN 'contains' THEN  -- string contains
        IF v_event_value IS NULL OR NOT (v_event_value::text ILIKE '%' || v_expected_value::text || '%') THEN
          RETURN false;
        END IF;

      WHEN 'in' THEN  -- value in array
        IF v_event_value IS NULL OR NOT (v_expected_value ? (v_event_value#>>'{}')) THEN
          RETURN false;
        END IF;

      WHEN 'exists' THEN  -- field exists
        IF v_expected_value::text::boolean = true AND v_event_value IS NULL THEN
          RETURN false;
        END IF;
        IF v_expected_value::text::boolean = false AND v_event_value IS NOT NULL THEN
          RETURN false;
        END IF;

      ELSE
        -- Unknown operator, skip condition (or fail safely)
        CONTINUE;
    END CASE;
  END LOOP;

  -- All conditions passed
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 3. queue_triggered_email
-- =====================================================
-- Creates an email in the queue with all necessary data
-- Returns the queue ID for tracking

CREATE OR REPLACE FUNCTION queue_triggered_email(
  p_tenant_id UUID,
  p_trigger_id UUID,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_recipient_user_id UUID,
  p_language_code TEXT,
  p_template_key TEXT,
  p_template_variables JSONB,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_template_id UUID;
  v_subject TEXT;
  v_body_html TEXT;
  v_body_text TEXT;
  v_version RECORD;
BEGIN
  -- Get template ID from template_key
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE tenant_id = p_tenant_id
    AND template_key = p_template_key
    AND is_active = true
  LIMIT 1;

  IF v_template_id IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_key;
  END IF;

  -- Fetch template version for language
  SELECT subject, body_html, body_text INTO v_version
  FROM email_template_versions
  WHERE template_id = v_template_id
    AND language_code = p_language_code
    AND is_current = true
  LIMIT 1;

  -- Fallback to English if language version not found
  IF v_version IS NULL THEN
    SELECT subject, body_html, body_text INTO v_version
    FROM email_template_versions
    WHERE template_id = v_template_id
      AND language_code = 'en'
      AND is_current = true
    LIMIT 1;
  END IF;

  -- Use template content or fallback to basic message
  v_subject := COALESCE(v_version.subject, 'Automated Email');
  v_body_html := COALESCE(v_version.body_html, '<p>This is an automated email.</p>');
  v_body_text := COALESCE(v_version.body_text, 'This is an automated email.');

  -- Insert into email queue
  INSERT INTO email_queue (
    tenant_id,
    recipient_email,
    recipient_name,
    recipient_user_id,
    subject,
    body_html,
    body_text,
    template_id,
    template_variables,
    scheduled_for,
    priority,
    status,
    metadata
  ) VALUES (
    p_tenant_id,
    p_recipient_email,
    p_recipient_name,
    p_recipient_user_id,
    v_subject,
    v_body_html,
    v_body_text,
    v_template_id,
    p_template_variables,
    p_scheduled_for,
    p_priority,
    'pending',
    jsonb_build_object(
      'trigger_id', p_trigger_id,
      'language_code', p_language_code,
      'queued_at', NOW()
    )
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grant Permissions
-- =====================================================
-- Allow authenticated users to execute these functions
-- (Service role will call these via triggerEngine.ts)

GRANT EXECUTE ON FUNCTION find_matching_triggers(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION evaluate_trigger_conditions(JSONB, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION queue_triggered_email(UUID, UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated, service_role;

-- =====================================================
-- Usage Examples
-- =====================================================

-- Example 1: Find triggers for enrollment.created event
-- SELECT * FROM find_matching_triggers(
--   'tenant-uuid-here',
--   'enrollment.created'
-- );

-- Example 2: Evaluate conditions
-- SELECT evaluate_trigger_conditions(
--   '{"payment_status": {"operator": "eq", "value": "completed"}}'::jsonb,
--   '{"payment_status": "completed", "amount": 100}'::jsonb
-- );

-- Example 3: Queue an email
-- SELECT queue_triggered_email(
--   'tenant-uuid-here',
--   'trigger-uuid-here',
--   'user@example.com',
--   'John Doe',
--   'user-uuid-here',
--   'en',
--   'lesson.reminder',
--   '{"lesson_name": "Introduction to SQL", "start_time": "2026-01-15 10:00:00"}'::jsonb,
--   NOW() + INTERVAL '1 hour',
--   'normal'
-- );
