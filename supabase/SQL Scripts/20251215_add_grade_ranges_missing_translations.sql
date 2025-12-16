-- =====================================================
-- ADD MISSING GRADE RANGES TRANSLATIONS
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
  WHERE translation_key LIKE 'admin.grading.ranges.%' OR
        translation_key LIKE 'admin.grading.scales.scaleType.%' OR
        translation_key IN ('common.delete', 'common.deleting');

  -- Insert all translations
  INSERT INTO public.translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- Scale types
  (v_tenant_id, 'en', 'admin.grading.scales.scaleType.letter', 'Letter', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.scaleType.letter', 'אותיות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.scales.scaleType.numeric', 'Numeric', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.scaleType.numeric', 'מספרי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.scales.scaleType.percentage', 'Percentage', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.scaleType.percentage', 'אחוזים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.scales.scaleType.pass_fail', 'Pass/Fail', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.scales.scaleType.pass_fail', 'עבר/נכשל', 'admin', NOW(), NOW()),

  -- Page elements
  (v_tenant_id, 'en', 'admin.grading.ranges.subtitle', 'Manage grade ranges for this scale', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.subtitle', 'נהל טווחי ציונים עבור סולם זה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.add', 'Add Grade Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.add', 'הוסף טווח ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.scaleInfo', 'Scale Information', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.scaleInfo', 'מידע על הסולם', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.type', 'Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.type', 'סוג', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.status', 'סטטוס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.default', 'Default', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.default', 'ברירת מחדל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.yes', 'Yes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.yes', 'כן', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.no', 'No', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.no', 'לא', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.gradeRanges', 'Grade Ranges', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.gradeRanges', 'טווחי ציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.failing', 'Failing', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.failing', 'נכשל', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.range', 'Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.range', 'טווח', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.gpa', 'GPA', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.gpa', 'ממוצע', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.order', 'Order', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.order', 'סדר', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'en', 'admin.grading.ranges.empty.title', 'No Grade Ranges', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.empty.title', 'אין טווחי ציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.empty.description', 'Add grade ranges to define how percentages are converted to grades', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.empty.description', 'הוסף טווחי ציונים כדי להגדיר כיצד אחוזים מומרים לציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.empty.addFirst', 'Add First Grade Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.empty.addFirst', 'הוסף טווח ציון ראשון', 'admin', NOW(), NOW()),

  -- Dialog
  (v_tenant_id, 'en', 'admin.grading.ranges.dialog.add', 'Add Grade Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.dialog.add', 'הוסף טווח ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.dialog.edit', 'Edit Grade Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.dialog.edit', 'ערוך טווח ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.dialog.addDescription', 'Create a new grade range for this scale', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.dialog.addDescription', 'צור טווח ציון חדש עבור סולם זה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.dialog.editDescription', 'Update the grade range details', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.dialog.editDescription', 'עדכן את פרטי טווח הציון', 'admin', NOW(), NOW()),

  -- Form fields
  (v_tenant_id, 'en', 'admin.grading.ranges.form.gradeLabel', 'Grade Label', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.gradeLabel', 'תווית ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.gradeLabelPlaceholder', 'e.g., A, B+, Pass', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.gradeLabelPlaceholder', 'למשל, א, ב+, עבר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.minPercentage', 'Min %', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.minPercentage', 'אחוז מינימלי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.maxPercentage', 'Max %', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.maxPercentage', 'אחוז מקסימלי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.gpaValue', 'GPA Value (optional)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.gpaValue', 'ערך ממוצע (אופציונלי)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.displayOrder', 'Display Order', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.displayOrder', 'סדר תצוגה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.color', 'Color', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.color', 'צבע', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.form.passingGrade', 'Passing Grade', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.form.passingGrade', 'ציון עובר', 'admin', NOW(), NOW()),

  -- Validation messages
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.title', 'Grade ranges validation issues', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.title', 'בעיות אימות טווחי ציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.overlap', 'Overlap between {grade1} and {grade2}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.overlap', 'חפיפה בין {grade1} ל-{grade2}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.gap', 'Gap between {grade1} ({percent1}%) and {grade2} ({percent2}%)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.gap', 'פער בין {grade1} ({percent1}%) ל-{grade2} ({percent2}%)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.notCoverZero', 'Grade ranges don''t cover 0%. Lowest range starts at {percent}%', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.notCoverZero', 'טווחי הציונים לא מכסים את 0%. הטווח הנמוך ביותר מתחיל ב-{percent}%', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.notCoverHundred', 'Grade ranges don''t cover 100%. Highest range ends at {percent}%', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.notCoverHundred', 'טווחי הציונים לא מכסים את 100%. הטווח הגבוה ביותר מסתיים ב-{percent}%', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.labelRequired', 'Please enter a grade label', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.labelRequired', 'אנא הזן תווית ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.validation.invalidRange', 'Minimum percentage cannot be greater than maximum percentage', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.validation.invalidRange', 'אחוז מינימלי לא יכול להיות גדול יותר מאחוז מקסימלי', 'admin', NOW(), NOW()),

  -- Success messages
  (v_tenant_id, 'en', 'admin.grading.ranges.success.created', 'Grade range created successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.success.created', 'טווח הציון נוצר בהצלחה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.success.updated', 'Grade range updated successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.success.updated', 'טווח הציון עודכן בהצלחה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.success.deleted', 'Grade range deleted successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.success.deleted', 'טווח הציון נמחק בהצלחה', 'admin', NOW(), NOW()),

  -- Error messages
  (v_tenant_id, 'en', 'admin.grading.ranges.error.loadData', 'Failed to load data', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.error.loadData', 'טעינת הנתונים נכשלה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.error.save', 'Failed to save grade range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.error.save', 'שמירת טווח הציון נכשלה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.error.delete', 'Failed to delete grade range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.error.delete', 'מחיקת טווח הציון נכשלה', 'admin', NOW(), NOW()),

  -- Info section
  (v_tenant_id, 'en', 'admin.grading.ranges.info.title', 'About Grade Ranges', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.title', 'אודות טווחי ציונים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.info.description', 'Grade ranges define how percentage scores are converted to letter grades. Each range specifies:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.description', 'טווחי ציונים מגדירים כיצד ציוני אחוזים מומרים לציוני אותיות. כל טווח מציין:', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.info.label', 'A grade label (e.g., "A", "B+", "Pass")', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.label', 'תווית ציון (למשל, "א", "ב+", "עבר")', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.info.percentage', 'A percentage range (e.g., 90-100 for an A)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.percentage', 'טווח אחוזים (למשל, 90-100 עבור א)', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.info.gpaValue', 'An optional GPA value for transcript calculations', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.gpaValue', 'ערך ממוצע אופציונלי עבור חישובי תעודות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.info.color', 'A color for visual display in the UI', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.color', 'צבע לתצוגה חזותית בממשק', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.info.passing', 'Whether the grade is passing or failing', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.info.passing', 'האם הציון הוא עובר או נכשל', 'admin', NOW(), NOW()),

  -- Not found
  (v_tenant_id, 'en', 'admin.grading.ranges.notFound.scale', 'Scale not found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.notFound.scale', 'סולם לא נמצא', 'admin', NOW(), NOW()),

  -- Delete dialog
  (v_tenant_id, 'en', 'admin.grading.ranges.delete.title', 'Delete Grade Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.delete.title', 'מחק טווח ציון', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.delete.description', 'Are you sure you want to delete this grade range? This action cannot be undone.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.delete.description', 'האם אתה בטוח שברצונך למחוק את טווח הציון הזה? לא ניתן לבטל פעולה זו.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'admin.grading.ranges.delete.confirmRange', 'Range', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.grading.ranges.delete.confirmRange', 'טווח', 'admin', NOW(), NOW()),

  -- Common delete/deleting
  (v_tenant_id, 'en', 'common.delete', 'Delete', 'both', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.delete', 'מחק', 'both', NOW(), NOW()),
  (v_tenant_id, 'en', 'common.deleting', 'Deleting...', 'both', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.deleting', 'מוחק...', 'both', NOW(), NOW());

  RAISE NOTICE '✅ Added missing grade ranges translations';
  RAISE NOTICE 'Total translations added: 58 keys × 2 languages = 116 entries';
END $$;
