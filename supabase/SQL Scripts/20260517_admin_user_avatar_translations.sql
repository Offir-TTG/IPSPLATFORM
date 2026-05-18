-- Hebrew + English translations for the admin "Profile Image" block
-- added to the UserDetailDrawer (and surfaced via the new
-- /api/admin/tenant/users/[id]/upload-avatar endpoint).
--
-- Without these rows the Hebrew admin sees the English fallback strings
-- baked into the t() calls.

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;

  -- Wipe + reseed so re-running the migration always converges.
  DELETE FROM public.translations
  WHERE translation_key LIKE 'admin.users.drawer.avatar.%';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Section heading
    ('en', 'admin.users.drawer.avatar.title', 'Profile Image',  'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.title', 'תמונת פרופיל',    'admin', tenant_uuid, 'admin'),

    -- Subtle hint under the heading
    ('en', 'admin.users.drawer.avatar.hint',
     'JPG or PNG, up to 2 MB.',
     'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.hint',
     'JPG או PNG, עד 2 מ"ב.',
     'admin', tenant_uuid, 'admin'),

    -- Button label when there is NO current image
    ('en', 'admin.users.drawer.avatar.upload', 'Upload image',  'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.upload', 'העלאת תמונה',    'admin', tenant_uuid, 'admin'),

    -- Button label when an image is already set
    ('en', 'admin.users.drawer.avatar.change', 'Change image',  'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.change', 'החלפת תמונה',    'admin', tenant_uuid, 'admin'),

    -- Toast: upload succeeded
    ('en', 'admin.users.drawer.avatar.uploaded',
     'Profile image updated successfully',
     'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.uploaded',
     'תמונת הפרופיל עודכנה בהצלחה',
     'admin', tenant_uuid, 'admin'),

    -- Toast: generic upload failure
    ('en', 'admin.users.drawer.avatar.uploadFailed', 'Failed to upload image',
     'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.uploadFailed', 'העלאת התמונה נכשלה',
     'admin', tenant_uuid, 'admin'),

    -- Toast: file too large
    ('en', 'admin.users.drawer.avatar.tooLarge',
     'File is too large (max 2 MB).',
     'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.tooLarge',
     'הקובץ גדול מדי (עד 2 מ"ב).',
     'admin', tenant_uuid, 'admin'),

    -- Toast: file isn't an image
    ('en', 'admin.users.drawer.avatar.notImage',
     'File must be an image.',
     'admin', tenant_uuid, 'admin'),
    ('he', 'admin.users.drawer.avatar.notImage',
     'הקובץ חייב להיות תמונה.',
     'admin', tenant_uuid, 'admin');

END $$;
