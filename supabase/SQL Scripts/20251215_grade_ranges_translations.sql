-- ============================================================================
-- GRADE RANGES PAGE TRANSLATIONS
-- ============================================================================
-- Complete translations for the grade ranges management page
-- Run this after creating the grading system translations
-- ============================================================================

-- Replace with your tenant ID
DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

-- Page Title & Navigation
PERFORM upsert_translation('en', 'admin.grading.ranges.backToScales', 'Back to Scales', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.backToScales', 'חזרה לסולמות', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.subtitle', 'Manage grade ranges for this scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.subtitle', 'ניהול טווחי ציונים לסולם זה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.add', 'Add Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.add', 'הוספת טווח ציונים', 'admin', 'admin', v_tenant_id);

-- Scale Information Card
PERFORM upsert_translation('en', 'admin.grading.ranges.scaleInfo', 'Scale Information', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.scaleInfo', 'מידע על הסולם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.type', 'Type', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.type', 'סוג', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.status', 'Status', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.status', 'סטטוס', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.default', 'Default', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.default', 'ברירת מחדל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.yes', 'Yes', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.yes', 'כן', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.no', 'No', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.no', 'לא', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.gradeRanges', 'Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.gradeRanges', 'טווחי ציונים', 'admin', 'admin', v_tenant_id);

-- Empty State
PERFORM upsert_translation('en', 'admin.grading.ranges.empty.title', 'No Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.empty.title', 'אין טווחי ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.empty.description', 'Add grade ranges to define how percentages are converted to grades', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.empty.description', 'הוסף טווחי ציונים כדי להגדיר כיצד אחוזים מומרים לציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.empty.addFirst', 'Add First Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.empty.addFirst', 'הוסף טווח ציונים ראשון', 'admin', 'admin', v_tenant_id);

-- Grade Range Display
PERFORM upsert_translation('en', 'admin.grading.ranges.failing', 'Failing', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.failing', 'נכשל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.range', 'Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.range', 'טווח', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.gpa', 'GPA', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.gpa', 'ממוצע', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.order', 'Order', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.order', 'סדר', 'admin', 'admin', v_tenant_id);

-- Info Card
PERFORM upsert_translation('en', 'admin.grading.ranges.info.title', 'About Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.title', 'אודות טווחי ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.description', 'Grade ranges define how percentage scores are converted to letter grades. Each range specifies:', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.description', 'טווחי ציונים מגדירים כיצד ציוני אחוזים מומרים לציוני אותיות. כל טווח מציין:', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.label', 'A grade label (e.g., "A", "B+", "Pass")', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.label', 'תווית ציון (למשל, "A", "B+", "עבר")', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.percentage', 'A percentage range (e.g., 90-100 for an A)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.percentage', 'טווח אחוזים (למשל, 90-100 עבור A)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.gpaValue', 'An optional GPA value for transcript calculations', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.gpaValue', 'ערך ממוצע אופציונלי לחישובי תעודה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.color', 'A color for visual display in the UI', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.color', 'צבע לתצוגה ויזואלית בממשק', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.passing', 'Whether the grade is passing or failing', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.passing', 'האם הציון עובר או נכשל', 'admin', 'admin', v_tenant_id);

-- Create/Edit Dialog
PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.add', 'Add Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.add', 'הוספת טווח ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.edit', 'Edit Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.edit', 'עריכת טווח ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.addDescription', 'Create a new grade range for this scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.addDescription', 'צור טווח ציונים חדש לסולם זה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.editDescription', 'Update the grade range details', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.editDescription', 'עדכן את פרטי טווח הציונים', 'admin', 'admin', v_tenant_id);

-- Form Fields
PERFORM upsert_translation('en', 'admin.grading.ranges.form.gradeLabel', 'Grade Label', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.gradeLabel', 'תווית ציון', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.gradeLabelPlaceholder', 'e.g., A, B+, Pass', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.gradeLabelPlaceholder', 'למשל, A, B+, עבר', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.minPercentage', 'Min %', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.minPercentage', 'אחוז מינימלי', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.maxPercentage', 'Max %', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.maxPercentage', 'אחוז מקסימלי', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.gpaValue', 'GPA Value (optional)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.gpaValue', 'ערך ממוצע (אופציונלי)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.displayOrder', 'Display Order', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.displayOrder', 'סדר תצוגה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.color', 'Color', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.color', 'צבע', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.passingGrade', 'Passing Grade', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.passingGrade', 'ציון עובר', 'admin', 'admin', v_tenant_id);

-- Validation Messages
PERFORM upsert_translation('en', 'admin.grading.ranges.validation.labelRequired', 'Please enter a grade label', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.validation.labelRequired', 'נא להזין תווית ציון', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.validation.invalidRange', 'Minimum percentage cannot be greater than maximum percentage', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.validation.invalidRange', 'אחוז מינימלי לא יכול להיות גדול מאחוז מקסימלי', 'admin', 'admin', v_tenant_id);

-- Success Messages
PERFORM upsert_translation('en', 'admin.grading.ranges.success.created', 'Grade range created successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.success.created', 'טווח הציונים נוצר בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.success.updated', 'Grade range updated successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.success.updated', 'טווח הציונים עודכן בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.success.deleted', 'Grade range deleted successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.success.deleted', 'טווח הציונים נמחק בהצלחה', 'admin', 'admin', v_tenant_id);

-- Error Messages
PERFORM upsert_translation('en', 'admin.grading.ranges.error.loadData', 'Failed to load data', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.error.loadData', 'נכשל בטעינת הנתונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.error.save', 'Failed to save grade range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.error.save', 'נכשל בשמירת טווח הציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.error.delete', 'Failed to delete grade range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.error.delete', 'נכשל במחיקת טווח הציונים', 'admin', 'admin', v_tenant_id);

-- Confirmation Messages
PERFORM upsert_translation('en', 'admin.grading.ranges.confirm.delete', 'Are you sure you want to delete this grade range?', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.confirm.delete', 'האם אתה בטוח שברצונך למחוק את טווח הציונים הזה?', 'admin', 'admin', v_tenant_id);

-- Not Found Messages
PERFORM upsert_translation('en', 'admin.grading.ranges.notFound.scale', 'Scale not found', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.notFound.scale', 'הסולם לא נמצא', 'admin', 'admin', v_tenant_id);

-- Additional translations for edit scale
PERFORM upsert_translation('en', 'admin.grading.scales.edit', 'Edit Scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.edit', 'עריכת סולם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.editDescription', 'Update the grading scale details', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.editDescription', 'עדכן את פרטי סולם הציונים', 'admin', 'admin', v_tenant_id);

RAISE NOTICE '✅ All grade ranges translations added successfully!';

END $$;
