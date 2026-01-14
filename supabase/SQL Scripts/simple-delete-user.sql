-- Simple delete script - delete in correct order
-- Replace the email/ID as needed

DELETE FROM auth.identities WHERE user_id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';
DELETE FROM auth.sessions WHERE user_id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';

DELETE FROM payment_schedules WHERE enrollment_id IN (
  SELECT id FROM enrollments WHERE user_id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc'
);

DELETE FROM payments WHERE enrollment_id IN (
  SELECT id FROM enrollments WHERE user_id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc'
);

DELETE FROM enrollments WHERE user_id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';
DELETE FROM public.users WHERE id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';
DELETE FROM auth.users WHERE id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc';

-- Verify
SELECT 'Deleted!' as status WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE id = 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc'
);
