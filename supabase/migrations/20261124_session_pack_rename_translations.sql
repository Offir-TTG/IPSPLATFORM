-- Product type "session_pack" is shown as "Personal guidance" / U&'\05DC\05D9\05D5\05D5\05D9 \05D0\05D9\05E9\05D9'
-- (was "Session Pack" / "chavilat mifgashim"), matching the services guide.
-- Renames the existing wording, global and per-tenant. Safe to rerun.
UPDATE translations SET translation_value = U&'\05DC\05D9\05D5\05D5\05D9 \05D0\05D9\05E9\05D9', updated_at = NOW()
WHERE language_code = 'he' AND translation_key IN (
  'products.type.session_pack', 'productType.session_pack', 'admin.enrollments.productType.session_pack',
  'enrollment.productType.session_pack', 'product.type.session_pack', 'admin.users.activity.values.productType.session_pack',
  'user.payments.checkout.item.session_pack', 'enrollment.wizard.compact.type.session_pack');
UPDATE translations SET translation_value = 'Personal guidance', updated_at = NOW()
WHERE language_code = 'en' AND translation_key IN (
  'products.type.session_pack', 'productType.session_pack', 'admin.enrollments.productType.session_pack',
  'enrollment.productType.session_pack', 'product.type.session_pack', 'admin.users.activity.values.productType.session_pack',
  'user.payments.checkout.item.session_pack', 'enrollment.wizard.compact.type.session_pack');
