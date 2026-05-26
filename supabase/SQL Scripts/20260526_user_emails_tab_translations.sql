-- Translations for the new "Emails" tab on /admin/users/[id].
-- Tab lists every email_queue row addressed to this user. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.tabs.emails',
      'admin.users.activity.emails.empty',
      'admin.users.activity.emails.preview',
      'admin.users.activity.emails.sentLabel',
      'admin.users.activity.emails.noPreview',
      'admin.users.activity.emails.col.status',
      'admin.users.activity.emails.col.subject',
      'admin.users.activity.emails.col.trigger',
      'admin.users.activity.emails.col.when',
      'admin.users.activity.emails.title',
      'admin.users.activity.emails.count'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Tab label
    ('en', 'admin.users.activity.tabs.emails',           'Emails',                                            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.tabs.emails',           'אימיילים',                                            'admin', NULL, 'admin'),

    -- Card title + count chip
    ('en', 'admin.users.activity.emails.title',          'Emails',                                            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.title',          'אימיילים',                                            'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.emails.count',          '{{count}} emails',                                  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.count',          '{{count}} אימיילים',                                   'admin', NULL, 'admin'),

    -- Empty state
    ('en', 'admin.users.activity.emails.empty',          'No emails sent to this user yet.',                  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.empty',          'לא נשלחו אימיילים למשתמש זה עדיין.',                     'admin', NULL, 'admin'),

    -- Per-row preview button + sent-time label + preview-fallback msg
    ('en', 'admin.users.activity.emails.preview',        'Preview',                                            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.preview',        'תצוגה מקדימה',                                         'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.emails.sentLabel',      'Sent',                                              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.sentLabel',      'נשלח',                                                 'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.emails.noPreview',      'No preview available for this email.',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.noPreview',      'אין תצוגה מקדימה זמינה לאימייל זה.',                       'admin', NULL, 'admin'),

    -- Table column headers
    ('en', 'admin.users.activity.emails.col.status',     'Status',                                            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.col.status',     'סטטוס',                                              'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.emails.col.subject',    'Subject',                                           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.col.subject',    'נושא',                                                'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.emails.col.trigger',    'Trigger',                                           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.col.trigger',    'טריגר',                                              'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.emails.col.when',       'When',                                              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.emails.col.when',       'מתי',                                                'admin', NULL, 'admin');
END $$;
