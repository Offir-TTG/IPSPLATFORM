-- Check details of queued emails
SELECT
  id,
  to_email,
  to_name,
  subject,
  LEFT(body_html, 200) as body_html_preview,
  template_variables,
  status,
  created_at
FROM email_queue
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 3;
