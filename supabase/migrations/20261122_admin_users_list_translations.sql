-- Translations for the redesigned Users list (/admin/settings/users) and
-- the user details drawer. Existing admin.users.* keys are reused; only
-- new wording is here. Safe to re-run.

DO $$
DECLARE
  keys text[] := ARRAY[
    'admin.users.list.count',
    'admin.users.list.clearSearch',
    'admin.users.list.showingRange',
    'admin.users.list.pageOf',
    'admin.users.list.prevPage',
    'admin.users.list.nextPage',
    'admin.users.drawer.title',
    'admin.users.drawer.description',
    'admin.users.drawer.openFullPage',
    'admin.users.drawer.copy',
    'admin.users.drawer.copied',
    'admin.users.drawer.phone',
    'admin.users.drawer.activeWord',
    'admin.users.drawer.overdue',
    'admin.users.drawer.owed',
    'admin.users.drawer.seePayments',
    'admin.users.drawer.noneYet',
    'admin.users.drawer.activeEnrollments',
    'admin.users.drawer.noActiveEnrollments',
    'admin.users.drawer.seeEnrollments',
    'admin.users.drawer.activity',
    'admin.users.drawer.enrollmentsActiveTotal',
    'admin.users.drawer.discard',
    'admin.users.drawer.unsavedNote'
  ];
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = ANY (keys);

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.list.count', '{count} users', 'admin', NULL, 'admin'),
    ('he', 'admin.users.list.count', '{count} משתמשים', 'admin', NULL, 'admin'),
    ('en', 'admin.users.list.clearSearch', 'Clear search', 'admin', NULL, 'admin'),
    ('he', 'admin.users.list.clearSearch', 'ניקוי החיפוש', 'admin', NULL, 'admin'),
    ('en', 'admin.users.list.showingRange', 'Showing {from}–{to} of {total}', 'admin', NULL, 'admin'),
    ('he', 'admin.users.list.showingRange', 'מוצגים {from}–{to} מתוך {total}', 'admin', NULL, 'admin'),
    ('en', 'admin.users.list.pageOf', 'Page {page} of {pages}', 'admin', NULL, 'admin'),
    ('he', 'admin.users.list.pageOf', 'עמוד {page} מתוך {pages}', 'admin', NULL, 'admin'),
    ('en', 'admin.users.list.prevPage', 'Previous page', 'admin', NULL, 'admin'),
    ('he', 'admin.users.list.prevPage', 'עמוד קודם', 'admin', NULL, 'admin'),
    ('en', 'admin.users.list.nextPage', 'Next page', 'admin', NULL, 'admin'),
    ('he', 'admin.users.list.nextPage', 'עמוד הבא', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.title', 'User details', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.title', 'פרטי משתמש', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.description', 'Profile, actions and activity', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.description', 'פרופיל, פעולות ופעילות', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.openFullPage', 'Open full page', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.openFullPage', 'פתיחה בעמוד מלא', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.copy', 'Copy', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.copy', 'העתקה', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.copied', 'Copied', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.copied', 'הועתק', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.phone', 'Phone', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.phone', 'טלפון', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.activeWord', 'active', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.activeWord', 'פעילות', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.overdue', 'owed, with payments overdue', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.overdue', 'לתשלום, עם תשלומים באיחור', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.owed', 'still to pay', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.owed', 'נותר לתשלום', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.seePayments', 'See payments', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.seePayments', 'לתשלומים', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.noneYet', 'None yet', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.noneYet', 'עדיין אין', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.activeEnrollments', 'active enrollments', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.activeEnrollments', 'הרשמות פעילות', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.noActiveEnrollments', 'no active enrollments', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.noActiveEnrollments', 'אין הרשמות פעילות', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.seeEnrollments', 'See enrollments', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.seeEnrollments', 'להרשמות', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.activity', 'Activity', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.activity', 'פעילות', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.enrollmentsActiveTotal', 'Enrollments (active / all)', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.enrollmentsActiveTotal', 'הרשמות (פעילות / הכול)', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.discard', 'Discard', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.discard', 'ביטול השינויים', 'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.unsavedNote', 'You have unsaved changes', 'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.unsavedNote', 'יש שינויים שלא נשמרו', 'admin', NULL, 'admin');
END $$;
