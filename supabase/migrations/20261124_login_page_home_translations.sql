-- Login page redesign (option C) and its admin editor (Settings -> Login page). In he + en.
-- Hebrew is written as U& character codes, so the file is plain ASCII.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'user', NOW(), NOW()
FROM (VALUES
  ('en', 'auth.login.signingIn', U&'Signing in\2026'),
  ('he', 'auth.login.signingIn', U&'\05DE\05EA\05D7\05D1\05E8\2026'),
  ('en', 'auth.login.badge', U&'Your personal area'),
  ('he', 'auth.login.badge', U&'\05D4\05D0\05D6\05D5\05E8 \05D4\05D0\05D9\05E9\05D9'),
  ('en', 'auth.login.homeTitle', U&'Welcome home'),
  ('he', 'auth.login.homeTitle', U&'\05D1\05E8\05D5\05DB\05D9\05DD \05D4\05D1\05D0\05D9\05DD \05D4\05D1\05D9\05EA\05D4'),
  ('en', 'auth.login.homeSubtitle', U&'Your programs, sessions and club are waiting for you here.'),
  ('he', 'auth.login.homeSubtitle', U&'\05D4\05EA\05D5\05DB\05E0\05D9\05D5\05EA, \05D4\05DE\05E4\05D2\05E9\05D9\05DD \05D5\05D4\05DE\05D5\05E2\05D3\05D5\05DF \05E9\05DC\05DB\05DD \05DE\05D7\05DB\05D9\05DD \05DC\05DB\05DD \05DB\05D0\05DF.'),
  ('en', 'auth.login.photoCaption', U&'Everything you bought and signed up for, in one place'),
  ('he', 'auth.login.photoCaption', U&'\05DB\05DC \05DE\05D4 \05E9\05E7\05E0\05D9\05EA\05DD \05D5\05E0\05E8\05E9\05DE\05EA\05DD \05D0\05DC\05D9\05D5, \05D1\05DE\05E7\05D5\05DD \05D0\05D7\05D3'),
  ('en', 'auth.login.toWebsite', U&'To the website'),
  ('he', 'auth.login.toWebsite', U&'\05DC\05D0\05EA\05E8')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);

INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.settingsHub.loginPageTitle', U&'Login page'),
  ('he', 'admin.settingsHub.loginPageTitle', U&'\05E2\05DE\05D5\05D3 \05D4\05DB\05E0\05D9\05E1\05D4'),
  ('en', 'admin.settingsHub.loginPage', U&'The portal''s home page: its picture and its words'),
  ('he', 'admin.settingsHub.loginPage', U&'\05E2\05DE\05D5\05D3 \05D4\05D1\05D9\05EA \05E9\05DC \05D4\05E4\05D5\05E8\05D8\05DC: \05D4\05EA\05DE\05D5\05E0\05D4 \05D5\05D4\05DE\05D9\05DC\05D9\05DD \05E9\05DC\05D5'),
  ('en', 'admin.loginPage.description', U&'This is the portal''s home page, the first thing clients see. Change its picture and its words here.'),
  ('he', 'admin.loginPage.description', U&'\05D6\05D4 \05E2\05DE\05D5\05D3 \05D4\05D1\05D9\05EA \05E9\05DC \05D4\05E4\05D5\05E8\05D8\05DC, \05D4\05D3\05D1\05E8 \05D4\05E8\05D0\05E9\05D5\05DF \05E9\05D4\05DC\05E7\05D5\05D7\05D5\05EA \05E8\05D5\05D0\05D9\05DD. \05DB\05D0\05DF \05DE\05E9\05E0\05D9\05DD \05D0\05EA \05D4\05EA\05DE\05D5\05E0\05D4 \05D5\05D0\05EA \05D4\05DE\05D9\05DC\05D9\05DD \05E9\05DC\05D5.'),
  ('en', 'admin.loginPage.viewPage', U&'View page'),
  ('he', 'admin.loginPage.viewPage', U&'\05E6\05E4\05D9\05D9\05D4 \05D1\05E2\05DE\05D5\05D3'),
  ('en', 'admin.loginPage.pictureTitle', U&'Picture'),
  ('he', 'admin.loginPage.pictureTitle', U&'\05EA\05DE\05D5\05E0\05D4'),
  ('en', 'admin.loginPage.pictureHint', U&'Shown beside the form on a computer and on top on a phone. A wide picture works best. PNG, JPG, GIF or WEBP, up to 20MB.'),
  ('he', 'admin.loginPage.pictureHint', U&'\05DE\05D5\05E6\05D2\05EA \05DC\05D9\05D3 \05D4\05D8\05D5\05E4\05E1 \05D1\05DE\05D7\05E9\05D1 \05D5\05DC\05DE\05E2\05DC\05D4 \05D1\05D8\05DC\05E4\05D5\05DF. \05EA\05DE\05D5\05E0\05D4 \05E8\05D7\05D1\05D4 \05DE\05EA\05D0\05D9\05DE\05D4 \05D4\05DB\05D9 \05D8\05D5\05D1. PNG, JPG, GIF \05D0\05D5 WEBP, \05E2\05D3 20MB.'),
  ('en', 'admin.loginPage.useDefaultImage', U&'Back to the built-in picture'),
  ('he', 'admin.loginPage.useDefaultImage', U&'\05D7\05D6\05E8\05D4 \05DC\05EA\05DE\05D5\05E0\05D4 \05D4\05E7\05D1\05D5\05E2\05D4'),
  ('en', 'admin.loginPage.wordsTitle', U&'Words'),
  ('he', 'admin.loginPage.wordsTitle', U&'\05DE\05D9\05DC\05D9\05DD'),
  ('en', 'admin.loginPage.wordsHint', U&'In Hebrew. The English page keeps its built-in wording.'),
  ('he', 'admin.loginPage.wordsHint', U&'\05D1\05E2\05D1\05E8\05D9\05EA. \05D4\05E2\05DE\05D5\05D3 \05D1\05D0\05E0\05D2\05DC\05D9\05EA \05E0\05E9\05D0\05E8 \05E2\05DD \05D4\05E0\05D5\05E1\05D7 \05D4\05E7\05D1\05D5\05E2.'),
  ('en', 'admin.loginPage.emptyShows', U&'Leave empty to show:'),
  ('he', 'admin.loginPage.emptyShows', U&'\05D4\05E9\05D0\05D9\05E8\05D5 \05E8\05D9\05E7 \05DB\05D3\05D9 \05DC\05D4\05E6\05D9\05D2:'),
  ('en', 'admin.loginPage.badge', U&'Small label above the heading'),
  ('he', 'admin.loginPage.badge', U&'\05EA\05D5\05D5\05D9\05EA \05E7\05D8\05E0\05D4 \05DE\05E2\05DC \05D4\05DB\05D5\05EA\05E8\05EA'),
  ('en', 'admin.loginPage.title', U&'Heading'),
  ('he', 'admin.loginPage.title', U&'\05DB\05D5\05EA\05E8\05EA'),
  ('en', 'admin.loginPage.subtitle', U&'Line under the heading'),
  ('he', 'admin.loginPage.subtitle', U&'\05E9\05D5\05E8\05D4 \05DE\05EA\05D7\05EA \05DC\05DB\05D5\05EA\05E8\05EA'),
  ('en', 'admin.loginPage.caption', U&'Line on the picture'),
  ('he', 'admin.loginPage.caption', U&'\05E9\05D5\05E8\05D4 \05E2\05DC \05D4\05EA\05DE\05D5\05E0\05D4'),
  ('en', 'admin.loginPage.captionComputer', U&'(computer only)'),
  ('he', 'admin.loginPage.captionComputer', U&'(\05D1\05DE\05D7\05E9\05D1 \05D1\05DC\05D1\05D3)'),
  ('en', 'admin.loginPage.siteTitle', U&'"To the website" link'),
  ('he', 'admin.loginPage.siteTitle', U&'\05D4\05E7\05D9\05E9\05D5\05E8 "\05DC\05D0\05EA\05E8"'),
  ('en', 'admin.loginPage.siteUrl', U&'Website address'),
  ('he', 'admin.loginPage.siteUrl', U&'\05DB\05EA\05D5\05D1\05EA \05D4\05D0\05EA\05E8'),
  ('en', 'admin.loginPage.siteUrlEmptyOrg', U&'Leave empty to use the organization''s website:'),
  ('he', 'admin.loginPage.siteUrlEmptyOrg', U&'\05D4\05E9\05D0\05D9\05E8\05D5 \05E8\05D9\05E7 \05DB\05D3\05D9 \05DC\05D4\05E9\05EA\05DE\05E9 \05D1\05D0\05EA\05E8 \05E9\05DC \05D4\05D0\05E8\05D2\05D5\05DF:'),
  ('en', 'admin.loginPage.siteUrlEmpty', U&'Leave empty to hide the link.'),
  ('he', 'admin.loginPage.siteUrlEmpty', U&'\05D4\05E9\05D0\05D9\05E8\05D5 \05E8\05D9\05E7 \05DB\05D3\05D9 \05DC\05D4\05E1\05EA\05D9\05E8 \05D0\05EA \05D4\05E7\05D9\05E9\05D5\05E8.'),
  ('en', 'admin.loginPage.siteUrlInvalid', U&'Write the full address, starting with https://'),
  ('he', 'admin.loginPage.siteUrlInvalid', U&'\05DB\05EA\05D1\05D5 \05D0\05EA \05D4\05DB\05EA\05D5\05D1\05EA \05D4\05DE\05DC\05D0\05D4, \05E9\05DE\05EA\05D7\05D9\05DC\05D4 \05D1-https://'),
  ('en', 'admin.loginPage.saved', U&'Login page saved'),
  ('he', 'admin.loginPage.saved', U&'\05E2\05DE\05D5\05D3 \05D4\05DB\05E0\05D9\05E1\05D4 \05E0\05E9\05DE\05E8'),
  ('en', 'admin.loginPage.preview', U&'Preview'),
  ('he', 'admin.loginPage.preview', U&'\05EA\05E6\05D5\05D2\05D4 \05DE\05E7\05D3\05D9\05DE\05D4'),
  ('en', 'admin.loginPage.previewHint', U&'Changes show here as you type. Save to put them on the page.'),
  ('he', 'admin.loginPage.previewHint', U&'\05D4\05E9\05D9\05E0\05D5\05D9\05D9\05DD \05DE\05D5\05E4\05D9\05E2\05D9\05DD \05DB\05D0\05DF \05EA\05D5\05DA \05DB\05D3\05D9 \05D4\05E7\05DC\05D3\05D4. \05E9\05DE\05E8\05D5 \05DB\05D3\05D9 \05E9\05D9\05D5\05E4\05D9\05E2\05D5 \05D1\05E2\05DE\05D5\05D3.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
