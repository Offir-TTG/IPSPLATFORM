-- =====================================================
-- ADD GRADE SCALES DELETE DIALOG TRANSLATIONS
-- =====================================================

DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the first tenant
  SELECT id INTO v_tenant_id FROM public.tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No tenant found. Please create a tenant first.';
  END IF;

  -- Delete existing translations to avoid duplicates
  DELETE FROM public.translations
  WHERE translation_key LIKE 'admin.grading.scales.delete.%' OR
        translation_key LIKE 'admin.grading.categories.delete.%' OR
        translation_key = 'admin.grading.categories.validation.exceedsTotal';

  -- Insert all translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Grading Scales Delete Dialog
  (v_tenant_id, 'en', 'admin.grading.scales.delete.title', 'Delete Grading Scale', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.delete.title', 'מחק סולם ציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.scales.delete.description', 'Are you sure you want to delete this grading scale? This action cannot be undone.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.delete.description', 'האם אתה בטוח שברצונך למחוק את סולם הציונים הזה? לא ניתן לבטל פעולה זו.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.scales.delete.rangesWarning', 'This will also delete {count} grade ranges', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.delete.rangesWarning', 'זה גם ימחק {count} טווחי ציונים', 'admin', NOW(), NOW()),

  -- Grade Categories Delete Dialog
  (v_tenant_id, 'en', 'admin.grading.categories.delete.title', 'Delete Grade Category', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.categories.delete.title', 'מחק קטגוריית ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.categories.delete.description', 'Are you sure you want to delete this grade category? This action cannot be undone.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.categories.delete.description', 'האם אתה בטוח שברצונך למחוק את קטגוריית הציון הזו? לא ניתן לבטל פעולה זו.', 'admin', NOW(), NOW()),

  -- Grade Categories Validation
  (v_tenant_id, 'en', 'admin.grading.categories.validation.exceedsTotal', 'Total weight would exceed 100%. Other categories: {other}%, New weight: {new}%', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.categories.validation.exceedsTotal', 'המשקל הכולל יעלה על 100%. קטגוריות אחרות: {other}%, משקל חדש: {new}%', 'admin', NOW(), NOW());

  RAISE NOTICE '✅ Added grade scales and categories delete translations';
  RAISE NOTICE 'Total translations added: 6 keys × 2 languages = 12 entries';
END $$;
