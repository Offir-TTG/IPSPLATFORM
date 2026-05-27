-- Missing audit-page translations surfaced while reviewing the page:
--   1. `admin.users.activity.activity.noDetails` — empty-state copy
--      inside an expanded audit row. Was in an earlier seed but tied
--      to context='admin'; re-asserted globally here so the audit
--      page (which also uses UserAuditTable) resolves it.
--   2. `audit.field.contact_email` — field-name label in the diff
--      renderer; had no seed at all so it was showing the raw key.
--
-- All entries are tenant_id=NULL so they apply across every tenant.
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.activity.noDetails',
      'audit.field.contact_email'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.activity.noDetails', 'No additional details available.', 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.activity.noDetails', 'אין פרטים נוספים זמינים.',           'admin', NULL, 'admin'),

    ('en', 'audit.field.contact_email',                'Contact Email',                   'admin', NULL, 'admin'),
    ('he', 'audit.field.contact_email',                'אימייל ליצירת קשר',                  'admin', NULL, 'admin');
END $$;
