-- Check EXACTLY what's blocking the deletion
-- This will show all tables that have records for this user

DO $$
DECLARE
  v_user_id UUID := 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';
  v_count INT;
  v_has_references BOOLEAN := false;
BEGIN
  RAISE NOTICE '🔍 Checking what is blocking deletion of user: %', v_user_id;
  RAISE NOTICE '';

  -- PUBLIC SCHEMA TABLES
  RAISE NOTICE '=== PUBLIC SCHEMA ===';

  BEGIN
    SELECT COUNT(*) INTO v_count FROM public.users WHERE id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ public.users: % records (MUST DELETE)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ public.users: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Could not check public.users: %', SQLERRM;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM enrollments WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ enrollments: % records (BLOCKING)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ enrollments: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Could not check enrollments: %', SQLERRM;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM subscriptions WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ subscriptions: % records (BLOCKING)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ subscriptions: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM user_programs WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ user_programs: % records (BLOCKING)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ user_programs: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM conversations WHERE created_by = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ conversations: % records (BLOCKING)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ conversations: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM conversation_participants WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ conversation_participants: % records (BLOCKING)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ conversation_participants: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM messages WHERE sender_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ messages: % records (BLOCKING)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ messages: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RAISE NOTICE '';
  RAISE NOTICE '=== AUTH SCHEMA ===';

  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.users WHERE id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ auth.users: % records (TARGET)', v_count;
    ELSE
      RAISE NOTICE '✅ auth.users: 0 records (ALREADY DELETED!)';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Could not check auth.users: %', SQLERRM;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.identities WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ auth.identities: % records (BLOCKING AUTH.USERS)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ auth.identities: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Could not check auth.identities: %', SQLERRM;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.sessions WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ auth.sessions: % records (BLOCKING AUTH.USERS)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ auth.sessions: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Could not check auth.sessions: %', SQLERRM;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.refresh_tokens WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ auth.refresh_tokens: % records (BLOCKING AUTH.USERS)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ auth.refresh_tokens: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ Could not check auth.refresh_tokens: %', SQLERRM;
  END;

  BEGIN
    SELECT COUNT(*) INTO v_count FROM auth.mfa_factors WHERE user_id = v_user_id;
    IF v_count > 0 THEN
      RAISE NOTICE '❌ auth.mfa_factors: % records (BLOCKING AUTH.USERS)', v_count;
      v_has_references := true;
    ELSE
      RAISE NOTICE '✅ auth.mfa_factors: 0 records';
    END IF;
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RAISE NOTICE '';
  IF v_has_references THEN
    RAISE NOTICE '❌ RESULT: User has references in tables - cannot delete from auth.users yet';
    RAISE NOTICE '💡 Delete the records marked with ❌ first, then try again';
  ELSE
    RAISE NOTICE '✅ RESULT: No blocking references found - deletion should work!';
  END IF;

END $$;
