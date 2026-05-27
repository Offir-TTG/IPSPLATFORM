-- Warning banner that appears on the admin gradebook page when the
-- chosen grading scale has zero ranges configured (so no letters
-- can be resolved and the student-side /grades page shows only a
-- percentage). Includes a direct link to the scale's configuration
-- page. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.grading.scale.noRangesTitle',
      'admin.grading.scale.noRangesHelp',
      'admin.grading.scale.configureRanges'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.grading.scale.noRangesTitle', 'This scale has no ranges defined',
      'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.noRangesTitle', 'לסולם הזה אין טווחים מוגדרים',
      'admin', NULL, 'admin'),

    ('en', 'admin.grading.scale.noRangesHelp',
      '"{{name}}" has no buckets — students will see only a percentage, no letter. Configure ranges to map percentages to labels (e.g. Pass: 60–100, Fail: 0–59).',
      'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.noRangesHelp',
      'ל"{{name}}" אין טווחים — סטודנטים יראו רק אחוזים, ללא אות. הגדר טווחים כדי למפות אחוזים לתוויות (לדוגמה: עובר 60–100, נכשל 0–59).',
      'admin', NULL, 'admin'),

    ('en', 'admin.grading.scale.configureRanges', 'Configure ranges →',
      'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.configureRanges', 'הגדר טווחים ←',
      'admin', NULL, 'admin');
END $$;
