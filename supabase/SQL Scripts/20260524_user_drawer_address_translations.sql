-- Translations for the new structured-address block + close button +
-- contact-email helper text on the admin user-edit drawer. Global
-- (tenant_id IS NULL) — admin chrome convention. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.drawer.close',
      'admin.users.drawer.contactEmail.help',
      'admin.users.drawer.address.section',
      'admin.users.drawer.address.street',
      'admin.users.drawer.address.streetPh',
      'admin.users.drawer.address.city',
      'admin.users.drawer.address.region',
      'admin.users.drawer.address.postal',
      'admin.users.drawer.address.country',
      'admin.users.drawer.address.autocompleteHint',
      'admin.users.drawer.section.identity',
      'admin.users.drawer.section.contact',
      'admin.users.drawer.section.access',
      'admin.users.drawer.section.communication',
      'admin.users.drawer.section.accountInfo'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.drawer.close',                'Close',                                                             'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.close',                'סגור',                                                               'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.contactEmail.help',
      'Communications are sent to this address when set; otherwise the login email is used.',
      'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.contactEmail.help',
      'הודעות נשלחות לכתובת זו אם הוגדרה; אחרת ייעשה שימוש בכתובת ההתחברות.',
      'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.address.section',      'Address',                                                           'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.section',      'כתובת',                                                              'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.address.street',       'Street address',                                                    'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.street',       'רחוב ומספר',                                                          'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.address.streetPh',     '123 Herzl St., Apt 4',                                              'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.streetPh',     'הרצל 123, דירה 4',                                                    'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.address.city',         'City',                                                              'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.city',         'עיר',                                                                 'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.address.region',       'State / region',                                                    'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.region',       'מחוז',                                                                'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.address.postal',       'Postal code',                                                       'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.postal',       'מיקוד',                                                               'admin', NULL, 'admin'),

    ('en', 'admin.users.drawer.address.country',      'Country',                                                           'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.country',      'מדינה',                                                               'admin', NULL, 'admin'),

    -- Google Places autocomplete hint (shown next to street label when the API has loaded)
    ('en', 'admin.users.drawer.address.autocompleteHint', 'start typing to see suggestions',                                'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.address.autocompleteHint', 'התחילו להקליד להצגת הצעות',                                          'admin', NULL, 'admin'),

    -- Section headings on the drawer body
    ('en', 'admin.users.drawer.section.identity',        'Identity',                                                       'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.section.identity',        'זהות',                                                            'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.section.contact',         'Contact',                                                        'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.section.contact',         'יצירת קשר',                                                        'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.section.access',          'Access',                                                         'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.section.access',          'הרשאות',                                                           'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.section.communication',   'Communication',                                                  'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.section.communication',   'תקשורת',                                                           'admin', NULL, 'admin'),
    ('en', 'admin.users.drawer.section.accountInfo',     'Account info',                                                   'admin', NULL, 'admin'),
    ('he', 'admin.users.drawer.section.accountInfo',     'פרטי חשבון',                                                        'admin', NULL, 'admin');

  RAISE NOTICE 'User drawer address + sections + close + contact-email translations seeded.';
END $$;
