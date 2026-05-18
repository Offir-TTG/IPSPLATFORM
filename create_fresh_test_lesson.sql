-- Delete old test lesson first
DELETE FROM lessons WHERE title LIKE 'TEST LESSON%';

-- Create new test lesson exactly 61 minutes from now
INSERT INTO lessons (
  id, course_id, title, description, "order", start_time, duration,
  materials, status, created_at, updated_at, tenant_id, module_id,
  content_blocks, is_published, timezone, zoom_waiting_room,
  zoom_join_before_host, zoom_mute_upon_entry, zoom_require_authentication,
  zoom_host_video, zoom_participant_video, zoom_audio, zoom_auto_recording,
  zoom_record_speaker_view, zoom_recording_disclaimer
) VALUES (
  gen_random_uuid(),
  '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6',
  'TEST LESSON - Reminder Test v2',
  'Fresh test lesson for -60 minute trigger',
  999,
  NOW() + INTERVAL '61 minutes',
  120, '[]', 'scheduled', NOW(), NOW(),
  '70d86807-7e7c-49cd-8601-98235444e2ac',
  'c35440bb-edb1-42ae-87e7-be3925b7292d',
  '[]', true, 'America/New_York', true, false, false, false, true, true, 'both', 'none', false, false
)
RETURNING id, title, start_time, ROUND(EXTRACT(EPOCH FROM (start_time - NOW())) / 60) as minutes_from_now;
