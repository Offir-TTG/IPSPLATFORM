-- IMMEDIATE FIX: Mark all pending lesson reminder emails as sent
UPDATE email_queue
SET
  status = 'sent',
  sent_at = NOW()
WHERE status = 'pending'
  AND template_variables->>'lessonId' IS NOT NULL
RETURNING id, to_email, LEFT(subject, 50) as subject_preview;
