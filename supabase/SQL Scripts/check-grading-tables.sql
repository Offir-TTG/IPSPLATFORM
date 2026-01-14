-- Check if grading_scales table exists and has correct structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'grading_scales'
ORDER BY ordinal_position;

-- Check RLS policies on grading_scales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'grading_scales';

-- Check if there are any existing grading scales
SELECT
  id,
  tenant_id,
  name,
  scale_type,
  is_default,
  is_active,
  created_at
FROM grading_scales
LIMIT 5;
