-- Create a test lesson that will trigger the reminder in ~1 minute
-- The trigger fires 60 minutes before lesson start, so we set start_time to 61 minutes from now

INSERT INTO "public"."lessons" (
  "id",
  "course_id",
  "title",
  "description",
  "order",
  "start_time",
  "duration",
  "materials",
  "status",
  "created_at",
  "updated_at",
  "tenant_id",
  "module_id",
  "content_blocks",
  "is_published",
  "timezone",
  "zoom_waiting_room",
  "zoom_join_before_host",
  "zoom_mute_upon_entry",
  "zoom_require_authentication",
  "zoom_host_video",
  "zoom_participant_video",
  "zoom_audio",
  "zoom_auto_recording",
  "zoom_record_speaker_view",
  "zoom_recording_disclaimer"
) VALUES (
  gen_random_uuid(), -- Generate new unique ID
  '321f0bb3-c0c6-43a1-a1c0-8810e317fdf6', -- Same course as original
  'TEST LESSON - Reminder Test', -- Clear test title
  'Test lesson to verify reminder cron works',
  999, -- High order number so it doesn't interfere
  NOW() + INTERVAL '61 minutes', -- 61 minutes from now
  120,
  '[]',
  'scheduled',
  NOW(),
  NOW(),
  '70d86807-7e7c-49cd-8601-98235444e2ac', -- Same tenant
  'c35440bb-edb1-42ae-87e7-be3925b7292d', -- Same module
  '[]',
  true,
  'America/New_York',
  true,
  false,
  false,
  false,
  true,
  true,
  'both',
  'none',
  false,
  false
)
RETURNING id, title, start_time, start_time - NOW() as time_from_now;
