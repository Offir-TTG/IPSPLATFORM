-- Check configured email triggers for lesson reminders (correct column names)

SELECT
  id,
  trigger_name,
  trigger_event,
  delay_minutes,
  send_days_before,
  is_enabled,
  template_id,
  recipient_role,
  recipient_field,
  tenant_id,
  created_at
FROM email_triggers
WHERE trigger_event = 'lesson.reminder'
  AND is_enabled = true
ORDER BY tenant_id, delay_minutes;

-- Summary of all trigger events
SELECT
  trigger_event,
  COUNT(*) as total,
  COUNT(CASE WHEN is_enabled = true THEN 1 END) as enabled,
  array_agg(DISTINCT delay_minutes ORDER BY delay_minutes) FILTER (WHERE delay_minutes IS NOT NULL) as delay_minutes_configured
FROM email_triggers
GROUP BY trigger_event
ORDER BY trigger_event;
