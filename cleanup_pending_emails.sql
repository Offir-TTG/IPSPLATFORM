-- Clean up pending lesson reminder emails
-- Mark them as sent to prevent re-sending

UPDATE email_queue
SET
  status = 'sent',
  sent_at = NOW()
WHERE status = 'pending'
  AND template_variables->>'lessonId' IS NOT NULL
RETURNING id, to_email, template_variables->>'lessonTitle' as lesson_title;
