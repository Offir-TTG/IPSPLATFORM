-- Check why emails keep being sent
SELECT
  status,
  COUNT(*) as count,
  COUNT(DISTINCT to_email) as unique_recipients,
  MAX(sent_at) as latest_sent,
  MAX(created_at) as latest_created
FROM email_queue
WHERE template_variables->>'lessonId' IS NOT NULL
GROUP BY status
ORDER BY status;
