-- =====================================================
-- COMPLETE GRADING SYSTEM TRANSLATIONS
-- =====================================================
-- English and Hebrew translations for all grading system UI elements
-- =====================================================

-- Create translation function if it doesn't exist
CREATE OR REPLACE FUNCTION upsert_translation(
  p_language_code VARCHAR,
  p_key VARCHAR,
  p_value TEXT,
  p_category VARCHAR DEFAULT 'common',
  p_context VARCHAR DEFAULT 'admin',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO translations (language_code, key, value, category, context, tenant_id)
  VALUES (p_language_code, p_key, p_value, p_category, p_context, p_tenant_id)
  ON CONFLICT (language_code, key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::UUID))
  DO UPDATE SET
    value = EXCLUDED.value,
    category = EXCLUDED.category,
    context = EXCLUDED.context,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

-- =====================================================
-- GRADING SCALES
-- =====================================================

-- Page titles
PERFORM upsert_translation('en', 'admin.grading.scales.title', 'Grading Scales', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.title', 'סולמות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.subtitle', 'Manage grading scales for your courses', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.subtitle', 'ניהול סולמות ציונים לקורסים שלך', 'admin', 'admin', v_tenant_id);

-- Buttons
PERFORM upsert_translation('en', 'admin.grading.scales.create', 'Create Scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.create', 'יצירת סולם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.edit', 'Edit Scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.edit', 'עריכת סולם', 'admin', 'admin', v_tenant_id);

-- Status badges
PERFORM upsert_translation('en', 'admin.grading.scales.active', 'Active', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.active', 'פעיל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.inactive', 'Inactive', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.inactive', 'לא פעיל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.default', 'Default', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.default', 'ברירת מחדל', 'admin', 'admin', v_tenant_id);

-- Scale types
PERFORM upsert_translation('en', 'admin.grading.scales.type.letter', 'Letter', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.type.letter', 'אותיות', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.type.numeric', 'Numeric', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.type.numeric', 'מספרי', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.type.passfail', 'Pass/Fail', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.type.passfail', 'עבר/נכשל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.type.custom', 'Custom', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.type.custom', 'מותאם אישית', 'admin', 'admin', v_tenant_id);

-- =====================================================
-- GRADE RANGES
-- =====================================================

PERFORM upsert_translation('en', 'admin.grading.ranges.subtitle', 'Manage grade ranges for this scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.subtitle', 'ניהול טווחי ציונים לסולם זה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.add', 'Add Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.add', 'הוספת טווח ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.scaleInfo', 'Scale Information', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.scaleInfo', 'מידע על הסולם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.type', 'Type', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.type', 'סוג', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.status', 'Status', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.status', 'סטטוס', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.gradeRanges', 'Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.gradeRanges', 'טווחי ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.yes', 'Yes', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.yes', 'כן', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.no', 'No', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.no', 'לא', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.failing', 'Failing', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.failing', 'נכשל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.range', 'Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.range', 'טווח', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.gpa', 'GPA', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.gpa', 'ממוצע', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.order', 'Order', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.order', 'סדר', 'admin', 'admin', v_tenant_id);

-- Form fields
PERFORM upsert_translation('en', 'admin.grading.ranges.form.gradeLabel', 'Grade Label', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.gradeLabel', 'תווית ציון', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.form.gradeLabelPlaceholder', 'e.g., A, B+, Pass', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.form.gradeLabelPlaceholder', 'לדוגמה: א, ב+, עבר', 'admin', 'admin', v_tenant_id);

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

-- Validation messages
PERFORM upsert_translation('en', 'admin.grading.ranges.validation.labelRequired', 'Please enter a grade label', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.validation.labelRequired', 'נא להזין תווית ציון', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.validation.invalidRange', 'Minimum percentage cannot be greater than maximum percentage', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.validation.invalidRange', 'אחוז מינימלי לא יכול להיות גדול מאחוז מקסימלי', 'admin', 'admin', v_tenant_id);

-- Success/Error messages
PERFORM upsert_translation('en', 'admin.grading.ranges.success.created', 'Grade range created successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.success.created', 'טווח הציונים נוצר בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.success.updated', 'Grade range updated successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.success.updated', 'טווח הציונים עודכן בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.success.deleted', 'Grade range deleted successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.success.deleted', 'טווח הציונים נמחק בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.error.loadData', 'Failed to load data', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.error.loadData', 'טעינת הנתונים נכשלה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.error.save', 'Failed to save grade range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.error.save', 'שמירת טווח הציונים נכשלה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.error.delete', 'Failed to delete grade range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.error.delete', 'מחיקת טווח הציונים נכשלה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.confirm.delete', 'Are you sure you want to delete this grade range?', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.confirm.delete', 'האם אתה בטוח שברצונך למחוק טווח ציונים זה?', 'admin', 'admin', v_tenant_id);

-- Dialog titles
PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.edit', 'Edit Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.edit', 'עריכת טווח ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.add', 'Add Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.add', 'הוספת טווח ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.editDescription', 'Update the grade range details', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.editDescription', 'עדכן את פרטי טווח הציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.dialog.addDescription', 'Create a new grade range for this scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.dialog.addDescription', 'צור טווח ציונים חדש לסולם זה', 'admin', 'admin', v_tenant_id);

-- Empty states
PERFORM upsert_translation('en', 'admin.grading.ranges.empty.title', 'No Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.empty.title', 'אין טווחי ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.empty.description', 'Add grade ranges to define how percentages are converted to grades', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.empty.description', 'הוסף טווחי ציונים כדי להגדיר כיצד אחוזים מומרים לציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.empty.addFirst', 'Add First Grade Range', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.empty.addFirst', 'הוסף טווח ציונים ראשון', 'admin', 'admin', v_tenant_id);

-- Info section
PERFORM upsert_translation('en', 'admin.grading.ranges.info.title', 'About Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.title', 'אודות טווחי ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.description', 'Grade ranges define how percentage scores are converted to letter grades. Each range specifies:', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.description', 'טווחי ציונים מגדירים כיצד ציוני אחוזים מומרים לציוני אותיות. כל טווח מציין:', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.label', 'A grade label (e.g., "A", "B+", "Pass")', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.label', 'תווית ציון (למשל, "א", "ב+", "עבר")', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.percentage', 'A percentage range (e.g., 90-100 for an A)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.percentage', 'טווח אחוזים (למשל, 90-100 עבור א)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.gpaValue', 'An optional GPA value for transcript calculations', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.gpaValue', 'ערך ממוצע אופציונלי לחישוב תעודה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.color', 'A color for visual display in the UI', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.color', 'צבע לתצוגה חזותית בממשק', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.info.passing', 'Whether the grade is passing or failing', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.info.passing', 'האם הציון הוא עובר או נכשל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.ranges.notFound.scale', 'Scale not found', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.ranges.notFound.scale', 'הסולם לא נמצא', 'admin', 'admin', v_tenant_id);

-- =====================================================
-- GRADE CATEGORIES
-- =====================================================

PERFORM upsert_translation('en', 'admin.grading.categories.title', 'Grade Categories', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.title', 'קטגוריות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.subtitle', 'Manage weighted categories for this course', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.subtitle', 'ניהול קטגוריות משוקללות לקורס זה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.addCategory', 'Add Category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.addCategory', 'הוספת קטגוריה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.totalWeight', 'Total Weight', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.totalWeight', 'משקל כולל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.exceedsLimit', 'Exceeds 100%', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.exceedsLimit', 'חורג מ-100%', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.complete', 'Complete', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.complete', 'שלם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.remaining', 'remaining', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.remaining', 'נותר', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.weightExceedsWarning', 'Total weight exceeds 100%. Please adjust category weights.', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.weightExceedsWarning', 'המשקל הכולל חורג מ-100%. נא להתאים את משקלי הקטגוריות.', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.dropLowest', 'Drop {n} lowest', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.dropLowest', 'השמט {n} נמוכים ביותר', 'admin', 'admin', v_tenant_id);

-- Form
PERFORM upsert_translation('en', 'admin.grading.categories.form.name', 'Category Name', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.name', 'שם קטגוריה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.namePlaceholder', 'e.g., Homework, Quizzes, Exams', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.namePlaceholder', 'לדוגמה: שיעורי בית, בחנים, מבחנים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.description', 'Description (optional)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.description', 'תיאור (אופציונלי)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.descriptionPlaceholder', 'Optional description for this category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.descriptionPlaceholder', 'תיאור אופציונלי לקטגוריה זו', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.weight', 'Weight (%)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.weight', 'משקל (%)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.weightHelper', 'Current total: {current}% | After adding: {after}%', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.weightHelper', 'סה"כ נוכחי: {current}% | לאחר הוספה: {after}%', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.dropLowest', 'Drop Lowest Scores', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.dropLowest', 'השמט ציונים נמוכים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.dropLowestHelper', 'Automatically drop the N lowest scores in this category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.dropLowestHelper', 'השמט אוטומטית את N הציונים הנמוכים ביותר בקטגוריה זו', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.displayOrder', 'Display Order', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.displayOrder', 'סדר תצוגה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.form.color', 'Color', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.form.color', 'צבע', 'admin', 'admin', v_tenant_id);

-- Validation
PERFORM upsert_translation('en', 'admin.grading.categories.validation.nameRequired', 'Please enter a category name', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.validation.nameRequired', 'נא להזין שם קטגוריה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.validation.weightRange', 'Weight must be between 0 and 100', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.validation.weightRange', 'המשקל חייב להיות בין 0 ל-100', 'admin', 'admin', v_tenant_id);

-- Success/Error messages
PERFORM upsert_translation('en', 'admin.grading.categories.success.created', 'Grade category created successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.success.created', 'קטגוריית הציונים נוצרה בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.success.updated', 'Grade category updated successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.success.updated', 'קטגוריית הציונים עודכנה בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.success.deleted', 'Grade category deleted successfully', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.success.deleted', 'קטגוריית הציונים נמחקה בהצלחה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.error.load', 'Failed to load grade categories', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.error.load', 'טעינת קטגוריות הציונים נכשלה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.error.save', 'Failed to save grade category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.error.save', 'שמירת קטגוריית הציונים נכשלה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.error.delete', 'Failed to delete grade category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.error.delete', 'מחיקת קטגוריית הציונים נכשלה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.confirm.delete', 'Are you sure you want to delete this grade category?', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.confirm.delete', 'האם אתה בטוח שברצונך למחוק קטגוריית ציונים זו?', 'admin', 'admin', v_tenant_id);

-- Dialog
PERFORM upsert_translation('en', 'admin.grading.categories.dialog.add', 'Add Grade Category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.dialog.add', 'הוספת קטגוריית ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.dialog.edit', 'Edit Grade Category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.dialog.edit', 'עריכת קטגוריית ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.dialog.addDescription', 'Create a new weighted category for this course', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.dialog.addDescription', 'צור קטגוריה משוקללת חדשה לקורס זה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.dialog.editDescription', 'Update the grade category details', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.dialog.editDescription', 'עדכן את פרטי קטגוריית הציונים', 'admin', 'admin', v_tenant_id);

-- Empty state
PERFORM upsert_translation('en', 'admin.grading.categories.empty.title', 'No Grade Categories', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.empty.title', 'אין קטגוריות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.empty.description', 'Add grade categories to organize assignments and calculate final grades', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.empty.description', 'הוסף קטגוריות ציונים לארגון משימות וחישוב ציונים סופיים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.empty.addFirst', 'Add First Category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.empty.addFirst', 'הוסף קטגוריה ראשונה', 'admin', 'admin', v_tenant_id);

-- Info section
PERFORM upsert_translation('en', 'admin.grading.categories.info.title', 'About Grade Categories', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.info.title', 'אודות קטגוריות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.info.description', 'Grade categories help you organize assignments and calculate weighted final grades.', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.info.description', 'קטגוריות ציונים עוזרות לך לארגן משימות ולחשב ציונים סופיים משוקללים.', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.info.point1', 'Each category has a weight (percentage) that contributes to the final grade', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.info.point1', 'לכל קטגוריה יש משקל (אחוז) שתורם לציון הסופי', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.info.point2', 'Total weight should equal 100% for accurate grading', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.info.point2', 'המשקל הכולל צריך להיות שווה ל-100% לציון מדויק', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.info.point3', 'Drop lowest allows you to automatically drop the lowest N scores in a category', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.info.point3', 'השמטת נמוכים מאפשרת לך להשמיט אוטומטית את N הציונים הנמוכים ביותר בקטגוריה', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.categories.info.example', 'Example: Homework (20%), Quizzes (15%), Midterm (25%), Final (40%)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.categories.info.example', 'דוגמה: שיעורי בית (20%), בחנים (15%), בוחן אמצע (25%), מבחן סופי (40%)', 'admin', 'admin', v_tenant_id);

-- =====================================================
-- COURSE BUILDER - GRADING BUTTON
-- =====================================================

PERFORM upsert_translation('en', 'lms.builder.grading', 'Grading', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'lms.builder.grading', 'ציונים', 'admin', 'admin', v_tenant_id);

-- =====================================================
-- COMMON TRANSLATIONS
-- =====================================================

PERFORM upsert_translation('en', 'common.loading', 'Loading...', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.loading', 'טוען...', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.error', 'Error', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.error', 'שגיאה', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.success', 'Success', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.success', 'הצלחה', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.cancel', 'Cancel', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.cancel', 'ביטול', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.create', 'Create', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.create', 'צור', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.update', 'Update', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.update', 'עדכן', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.delete', 'Delete', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.delete', 'מחק', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.save', 'Save', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.save', 'שמור', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.saving', 'Saving...', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.saving', 'שומר...', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.edit', 'Edit', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.edit', 'ערוך', 'common', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'common.back', 'Back', 'common', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'common.back', 'חזור', 'common', 'admin', v_tenant_id);

RAISE NOTICE '✅ All grading system translations added successfully!';
RAISE NOTICE '';
RAISE NOTICE '📊 Translation Summary:';
RAISE NOTICE '  - Grading Scales: Complete';
RAISE NOTICE '  - Grade Ranges: Complete';
RAISE NOTICE '  - Grade Categories: Complete';
RAISE NOTICE '  - Common terms: Complete';
RAISE NOTICE '';
RAISE NOTICE '🌍 Languages: English + Hebrew';

END $$;
