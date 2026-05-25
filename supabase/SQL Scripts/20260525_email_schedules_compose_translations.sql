-- Email schedules: simplified compose-form translation keys.
-- The schedule dialog now locks to the generic-notification template
-- and exposes a compact Subject / Message / Priority / optional Action
-- form. These are the new strings introduced by that simplification.
-- Global tenant (tenant_id IS NULL). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.schedules.compose',
      'emails.schedules.subject',
      'emails.schedules.subjectPlaceholder',
      'emails.schedules.message',
      'emails.schedules.messagePlaceholder',
      'emails.schedules.messageHint',
      'emails.schedules.priority',
      'emails.schedules.priority.normal',
      'emails.schedules.priority.high',
      'emails.schedules.priority.urgent',
      'emails.schedules.actionUrl',
      'emails.schedules.actionLabel',
      'emails.schedules.actionLabelPlaceholder',
      'emails.schedules.missingCompose',
      'emails.schedules.dialogDescription',
      'emails.schedules.language',
      'emails.schedules.language.en',
      'emails.schedules.language.he',
      'emails.queue.language',
      'emails.queue.trigger',
      'emails.queue.noBody',
      'emails.queue.noVariables'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'emails.schedules.compose',                'Compose email',                                                   'admin', NULL, 'admin'),
    ('he', 'emails.schedules.compose',                'חיבור אימייל',                                                      'admin', NULL, 'admin'),

    ('en', 'emails.schedules.subject',                'Subject',                                                         'admin', NULL, 'admin'),
    ('he', 'emails.schedules.subject',                'נושא',                                                              'admin', NULL, 'admin'),

    ('en', 'emails.schedules.subjectPlaceholder',     'e.g. New course available',                                       'admin', NULL, 'admin'),
    ('he', 'emails.schedules.subjectPlaceholder',     'לדוגמה: קורס חדש זמין',                                              'admin', NULL, 'admin'),

    ('en', 'emails.schedules.message',                'Message',                                                         'admin', NULL, 'admin'),
    ('he', 'emails.schedules.message',                'הודעה',                                                             'admin', NULL, 'admin'),

    ('en', 'emails.schedules.messagePlaceholder',     'Body of the email…',                                              'admin', NULL, 'admin'),
    ('he', 'emails.schedules.messagePlaceholder',     'תוכן ההודעה…',                                                      'admin', NULL, 'admin'),

    ('en', 'emails.schedules.messageHint',            'Recipient name and your organization name are filled in automatically.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.messageHint',            'שם הנמען ושם הארגון שלך ימולאו אוטומטית.',                              'admin', NULL, 'admin'),

    ('en', 'emails.schedules.priority',               'Priority',                                                        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.priority',               'עדיפות',                                                            'admin', NULL, 'admin'),

    ('en', 'emails.schedules.priority.normal',        'Normal',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.priority.normal',        'רגילה',                                                             'admin', NULL, 'admin'),

    ('en', 'emails.schedules.priority.high',          'High',                                                            'admin', NULL, 'admin'),
    ('he', 'emails.schedules.priority.high',          'גבוהה',                                                             'admin', NULL, 'admin'),

    ('en', 'emails.schedules.priority.urgent',        'Urgent',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.priority.urgent',        'דחופה',                                                             'admin', NULL, 'admin'),

    ('en', 'emails.schedules.actionUrl',              'Action link (optional)',                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.actionUrl',              'קישור לפעולה (אופציונלי)',                                            'admin', NULL, 'admin'),

    ('en', 'emails.schedules.actionLabel',            'Button label',                                                    'admin', NULL, 'admin'),
    ('he', 'emails.schedules.actionLabel',            'תווית הכפתור',                                                      'admin', NULL, 'admin'),

    ('en', 'emails.schedules.actionLabelPlaceholder', 'View details',                                                    'admin', NULL, 'admin'),
    ('he', 'emails.schedules.actionLabelPlaceholder', 'צפה בפרטים',                                                        'admin', NULL, 'admin'),

    ('en', 'emails.schedules.missingCompose',         'Subject and message are required',                                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.missingCompose',         'יש למלא נושא והודעה',                                                'admin', NULL, 'admin'),

    -- Updated phrasing for the dialog description now that the
    -- template picker is gone.
    ('en', 'emails.schedules.dialogDescription',      'Compose a notification email and schedule it to a group of users.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.dialogDescription',      'חבר הודעת התראה ותזמן שליחה לקבוצת משתמשים.',                          'admin', NULL, 'admin'),

    -- Language picker on the schedule dialog.
    ('en', 'emails.schedules.language',               'Language',                                                        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.language',               'שפה',                                                               'admin', NULL, 'admin'),
    ('en', 'emails.schedules.language.en',            'English',                                                         'admin', NULL, 'admin'),
    ('he', 'emails.schedules.language.en',            'אנגלית',                                                            'admin', NULL, 'admin'),
    ('en', 'emails.schedules.language.he',            'Hebrew',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.language.he',            'עברית',                                                             'admin', NULL, 'admin'),

    -- Email queue: detail-modal extra labels + empty-body fallbacks.
    ('en', 'emails.queue.language',                   'Language',                                                        'admin', NULL, 'admin'),
    ('he', 'emails.queue.language',                   'שפה',                                                               'admin', NULL, 'admin'),
    ('en', 'emails.queue.trigger',                    'Trigger',                                                         'admin', NULL, 'admin'),
    ('he', 'emails.queue.trigger',                    'טריגר',                                                             'admin', NULL, 'admin'),
    ('en', 'emails.queue.noBody',                     'No rendered body was stored for this email. Variables below were captured at enqueue time.', 'admin', NULL, 'admin'),
    ('he', 'emails.queue.noBody',                     'לא נשמר תוכן מעובד לאימייל זה. המשתנים שמופיעים מטה נלכדו בעת הוספה לתור.', 'admin', NULL, 'admin'),
    ('en', 'emails.queue.noVariables',                'No template variables captured.',                                 'admin', NULL, 'admin'),
    ('he', 'emails.queue.noVariables',                'לא נלכדו משתני תבנית.',                                              'admin', NULL, 'admin');

  RAISE NOTICE 'Email schedules compose translations seeded.';
END $$;
