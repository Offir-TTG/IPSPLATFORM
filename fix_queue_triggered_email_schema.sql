-- Fix queue_triggered_email to use correct email_queue column names

DROP FUNCTION IF EXISTS queue_triggered_email(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT, TIMESTAMP WITH TIME ZONE
);

CREATE OR REPLACE FUNCTION queue_triggered_email(
  p_tenant_id UUID,
  p_trigger_id UUID,
  p_template_key TEXT,
  p_language_code TEXT,
  p_recipient_email TEXT,
  p_recipient_name TEXT,
  p_recipient_user_id UUID,
  p_template_variables JSONB,
  p_priority TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE
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

  -- Insert into email queue with correct column names
  INSERT INTO email_queue (
    tenant_id,
    to_email,
    to_name,
    user_id,
    template_id,
    language_code,
    subject,
    body_html,
    body_text,
    template_variables,
    scheduled_for,
    priority,
    status,
    trigger_type,
    trigger_event
  ) VALUES (
    p_tenant_id,
    p_recipient_email,
    p_recipient_name,
    p_recipient_user_id,
    v_template_id,
    p_language_code,
    v_subject,
    v_body_html,
    v_body_text,
    p_template_variables,
    p_scheduled_for,
    p_priority,
    'pending',
    'automated',
    'lesson.reminder'
  )
  RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION queue_triggered_email(UUID, UUID, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated, service_role;
