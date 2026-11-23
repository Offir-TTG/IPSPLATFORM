-- Email templates for membership price changes, for every organization:
--   subscription.price_change            to current members before the change starts
--   subscription.price_change_cancelled  when a change members were told about is cancelled
-- Hebrew and English. Editable afterwards in Emails > Templates.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Only adds what is missing. Safe to rerun.

INSERT INTO email_templates (tenant_id, template_key, template_name, template_category, description, is_system, is_active, allow_customization, variables)
SELECT t.id, 'subscription.price_change', 'Membership price change', 'payment', 'Sent to current members before a scheduled membership price change takes effect', true, true, true, '[{"name": "userName", "description": "First name", "example": "Noa", "required": true}, {"name": "productName", "description": "Membership name", "example": "ADHD Experts Club", "required": true}, {"name": "oldPrice", "description": "Current price", "example": "$30.00", "required": true}, {"name": "newPrice", "description": "New price", "example": "$40.00", "required": true}, {"name": "chargeDate", "description": "First charge at the new price", "example": "5 January 2027", "required": true}, {"name": "portalUrl", "description": "Link to the personal area", "example": "https://example.com/billing", "required": false}]'::jsonb
FROM tenants t
ON CONFLICT (tenant_id, template_key) DO NOTHING;

INSERT INTO email_template_versions (template_id, language_code, subject, body_html, body_text, version, is_current)
SELECT et.id, 'he', U&'\05E2\05D3\05DB\05D5\05DF \05DE\05D7\05D9\05E8 \05D4\05DE\05E0\05D5\05D9 \05D1{{productName}}', U&'<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7"><p>\05E9\05DC\05D5\05DD {{userName}},</p><p>\05E8\05E6\05D9\05E0\05D5 \05DC\05E2\05D3\05DB\05DF \05DE\05E8\05D0\05E9: \05DE\05D7\05D9\05E8 \05D4\05DE\05E0\05D5\05D9 \05D1{{productName}} \05DE\05E9\05EA\05E0\05D4.</p><p style="font-size:18px"><s>{{oldPrice}}</s> &larr; <b>{{newPrice}}</b></p><p>\05D4\05DE\05D7\05D9\05E8 \05D4\05D7\05D3\05E9 \05D9\05D7\05D5\05DC \05DE\05D4\05D7\05D9\05D5\05D1 \05E9\05DC\05DA \05D1-<b>{{chargeDate}}</b>. \05E2\05D3 \05D0\05D6 \05D4\05DB\05D5\05DC \05E0\05E9\05D0\05E8 \05DB\05E8\05D2\05D9\05DC.</p><p>\05D0\05DD \05EA\05E8\05E6\05D5 \05DC\05D4\05E4\05E1\05D9\05E7 \05D0\05EA \05D4\05DE\05E0\05D5\05D9, \05D0\05E4\05E9\05E8 \05DC\05E2\05E9\05D5\05EA \05D6\05D0\05EA \05D1\05DB\05DC \05E2\05EA \05DC\05E4\05E0\05D9 \05DB\05DF \05D1\05D0\05D6\05D5\05E8 \05D4\05D0\05D9\05E9\05D9.</p><p><a href="{{portalUrl}}">\05DC\05D0\05D6\05D5\05E8 \05D4\05D0\05D9\05E9\05D9</a></p></div>', U&'\05E9\05DC\05D5\05DD {{userName}},
\05DE\05D7\05D9\05E8 \05D4\05DE\05E0\05D5\05D9 \05D1{{productName}} \05DE\05E9\05EA\05E0\05D4 \05DE-{{oldPrice}} \05DC-{{newPrice}}, \05DE\05D4\05D7\05D9\05D5\05D1 \05E9\05DC\05DA \05D1-{{chargeDate}}.
\05D0\05E4\05E9\05E8 \05DC\05D4\05E4\05E1\05D9\05E7 \05D0\05EA \05D4\05DE\05E0\05D5\05D9 \05DC\05E4\05E0\05D9 \05DB\05DF \05D1\05D0\05D6\05D5\05E8 \05D4\05D0\05D9\05E9\05D9: {{portalUrl}}', 1, true
FROM email_templates et
WHERE et.template_key = 'subscription.price_change'
  AND NOT EXISTS (SELECT 1 FROM email_template_versions v WHERE v.template_id = et.id AND v.language_code = 'he');

INSERT INTO email_template_versions (template_id, language_code, subject, body_html, body_text, version, is_current)
SELECT et.id, 'en', 'Your {{productName}} membership price is changing', '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7"><p>Hi {{userName}},</p><p>A heads-up: the membership price for {{productName}} is changing.</p><p style="font-size:18px"><s>{{oldPrice}}</s> &rarr; <b>{{newPrice}}</b></p><p>The new price applies from your charge on <b>{{chargeDate}}</b>. Until then nothing changes.</p><p>If you would like to stop your membership, you can do so any time before then in your account.</p><p><a href="{{portalUrl}}">Go to my account</a></p></div>', 'Hi {{userName}},
The membership price for {{productName}} changes from {{oldPrice}} to {{newPrice}}, from your charge on {{chargeDate}}.
You can stop your membership before then in your account: {{portalUrl}}', 1, true
FROM email_templates et
WHERE et.template_key = 'subscription.price_change'
  AND NOT EXISTS (SELECT 1 FROM email_template_versions v WHERE v.template_id = et.id AND v.language_code = 'en');

INSERT INTO email_templates (tenant_id, template_key, template_name, template_category, description, is_system, is_active, allow_customization, variables)
SELECT t.id, 'subscription.price_change_cancelled', 'Membership price change cancelled', 'payment', 'Sent when a price change members were told about is cancelled', true, true, true, '[{"name": "userName", "description": "First name", "example": "Noa", "required": true}, {"name": "productName", "description": "Membership name", "example": "ADHD Experts Club", "required": true}, {"name": "oldPrice", "description": "The price that stays", "example": "$30.00", "required": true}]'::jsonb
FROM tenants t
ON CONFLICT (tenant_id, template_key) DO NOTHING;

INSERT INTO email_template_versions (template_id, language_code, subject, body_html, body_text, version, is_current)
SELECT et.id, 'he', U&'\05DE\05D7\05D9\05E8 \05D4\05DE\05E0\05D5\05D9 \05D1{{productName}} \05DC\05D0 \05DE\05E9\05EA\05E0\05D4', U&'<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7"><p>\05E9\05DC\05D5\05DD {{userName}},</p><p>\05E2\05D3\05DB\05D5\05DF: \05E9\05D9\05E0\05D5\05D9 \05D4\05DE\05D7\05D9\05E8 \05E9\05D4\05D5\05D3\05E2\05E0\05D5 \05E2\05DC\05D9\05D5 \05D1\05D5\05D8\05DC. \05D4\05DE\05E0\05D5\05D9 \05E9\05DC\05DA \05D1{{productName}} \05E0\05E9\05D0\05E8 \05D1-<b>{{oldPrice}}</b>.</p></div>', U&'\05E9\05DC\05D5\05DD {{userName}},
\05E9\05D9\05E0\05D5\05D9 \05D4\05DE\05D7\05D9\05E8 \05E9\05D4\05D5\05D3\05E2\05E0\05D5 \05E2\05DC\05D9\05D5 \05D1\05D5\05D8\05DC. \05D4\05DE\05E0\05D5\05D9 \05E9\05DC\05DA \05D1{{productName}} \05E0\05E9\05D0\05E8 \05D1-{{oldPrice}}.', 1, true
FROM email_templates et
WHERE et.template_key = 'subscription.price_change_cancelled'
  AND NOT EXISTS (SELECT 1 FROM email_template_versions v WHERE v.template_id = et.id AND v.language_code = 'he');

INSERT INTO email_template_versions (template_id, language_code, subject, body_html, body_text, version, is_current)
SELECT et.id, 'en', 'Your {{productName}} membership price stays the same', '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7"><p>Hi {{userName}},</p><p>An update: the price change we told you about has been cancelled. Your {{productName}} membership stays at <b>{{oldPrice}}</b>.</p></div>', 'Hi {{userName}},
The price change we told you about has been cancelled. Your {{productName}} membership stays at {{oldPrice}}.', 1, true
FROM email_templates et
WHERE et.template_key = 'subscription.price_change_cancelled'
  AND NOT EXISTS (SELECT 1 FROM email_template_versions v WHERE v.template_id = et.id AND v.language_code = 'en');
