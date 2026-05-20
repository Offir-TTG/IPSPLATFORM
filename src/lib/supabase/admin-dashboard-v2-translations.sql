-- ============================================================================
-- Admin Dashboard v2 translations (two-chart + cohort + tables redesign)
--
-- Adds ONLY the new keys introduced by the May 2026 dashboard rewrite.
-- Idempotent via WHERE NOT EXISTS (doesn't rely on a specific unique
-- constraint — the live schema lost the original UNIQUE on `key`
-- when tenant_id was introduced, so ON CONFLICT can't be used here).
--
-- Schema (with multi-tenancy + context columns):
--   public.translation_keys (key, category, description, context, tenant_id)
--   public.translations     (language_code, translation_key,
--                            translation_value, category, context, tenant_id)
--
-- tenant_id is sourced from an existing row so the new keys live
-- under the same tenant as the rest of the dashboard translations.
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
  -- Header / subtitle
  ('admin.dashboard.allClearSubtitle',         'admin', 'Header subtitle when no attention items',                       'admin'),
  ('admin.dashboard.attentionSubtitle',        'admin', 'Header subtitle when attention items exist (uses {{count}})',   'admin'),

  -- Attention banner
  ('admin.dashboard.allClearBanner',           'admin', 'Green banner text when nothing needs attention',                'admin'),
  ('admin.dashboard.attention.overdueLabel',   'admin', 'Attention banner: overdue payments noun',                       'admin'),
  ('admin.dashboard.attention.pendingLabel',   'admin', 'Attention banner: pending enrollments noun',                    'admin'),
  ('admin.dashboard.attention.draftLabel',     'admin', 'Attention banner: draft invitations noun',                      'admin'),
  ('admin.dashboard.attention.resolve',        'admin', 'Attention banner CTA: resolve',                                 'admin'),
  ('admin.dashboard.attention.review',         'admin', 'Attention banner CTA: review',                                  'admin'),
  ('admin.dashboard.attention.openList',       'admin', 'Attention banner CTA: open list',                               'admin'),

  -- Chart hero
  ('admin.dashboard.revenue6mo',               'admin', 'Chart hero title: revenue last 6 months',                       'admin'),
  ('admin.dashboard.enrollments6mo',           'admin', 'Chart hero title: enrollments last 6 months',                   'admin'),
  ('admin.dashboard.activeNowShort',           'admin', 'Inline label: active now',                                      'admin'),

  -- All-numbers cohort table
  ('admin.dashboard.allNumbers',               'admin', 'Cohort table card title',                                       'admin'),
  ('admin.dashboard.overdue',                  'admin', 'Short label inside cohort cell ("3 overdue")',                  'admin'),
  ('admin.dashboard.content',                  'admin', 'Cohort row label for LMS/content metrics',                      'admin'),
  ('admin.dashboard.next7d',                   'admin', 'Cohort cell label for upcoming sessions',                       'admin'),

  -- Recent-activity card links
  ('admin.dashboard.viewAll',                  'admin', 'Recent-activity card "View all" link',                          'admin'),

  -- Recent-activity table column headers
  ('admin.dashboard.col.status',               'admin', 'Recent enrollments table column: Status',                       'admin'),
  ('admin.dashboard.col.name',                 'admin', 'Recent table column: Name',                                     'admin'),
  ('admin.dashboard.col.product',              'admin', 'Recent enrollments table column: Product',                      'admin'),
  ('admin.dashboard.col.date',                 'admin', 'Recent table column: Date',                                     'admin'),
  ('admin.dashboard.col.amount',               'admin', 'Recent payments table column: Amount',                          'admin'),
  ('admin.dashboard.col.email',                'admin', 'Recent payments table column: Email',                           'admin')
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
  -- Header / subtitle
  ('he', 'admin.dashboard.allClearSubtitle',       'הכל מסודר — אין כרגע פעולות שמחכות לך.',                            'admin', 'admin'),
  ('he', 'admin.dashboard.attentionSubtitle',      'יש לך {{count}} פריטים לטיפול היום.',                               'admin', 'admin'),

  -- Attention banner
  ('he', 'admin.dashboard.allClearBanner',         'אין תשלומים באיחור, הרשמות ממתינות או טיוטות ישנות. עבודה מצוינת.', 'admin', 'admin'),
  ('he', 'admin.dashboard.attention.overdueLabel', 'תשלומים באיחור',                                                     'admin', 'admin'),
  ('he', 'admin.dashboard.attention.pendingLabel', 'הרשמות שמחכות לפעולה שלך',                                          'admin', 'admin'),
  ('he', 'admin.dashboard.attention.draftLabel',   'הזמנות שעדיין בטיוטה',                                               'admin', 'admin'),
  ('he', 'admin.dashboard.attention.resolve',      'טפל',                                                                'admin', 'admin'),
  ('he', 'admin.dashboard.attention.review',       'בדוק',                                                               'admin', 'admin'),
  ('he', 'admin.dashboard.attention.openList',     'פתח',                                                                'admin', 'admin'),

  -- Chart hero
  ('he', 'admin.dashboard.revenue6mo',             'הכנסות — 6 החודשים האחרונים',                                        'admin', 'admin'),
  ('he', 'admin.dashboard.enrollments6mo',         'הרשמות — 6 החודשים האחרונים',                                        'admin', 'admin'),
  ('he', 'admin.dashboard.activeNowShort',         'פעילות כעת',                                                         'admin', 'admin'),

  -- All-numbers cohort table
  ('he', 'admin.dashboard.allNumbers',             'כל המספרים',                                                         'admin', 'admin'),
  ('he', 'admin.dashboard.overdue',                'באיחור',                                                             'admin', 'admin'),
  ('he', 'admin.dashboard.content',                'תוכן',                                                               'admin', 'admin'),
  ('he', 'admin.dashboard.next7d',                 'מפגשים ב-7 ימים הקרובים',                                           'admin', 'admin'),

  -- Recent-activity card links
  ('he', 'admin.dashboard.viewAll',                'הצג הכל',                                                           'admin', 'admin'),

  -- Recent-activity table column headers
  ('he', 'admin.dashboard.col.status',             'סטטוס',                                                              'admin', 'admin'),
  ('he', 'admin.dashboard.col.name',               'שם',                                                                 'admin', 'admin'),
  ('he', 'admin.dashboard.col.product',            'מוצר',                                                               'admin', 'admin'),
  ('he', 'admin.dashboard.col.date',               'תאריך',                                                              'admin', 'admin'),
  ('he', 'admin.dashboard.col.amount',             'סכום',                                                               'admin', 'admin'),
  ('he', 'admin.dashboard.col.email',              'אימייל',                                                             'admin', 'admin')
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
  -- Header / subtitle
  ('en', 'admin.dashboard.allClearSubtitle',       'All clear — nothing needs your attention right now.',                'admin', 'admin'),
  ('en', 'admin.dashboard.attentionSubtitle',      'You have {{count}} items to look at today.',                         'admin', 'admin'),

  -- Attention banner
  ('en', 'admin.dashboard.allClearBanner',         'No overdue payments, pending enrollments, or stale drafts. Nice work.', 'admin', 'admin'),
  ('en', 'admin.dashboard.attention.overdueLabel', 'overdue payments',                                                    'admin', 'admin'),
  ('en', 'admin.dashboard.attention.pendingLabel', 'enrollments awaiting your action',                                    'admin', 'admin'),
  ('en', 'admin.dashboard.attention.draftLabel',   'invitations still in draft',                                          'admin', 'admin'),
  ('en', 'admin.dashboard.attention.resolve',      'Resolve',                                                             'admin', 'admin'),
  ('en', 'admin.dashboard.attention.review',       'Review',                                                              'admin', 'admin'),
  ('en', 'admin.dashboard.attention.openList',     'Open',                                                                'admin', 'admin'),

  -- Chart hero
  ('en', 'admin.dashboard.revenue6mo',             'Revenue — last 6 months',                                             'admin', 'admin'),
  ('en', 'admin.dashboard.enrollments6mo',         'Enrollments — last 6 months',                                         'admin', 'admin'),
  ('en', 'admin.dashboard.activeNowShort',         'active now',                                                          'admin', 'admin'),

  -- All-numbers cohort table
  ('en', 'admin.dashboard.allNumbers',             'All numbers',                                                         'admin', 'admin'),
  ('en', 'admin.dashboard.overdue',                'overdue',                                                             'admin', 'admin'),
  ('en', 'admin.dashboard.content',                'Content',                                                             'admin', 'admin'),
  ('en', 'admin.dashboard.next7d',                 'Sessions next 7d',                                                    'admin', 'admin'),

  -- Recent-activity card links
  ('en', 'admin.dashboard.viewAll',                'View all',                                                            'admin', 'admin'),

  -- Recent-activity table column headers
  ('en', 'admin.dashboard.col.status',             'Status',                                                              'admin', 'admin'),
  ('en', 'admin.dashboard.col.name',               'Name',                                                                'admin', 'admin'),
  ('en', 'admin.dashboard.col.product',            'Product',                                                             'admin', 'admin'),
  ('en', 'admin.dashboard.col.date',               'Date',                                                                'admin', 'admin'),
  ('en', 'admin.dashboard.col.amount',             'Amount',                                                              'admin', 'admin'),
  ('en', 'admin.dashboard.col.email',              'Email',                                                               'admin', 'admin')
) AS vals(language_code, translation_key, translation_value, category, context)
WHERE NOT EXISTS (
  SELECT 1 FROM public.translations t
  WHERE t.language_code = vals.language_code
    AND t.translation_key = vals.translation_key
);
