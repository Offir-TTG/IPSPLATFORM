-- Adds the `common.*` status keys that weren't covered by the existing
-- payment-translations files (paid / pending / overdue / failed /
-- paused were already there from 20251127000000_payment_translations_complete.sql).
--
-- Used by the enrollment-picker dropdown on the standalone-payment
-- dialog, and by any other component that translates enum status values
-- via the t(`common.${status}`, status) convention.
--
-- These are global (tenant_id IS NULL) so any tenant benefits without
-- a per-tenant reseed. Context 'both' since they're shared between
-- admin and user surfaces.

DO $$
BEGIN
  DELETE FROM public.translations
   WHERE tenant_id IS NULL
     AND translation_key IN (
       'common.partial',
       'common.active',
       'common.completed',
       'common.suspended',
       'common.cancelled',
       'common.processing',
       'common.adjusted'
     );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'common.partial',     'Partial',          'both', NULL, 'common'),
    ('he', 'common.partial',     'חלקי',             'both', NULL, 'common'),

    ('en', 'common.active',      'Active',           'both', NULL, 'common'),
    ('he', 'common.active',      'פעיל',             'both', NULL, 'common'),

    ('en', 'common.completed',   'Completed',        'both', NULL, 'common'),
    ('he', 'common.completed',   'הושלם',            'both', NULL, 'common'),

    ('en', 'common.suspended',   'Suspended',        'both', NULL, 'common'),
    ('he', 'common.suspended',   'מושעה',            'both', NULL, 'common'),

    ('en', 'common.cancelled',   'Cancelled',        'both', NULL, 'common'),
    ('he', 'common.cancelled',   'בוטל',             'both', NULL, 'common'),

    ('en', 'common.processing',  'Processing',       'both', NULL, 'common'),
    ('he', 'common.processing',  'בעיבוד',           'both', NULL, 'common'),

    ('en', 'common.adjusted',    'Adjusted',         'both', NULL, 'common'),
    ('he', 'common.adjusted',    'הותאם',            'both', NULL, 'common');

  RAISE NOTICE 'Common status translations seeded.';
END$$;
