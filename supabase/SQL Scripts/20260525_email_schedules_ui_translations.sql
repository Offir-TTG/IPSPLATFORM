-- Translations for the new /admin/emails/schedules page + dialog.
-- The base `emails.schedules.title` / `.create` / `.edit` / `.delete`
-- keys live in 20251202_email_system_translations.sql; this script
-- adds the UI strings the new page introduces. Global tenant
-- (tenant_id IS NULL) — admin chrome convention. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.schedules.subtitle',
      'emails.schedules.empty',
      'emails.schedules.loadFailed',
      'emails.schedules.deleted',
      'emails.schedules.deleteFailed',
      'emails.schedules.deleteConfirm',
      'emails.schedules.template',
      'emails.schedules.failed',
      'emails.schedules.recurring',
      'emails.schedules.dialogDescription',
      'emails.schedules.description',
      'emails.schedules.selectTemplate',
      'emails.schedules.recurrence.noRecurrence',
      'emails.schedules.recurrence.daily',
      'emails.schedules.recurrence.weekly',
      'emails.schedules.recurrence.monthly',
      'emails.schedules.recurrence.custom',
      'emails.schedules.customRRule',
      'emails.schedules.customRRuleHint',
      'emails.schedules.recurrence_end_date',
      'emails.schedules.preview',
      'emails.schedules.previewResult',
      'emails.schedules.previewFailed',
      'emails.schedules.filter.role',
      'emails.schedules.filter.status',
      'emails.schedules.missingFields',
      'emails.schedules.created',
      'emails.schedules.updated',
      'emails.schedules.saveFailed',
      'emails.schedules.status.pending',
      'emails.schedules.status.processing',
      'emails.schedules.status.completed',
      'emails.schedules.status.cancelled',
      'emails.schedules.status.failed',
      'common.all',
      'common.cancel',
      'common.delete',
      'common.save',
      'common.loading',
      'emails.schedules.name',
      'emails.schedules.recipients',
      'emails.schedules.scheduled_for',
      'emails.schedules.recurrence',
      'emails.schedules.recipientMode',
      'emails.schedules.recipientMode.all',
      'emails.schedules.recipientMode.filter',
      'emails.schedules.recipientMode.users',
      'emails.schedules.recipientMode.product',
      'emails.schedules.pickUsers',
      'emails.schedules.pickProduct',
      'emails.schedules.searchUsers',
      'emails.schedules.title',
      'emails.schedules.create',
      'emails.schedules.edit',
      'emails.schedules.delete',
      'emails.schedules.next_run',
      'emails.schedules.last_run',
      'emails.schedules.emails_sent',
      'emails.schedules.sendNow',
      'emails.schedules.sendNowOk',
      'emails.schedules.sendNowFailed',
      'emails.schedules.templateVars',
      'emails.schedules.templateVarsHint',
      'emails.schedules.requiredVarsMissing'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Page chrome
    ('en', 'emails.schedules.subtitle',          'Schedule one-off and recurring email campaigns.',                 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.subtitle',          'תזמון קמפיינים חד-פעמיים וחוזרים.',                                  'admin', NULL, 'admin'),
    ('en', 'emails.schedules.empty',             'No schedules yet. Create one to send a campaign at a future date.','admin', NULL, 'admin'),
    ('he', 'emails.schedules.empty',             'אין תזמונים עדיין. צרו תזמון כדי לשלוח קמפיין בתאריך עתידי.',          'admin', NULL, 'admin'),
    ('en', 'emails.schedules.loadFailed',        'Failed to load schedules',                                        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.loadFailed',        'טעינת התזמונים נכשלה',                                              'admin', NULL, 'admin'),
    ('en', 'emails.schedules.deleted',           'Schedule deleted',                                                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleted',           'התזמון נמחק',                                                       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.deleteFailed',     'Failed to delete schedule',                                       'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleteFailed',     'מחיקת התזמון נכשלה',                                                 'admin', NULL, 'admin'),
    ('en', 'emails.schedules.deleteConfirm',    'This will permanently delete the schedule. Already-sent emails are unaffected.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleteConfirm',    'פעולה זו תמחק את התזמון לצמיתות. מיילים שכבר נשלחו לא יושפעו.',          'admin', NULL, 'admin'),
    ('en', 'emails.schedules.template',         'Template',                                                        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.template',         'תבנית',                                                             'admin', NULL, 'admin'),
    ('en', 'emails.schedules.failed',           'failed',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.failed',           'נכשלו',                                                              'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurring',        'Recurring',                                                       'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurring',        'חוזר',                                                              'admin', NULL, 'admin'),

    -- Dialog
    ('en', 'emails.schedules.dialogDescription', 'Schedule an email template to be sent to a group of users at a future date.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.dialogDescription', 'תזמן תבנית מייל להישלח לקבוצת משתמשים בתאריך עתידי.',                  'admin', NULL, 'admin'),
    ('en', 'emails.schedules.description',       'Description',                                                    'admin', NULL, 'admin'),
    ('he', 'emails.schedules.description',       'תיאור',                                                            'admin', NULL, 'admin'),
    ('en', 'emails.schedules.selectTemplate',    'Select a template',                                              'admin', NULL, 'admin'),
    ('he', 'emails.schedules.selectTemplate',    'בחר תבנית',                                                         'admin', NULL, 'admin'),

    -- Recurrence presets
    ('en', 'emails.schedules.recurrence.noRecurrence', 'One-time (no recurrence)', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence.noRecurrence', 'חד-פעמי (ללא חזרה)',         'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurrence.daily',        'Daily',                    'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence.daily',        'יומי',                       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurrence.weekly',       'Weekly',                   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence.weekly',       'שבועי',                      'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurrence.monthly',      'Monthly',                  'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence.monthly',      'חודשי',                      'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurrence.custom',       'Custom (RRULE)',           'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence.custom',       'מותאם (RRULE)',              'admin', NULL, 'admin'),
    ('en', 'emails.schedules.customRRule',             'Custom RRULE',             'admin', NULL, 'admin'),
    ('he', 'emails.schedules.customRRule',             'RRULE מותאם',                 'admin', NULL, 'admin'),
    ('en', 'emails.schedules.customRRuleHint',         'RFC 5545 RRULE string (no leading "RRULE:" needed).', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.customRRuleHint',         'מחרוזת RRULE לפי RFC 5545 (ללא קידומת "RRULE:").',     'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurrence_end_date',     'Recurrence end (optional)','admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence_end_date',     'תאריך סיום חזרה (אופציונלי)','admin', NULL, 'admin'),

    -- Recipient preview
    ('en', 'emails.schedules.preview',          'Preview count',                                                   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.preview',          'הצג ספירה',                                                          'admin', NULL, 'admin'),
    ('en', 'emails.schedules.previewResult',    '{{count}} eligible recipients',                                   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.previewResult',    '{{count}} נמענים מתאימים',                                          'admin', NULL, 'admin'),
    ('en', 'emails.schedules.previewFailed',    'Failed to preview recipients',                                    'admin', NULL, 'admin'),
    ('he', 'emails.schedules.previewFailed',    'תצוגה מקדימה של נמענים נכשלה',                                       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.filter.role',      'Role',                                                            'admin', NULL, 'admin'),
    ('he', 'emails.schedules.filter.role',      'תפקיד',                                                             'admin', NULL, 'admin'),
    ('en', 'emails.schedules.filter.status',    'Status',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.filter.status',    'סטטוס',                                                             'admin', NULL, 'admin'),

    -- Save / errors
    ('en', 'emails.schedules.missingFields',    'Name, template, and date are required',                           'admin', NULL, 'admin'),
    ('he', 'emails.schedules.missingFields',    'שם, תבנית ותאריך הם חובה',                                            'admin', NULL, 'admin'),
    ('en', 'emails.schedules.created',          'Schedule created',                                                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.created',          'התזמון נוצר',                                                        'admin', NULL, 'admin'),
    ('en', 'emails.schedules.updated',          'Schedule updated',                                                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.updated',          'התזמון עודכן',                                                       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.saveFailed',       'Failed to save schedule',                                         'admin', NULL, 'admin'),
    ('he', 'emails.schedules.saveFailed',       'שמירת התזמון נכשלה',                                                  'admin', NULL, 'admin'),

    -- Schedule status badge labels
    ('en', 'emails.schedules.status.pending',     'Pending',     'admin', NULL, 'admin'),
    ('he', 'emails.schedules.status.pending',     'ממתין',         'admin', NULL, 'admin'),
    ('en', 'emails.schedules.status.processing',  'Processing',  'admin', NULL, 'admin'),
    ('he', 'emails.schedules.status.processing',  'בעיבוד',        'admin', NULL, 'admin'),
    ('en', 'emails.schedules.status.completed',   'Completed',   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.status.completed',   'הושלם',         'admin', NULL, 'admin'),
    ('en', 'emails.schedules.status.cancelled',   'Cancelled',   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.status.cancelled',   'בוטל',          'admin', NULL, 'admin'),
    ('en', 'emails.schedules.status.failed',      'Failed',      'admin', NULL, 'admin'),
    ('he', 'emails.schedules.status.failed',      'נכשל',          'admin', NULL, 'admin'),

    -- Common helpers used by the dialog / list page
    ('en', 'common.all',     'All',       'admin', NULL, 'admin'),
    ('he', 'common.all',     'הכל',        'admin', NULL, 'admin'),
    ('en', 'common.cancel',  'Cancel',    'admin', NULL, 'admin'),
    ('he', 'common.cancel',  'ביטול',      'admin', NULL, 'admin'),
    ('en', 'common.delete',  'Delete',    'admin', NULL, 'admin'),
    ('he', 'common.delete',  'מחיקה',      'admin', NULL, 'admin'),
    ('en', 'common.save',    'Save',      'admin', NULL, 'admin'),
    ('he', 'common.save',    'שמירה',      'admin', NULL, 'admin'),
    ('en', 'common.loading', 'Loading…',  'admin', NULL, 'admin'),
    ('he', 'common.loading', 'טוען…',      'admin', NULL, 'admin'),

    -- Dialog labels that historically lived only in
    -- 20251202_email_system_translations.sql (which uses a different
    -- INSERT shape and may not have been applied in production). Mirror
    -- them here so the new dialog is fully Hebrew-translated regardless.
    ('en', 'emails.schedules.name',          'Schedule Name',  'admin', NULL, 'admin'),
    ('he', 'emails.schedules.name',          'שם התזמון',        'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recipients',    'Recipients',     'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recipients',    'נמענים',           'admin', NULL, 'admin'),
    ('en', 'emails.schedules.scheduled_for', 'Scheduled For',  'admin', NULL, 'admin'),
    ('he', 'emails.schedules.scheduled_for', 'תאריך שליחה',      'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recurrence',    'Recurrence',     'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recurrence',    'חזרה',             'admin', NULL, 'admin'),

    -- Recipient-mode picker (new — see ScheduleDialog rewrite)
    ('en', 'emails.schedules.recipientMode',         'Send to',                       'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recipientMode',         'שלח אל',                          'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recipientMode.all',     'All users in tenant',           'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recipientMode.all',     'כל המשתמשים בארגון',                'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recipientMode.filter',  'By role / status filter',       'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recipientMode.filter',  'לפי תפקיד / סטטוס',                'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recipientMode.users',   'Specific users',                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.recipientMode.users',   'משתמשים מסוימים',                  'admin', NULL, 'admin'),
    ('en', 'emails.schedules.recipientMode.product', 'Enrolled in a program / course','admin', NULL, 'admin'),
    ('he', 'emails.schedules.recipientMode.product', 'הרשומים לתוכנית / קורס',           'admin', NULL, 'admin'),
    ('en', 'emails.schedules.pickUsers',             'Pick users',                    'admin', NULL, 'admin'),
    ('he', 'emails.schedules.pickUsers',             'בחירת משתמשים',                   'admin', NULL, 'admin'),
    ('en', 'emails.schedules.pickProduct',           'Pick a program or course',      'admin', NULL, 'admin'),
    ('he', 'emails.schedules.pickProduct',           'בחירת תוכנית או קורס',             'admin', NULL, 'admin'),
    ('en', 'emails.schedules.searchUsers',           'Type to search by email or name…','admin', NULL, 'admin'),
    ('he', 'emails.schedules.searchUsers',           'הקלידו לחיפוש לפי דוא״ל או שם…',     'admin', NULL, 'admin'),

    -- Base keys that historically lived only in
    -- 20251202_email_system_translations.sql (which may not have been
    -- applied in production). Mirror them here so the new page is
    -- fully translated regardless of migration history.
    ('en', 'emails.schedules.title',       'Email Schedules', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.title',       'תזמון אימיילים',    'admin', NULL, 'admin'),
    ('en', 'emails.schedules.create',      'Create Schedule', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.create',      'יצירת תזמון',       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.edit',        'Edit Schedule',   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.edit',        'עריכת תזמון',       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.delete',      'Delete Schedule', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.delete',      'מחיקת תזמון',       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.next_run',    'Next Run',        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.next_run',    'הרצה הבאה',         'admin', NULL, 'admin'),
    ('en', 'emails.schedules.last_run',    'Last Run',        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.last_run',    'הרצה אחרונה',       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.emails_sent', 'Sent',            'admin', NULL, 'admin'),
    ('he', 'emails.schedules.emails_sent', 'נשלחו',             'admin', NULL, 'admin'),

    -- Send-now action (per-row button)
    ('en', 'emails.schedules.sendNow',       'Send now',                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.sendNow',       'שלח עכשיו',                           'admin', NULL, 'admin'),
    ('en', 'emails.schedules.sendNowOk',     '{{count}} emails enqueued',         'admin', NULL, 'admin'),
    ('he', 'emails.schedules.sendNowOk',     '{{count}} מיילים נוספו לתור השליחה',   'admin', NULL, 'admin'),
    ('en', 'emails.schedules.sendNowFailed', 'Failed to enqueue sends',           'admin', NULL, 'admin'),
    ('he', 'emails.schedules.sendNowFailed', 'הוספת השליחות לתור נכשלה',             'admin', NULL, 'admin'),

    -- Template variables section in the dialog
    ('en', 'emails.schedules.templateVars',         'Template variables',                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.templateVars',         'משתני תבנית',                                                   'admin', NULL, 'admin'),
    ('en', 'emails.schedules.templateVarsHint',     'Values used by this template''s body. Required fields are marked with *.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.templateVarsHint',     'הערכים המשמשים בגוף התבנית. שדות חובה מסומנים ב-*.',                'admin', NULL, 'admin'),
    ('en', 'emails.schedules.requiredVarsMissing', 'Missing required template variables: {{names}}',                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.requiredVarsMissing', 'חסרים משתני תבנית חובה: {{names}}',                                'admin', NULL, 'admin');

  RAISE NOTICE 'Email schedules UI translations seeded.';
END $$;
