-- Check configured email triggers for lesson reminders

SELECT
  id,
  event_type,
  delay_minutes,
  is_enabled,
  email_template_id,
  tenant_id,
  created_at,
  updated_at
FROM email_triggers
WHERE event_type = 'lesson.reminder'
  AND is_enabled = true
ORDER BY tenant_id, delay_minutes;

-- Check if there are email templates for lesson reminders
SELECT
  et.id as template_id,
  et.name as template_name,
  et.subject,
  et.language_code,
  et.tenant_id,
  tr.id as trigger_id,
  tr.delay_minutes,
  tr.is_enabled
FROM email_templates et
LEFT JOIN email_triggers tr ON tr.email_template_id = et.id AND tr.event_type = 'lesson.reminder'
WHERE et.name ILIKE '%lesson%' OR et.name ILIKE '%reminder%'
ORDER BY et.tenant_id, et.language_code;
