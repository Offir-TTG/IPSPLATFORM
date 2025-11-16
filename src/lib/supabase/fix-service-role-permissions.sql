-- Fix: Grant service role full access to bypass RLS
-- This ensures the admin client (using service_role key) can access all tables

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all permissions on ALL existing tables to service_role
-- This is the simplest and most comprehensive approach
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Note: Service role ALWAYS bypasses RLS by default in Supabase
-- No need to modify RLS settings - service_role has superuser privileges
