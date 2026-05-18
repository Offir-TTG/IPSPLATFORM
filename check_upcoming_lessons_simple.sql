-- Check for upcoming lessons - simple version to test what columns exist

-- First, check what columns exist in lessons
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'lessons'
ORDER BY ordinal_position;

-- Lessons in the next 25 hours (basic query)
SELECT
  l.id,
  l.title,
  l.start_time,
  l.course_id,
  l.tenant_id,
  -- Calculate time until lesson
  EXTRACT(EPOCH FROM (l.start_time - NOW())) / 3600 as hours_until_start,
  EXTRACT(EPOCH FROM (l.start_time - NOW())) / 60 as minutes_until_start,
  -- Check reminder scenarios
  CASE
    WHEN l.start_time BETWEEN NOW() + INTERVAL '23 hours 45 minutes' AND NOW() + INTERVAL '24 hours 15 minutes'
      THEN '24-hour reminder window'
    WHEN l.start_time BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes'
      THEN '30-minute reminder window'
    WHEN l.start_time > NOW() AND l.start_time <= NOW() + INTERVAL '25 hours'
      THEN 'Within 25h window'
    ELSE 'Outside window'
  END as reminder_status
FROM lessons l
WHERE l.start_time >= NOW()
  AND l.start_time <= NOW() + INTERVAL '25 hours'
ORDER BY l.start_time;

-- Summary
SELECT
  COUNT(*) as total_upcoming_lessons,
  COUNT(CASE WHEN l.start_time BETWEEN NOW() + INTERVAL '23 hours 45 minutes' AND NOW() + INTERVAL '24 hours 15 minutes' THEN 1 END) as in_24h_window,
  COUNT(CASE WHEN l.start_time BETWEEN NOW() + INTERVAL '25 minutes' AND NOW() + INTERVAL '35 minutes' THEN 1 END) as in_30min_window
FROM lessons l
WHERE l.start_time >= NOW()
  AND l.start_time <= NOW() + INTERVAL '25 hours';
