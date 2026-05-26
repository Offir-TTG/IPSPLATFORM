-- Translations for the rewritten Activity tab on /admin/users/[id].
-- Tab now uses a Card + AuditEventsTable + platform-standard
-- TabPagination instead of cursor-based "Load more". Count moved
-- into the card header so it has a proper label and stops floating
-- next to the filter dropdown. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.activity.title',
      'admin.users.activity.activity.count',
      'admin.users.activity.activity.noDetails'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.activity.title',     'Activity',                                  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.activity.title',     'פעילות',                                      'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.activity.count',     '{{count}} events',                          'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.activity.count',     '{{count}} אירועים',                           'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.activity.noDetails', 'No additional details available.',          'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.activity.noDetails', 'אין פרטים נוספים זמינים.',                      'admin', NULL, 'admin');
END $$;
