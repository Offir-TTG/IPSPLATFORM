-- Translations for the help drawer UI strings (button label, header,
-- search placeholder, "Browse all topics", "Related articles", etc.).
-- Global (tenant_id IS NULL) — admin chrome convention. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE translation_key IN (
    'admin.help.title',
    'admin.help.openLabel',
    'admin.help.browseAll',
    'admin.help.searchPlaceholder',
    'admin.help.relatedArticles',
    'admin.help.lastUpdated',
    'admin.help.noResults',
    'admin.help.helpCenter',
    'admin.help.askQuestion',
    'admin.help.searchHint',
    'admin.help.searchResults',
    'admin.help.prerequisites',
    'admin.help.prerequisitesHint',
    'admin.help.nextSteps',
    'admin.help.nextStepsHint'
  )
  AND tenant_id IS NULL;

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.help.title',             'Help & Documentation', 'admin', NULL, 'admin'),
    ('he', 'admin.help.title',             'עזרה ותיעוד',           'admin', NULL, 'admin'),

    ('en', 'admin.help.openLabel',         'Open help',             'admin', NULL, 'admin'),
    ('he', 'admin.help.openLabel',         'פתח עזרה',              'admin', NULL, 'admin'),

    ('en', 'admin.help.browseAll',         'Browse all topics',     'admin', NULL, 'admin'),
    ('he', 'admin.help.browseAll',         'כל הנושאים',            'admin', NULL, 'admin'),

    ('en', 'admin.help.searchPlaceholder', 'Search topics...',      'admin', NULL, 'admin'),
    ('he', 'admin.help.searchPlaceholder', 'חפש נושאים...',          'admin', NULL, 'admin'),

    ('en', 'admin.help.relatedArticles',   'Related articles',      'admin', NULL, 'admin'),
    ('he', 'admin.help.relatedArticles',   'מאמרים קשורים',          'admin', NULL, 'admin'),

    ('en', 'admin.help.lastUpdated',       'Last updated',          'admin', NULL, 'admin'),
    ('he', 'admin.help.lastUpdated',       'עודכן לאחרונה',          'admin', NULL, 'admin'),

    ('en', 'admin.help.noResults',         'No topics match your search.', 'admin', NULL, 'admin'),
    ('he', 'admin.help.noResults',         'לא נמצאו נושאים תואמים לחיפוש.', 'admin', NULL, 'admin'),

    ('en', 'admin.help.helpCenter',        'HELP CENTER',                  'admin', NULL, 'admin'),
    ('he', 'admin.help.helpCenter',        'מרכז עזרה',                     'admin', NULL, 'admin'),

    ('en', 'admin.help.askQuestion',       'Ask a question or search topics...', 'admin', NULL, 'admin'),
    ('he', 'admin.help.askQuestion',       'שאל שאלה או חפש נושאים...',           'admin', NULL, 'admin'),

    ('en', 'admin.help.searchHint',        'Try different keywords or browse all topics below.',     'admin', NULL, 'admin'),
    ('he', 'admin.help.searchHint',        'נסה מילות מפתח אחרות או דפדף בכל הנושאים למטה.',           'admin', NULL, 'admin'),

    ('en', 'admin.help.searchResults',     'Search results',               'admin', NULL, 'admin'),
    ('he', 'admin.help.searchResults',     'תוצאות חיפוש',                  'admin', NULL, 'admin'),

    ('en', 'admin.help.prerequisites',     'Before you start',             'admin', NULL, 'admin'),
    ('he', 'admin.help.prerequisites',     'לפני שמתחילים',                 'admin', NULL, 'admin'),

    ('en', 'admin.help.prerequisitesHint', 'Complete these articles first.', 'admin', NULL, 'admin'),
    ('he', 'admin.help.prerequisitesHint', 'השלם את המאמרים האלה תחילה.',     'admin', NULL, 'admin'),

    ('en', 'admin.help.nextSteps',         'What''s next',                 'admin', NULL, 'admin'),
    ('he', 'admin.help.nextSteps',         'מה הלאה',                       'admin', NULL, 'admin'),

    ('en', 'admin.help.nextStepsHint',     'Continue with these articles to keep going.', 'admin', NULL, 'admin'),
    ('he', 'admin.help.nextStepsHint',     'המשך עם המאמרים האלה כדי להתקדם.',             'admin', NULL, 'admin');

  RAISE NOTICE 'Help drawer UI translations seeded.';
END $$;
