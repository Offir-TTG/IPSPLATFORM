-- ============================================================================
-- GRADING SYSTEM TRANSLATIONS
-- ============================================================================
-- Complete translations for the grading system UI
-- Run this after creating the grading system tables
-- ============================================================================

-- Replace with your tenant ID
DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

-- Navigation
PERFORM upsert_translation('en', 'admin.nav.grading', 'Grading', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.nav.grading', 'ציונים', 'admin', 'admin', v_tenant_id);

-- Grading Scales Page
PERFORM upsert_translation('en', 'admin.grading.scales.title', 'Grading Scales', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.title', 'סולמות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.subtitle', 'Manage grading scales and grade ranges for courses', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.subtitle', 'ניהול סולמות ציונים וטווחי ציונים לקורסים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.create', 'Create Scale', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.create', 'יצירת סולם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.default', 'Default', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.default', 'ברירת מחדל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.active', 'Active', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.active', 'פעיל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.inactive', 'Inactive', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.inactive', 'לא פעיל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.ranges', 'Grade Ranges', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.ranges', 'טווחי ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.failing', 'Failing', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.failing', 'נכשל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.noRanges', 'No grade ranges defined', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.noRanges', 'לא הוגדרו טווחי ציונים', 'admin', 'admin', v_tenant_id);

-- Empty State
PERFORM upsert_translation('en', 'admin.grading.scales.empty.title', 'No Grading Scales', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.empty.title', 'אין סולמות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.empty.description', 'Create your first grading scale to get started', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.empty.description', 'צור את סולם הציונים הראשון שלך כדי להתחיל', 'admin', 'admin', v_tenant_id);

-- Info Card
PERFORM upsert_translation('en', 'admin.grading.scales.info.title', 'About Grading Scales', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.info.title', 'אודות סולמות ציונים', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.info.description', 'Grading scales define how percentages are converted to letter grades. You can create multiple scales for different course types (e.g., Letter Grades A-F, Pass/Fail, Numeric 0-100). Set one scale as default to automatically apply it to new courses.', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.info.description', 'סולמות ציונים מגדירים כיצד אחוזים מומרים לציוני אותיות. ניתן ליצור מספר סולמות לסוגי קורסים שונים (למשל, ציוני אותיות A-F, עבר/נכשל, מספרי 0-100). הגדר סולם אחד כברירת מחדל כדי להחיל אותו אוטומטית על קורסים חדשים.', 'admin', 'admin', v_tenant_id);

-- Create Dialog
PERFORM upsert_translation('en', 'admin.grading.scales.createDescription', 'Create a new grading scale for your courses', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.createDescription', 'צור סולם ציונים חדש לקורסים שלך', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.name', 'Name', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.name', 'שם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.namePlaceholder', 'e.g., Standard Letter Grade (A-F)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.namePlaceholder', 'למשל, ציון אותיות סטנדרטי (A-F)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.description', 'Description', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.description', 'תיאור', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.descriptionPlaceholder', 'Optional description...', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.descriptionPlaceholder', 'תיאור אופציונלי...', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.type', 'Scale Type', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.type', 'סוג סולם', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.default', 'Set as Default', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.default', 'הגדר כברירת מחדל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.form.active', 'Active', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.form.active', 'פעיל', 'admin', 'admin', v_tenant_id);

-- Scale Types
PERFORM upsert_translation('en', 'admin.grading.scales.types.letter', 'Letter Grade (A-F)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.types.letter', 'ציון אותיות (A-F)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.types.numeric', 'Numeric (0-100)', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.types.numeric', 'מספרי (0-100)', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.types.passfail', 'Pass/Fail', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.types.passfail', 'עבר/נכשל', 'admin', 'admin', v_tenant_id);

PERFORM upsert_translation('en', 'admin.grading.scales.types.custom', 'Custom', 'admin', 'admin', v_tenant_id);
PERFORM upsert_translation('he', 'admin.grading.scales.types.custom', 'מותאם אישית', 'admin', 'admin', v_tenant_id);

RAISE NOTICE '✅ All grading translations added successfully!';

END $$;
