-- TEMPORARY FIX: Mark all pending lesson reminder emails as sent to stop duplicates
UPDATE email_queue
SET
  status = 'sent',
  sent_at = NOW(),
  message_id = 'bulk-marked-sent-to-prevent-duplicates'
WHERE status = 'pending'
  AND template_variables->>'lessonId' IS NOT NULL
RETURNING id, to_email, subject;
