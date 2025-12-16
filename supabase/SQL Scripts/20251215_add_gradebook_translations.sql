-- =====================================================
-- ADD GRADEBOOK TRANSLATIONS
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
  WHERE translation_key LIKE 'admin.grading.gradebook.%';

  -- Insert all translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Gradebook Page Header
  (v_tenant_id, 'en', 'admin.grading.gradebook.title', 'Gradebook', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.title', 'ספר ציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.subtitle', 'Manage student grades for this course', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.subtitle', 'נהל ציוני תלמידים עבור קורס זה', 'admin', NOW(), NOW()),

  -- Gradebook Actions
  (v_tenant_id, 'en', 'admin.grading.gradebook.export', 'Export', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.export', 'ייצא', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.import', 'Import', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.import', 'ייבא', 'admin', NOW(), NOW()),

  -- Gradebook Table
  (v_tenant_id, 'en', 'admin.grading.gradebook.student', 'Student', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.student', 'תלמיד', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.total', 'Total', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.total', 'סה"כ', 'admin', NOW(), NOW()),

  -- Gradebook Empty States
  (v_tenant_id, 'en', 'admin.grading.gradebook.empty.title', 'No Data Available', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.empty.title', 'אין נתונים זמינים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.empty.noStudents', 'No students enrolled in this course', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.empty.noStudents', 'אין תלמידים רשומים לקורס זה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.empty.noItems', 'No grade items created for this course', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.empty.noItems', 'לא נוצרו פריטי ציון עבור קורס זה', 'admin', NOW(), NOW()),

  -- Gradebook Messages
  (v_tenant_id, 'en', 'admin.grading.gradebook.noChanges', 'No changes to save', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.noChanges', 'אין שינויים לשמור', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.success.saved', 'Grades saved successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.success.saved', 'הציונים נשמרו בהצלחה', 'admin', NOW(), NOW()),

  -- Gradebook Errors
  (v_tenant_id, 'en', 'admin.grading.gradebook.error.load', 'Failed to load gradebook data', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.error.load', 'נכשל בטעינת נתוני ספר הציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.gradebook.error.save', 'Failed to save grades', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.gradebook.error.save', 'נכשל בשמירת הציונים', 'admin', NOW(), NOW());

  RAISE NOTICE '✅ Added gradebook translations';
  RAISE NOTICE 'Total translations added: 14 keys × 2 languages = 28 entries';
END $$;
