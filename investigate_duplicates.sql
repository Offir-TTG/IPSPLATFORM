-- Investigation: Find duplicate emails and understand the data structure

-- Query 1: Check for duplicate lesson reminder emails
SELECT
  user_id,
  template_variables->>'lessonId' as lesson_id,
  template_variables->>'userId' as vars_user_id,
  COUNT(*) as email_count,
  MIN(created_at) as first_queued,
  MAX(created_at) as last_queued,
  ARRAY_AGG(status) as statuses,
  ARRAY_AGG(id) as email_ids
FROM email_queue
WHERE template_variables->>'lessonId' IS NOT NULL
GROUP BY user_id, template_variables->>'lessonId', template_variables->>'userId'
HAVING COUNT(*) > 1
ORDER BY email_count DESC
LIMIT 10;

-- Query 2: Sample template_variables structure
SELECT
  id,
  user_id,
  to_email,
  status,
  template_variables,
  created_at
FROM email_queue
WHERE template_variables->>'lessonId' IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- Query 3: Count emails by status
SELECT
  status,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT template_variables->>'lessonId') as unique_lessons
FROM email_queue
WHERE template_variables->>'lessonId' IS NOT NULL
GROUP BY status;

-- Query 4: Find lessons that triggered most emails
SELECT
  template_variables->>'lessonId' as lesson_id,
  template_variables->>'lessonTitle' as lesson_title,
  COUNT(*) as total_emails,
  COUNT(DISTINCT user_id) as unique_recipients,
  MIN(created_at) as first_email,
  MAX(created_at) as last_email
FROM email_queue
WHERE template_variables->>'lessonId' IS NOT NULL
GROUP BY template_variables->>'lessonId', template_variables->>'lessonTitle'
ORDER BY total_emails DESC
LIMIT 5;
