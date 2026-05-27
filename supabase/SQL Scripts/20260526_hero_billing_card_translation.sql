-- New "Billing" quick-action card on the user dashboard hero (added
-- when the billing tab was promoted to its own /billing page).
-- Hebrew matches what `user.profile.tabs.billing` used (חיוב) so the
-- copy stays consistent across the portal. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key = 'user.dashboard.hero.actions.billing';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.dashboard.hero.actions.billing', 'Billing', 'user', NULL, 'user'),
    ('he', 'user.dashboard.hero.actions.billing', 'חיוב',     'user', NULL, 'user');
END $$;
