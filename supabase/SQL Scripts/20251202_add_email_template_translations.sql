-- ============================================================================
-- Product Email Template Translations
-- ============================================================================
-- Translations for the email template selector in product form
-- ============================================================================

-- Tab Label
INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES (NULL, 'products.tabs.emails', 'en', 'Email Templates', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES (NULL, 'products.tabs.emails', 'he', 'תבניות אימייל', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

-- Help Note
INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES (NULL, 'products.email_templates.help_note', 'en', 'Leave as "Use Default Template" to use the standard enrollment email template. Create custom templates in', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES (NULL, 'products.email_templates.help_note', 'he', 'השאר כ"השתמש בתבנית ברירת מחדל" כדי להשתמש בתבנית האימייל הסטנדרטית. צור תבניות מותאמות אישית ב', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

-- Template Management Link
INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES (NULL, 'products.email_templates.template_management', 'en', 'Email Template Management', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;

INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES (NULL, 'products.email_templates.template_management', 'he', 'ניהול תבניות אימייל', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;
