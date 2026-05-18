-- Check for upcoming lessons that should trigger reminders

-- Lessons in the next 25 hours (same window as cron)
SELECT
  l.id,
  l.title,
  l.start_time,
  l.course_id,
  l.program_id,
  l.zoom_meeting_id,
  l.tenant_id,
  -- Calculate time until lesson
  EXTRACT(EPOCH FROM (l.start_time - NOW())) / 3600 as hours_until_start,
  EXTRACT(EPOCH FROM (l.start_time - NOW())) / 60 as minutes_until_start,
  -- Check reminder scenarios
  CASE
    WHEN l.start_time BETWEEN NOW() + INTERVAL '23 hours 45 minutes' AND NOW() + INTERVAL '24 hours 15 minutes'
      THEN '✅ 24-hour reminder window'
    WHEN l.start_time BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes'
      THEN '✅ 30-minute reminder window'
    WHEN l.start_time > NOW() AND l.start_time <= NOW() + INTERVAL '25 hours'
      THEN '⚠️ Within 25h window but not in standard reminder times'
    ELSE 'Outside reminder window'
  END as reminder_status,
  -- Course info
  c.title as course_title
FROM lessons l
LEFT JOIN courses c ON c.id = l.course_id
WHERE l.start_time >= NOW()
  AND l.start_time <= NOW() + INTERVAL '25 hours'
ORDER BY l.start_time;

-- Count of active enrollments per lesson
SELECT
  l.id as lesson_id,
  l.title,
  l.start_time,
  COUNT(e.id) as enrolled_students
FROM lessons l
LEFT JOIN enrollments e ON (
  (l.course_id IS NOT NULL AND e.course_id = l.course_id)
  OR (l.program_id IS NOT NULL AND e.program_id = l.program_id)
)
AND e.status = 'active'
AND e.tenant_id = l.tenant_id
WHERE l.start_time >= NOW()
  AND l.start_time <= NOW() + INTERVAL '25 hours'
GROUP BY l.id, l.title, l.start_time
ORDER BY l.start_time;

-- Summary
SELECT
  COUNT(*) as total_upcoming_lessons,
  COUNT(CASE WHEN l.start_time BETWEEN NOW() + INTERVAL '23 hours 45 minutes' AND NOW() + INTERVAL '24 hours 15 minutes' THEN 1 END) as in_24h_window,
  COUNT(CASE WHEN l.start_time BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes' THEN 1 END) as in_30min_window,
  MIN(l.start_time) as earliest_lesson,
  MAX(l.start_time) as latest_lesson
FROM lessons l
WHERE l.start_time >= NOW()
  AND l.start_time <= NOW() + INTERVAL '25 hours';
