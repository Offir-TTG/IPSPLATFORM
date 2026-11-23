-- Future price on a new subscription product (product wizard, Pricing step), in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.priceChange.futureTitle', 'Schedule a future price (optional)'),
  ('he', 'admin.priceChange.futureTitle', U&'\05DE\05D7\05D9\05E8 \05E2\05EA\05D9\05D3\05D9 (\05DC\05D0 \05D7\05D5\05D1\05D4)'),
  ('en', 'admin.priceChange.futureHint', 'For example, a launch price that goes up on a date. You can also do this later from the product.'),
  ('he', 'admin.priceChange.futureHint', U&'\05DC\05DE\05E9\05DC \05DE\05D7\05D9\05E8 \05D4\05E9\05E7\05D4 \05E9\05E2\05D5\05DC\05D4 \05D1\05EA\05D0\05E8\05D9\05DA \05DE\05E1\05D5\05D9\05DD. \05D0\05E4\05E9\05E8 \05D2\05DD \05DC\05E7\05D1\05D5\05E2 \05D0\05EA \05D6\05D4 \05D0\05D7\05E8 \05DB\05DA \05DE\05D4\05DE\05D5\05E6\05E8.'),
  ('en', 'admin.priceChange.whoFuture', 'Who pays the new price?'),
  ('he', 'admin.priceChange.whoFuture', U&'\05DE\05D9 \05DE\05E9\05DC\05DD \05D0\05EA \05D4\05DE\05D7\05D9\05E8 \05D4\05D7\05D3\05E9?'),
  ('en', 'admin.priceChange.futureNewText', 'Whoever joins before the date keeps {price}. People who join from the date pay the new price.'),
  ('he', 'admin.priceChange.futureNewText', U&'\05DE\05D9 \05E9\05DE\05E6\05D8\05E8\05E3 \05DC\05E4\05E0\05D9 \05D4\05EA\05D0\05E8\05D9\05DA \05E9\05D5\05DE\05E8 \05E2\05DC {price}. \05DE\05D9 \05E9\05DE\05E6\05D8\05E8\05E3 \05DE\05D4\05EA\05D0\05E8\05D9\05DA \05DE\05E9\05DC\05DD \05D0\05EA \05D4\05DE\05D7\05D9\05E8 \05D4\05D7\05D3\05E9.'),
  ('en', 'admin.priceChange.futureAllText', 'Everyone moves to the new price from their first renewal on or after the date. Members are emailed in advance.'),
  ('he', 'admin.priceChange.futureAllText', U&'\05DB\05D5\05DC\05DD \05E2\05D5\05D1\05E8\05D9\05DD \05DC\05DE\05D7\05D9\05E8 \05D4\05D7\05D3\05E9 \05DE\05D4\05D7\05D9\05D3\05D5\05E9 \05D4\05E8\05D0\05E9\05D5\05DF \05D1\05EA\05D0\05E8\05D9\05DA \05D0\05D5 \05D0\05D7\05E8\05D9\05D5. \05D4\05DE\05E0\05D5\05D9\05D9\05DD \05DE\05E7\05D1\05DC\05D9\05DD \05DE\05D9\05D9\05DC \05DE\05E8\05D0\05E9.'),
  ('en', 'admin.priceChange.futureSummary', U&'Until {date} the price is {old}; from {date} it is {price}. Buyers see "{old} \00B7 from {date} {price}" before paying.'),
  ('he', 'admin.priceChange.futureSummary', U&'\05E2\05D3 {date} \05D4\05DE\05D7\05D9\05E8 {old}; \05DE-{date} \05D4\05DE\05D7\05D9\05E8 {price}. \05E7\05D5\05E0\05D9\05DD \05D9\05E8\05D0\05D5 "{old} \00B7 \05DE-{date} {price}" \05DC\05E4\05E0\05D9 \05D4\05EA\05E9\05DC\05D5\05DD.'),
  ('en', 'admin.priceChange.futureNotScheduled', 'The product was created, but the future price was not scheduled. Add it from the product with "Change price".'),
  ('he', 'admin.priceChange.futureNotScheduled', U&'\05D4\05DE\05D5\05E6\05E8 \05E0\05D5\05E6\05E8, \05D0\05D1\05DC \05D4\05DE\05D7\05D9\05E8 \05D4\05E2\05EA\05D9\05D3\05D9 \05DC\05D0 \05E0\05E7\05D1\05E2. \05D0\05E4\05E9\05E8 \05DC\05D4\05D5\05E1\05D9\05E3 \05D0\05D5\05EA\05D5 \05DE\05D4\05DE\05D5\05E6\05E8 \05D1\05DB\05E4\05EA\05D5\05E8 "\05E9\05D9\05E0\05D5\05D9 \05DE\05D7\05D9\05E8".')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
