-- Check email status breakdown
SELECT
  status,
  COUNT(*) as count,
  MAX(created_at) as latest_created,
  MAX(sent_at) as latest_sent
FROM email_queue
GROUP BY status
ORDER BY status;
