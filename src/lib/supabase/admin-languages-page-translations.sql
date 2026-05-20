-- ============================================================================
-- Full English + Hebrew coverage for /admin/config/languages
--
-- Idempotent via WHERE NOT EXISTS — re-runnable safely. Any key already
-- present in either table is left untouched.
--
-- Schema (with multi-tenancy + context columns):
--   public.translation_keys (key, category, description, context, tenant_id)
--   public.translations     (language_code, translation_key,
--                            translation_value, category, context, tenant_id)
-- ============================================================================

-- ── Register the keys ──────────────────────────────────────────────────────
INSERT INTO public.translation_keys (key, category, description, context, tenant_id)
SELECT
  vals.key,
  vals.category,
  vals.description,
  vals.context,
  (SELECT tenant_id FROM public.translation_keys WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  -- Page header
  ('admin.languages.title',                    'admin', 'Languages page title',                         'admin'),
  ('admin.languages.subtitle',                 'admin', 'Languages page subtitle',                      'admin'),
  ('admin.languages.add',                      'admin', 'Add Language button',                          'admin'),
  ('admin.languages.edit',                     'admin', 'Edit Language modal title',                    'admin'),

  -- Row labels
  ('admin.languages.code',                     'admin', 'Code label in language card',                  'admin'),
  ('admin.languages.direction',                'admin', 'Direction label in language card',             'admin'),
  ('admin.languages.directionLtr',             'admin', 'LTR direction value',                          'admin'),
  ('admin.languages.directionRtl',             'admin', 'RTL direction value',                          'admin'),
  ('admin.languages.currency',                 'admin', 'Currency label',                               'admin'),
  ('admin.languages.default',                  'admin', 'Default badge on language card',               'admin'),
  ('admin.languages.active',                   'admin', 'Active status badge',                          'admin'),
  ('admin.languages.inactive',                 'admin', 'Inactive status badge',                        'admin'),

  -- Card actions
  ('admin.languages.setDefault',               'admin', '"Default" action button label',                'admin'),
  ('admin.languages.setDefaultTitle',          'admin', '"Set as default" hover tooltip',               'admin'),
  ('admin.languages.toggleActive',             'admin', 'Toggle active hover tooltip',                  'admin'),
  ('admin.languages.show',                     'admin', 'Show button label',                            'admin'),
  ('admin.languages.hide',                     'admin', 'Hide button label',                            'admin'),
  ('admin.languages.editTitle',                'admin', 'Edit icon button tooltip',                     'admin'),
  ('admin.languages.deleteTitle',              'admin', 'Delete icon button tooltip',                   'admin'),

  -- Empty state
  ('admin.languages.empty',                    'admin', 'Empty state title',                            'admin'),
  ('admin.languages.emptyDesc',                'admin', 'Empty state description',                      'admin'),

  -- Errors
  ('admin.languages.error.required',           'admin', 'Validation: all fields required',              'admin'),
  ('admin.languages.error.codeLength',         'admin', 'Validation: code must be 2 chars',             'admin'),

  -- Add/Edit modal — form fields
  ('admin.languages.form.code',                'admin', 'Form: Language Code label',                    'admin'),
  ('admin.languages.form.codeHint',            'admin', 'Form: 2-letter ISO hint',                      'admin'),
  ('admin.languages.form.selectLanguage',      'admin', 'Form: Select a language placeholder',          'admin'),
  ('admin.languages.form.selectHint',          'admin', 'Form: auto-fill on selection hint',            'admin'),
  ('admin.languages.form.noResults',           'admin', 'Form: search dropdown empty',                  'admin'),
  ('admin.languages.form.popularLanguages',    'admin', 'Form: popular languages group label',          'admin'),
  ('admin.languages.form.otherLanguages',      'admin', 'Form: other languages group label',           'admin'),
  ('admin.languages.form.name',                'admin', 'Form: English Name label',                     'admin'),
  ('admin.languages.form.namePlaceholder',     'admin', 'Form: English Name placeholder',               'admin'),
  ('admin.languages.form.nativeName',          'admin', 'Form: Native Name label',                      'admin'),
  ('admin.languages.form.nativeNamePlaceholder', 'admin', 'Form: Native Name placeholder',              'admin'),
  ('admin.languages.form.direction',           'admin', 'Form: Text Direction label',                   'admin'),
  ('admin.languages.form.directionHint',       'admin', 'Form: direction auto-fill hint',               'admin'),
  ('admin.languages.form.directionLtr',        'admin', 'Form: LTR option text',                        'admin'),
  ('admin.languages.form.directionRtl',        'admin', 'Form: RTL option text',                        'admin'),
  ('admin.languages.form.currency',            'admin', 'Form: Currency label',                         'admin'),
  ('admin.languages.form.currencyHint',        'admin', 'Form: currency hint',                          'admin'),
  ('admin.languages.form.currencyAutoFill',    'admin', 'Form: currency auto-fill hint',                'admin'),
  ('admin.languages.form.active',              'admin', 'Form: Active checkbox label',                  'admin'),
  ('admin.languages.form.default',             'admin', 'Form: Default Language checkbox label',        'admin'),

  -- Delete confirmation
  ('admin.languages.confirmDelete.title',      'admin', 'Delete confirm modal title',                   'admin'),
  ('admin.languages.confirmDelete.message',    'admin', 'Delete confirm message lead',                  'admin'),
  ('admin.languages.confirmDelete.warning',    'admin', 'Delete confirm warning text',                  'admin'),
  ('admin.languages.confirmDelete.confirm',    'admin', 'Delete confirm CTA',                           'admin')
) AS vals(key, category, description, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translation_keys tk WHERE tk.key = vals.key
);

-- ── Hebrew translations ────────────────────────────────────────────────────
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  -- Page header
  ('he', 'admin.languages.title',                    'שפות',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.subtitle',                 'ניהול שפות הפלטפורמה והתרגומים',                                      'admin', 'admin'),
  ('he', 'admin.languages.add',                      'הוסף שפה',                                                              'admin', 'admin'),
  ('he', 'admin.languages.edit',                     'עריכת שפה',                                                             'admin', 'admin'),

  -- Row labels
  ('he', 'admin.languages.code',                     'קוד',                                                                   'admin', 'admin'),
  ('he', 'admin.languages.direction',                'כיוון',                                                                 'admin', 'admin'),
  ('he', 'admin.languages.directionLtr',             'LTR →',                                                                 'admin', 'admin'),
  ('he', 'admin.languages.directionRtl',             'RTL ←',                                                                 'admin', 'admin'),
  ('he', 'admin.languages.currency',                 'מטבע',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.default',                  'ברירת מחדל',                                                            'admin', 'admin'),
  ('he', 'admin.languages.active',                   'פעיל',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.inactive',                 'לא פעיל',                                                               'admin', 'admin'),

  -- Card actions
  ('he', 'admin.languages.setDefault',               'ברירת מחדל',                                                            'admin', 'admin'),
  ('he', 'admin.languages.setDefaultTitle',          'הגדר כברירת מחדל',                                                      'admin', 'admin'),
  ('he', 'admin.languages.toggleActive',             'החלף סטטוס',                                                            'admin', 'admin'),
  ('he', 'admin.languages.show',                     'הצג',                                                                   'admin', 'admin'),
  ('he', 'admin.languages.hide',                     'הסתר',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.editTitle',                'ערוך',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.deleteTitle',              'מחק',                                                                   'admin', 'admin'),

  -- Empty state
  ('he', 'admin.languages.empty',                    'אין עדיין שפות',                                                        'admin', 'admin'),
  ('he', 'admin.languages.emptyDesc',                'הוסיפו את השפה הראשונה כדי להתחיל',                                     'admin', 'admin'),

  -- Errors
  ('he', 'admin.languages.error.required',           'יש למלא את כל השדות',                                                   'admin', 'admin'),
  ('he', 'admin.languages.error.codeLength',         'קוד השפה חייב להיות שתי אותיות (ISO 639-1)',                            'admin', 'admin'),

  -- Add/Edit modal — form fields
  ('he', 'admin.languages.form.code',                'קוד שפה',                                                               'admin', 'admin'),
  ('he', 'admin.languages.form.codeHint',            'קוד בן 2 תווים לפי ISO 639-1',                                          'admin', 'admin'),
  ('he', 'admin.languages.form.selectLanguage',      'בחרו שפה…',                                                             'admin', 'admin'),
  ('he', 'admin.languages.form.selectHint',          'בחירת שפה תמלא את הטופס באופן אוטומטי',                                 'admin', 'admin'),
  ('he', 'admin.languages.form.noResults',           'לא נמצאו שפות',                                                         'admin', 'admin'),
  ('he', 'admin.languages.form.popularLanguages',    'שפות נפוצות',                                                           'admin', 'admin'),
  ('he', 'admin.languages.form.otherLanguages',      'שפות נוספות',                                                           'admin', 'admin'),
  ('he', 'admin.languages.form.name',                'שם באנגלית',                                                            'admin', 'admin'),
  ('he', 'admin.languages.form.namePlaceholder',     'English, Hebrew, Spanish…',                                             'admin', 'admin'),
  ('he', 'admin.languages.form.nativeName',          'שם בשפה המקורית',                                                       'admin', 'admin'),
  ('he', 'admin.languages.form.nativeNamePlaceholder', 'English, עברית, Español…',                                            'admin', 'admin'),
  ('he', 'admin.languages.form.direction',           'כיוון טקסט',                                                            'admin', 'admin'),
  ('he', 'admin.languages.form.directionHint',       'יתמלא אוטומטית עם בחירת השפה',                                          'admin', 'admin'),
  ('he', 'admin.languages.form.directionLtr',        'משמאל לימין (LTR)',                                                     'admin', 'admin'),
  ('he', 'admin.languages.form.directionRtl',        'מימין לשמאל (RTL)',                                                     'admin', 'admin'),
  ('he', 'admin.languages.form.currency',            'מטבע',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.form.currencyHint',        'מטבע ברירת המחדל לשפה זו',                                              'admin', 'admin'),
  ('he', 'admin.languages.form.currencyAutoFill',    'יתמלא אוטומטית עם בחירת השפה',                                          'admin', 'admin'),
  ('he', 'admin.languages.form.active',              'פעיל',                                                                  'admin', 'admin'),
  ('he', 'admin.languages.form.default',             'שפת ברירת מחדל',                                                        'admin', 'admin'),

  -- Delete confirmation
  ('he', 'admin.languages.confirmDelete.title',      'מחיקת שפה',                                                             'admin', 'admin'),
  ('he', 'admin.languages.confirmDelete.message',    'האם למחוק את',                                                          'admin', 'admin'),
  ('he', 'admin.languages.confirmDelete.warning',    'הפעולה אינה הפיכה. כל התרגומים לשפה זו יימחקו.',                        'admin', 'admin'),
  ('he', 'admin.languages.confirmDelete.confirm',    'מחק',                                                                   'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);

-- ── English translations ───────────────────────────────────────────────────
INSERT INTO public.translations (language_code, translation_key, translation_value, category, context, tenant_id)
SELECT
  vals.language_code,
  vals.translation_key,
  vals.translation_value,
  vals.category,
  vals.context,
  (SELECT tenant_id FROM public.translations WHERE tenant_id IS NOT NULL LIMIT 1) AS tenant_id
FROM (VALUES
  -- Page header
  ('en', 'admin.languages.title',                    'Languages',                                                             'admin', 'admin'),
  ('en', 'admin.languages.subtitle',                 'Manage platform languages and translations',                            'admin', 'admin'),
  ('en', 'admin.languages.add',                      'Add Language',                                                          'admin', 'admin'),
  ('en', 'admin.languages.edit',                     'Edit Language',                                                         'admin', 'admin'),

  -- Row labels
  ('en', 'admin.languages.code',                     'Code',                                                                  'admin', 'admin'),
  ('en', 'admin.languages.direction',                'Direction',                                                             'admin', 'admin'),
  ('en', 'admin.languages.directionLtr',             'LTR →',                                                                 'admin', 'admin'),
  ('en', 'admin.languages.directionRtl',             'RTL ←',                                                                 'admin', 'admin'),
  ('en', 'admin.languages.currency',                 'Currency',                                                              'admin', 'admin'),
  ('en', 'admin.languages.default',                  'Default',                                                               'admin', 'admin'),
  ('en', 'admin.languages.active',                   'Active',                                                                'admin', 'admin'),
  ('en', 'admin.languages.inactive',                 'Inactive',                                                              'admin', 'admin'),

  -- Card actions
  ('en', 'admin.languages.setDefault',               'Default',                                                               'admin', 'admin'),
  ('en', 'admin.languages.setDefaultTitle',          'Set as default',                                                        'admin', 'admin'),
  ('en', 'admin.languages.toggleActive',             'Toggle status',                                                         'admin', 'admin'),
  ('en', 'admin.languages.show',                     'Show',                                                                  'admin', 'admin'),
  ('en', 'admin.languages.hide',                     'Hide',                                                                  'admin', 'admin'),
  ('en', 'admin.languages.editTitle',                'Edit',                                                                  'admin', 'admin'),
  ('en', 'admin.languages.deleteTitle',              'Delete',                                                                'admin', 'admin'),

  -- Empty state
  ('en', 'admin.languages.empty',                    'No languages yet',                                                      'admin', 'admin'),
  ('en', 'admin.languages.emptyDesc',                'Add your first language to get started',                                'admin', 'admin'),

  -- Errors
  ('en', 'admin.languages.error.required',           'All fields are required',                                               'admin', 'admin'),
  ('en', 'admin.languages.error.codeLength',         'Language code must be 2 characters (ISO 639-1)',                        'admin', 'admin'),

  -- Add/Edit modal — form fields
  ('en', 'admin.languages.form.code',                'Language Code',                                                         'admin', 'admin'),
  ('en', 'admin.languages.form.codeHint',            '2-letter ISO 639-1 code',                                               'admin', 'admin'),
  ('en', 'admin.languages.form.selectLanguage',      'Select a language…',                                                    'admin', 'admin'),
  ('en', 'admin.languages.form.selectHint',          'Selecting a language will auto-fill the form',                          'admin', 'admin'),
  ('en', 'admin.languages.form.noResults',           'No languages found',                                                    'admin', 'admin'),
  ('en', 'admin.languages.form.popularLanguages',    'Popular Languages',                                                     'admin', 'admin'),
  ('en', 'admin.languages.form.otherLanguages',      'Other Languages',                                                       'admin', 'admin'),
  ('en', 'admin.languages.form.name',                'English Name',                                                          'admin', 'admin'),
  ('en', 'admin.languages.form.namePlaceholder',     'English, Hebrew, Spanish…',                                             'admin', 'admin'),
  ('en', 'admin.languages.form.nativeName',          'Native Name',                                                           'admin', 'admin'),
  ('en', 'admin.languages.form.nativeNamePlaceholder', 'English, עברית, Español…',                                            'admin', 'admin'),
  ('en', 'admin.languages.form.direction',           'Text Direction',                                                        'admin', 'admin'),
  ('en', 'admin.languages.form.directionHint',       'Will be auto-filled when you select a language',                        'admin', 'admin'),
  ('en', 'admin.languages.form.directionLtr',        'Left to Right (LTR)',                                                   'admin', 'admin'),
  ('en', 'admin.languages.form.directionRtl',        'Right to Left (RTL)',                                                   'admin', 'admin'),
  ('en', 'admin.languages.form.currency',            'Currency',                                                              'admin', 'admin'),
  ('en', 'admin.languages.form.currencyHint',        'Default currency for this language',                                    'admin', 'admin'),
  ('en', 'admin.languages.form.currencyAutoFill',    'Will be auto-filled when you select a language',                        'admin', 'admin'),
  ('en', 'admin.languages.form.active',              'Active',                                                                'admin', 'admin'),
  ('en', 'admin.languages.form.default',             'Default Language',                                                      'admin', 'admin'),

  -- Delete confirmation
  ('en', 'admin.languages.confirmDelete.title',      'Delete Language',                                                       'admin', 'admin'),
  ('en', 'admin.languages.confirmDelete.message',    'Are you sure you want to delete',                                       'admin', 'admin'),
  ('en', 'admin.languages.confirmDelete.warning',    'This action cannot be undone. All translations for this language will be deleted.', 'admin', 'admin'),
  ('en', 'admin.languages.confirmDelete.confirm',    'Delete',                                                                'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);
