-- Payment plans page redesign (list, drawer, step-by-step editor), plus older plan and shared labels that never had Hebrew.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  -- Shared
  ('en', 'common.error', 'Error'),
  ('he', 'common.error', U&'\05E9\05D2\05D9\05D0\05D4'),
  ('en', 'admin.users.filters.clear', 'Clear filters'),
  ('he', 'admin.users.filters.clear', U&'\05E0\05D9\05E7\05D5\05D9 \05D4\05E1\05D9\05E0\05D5\05DF'),
  -- Older plan messages
  ('en', 'admin.payments.plans.loadError', 'Failed to load payment plans'),
  ('he', 'admin.payments.plans.loadError', U&'\05D8\05E2\05D9\05E0\05EA \05EA\05D5\05DB\05E0\05D9\05D5\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05E0\05DB\05E9\05DC\05D4'),
  ('en', 'admin.payments.plans.deleteSuccess', 'Payment plan deleted'),
  ('he', 'admin.payments.plans.deleteSuccess', U&'\05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05E0\05DE\05D7\05E7\05D4'),
  ('en', 'admin.payments.plans.deleteError', 'Failed to delete payment plan'),
  ('he', 'admin.payments.plans.deleteError', U&'\05DE\05D7\05D9\05E7\05EA \05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05E0\05DB\05E9\05DC\05D4'),
  ('en', 'admin.payments.plans.updateSuccess', 'Payment plan saved'),
  ('he', 'admin.payments.plans.updateSuccess', U&'\05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05E0\05E9\05DE\05E8\05D4'),
  ('en', 'admin.payments.plans.createSuccess', 'Payment plan created'),
  ('he', 'admin.payments.plans.createSuccess', U&'\05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05E0\05D5\05E6\05E8\05D4'),
  ('en', 'admin.payments.plans.saveError', 'Failed to save payment plan'),
  ('he', 'admin.payments.plans.saveError', U&'\05E9\05DE\05D9\05E8\05EA \05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05E0\05DB\05E9\05DC\05D4'),
  -- List
  ('en', 'admin.payments.plans.kpi.all', 'All plans'),
  ('he', 'admin.payments.plans.kpi.all', U&'\05DB\05DC \05D4\05EA\05D5\05DB\05E0\05D9\05D5\05EA'),
  ('en', 'admin.payments.plans.kpi.autoSub', 'Assigned automatically'),
  ('he', 'admin.payments.plans.kpi.autoSub', U&'\05DE\05E9\05D5\05D9\05DB\05D5\05EA \05D0\05D5\05D8\05D5\05DE\05D8\05D9\05EA'),
  ('en', 'admin.payments.plans.searchPlaceholder', 'Search by name or description'),
  ('he', 'admin.payments.plans.searchPlaceholder', U&'\05D7\05D9\05E4\05D5\05E9 \05DC\05E4\05D9 \05E9\05DD \05D0\05D5 \05EA\05D9\05D0\05D5\05E8'),
  ('en', 'admin.payments.plans.allTypes', 'All types'),
  ('he', 'admin.payments.plans.allTypes', U&'\05DB\05DC \05D4\05E1\05D5\05D2\05D9\05DD'),
  ('en', 'admin.payments.plans.noMatch', 'No plans match'),
  ('he', 'admin.payments.plans.noMatch', U&'\05DC\05D0 \05E0\05DE\05E6\05D0\05D5 \05EA\05D5\05DB\05E0\05D9\05D5\05EA'),
  ('en', 'admin.payments.plans.table.plan', 'Plan'),
  ('he', 'admin.payments.plans.table.plan', U&'\05EA\05D5\05DB\05E0\05D9\05EA'),
  -- Drawer
  ('en', 'admin.payments.plans.drawer.howCharged', 'How it charges'),
  ('he', 'admin.payments.plans.drawer.howCharged', U&'\05D0\05D9\05DA \05DE\05D7\05D9\05D9\05D1\05EA'),
  ('en', 'admin.payments.plans.drawer.usedBy', 'Enrollments'),
  ('he', 'admin.payments.plans.drawer.usedBy', U&'\05D4\05E8\05E9\05DE\05D5\05EA'),
  ('en', 'admin.payments.plans.drawer.edit', 'Edit plan'),
  ('he', 'admin.payments.plans.drawer.edit', U&'\05E2\05E8\05D9\05DB\05EA \05D4\05EA\05D5\05DB\05E0\05D9\05EA'),
  ('en', 'admin.payments.plans.drawer.inUse', 'Enrollments use this plan, so it cannot be deleted. Turn it off instead.'),
  ('he', 'admin.payments.plans.drawer.inUse', U&'\05D9\05E9 \05D4\05E8\05E9\05DE\05D5\05EA \05E9\05DE\05E9\05EA\05DE\05E9\05D5\05EA \05D1\05EA\05D5\05DB\05E0\05D9\05EA, \05D5\05DC\05DB\05DF \05D0\05D9 \05D0\05E4\05E9\05E8 \05DC\05DE\05D7\05D5\05E7 \05D0\05D5\05EA\05D4. \05D0\05E4\05E9\05E8 \05DC\05DB\05D1\05D5\05EA \05D0\05D5\05EA\05D4.'),
  -- Editor
  ('en', 'admin.payments.plans.wizard.back', 'Back to payment plans'),
  ('he', 'admin.payments.plans.wizard.back', U&'\05D7\05D6\05E8\05D4 \05DC\05EA\05D5\05DB\05E0\05D9\05D5\05EA \05D4\05EA\05E9\05DC\05D5\05DD'),
  ('en', 'admin.payments.plans.wizard.stepBasics', 'Name and type'),
  ('he', 'admin.payments.plans.wizard.stepBasics', U&'\05E9\05DD \05D5\05E1\05D5\05D2'),
  ('en', 'admin.payments.plans.wizard.stepCharges', 'How it charges'),
  ('he', 'admin.payments.plans.wizard.stepCharges', U&'\05D0\05D9\05DA \05DE\05D7\05D9\05D9\05D1\05EA'),
  ('en', 'admin.payments.plans.wizard.basicsTitle', 'Name and payment type'),
  ('he', 'admin.payments.plans.wizard.basicsTitle', U&'\05E9\05DD \05D5\05E1\05D5\05D2 \05D4\05EA\05E9\05DC\05D5\05DD'),
  ('en', 'admin.payments.plans.wizard.oneTimeText', 'The whole price in one payment.'),
  ('he', 'admin.payments.plans.wizard.oneTimeText', U&'\05DB\05DC \05D4\05DE\05D7\05D9\05E8 \05D1\05EA\05E9\05DC\05D5\05DD \05D0\05D7\05D3.'),
  ('en', 'admin.payments.plans.wizard.depositText', 'A deposit first, then equal payments.'),
  ('he', 'admin.payments.plans.wizard.depositText', U&'\05E7\05D5\05D3\05DD \05DE\05E7\05D3\05DE\05D4, \05D5\05D0\05D7\05E8 \05DB\05DA \05EA\05E9\05DC\05D5\05DE\05D9\05DD \05E9\05D5\05D5\05D9\05DD.'),
  ('en', 'admin.payments.plans.wizard.installmentsText', 'The price paid in equal parts.'),
  ('he', 'admin.payments.plans.wizard.installmentsText', U&'\05D4\05DE\05D7\05D9\05E8 \05DE\05D7\05D5\05DC\05E7 \05DC\05EA\05E9\05DC\05D5\05DE\05D9\05DD \05E9\05D5\05D5\05D9\05DD.'),
  ('en', 'admin.payments.plans.wizard.subscriptionText', 'Charged again every period, until cancelled.'),
  ('he', 'admin.payments.plans.wizard.subscriptionText', U&'\05D7\05D9\05D5\05D1 \05D7\05D5\05D6\05E8 \05D1\05DB\05DC \05EA\05E7\05D5\05E4\05D4, \05E2\05D3 \05DC\05D1\05D9\05D8\05D5\05DC.'),
  ('en', 'admin.payments.plans.wizard.oneTimeNothing', 'Nothing more to set: the whole price is paid at once.'),
  ('he', 'admin.payments.plans.wizard.oneTimeNothing', U&'\05D0\05D9\05DF \05DE\05D4 \05DC\05D4\05D2\05D3\05D9\05E8 \05DB\05D0\05DF: \05DB\05DC \05D4\05DE\05D7\05D9\05E8 \05DE\05E9\05D5\05DC\05DD \05D1\05D1\05EA \05D0\05D7\05EA.'),
  ('en', 'admin.payments.plans.wizard.summary', 'In short'),
  ('he', 'admin.payments.plans.wizard.summary', U&'\05D1\05E7\05E6\05E8\05D4'),
  ('en', 'admin.payments.plans.wizard.required', 'This field is required.'),
  ('he', 'admin.payments.plans.wizard.required', U&'\05D6\05D4 \05E9\05D3\05D4 \05D7\05D5\05D1\05D4.'),
  ('en', 'admin.payments.plans.wizard.errName', 'Give the plan a name.'),
  ('he', 'admin.payments.plans.wizard.errName', U&'\05D9\05E9 \05DC\05EA\05EA \05E9\05DD \05DC\05EA\05D5\05DB\05E0\05D9\05EA.'),
  ('en', 'admin.payments.plans.wizard.errPercent', 'Write a percentage between 1 and 100.'),
  ('he', 'admin.payments.plans.wizard.errPercent', U&'\05D9\05E9 \05DC\05DB\05EA\05D5\05D1 \05D0\05D7\05D5\05D6 \05D1\05D9\05DF 1 \05DC-100.'),
  ('en', 'admin.payments.plans.wizard.errAmount', 'Write an amount greater than 0.'),
  ('he', 'admin.payments.plans.wizard.errAmount', U&'\05D9\05E9 \05DC\05DB\05EA\05D5\05D1 \05E1\05DB\05D5\05DD \05D2\05D3\05D5\05DC \05DE-0.'),
  ('en', 'admin.payments.plans.wizard.errCount', 'Write how many payments (1 or more).'),
  ('he', 'admin.payments.plans.wizard.errCount', U&'\05D9\05E9 \05DC\05DB\05EA\05D5\05D1 \05DB\05DE\05D4 \05EA\05E9\05DC\05D5\05DE\05D9\05DD (1 \05D0\05D5 \05D9\05D5\05EA\05E8).'),
  ('en', 'admin.payments.plans.wizard.notFound', 'This payment plan was not found. It may have been deleted.'),
  ('he', 'admin.payments.plans.wizard.notFound', U&'\05EA\05D5\05DB\05E0\05D9\05EA \05D4\05EA\05E9\05DC\05D5\05DD \05DC\05D0 \05E0\05DE\05E6\05D0\05D4. \05D9\05D9\05EA\05DB\05DF \05E9\05E0\05DE\05D7\05E7\05D4.'),
  ('en', 'admin.payments.plans.wizard.newNote', 'New plan, not saved yet'),
  ('he', 'admin.payments.plans.wizard.newNote', U&'\05EA\05D5\05DB\05E0\05D9\05EA \05D7\05D3\05E9\05D4, \05E2\05D5\05D3 \05DC\05D0 \05E0\05E9\05DE\05E8\05D4')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
