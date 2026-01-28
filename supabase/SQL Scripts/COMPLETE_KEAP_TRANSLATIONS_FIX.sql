-- Complete fix for ALL missing Keap translations
-- This includes the Create Dialog translations AND the Stats translations

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN
  -- Delete existing translations for these keys to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
  AND translation_key IN (
    'admin.keap.tags.filtered',
    'admin.keap.tags.withCategory',
    'admin.keap.tags.tagName',
    'admin.keap.tags.tagNamePlaceholder',
    'admin.keap.tags.description',
    'admin.keap.tags.descriptionPlaceholder',
    'admin.keap.tags.cancel',
    'admin.keap.tags.create'
  );

  -- Insert all missing translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- ENGLISH TRANSLATIONS
  -- Stats Section
  (v_tenant_id, 'en', 'admin.keap.tags.filtered', 'Filtered', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.withCategory', 'With Category', 'admin', NOW(), NOW()),

  -- Create Dialog
  (v_tenant_id, 'en', 'admin.keap.tags.tagName', 'Tag Name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.tagNamePlaceholder', 'e.g., LMS Student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.description', 'Description', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.descriptionPlaceholder', 'Brief description of this tag', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.cancel', 'Cancel', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.keap.tags.create', 'Create', 'admin', NOW(), NOW()),

  -- HEBREW TRANSLATIONS
  -- Stats Section
  (v_tenant_id, 'he', 'admin.keap.tags.filtered', 'מסונן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.withCategory', 'עם קטגוריה', 'admin', NOW(), NOW()),

  -- Create Dialog
  (v_tenant_id, 'he', 'admin.keap.tags.tagName', 'שם תג', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.tagNamePlaceholder', 'לדוגמה: תלמיד LMS', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.description', 'תיאור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.descriptionPlaceholder', 'תיאור קצר של התג הזה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.cancel', 'ביטול', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.keap.tags.create', 'צור', 'admin', NOW(), NOW());

  RAISE NOTICE 'Successfully inserted 16 translations (8 English + 8 Hebrew)';
  RAISE NOTICE 'Keys added:';
  RAISE NOTICE '  - admin.keap.tags.filtered';
  RAISE NOTICE '  - admin.keap.tags.withCategory';
  RAISE NOTICE '  - admin.keap.tags.tagName';
  RAISE NOTICE '  - admin.keap.tags.tagNamePlaceholder';
  RAISE NOTICE '  - admin.keap.tags.description';
  RAISE NOTICE '  - admin.keap.tags.descriptionPlaceholder';
  RAISE NOTICE '  - admin.keap.tags.cancel';
  RAISE NOTICE '  - admin.keap.tags.create';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;

-- Verify the insertions
SELECT
  language_code,
  COUNT(*) as count,
  string_agg(translation_key, ', ' ORDER BY translation_key) as keys
FROM translations
WHERE tenant_id = '70d86807-7e7c-49cd-8601-98235444e2ac'
AND translation_key LIKE 'admin.keap.tags.%'
AND translation_key IN (
  'admin.keap.tags.filtered',
  'admin.keap.tags.withCategory',
  'admin.keap.tags.tagName',
  'admin.keap.tags.tagNamePlaceholder',
  'admin.keap.tags.description',
  'admin.keap.tags.descriptionPlaceholder',
  'admin.keap.tags.cancel',
  'admin.keap.tags.create'
)
GROUP BY language_code
ORDER BY language_code;
