/**
 * DROP audit tables immediately
 * Run this in Supabase SQL Editor
 */

-- Drop all policies first
DROP POLICY IF EXISTS "Admin users can view all audit events" ON audit_events;
DROP POLICY IF EXISTS "Users can view their own audit events" ON audit_events;
DROP POLICY IF EXISTS "Service role can insert audit events" ON audit_events;
DROP POLICY IF EXISTS "System can insert audit events" ON audit_events;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON audit_events;
DROP POLICY IF EXISTS "Enable insert access for service role" ON audit_events;
DROP POLICY IF EXISTS "Users can view their own sessions" ON audit_sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON audit_sessions;

-- Drop triggers
DROP TRIGGER IF EXISTS update_audit_events_updated_at ON audit_events;
DROP TRIGGER IF EXISTS update_audit_sessions_updated_at ON audit_sessions;

-- Drop the tables
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS audit_sessions CASCADE;

-- Confirm
SELECT 'Audit tables dropped successfully' as status;
