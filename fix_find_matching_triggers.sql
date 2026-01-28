-- Fix the find_matching_triggers RPC function
-- Remove non-existent columns: recipient_user_id, recipient_email
-- Add missing column: recipient_role

DROP FUNCTION IF EXISTS find_matching_triggers(UUID, TEXT);

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
  recipient_role TEXT,
  recipient_field TEXT
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
    et.recipient_role,
    et.recipient_field
  FROM email_triggers et
  INNER JOIN email_templates tmp ON et.template_id = tmp.id
  WHERE et.tenant_id = p_tenant_id
    AND et.trigger_event = p_trigger_event
    AND et.is_active = true
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

GRANT EXECUTE ON FUNCTION find_matching_triggers(UUID, TEXT) TO authenticated, service_role;
