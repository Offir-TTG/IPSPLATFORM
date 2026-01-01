-- Verify notification_reads is in realtime publication
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notification_reads';

-- If not found, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notification_reads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notification_reads;
    RAISE NOTICE 'Added notification_reads to realtime publication';
  ELSE
    RAISE NOTICE 'notification_reads already in realtime publication';
  END IF;
END $$;
