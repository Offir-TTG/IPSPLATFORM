-- Delete test user AND all their data
-- This completely removes all traces of the test user from all tables

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

    -- Delete from all tables that reference this user
    -- Order matters: delete from child tables first, then parent tables

    -- 1. Delete chat/messaging data
    DELETE FROM message_read_receipts WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted message_read_receipts';

    DELETE FROM messages WHERE sender_id = v_user_id;
    RAISE NOTICE 'Deleted messages';

    DELETE FROM conversation_participants WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted conversation_participants';

    DELETE FROM conversations WHERE created_by = v_user_id;
    RAISE NOTICE 'Deleted conversations';

    -- 2. Delete course/lesson related data
    DELETE FROM lesson_completions WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted lesson_completions';

    DELETE FROM user_programs WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted user_programs';

    DELETE FROM assignment_submissions WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted assignment_submissions';

    -- 3. Delete payment/enrollment data
    DELETE FROM payment_schedules WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = v_user_id);
    RAISE NOTICE 'Deleted payment_schedules';

    DELETE FROM payments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE user_id = v_user_id);
    RAISE NOTICE 'Deleted payments';

    DELETE FROM subscriptions WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted subscriptions';

    DELETE FROM enrollments WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted enrollments';

    -- 4. Delete email data
    DELETE FROM email_logs WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted email_logs';

    DELETE FROM email_templates WHERE created_by = v_user_id;
    RAISE NOTICE 'Deleted email_templates';

    -- 5. Delete audit data
    DELETE FROM audit_events WHERE user_id = v_user_id;
    RAISE NOTICE 'Deleted audit_events';

    -- 6. Delete other user-related data
    DELETE FROM course_materials WHERE uploaded_by = v_user_id;
    RAISE NOTICE 'Deleted course_materials';

    -- 7. Finally, delete the user record from public.users
    DELETE FROM public.users WHERE id = v_user_id;
    RAISE NOTICE 'Deleted from public.users';

    -- 8. Last step: delete from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;
    RAISE NOTICE 'Deleted from auth.users';

    RAISE NOTICE '✅ User and all related data deleted successfully!';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error: %', SQLERRM;
    RAISE NOTICE 'Rolling back transaction...';
    RAISE;
END $$;

-- Verify everything is gone
SELECT 'Verification Results' as status;

SELECT
  'auth.users' as table_name,
  COUNT(*) as remaining_records
FROM auth.users
WHERE email = 'offir.omer@gmail.com'
UNION ALL
SELECT
  'public.users' as table_name,
  COUNT(*) as remaining_records
FROM public.users
WHERE email = 'offir.omer@gmail.com'
UNION ALL
SELECT
  'enrollments' as table_name,
  COUNT(*) as remaining_records
FROM enrollments
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'offir.omer@gmail.com');
