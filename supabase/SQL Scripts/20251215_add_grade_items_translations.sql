-- =====================================================
-- ADD GRADE ITEMS TRANSLATIONS
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
  WHERE translation_key LIKE 'admin.grading.items.%';

  -- Insert all translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Page title and subtitle
  (v_tenant_id, 'en', 'admin.grading.items.title', 'Grade Items', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.title', 'פריטי ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.subtitle', 'Manage assignments, quizzes, and exams', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.subtitle', 'נהל משימות, בחנים ומבחנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.addItem', 'Add Item', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.addItem', 'הוסף פריט', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'en', 'admin.grading.items.empty.title', 'No Grade Items', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.empty.title', 'אין פריטי ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.empty.description', 'Add grade items like assignments, quizzes, and exams', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.empty.description', 'הוסף פריטי ציון כמו משימות, בחנים ומבחנים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.empty.addFirst', 'Add First Item', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.empty.addFirst', 'הוסף פריט ראשון', 'admin', NOW(), NOW()),

  -- List labels
  (v_tenant_id, 'en', 'admin.grading.items.uncategorized', 'Uncategorized', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.uncategorized', 'ללא קטגוריה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.extraCredit', 'Extra Credit', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.extraCredit', 'נקודות בונוס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.draft', 'Draft', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.draft', 'טיוטה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.due', 'Due', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.due', 'תאריך הגשה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.noLateSubmission', 'No late submissions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.noLateSubmission', 'ללא הגשות מאוחרות', 'admin', NOW(), NOW()),

  -- Dialog
  (v_tenant_id, 'en', 'admin.grading.items.dialog.add', 'Add Grade Item', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.dialog.add', 'הוסף פריט ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.dialog.edit', 'Edit Grade Item', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.dialog.edit', 'ערוך פריט ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.dialog.addDescription', 'Create a new assignment, quiz, or exam', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.dialog.addDescription', 'צור משימה, בחן או מבחן חדש', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.dialog.editDescription', 'Update the grade item details', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.dialog.editDescription', 'עדכן את פרטי פריט הציון', 'admin', NOW(), NOW()),

  -- Form fields
  (v_tenant_id, 'en', 'admin.grading.items.form.name', 'Item Name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.name', 'שם הפריט', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.namePlaceholder', 'e.g., Homework 1, Midterm Exam', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.namePlaceholder', 'למשל, שיעורי בית 1, מבחן אמצע', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.description', 'Description (optional)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.description', 'תיאור (אופציונלי)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.descriptionPlaceholder', 'Optional description', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.descriptionPlaceholder', 'תיאור אופציונלי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.category', 'Category', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.category', 'קטגוריה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.selectCategory', 'Select a category (optional)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.selectCategory', 'בחר קטגוריה (אופציונלי)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.noCategory', 'No category', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.noCategory', 'ללא קטגוריה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.maxPoints', 'Max Points', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.maxPoints', 'מקסימום נקודות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.dueDate', 'Due Date (optional)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.dueDate', 'תאריך הגשה (אופציונלי)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.availableFrom', 'Available From', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.availableFrom', 'זמין מתאריך', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.availableUntil', 'Available Until', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.availableUntil', 'זמין עד תאריך', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.isPublished', 'Published (visible to students)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.isPublished', 'פורסם (גלוי לסטודנטים)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.isExtraCredit', 'Extra Credit', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.isExtraCredit', 'נקודות בונוס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.allowLateSubmission', 'Allow late submissions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.allowLateSubmission', 'אפשר הגשות מאוחרות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.form.displayOrder', 'Display Order', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.form.displayOrder', 'סדר תצוגה', 'admin', NOW(), NOW()),

  -- Validation messages
  (v_tenant_id, 'en', 'admin.grading.items.validation.nameRequired', 'Please enter an item name', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.validation.nameRequired', 'אנא הזן שם פריט', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.validation.maxPointsPositive', 'Max points must be greater than 0', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.validation.maxPointsPositive', 'מקסימום נקודות חייב להיות גדול מ-0', 'admin', NOW(), NOW()),

  -- Success messages
  (v_tenant_id, 'en', 'admin.grading.items.success.created', 'Grade item created successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.success.created', 'פריט הציון נוצר בהצלחה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.success.updated', 'Grade item updated successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.success.updated', 'פריט הציון עודכן בהצלחה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.success.deleted', 'Grade item deleted successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.success.deleted', 'פריט הציון נמחק בהצלחה', 'admin', NOW(), NOW()),

  -- Error messages
  (v_tenant_id, 'en', 'admin.grading.items.error.load', 'Failed to load grade items', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.error.load', 'טעינת פריטי הציון נכשלה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.error.save', 'Failed to save grade item', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.error.save', 'שמירת פריט הציון נכשלה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.items.error.delete', 'Failed to delete grade item', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.error.delete', 'מחיקת פריט הציון נכשלה', 'admin', NOW(), NOW()),

  -- Confirm messages
  (v_tenant_id, 'en', 'admin.grading.items.confirm.delete', 'Are you sure you want to delete this grade item?', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.items.confirm.delete', 'האם אתה בטוח שברצונך למחוק את פריט הציון הזה?', 'admin', NOW(), NOW());

  RAISE NOTICE '✅ Added grade items translations';
  RAISE NOTICE 'Total translations added: 39 keys × 2 languages = 78 entries';
END $$;
