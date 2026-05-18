-- Check sent emails
SELECT
  id,
  to_email,
  subject,
  status,
  sent_at,
  created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;
