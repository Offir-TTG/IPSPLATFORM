-- Hebrew translations for the toasts on /admin/grading/scales and for
-- the picker's new "scale changed → letters recomputed" toast. The
-- scales page was using hardcoded English strings for every toast
-- title/description (Success / Error / created / updated / deleted /
-- failed). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.grading.scales.toast.loadFailed',
      'admin.grading.scales.toast.nameRequired',
      'admin.grading.scales.toast.created',
      'admin.grading.scales.toast.updated',
      'admin.grading.scales.toast.createFailed',
      'admin.grading.scales.toast.updateFailed',
      'admin.grading.scales.toast.deleted',
      'admin.grading.scales.toast.deleteFailed',
      'admin.grading.scale.savedAndRecomputedToast'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.grading.scales.toast.loadFailed',    'Failed to load grading scales',            'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.loadFailed',    'טעינת סולמות הדירוג נכשלה',                   'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.nameRequired',  'Please enter a name for the grading scale','admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.nameRequired',  'יש להזין שם לסולם הדירוג',                    'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.created',       'Grading scale created successfully',       'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.created',       'סולם הדירוג נוצר בהצלחה',                     'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.updated',       'Grading scale updated successfully',       'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.updated',       'סולם הדירוג עודכן בהצלחה',                    'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.createFailed',  'Failed to create grading scale',           'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.createFailed',  'יצירת סולם הדירוג נכשלה',                     'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.updateFailed',  'Failed to update grading scale',           'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.updateFailed',  'עדכון סולם הדירוג נכשל',                      'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.deleted',       'Grading scale deleted successfully',       'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.deleted',       'סולם הדירוג נמחק בהצלחה',                     'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.toast.deleteFailed',  'Failed to delete grading scale',           'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.toast.deleteFailed',  'מחיקת סולם הדירוג נכשלה',                     'admin', NULL, 'admin'),

    -- Course scale picker — when stored letters are cleared
    ('en', 'admin.grading.scale.savedAndRecomputedToast',
      'Grading scale updated · {{n}} grades will use the new scale',
      'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.savedAndRecomputedToast',
      'סולם הדירוג עודכן · {{n}} ציונים ישתמשו בסולם החדש',
      'admin', NULL, 'admin');
END $$;
