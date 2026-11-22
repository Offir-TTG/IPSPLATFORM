-- Product page labels that the products redesign translations file missed.
-- Already applied on 22 Nov 2026; kept for other environments. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.payments.products.copyLink', 'Copy product link'),
  ('he', 'admin.payments.products.copyLink', 'העתקת הקישור למוצר'),
  ('en', 'admin.payments.products.linkCopied', 'Link copied'),
  ('he', 'admin.payments.products.linkCopied', 'הקישור הועתק'),
  ('en', 'admin.payments.products.linkCopyFailed', 'Failed to copy link'),
  ('he', 'admin.payments.products.linkCopyFailed', 'לא הצלחנו להעתיק את הקישור'),
  ('en', 'common.unknown', 'Unknown User'),
  ('he', 'common.unknown', 'משתמש לא ידוע')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
