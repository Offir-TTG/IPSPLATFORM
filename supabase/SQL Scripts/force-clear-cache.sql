-- Force PostgreSQL to recompile the function by doing a dummy update
-- This invalidates the prepared statement cache

-- First, add a comment to force recompilation
COMMENT ON FUNCTION public.get_user_dashboard(UUID) IS 'Dashboard data aggregation function - Updated ' || NOW()::text;

-- Then call DISCARD ALL to clear any cached plans (if you have permission)
-- DISCARD ALL;

-- Alternative: Just call the function once to test it
SELECT public.get_user_dashboard('00000000-0000-0000-0000-000000000000'::UUID);
