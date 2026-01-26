-- Check if the RPC function is VOLATILE or STABLE
SELECT
  proname as function_name,
  provolatile as volatility_code,
  CASE provolatile
    WHEN 'i' THEN 'IMMUTABLE ❌ (function result never changes)'
    WHEN 's' THEN 'STABLE ❌ (result cached within query - THIS IS THE PROBLEM)'
    WHEN 'v' THEN 'VOLATILE ✅ (never cached - THIS IS WHAT WE NEED)'
  END as volatility_description
FROM pg_proc
WHERE proname = 'get_enrollment_fresh';
