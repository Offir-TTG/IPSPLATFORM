/**
 * Delete the audit_events table and all related objects
 *
 * WARNING: This will permanently delete all audit trail data!
 *
 * This script will:
 * 1. Drop all policies on audit_events table
 * 2. Drop all triggers on audit_events table
 * 3. Drop the audit_events table with CASCADE to remove all dependencies
 * 4. Drop related audit_sessions table (used for session tracking)
 *
 * Run this in the Supabase SQL Editor
 */

-- First, check which audit tables exist
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename LIKE '%audit%'
ORDER BY tablename;

-- Show how many records exist (if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_events' AND schemaname = 'public') THEN
    RAISE NOTICE 'audit_events table exists';
    PERFORM COUNT(*) FROM audit_events;
  ELSE
    RAISE NOTICE 'audit_events table does NOT exist';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'audit_sessions' AND schemaname = 'public') THEN
    RAISE NOTICE 'audit_sessions table exists';
    PERFORM COUNT(*) FROM audit_sessions;
  ELSE
    RAISE NOTICE 'audit_sessions table does NOT exist';
  END IF;
END $$;

-- Uncomment the lines below to actually delete the tables

/*

-- Drop all policies on audit_events
DROP POLICY IF EXISTS "Admin users can view all audit events" ON audit_events;
DROP POLICY IF EXISTS "Users can view their own audit events" ON audit_events;
DROP POLICY IF EXISTS "Service role can insert audit events" ON audit_events;
DROP POLICY IF EXISTS "System can insert audit events" ON audit_events;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_events;
DROP POLICY IF EXISTS "Enable insert access for service role" ON audit_events;

-- Drop all policies on audit_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON audit_sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON audit_sessions;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_audit_events_updated_at ON audit_events;
DROP TRIGGER IF EXISTS update_audit_sessions_updated_at ON audit_sessions;

-- Drop the tables with CASCADE to remove all dependencies
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS audit_sessions CASCADE;

-- Confirm deletion
SELECT 'Audit tables deleted successfully' as status;

*/
