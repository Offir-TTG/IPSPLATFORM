-- Enable Realtime for Chat System
-- This adds the messages table to the supabase_realtime publication

-- Add messages table to realtime publication so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Verify the publication includes messages
-- You can check this by running: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
