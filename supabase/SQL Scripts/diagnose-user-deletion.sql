-- Diagnostic script to find what's preventing user deletion
-- Run this to see all tables that reference the user

DO $$
DECLARE
  v_user_id UUID;
  v_count INT;
BEGIN
  -- Find the user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'offir.omer@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found: offir.omer@gmail.com';
  ELSE
    RAISE NOTICE '✅ Found user: %', v_user_id;
    RAISE NOTICE '';
    RAISE NOTICE '=== Checking all tables for references ===';
    RAISE NOTICE '';

    -- Check each table with error handling for missing tables
    BEGIN
      SELECT COUNT(*) INTO v_count FROM enrollments WHERE user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'enrollments: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM payment_schedules ps JOIN enrollments e ON ps.enrollment_id = e.id WHERE e.user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'payment_schedules: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM payments p JOIN enrollments e ON p.enrollment_id = e.id WHERE e.user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'payments: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM subscriptions WHERE user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'subscriptions: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM user_programs WHERE user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'user_programs: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM conversations WHERE created_by = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'conversations: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM conversation_participants WHERE user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'conversation_participants: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM messages WHERE sender_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'messages: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM email_logs WHERE user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'email_logs: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM audit_events WHERE user_id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'audit_events: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      SELECT COUNT(*) INTO v_count FROM public.users WHERE id = v_user_id;
      IF v_count > 0 THEN RAISE NOTICE 'public.users: % records', v_count; END IF;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RAISE NOTICE '';
    RAISE NOTICE '=== Summary: Use force-delete-user.sql or delete-user-via-api.ts ===';
  END IF;
END $$;
