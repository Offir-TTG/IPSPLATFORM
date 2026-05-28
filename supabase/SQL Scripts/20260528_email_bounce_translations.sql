-- 2026-05-28: i18n for the hard-bounce UI introduced alongside
-- 20260528_email_bounce_tracking.sql.
--
-- Surfaces touched:
--   - /admin/emails/queue            (status-row bounce badge, detail modal,
--                                     translated error_message for the
--                                     pre-send blocklist gate)
--   - user detail → Emails activity  (status-cell bounce badge)
--   - /admin/emails/analytics        (Bounced summary card + hard sub-tally)
--
-- All entries tenant_id=NULL so they apply across every tenant. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.bounce.hard',
      'emails.bounce.soft',
      'emails.bounce.complaint',
      'emails.bounce.hard.tooltip',
      'emails.bounce.soft.tooltip',
      'emails.bounce.complaint.tooltip',
      'emails.queue.errorMessage.hardBounceBlocked',
      'analytics.bounced',
      'analytics.hardBounced'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- ─── Bounce badge labels ───
    ('en', 'emails.bounce.hard',      'Hard bounce', 'admin', NULL, 'admin'),
    ('he', 'emails.bounce.hard',      'החזרה קשה',     'admin', NULL, 'admin'),
    ('en', 'emails.bounce.soft',      'Soft bounce', 'admin', NULL, 'admin'),
    ('he', 'emails.bounce.soft',      'החזרה רכה',     'admin', NULL, 'admin'),
    ('en', 'emails.bounce.complaint', 'Complaint',   'admin', NULL, 'admin'),
    ('he', 'emails.bounce.complaint', 'תלונה',        'admin', NULL, 'admin'),

    -- ─── Bounce badge tooltips (hover/title) ───
    ('en', 'emails.bounce.hard.tooltip',
           'Permanent delivery failure. Future sends to this address are blocked.',
           'admin', NULL, 'admin'),
    ('he', 'emails.bounce.hard.tooltip',
           'כשל מסירה קבוע. שליחות עתידיות לכתובת זו ייחסמו.',
           'admin', NULL, 'admin'),
    ('en', 'emails.bounce.soft.tooltip',
           'Temporary delivery failure (mailbox full, server unavailable).',
           'admin', NULL, 'admin'),
    ('he', 'emails.bounce.soft.tooltip',
           'כשל מסירה זמני (תיבת דואר מלאה או שרת לא זמין).',
           'admin', NULL, 'admin'),
    ('en', 'emails.bounce.complaint.tooltip',
           'Recipient marked the message as spam.',
           'admin', NULL, 'admin'),
    ('he', 'emails.bounce.complaint.tooltip',
           'הנמען סימן את ההודעה כספאם.',
           'admin', NULL, 'admin'),

    -- ─── error_message written by the queue cron when the pre-send
    --     blocklist gate (isEmailDeliverable) suppresses a send ───
    ('en', 'emails.queue.errorMessage.hardBounceBlocked',
           'Recipient address previously hard-bounced',
           'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.hardBounceBlocked',
           'כתובת הנמען חזרה בעבר כהחזרה קשה',
           'admin', NULL, 'admin'),

    -- ─── Email analytics — Bounced summary card ───
    ('en', 'analytics.bounced',     'Bounced',                            'admin', NULL, 'admin'),
    ('he', 'analytics.bounced',     'החזרות',                              'admin', NULL, 'admin'),
    ('en', 'analytics.hardBounced', 'blocked from future sends',          'admin', NULL, 'admin'),
    ('he', 'analytics.hardBounced', 'חסומות לשליחה עתידית',                  'admin', NULL, 'admin');
END $$;
