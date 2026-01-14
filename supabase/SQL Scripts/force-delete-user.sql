-- Force delete user - most aggressive approach
-- This uses CASCADE deletes and manual cleanup

DO $$
DECLARE
  v_user_id UUID := 'def0a079-3dd6-4e50-b1d2-7aa895dca5bb'; -- Replace with actual user ID if different
  v_email TEXT := 'offir.omer@gmail.com';
BEGIN
  -- First, get the user ID if we only have email
  IF v_user_id IS NULL THEN
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  END IF;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found';
    RETURN;
  END IF;

  RAISE NOTICE '🗑️  Deleting user: % (%)', v_email, v_user_id;
  RAISE NOTICE '';

  -- Delete in order from most dependent to least dependent
  BEGIN
    -- Payment schedules first (child of enrollments)
    DELETE FROM payment_schedules
    WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = v_user_id);
    RAISE NOTICE '✓ Deleted payment_schedules';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ payment_schedules: %', SQLERRM;
  END;

  BEGIN
    -- Payments (child of enrollments)
    DELETE FROM payments
    WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = v_user_id);
    RAISE NOTICE '✓ Deleted payments';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ payments: %', SQLERRM;
  END;

  BEGIN
    -- Enrollments
    DELETE FROM enrollments WHERE user_id = v_user_id;
    RAISE NOTICE '✓ Deleted enrollments';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ enrollments: %', SQLERRM;
  END;

  BEGIN
    -- Subscriptions
    DELETE FROM subscriptions WHERE user_id = v_user_id;
    RAISE NOTICE '✓ Deleted subscriptions';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ subscriptions: %', SQLERRM;
  END;

  BEGIN
    -- User programs
    DELETE FROM user_programs WHERE user_id = v_user_id;
    RAISE NOTICE '✓ Deleted user_programs';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ user_programs: %', SQLERRM;
  END;

  BEGIN
    -- Chat data
    DELETE FROM message_read_receipts WHERE user_id = v_user_id;
    DELETE FROM messages WHERE sender_id = v_user_id;
    DELETE FROM conversation_participants WHERE user_id = v_user_id;
    DELETE FROM conversations WHERE created_by = v_user_id;
    RAISE NOTICE '✓ Deleted chat data';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ chat data: %', SQLERRM;
  END;

  BEGIN
    -- Email and audit logs
    DELETE FROM email_logs WHERE user_id = v_user_id;
    DELETE FROM audit_events WHERE user_id = v_user_id;
    RAISE NOTICE '✓ Deleted logs';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ logs: %', SQLERRM;
  END;

  BEGIN
    -- Public users table
    DELETE FROM public.users WHERE id = v_user_id;
    RAISE NOTICE '✓ Deleted from public.users';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⚠ public.users: %', SQLERRM;
  END;

  BEGIN
    -- Auth users table - THE FINAL STEP
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE '✓ Deleted from auth.users';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 User successfully deleted!';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FAILED to delete from auth.users: %', SQLERRM;
    RAISE NOTICE '';
    RAISE NOTICE '💡 Try using Supabase Auth Admin API or Dashboard to delete this user';
  END;

END $$;

-- Verify deletion
SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ User successfully deleted from auth.users'
    ELSE '❌ User still exists in auth.users'
  END as auth_status
FROM auth.users
WHERE email = 'offir.omer@gmail.com';

SELECT
  CASE
    WHEN COUNT(*) = 0 THEN '✅ User successfully deleted from public.users'
    ELSE '❌ User still exists in public.users'
  END as public_status
FROM public.users
WHERE email = 'offir.omer@gmail.com';
