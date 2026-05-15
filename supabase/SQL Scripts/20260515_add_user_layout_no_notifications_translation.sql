-- Add missing translation for the user-portal header notifications dropdown
-- empty state. The key `user.layout.noNotifications` is referenced in
-- src/components/user/UserLayout.tsx but was never seeded, so the Hebrew
-- locale fell back to the English literal "No notifications".

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  DELETE FROM public.translations
  WHERE translation_key = 'user.layout.noNotifications'
    AND tenant_id = tenant_uuid;

  INSERT INTO public.translations (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.layout.noNotifications', 'No notifications', 'user', tenant_uuid, 'user'),
    ('he', 'user.layout.noNotifications', 'אין התראות',       'user', tenant_uuid, 'user');
END $$;
