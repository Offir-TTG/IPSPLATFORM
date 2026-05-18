-- Check latest sent emails with rendered content
SELECT
  id,
  to_email,
  subject,
  status,
  sent_at,
  message_id,
  created_at
FROM email_queue
WHERE status = 'sent'
ORDER BY sent_at DESC
LIMIT 5;
