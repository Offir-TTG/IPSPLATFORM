-- Automatic reminders list: the on/off switch on each row.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.reminders.switch.confirmOn', 'Turn on "{name}"? From now on, every new case starts it.'),
  ('he', 'admin.reminders.switch.confirmOn', U&'\05DC\05D4\05E4\05E2\05D9\05DC \05D0\05EA "{name}"? \05DE\05E2\05DB\05E9\05D9\05D5, \05DB\05DC \05DE\05E7\05E8\05D4 \05D7\05D3\05E9 \05D9\05EA\05D7\05D9\05DC \05D0\05D5\05EA\05D4.'),
  ('en', 'admin.reminders.switch.off', 'The reminder is off'),
  ('he', 'admin.reminders.switch.off', U&'\05D4\05EA\05D6\05DB\05D5\05E8\05EA \05DB\05D5\05D1\05EA\05D4'),
  ('en', 'admin.reminders.switch.turnOn', 'Turn on'),
  ('he', 'admin.reminders.switch.turnOn', U&'\05D4\05E4\05E2\05DC\05D4'),
  ('en', 'admin.reminders.switch.turnOff', 'Turn off'),
  ('he', 'admin.reminders.switch.turnOff', U&'\05DB\05D9\05D1\05D5\05D9')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
