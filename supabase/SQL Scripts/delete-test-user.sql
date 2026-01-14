-- Delete test user: offir.omer@gmail.com
-- This will:
-- 1. Set user_id to NULL in enrollments (due to ON DELETE SET NULL)
-- 2. Delete from public.users table
-- 3. Delete from auth.users table

-- Get the user ID first
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find the user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'offir.omer@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found: offir.omer@gmail.com';
  ELSE
    RAISE NOTICE 'Found user: %', v_user_id;

    -- Delete from public.users first (this will trigger ON DELETE SET NULL for enrollments)
    DELETE FROM public.users WHERE id = v_user_id;
    RAISE NOTICE 'Deleted from public.users';

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE 'Deleted from auth.users';

    RAISE NOTICE 'User deleted successfully: offir.omer@gmail.com';
  END IF;
END $$;

-- Verify deletion
SELECT
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
WHERE email = 'offir.omer@gmail.com'
UNION ALL
SELECT
  'public.users' as table_name,
  COUNT(*) as count
FROM public.users
WHERE email = 'offir.omer@gmail.com';

-- Check if any enrollments were affected
SELECT
  id,
  user_id,
  status,
  created_at
FROM enrollments
WHERE user_id IS NULL
ORDER BY created_at DESC
LIMIT 5;
