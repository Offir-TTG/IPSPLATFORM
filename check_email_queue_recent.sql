-- Check recent email queue entries
SELECT
  id,
  to_email,
  to_name,
  subject,
  status,
  created_at,
  template_id,
  scheduled_for
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
