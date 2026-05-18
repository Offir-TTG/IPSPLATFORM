-- =====================================================================
-- Re-seed the products.crm.* translations as GLOBAL (tenant_id IS NULL)
-- so they apply to every admin regardless of which tenant they're in.
-- The translations API merges per-tenant rows with global rows, and the
-- earlier tenant-scoped seed missed whatever tenant the current admin
-- is logged into. Global is the right home for admin chrome anyway.
-- Safe to re-run: deletes any existing rows under this key prefix first.
-- =====================================================================

DO $$
BEGIN
  -- Wipe all prior copies (tenant-scoped + global) under this prefix so
  -- the global rows are the single source of truth.
  DELETE FROM public.translations
  WHERE translation_key LIKE 'products.crm.%';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Section heading
    ('en', 'products.crm.title', 'CRM Tags',  'admin', NULL, 'admin'),
    ('he', 'products.crm.title', 'תגיות CRM', 'admin', NULL, 'admin'),

    -- Card description
    ('en', 'products.crm.description',
     'Tags applied to the buyer''s CRM contact when they complete enrollment in this product.',
     'admin', NULL, 'admin'),
    ('he', 'products.crm.description',
     'תגיות שיוחלו על איש הקשר ב-CRM של הרוכש עם השלמת הרישום למוצר זה.',
     'admin', NULL, 'admin'),

    -- Search input placeholder
    ('en', 'products.crm.search', 'Search CRM tags…', 'admin', NULL, 'admin'),
    ('he', 'products.crm.search', 'חיפוש תגיות CRM…', 'admin', NULL, 'admin'),

    -- Empty states
    ('en', 'products.crm.none_found',     'No CRM tags found.',     'admin', NULL, 'admin'),
    ('he', 'products.crm.none_found',     'לא נמצאו תגיות CRM.',    'admin', NULL, 'admin'),

    ('en', 'products.crm.none_available', 'No CRM tags available.', 'admin', NULL, 'admin'),
    ('he', 'products.crm.none_available', 'אין תגיות CRM זמינות.',  'admin', NULL, 'admin'),

    -- Footer counter
    ('en', 'products.crm.tags_available', 'CRM tags available', 'admin', NULL, 'admin'),
    ('he', 'products.crm.tags_available', 'תגיות CRM זמינות',   'admin', NULL, 'admin');

  RAISE NOTICE 'CRM tag picker translations seeded as global (tenant_id IS NULL)';
END$$;
