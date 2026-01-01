-- Temporary: Disable RLS on notifications table for testing
-- WARNING: This allows anyone to insert notifications - only for testing!

ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable with:
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
