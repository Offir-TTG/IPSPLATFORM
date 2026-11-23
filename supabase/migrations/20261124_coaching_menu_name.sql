-- Admin menu: the coaching item is "Coaching" in English and family guidance in Hebrew (it covers parent and child coaching).
-- Already applied to the shared translations; safe to rerun.
UPDATE translations SET translation_value = 'Coaching', updated_at = NOW()
  WHERE translation_key = 'admin.nav.coaching' AND language_code = 'en' AND tenant_id IS NULL;
UPDATE translations SET translation_value = U&'\05D4\05D3\05E8\05DB\05EA \05DE\05E9\05E4\05D7\05D4', updated_at = NOW()
  WHERE translation_key = 'admin.nav.coaching' AND language_code = 'he' AND tenant_id IS NULL;
