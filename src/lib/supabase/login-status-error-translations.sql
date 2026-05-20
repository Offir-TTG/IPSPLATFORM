-- ============================================================================
-- EN + HE for the new login-status error messages.
-- Idempotent via WHERE NOT EXISTS — safe to re-run.
--
-- Why this exists: previously a suspended/inactive user saw the generic
-- "You do not have access to this organization" because the membership
-- RPC bakes in `status = 'active'`. The login route now runs an
-- explicit status check first and returns a `code` per reason so the
-- client can show the actual cause — this SQL provides the localized
-- text for each code.
-- ============================================================================

INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
SELECT
  vals.key,
  vals.category,
  vals.description,
  vals.context,
  (SELECT tenant_id FROM public.translation_keys WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('auth.errors.accountSuspended',   'auth', 'Login: tenant_users.status = suspended', 'user'),
  ('auth.errors.accountInactive',    'auth', 'Login: is_active=false or tenant_users.status=inactive', 'user'),
  ('auth.errors.accountInvited',     'auth', 'Login: tenant_users.status = invited (must complete invite)', 'user'),
  ('auth.errors.profileMissing',     'auth', 'Login: user authenticated but no users row found', 'user'),
  ('auth.errors.statusCheckFailed',  'auth', 'Login: status query errored — fail closed message', 'user')
) AS vals(key, category, description, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translation_keys tk WHERE tk.key = vals.key
);

-- Hebrew
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('he', 'auth.errors.accountSuspended',  'החשבון שלך הושעה. פנה למנהל המערכת כדי לשחזר את הגישה.',                                  'auth', 'user'),
  ('he', 'auth.errors.accountInactive',   'החשבון שלך אינו פעיל. פנה למנהל המערכת כדי להפעיל אותו מחדש.',                            'auth', 'user'),
  ('he', 'auth.errors.accountInvited',    'יש להשלים את ההזמנה לפני הכניסה. בדוק את האימייל שלך עם הקישור להזמנה.',                  'auth', 'user'),
  ('he', 'auth.errors.profileMissing',    'פרופיל המשתמש לא נמצא.',                                                                  'auth', 'user'),
  ('he', 'auth.errors.statusCheckFailed', 'לא ניתן לאמת את סטטוס החשבון כעת. נסה שוב.',                                              'auth', 'user')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);

-- English
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  ('en', 'auth.errors.accountSuspended',  'Your account has been suspended. Contact your administrator to restore access.', 'auth', 'user'),
  ('en', 'auth.errors.accountInactive',   'Your account is inactive. Contact your administrator to reactivate it.',        'auth', 'user'),
  ('en', 'auth.errors.accountInvited',    'Please complete your invitation before signing in. Check your email for the invitation link.', 'auth', 'user'),
  ('en', 'auth.errors.profileMissing',    'User profile not found.',                                                       'auth', 'user'),
  ('en', 'auth.errors.statusCheckFailed', 'Unable to verify account status. Please try again.',                            'auth', 'user')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);
