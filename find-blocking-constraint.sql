-- Find what's blocking the user deletion in auth schema
-- This will show all foreign keys pointing to auth.users

SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'users'
  AND ccu.table_schema = 'auth';

-- Check how many records exist in each table for this user
DO $$
DECLARE
  v_user_id UUID := 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';
  v_count INT;
BEGIN
  RAISE NOTICE 'Checking auth schema tables for user: %', v_user_id;
  RAISE NOTICE '';

  -- Check auth.identities
  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.identities WHERE user_id = v_user_id;
    IF v_count > 0 THEN RAISE NOTICE 'auth.identities: % records', v_count; END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not check auth.identities: %', SQLERRM;
  END;

  -- Check auth.sessions
  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.sessions WHERE user_id = v_user_id;
    IF v_count > 0 THEN RAISE NOTICE 'auth.sessions: % records', v_count; END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not check auth.sessions: %', SQLERRM;
  END;

  -- Check auth.mfa_factors
  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.mfa_factors WHERE user_id = v_user_id;
    IF v_count > 0 THEN RAISE NOTICE 'auth.mfa_factors: % records', v_count; END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not check auth.mfa_factors: %', SQLERRM;
  END;

  -- Check auth.mfa_challenges
  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.mfa_challenges WHERE user_id = v_user_id;
    IF v_count > 0 THEN RAISE NOTICE 'auth.mfa_challenges: % records', v_count; END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not check auth.mfa_challenges: %', SQLERRM;
  END;

END $$;
