-- One "Settings" link in the admin menu, opening the new Settings page
-- (/admin/settings), where every settings screen is a card.
--
-- 1. Under "Configuration" (admin.nav.configuration), the ten settings links
--    are hidden: Organization, Languages, Translations, Settings (platform),
--    Theme, Features, Integrations, Navigation, Emails and Crons. They're
--    hidden, not deleted, so Navigation can show them again.
-- 2. A "Settings" link (admin.nav.settings_hub) is added first in that section.
-- 3. The wording of the menu link and the Settings page, in he + en.
--
-- RUN AFTER DEPLOYING the code with the new /admin/settings page, or the
-- live admin links to the old page. Safe to run more than once.

DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT tenant_id, id AS config_id FROM navigation_items
    WHERE translation_key = 'admin.nav.configuration' AND parent_id IS NULL
  LOOP
    -- Hide the settings links (Translations is nested under Languages).
    UPDATE navigation_items SET is_active = false, updated_at = NOW()
    WHERE tenant_id = t.tenant_id
      AND href IN (
        '/admin/settings/organization', '/admin/config/languages',
        '/admin/config/translations', '/admin/config/settings',
        '/admin/settings/theme', '/admin/config/features',
        '/admin/config/integrations', '/admin/config/navigation',
        '/admin/emails', '/admin/crons'
      );

    CONTINUE WHEN EXISTS (
      SELECT 1 FROM navigation_items
      WHERE tenant_id = t.tenant_id AND translation_key = 'admin.nav.settings_hub'
    );
    -- First in the section: make room, then add.
    UPDATE navigation_items SET "order" = "order" + 1
    WHERE tenant_id = t.tenant_id AND parent_id = t.config_id;
    INSERT INTO navigation_items (parent_id, translation_key, icon, href, "order", roles, is_active, is_external, tenant_id)
    VALUES (t.config_id, 'admin.nav.settings_hub', 'settings', '/admin/settings', 1,
            ARRAY['admin','super_admin'], true, false, t.tenant_id);
  END LOOP;
END $$;

INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.nav.settings_hub', 'Settings'),
  ('he', 'admin.nav.settings_hub', 'הגדרות'),
  ('en', 'admin.settingsHub.title', 'Settings'),
  ('he', 'admin.settingsHub.title', 'הגדרות'),
  ('en', 'admin.settingsHub.subtitle', 'Everything that sets up the platform, in one place. Choose a card to open it.'),
  ('he', 'admin.settingsHub.subtitle', 'כל מה שמגדיר את הפלטפורמה, במקום אחד. בחרו כרטיס כדי לפתוח אותו.'),
  ('en', 'admin.settingsHub.group.organization', 'Your organization'),
  ('he', 'admin.settingsHub.group.organization', 'הארגון שלכם'),
  ('en', 'admin.settingsHub.group.language', 'Language'),
  ('he', 'admin.settingsHub.group.language', 'שפה'),
  ('en', 'admin.settingsHub.group.platform', 'Platform'),
  ('he', 'admin.settingsHub.group.platform', 'פלטפורמה'),
  ('en', 'admin.settingsHub.group.system', 'Menu, emails and system'),
  ('he', 'admin.settingsHub.group.system', 'תפריט, דוא"ל ומערכת'),
  ('en', 'admin.settingsHub.platformTitle', 'Platform settings'),
  ('he', 'admin.settingsHub.platformTitle', 'הגדרות פלטפורמה'),
  ('en', 'admin.settingsHub.organization', 'Your organization''s details and preferences'),
  ('he', 'admin.settingsHub.organization', 'פרטי הארגון וההעדפות שלו'),
  ('en', 'admin.settingsHub.theme', 'Colors, fonts and how the platform looks'),
  ('he', 'admin.settingsHub.theme', 'צבעים, גופנים ומראה הפלטפורמה'),
  ('en', 'admin.settingsHub.languages', 'Which languages the platform offers, and the default one'),
  ('he', 'admin.settingsHub.languages', 'אילו שפות הפלטפורמה מציעה, ומהי שפת ברירת המחדל'),
  ('en', 'admin.settingsHub.translations', 'The wording of every screen, in each language'),
  ('he', 'admin.settingsHub.translations', 'הנוסח של כל מסך, בכל שפה'),
  ('en', 'admin.settingsHub.platform', 'General settings that apply across the whole platform'),
  ('he', 'admin.settingsHub.platform', 'הגדרות כלליות שחלות על כל הפלטפורמה'),
  ('en', 'admin.settingsHub.features', 'Turn parts of the platform on or off'),
  ('he', 'admin.settingsHub.features', 'הפעלה וכיבוי של חלקים בפלטפורמה'),
  ('en', 'admin.settingsHub.integrations', 'Payments, signatures, video meetings and the other connected services'),
  ('he', 'admin.settingsHub.integrations', 'תשלומים, חתימות, פגישות וידאו ושאר השירותים המחוברים'),
  ('en', 'admin.settingsHub.navigation', 'The order and visibility of the side menu'),
  ('he', 'admin.settingsHub.navigation', 'הסדר והתצוגה של התפריט הצדדי'),
  ('en', 'admin.settingsHub.emails', 'Email templates, sending queue, schedules and results'),
  ('he', 'admin.settingsHub.emails', 'תבניות דוא"ל, תור השליחה, תזמונים ותוצאות'),
  ('en', 'admin.settingsHub.crons', 'The automatic jobs the platform runs, and whether they worked'),
  ('he', 'admin.settingsHub.crons', 'המשימות האוטומטיות שהפלטפורמה מריצה, והאם הצליחו')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
