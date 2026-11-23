-- Attendance tab: one switch (one meeting / all meetings / summary), saving on each change.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.attendanceTab.modeMeeting', 'One meeting'),
  ('he', 'admin.attendanceTab.modeMeeting', U&'\05DE\05E4\05D2\05E9'),
  ('en', 'admin.attendanceTab.modeAll', 'All meetings'),
  ('he', 'admin.attendanceTab.modeAll', U&'\05DB\05DC \05D4\05DE\05E4\05D2\05E9\05D9\05DD'),
  ('en', 'admin.attendanceTab.rule', 'Late counts as present · Excused does not count as absent'),
  ('he', 'admin.attendanceTab.rule', U&'\05D0\05D9\05D7\05D5\05E8 \05E0\05E1\05E4\05E8 \05DB\05E0\05D5\05DB\05D7\05D5\05EA \00B7 \05DE\05D5\05E6\05D3\05E7 \05DC\05D0 \05E0\05E1\05E4\05E8 \05DB\05D4\05D9\05E2\05D3\05E8\05D5\05EA'),
  ('en', 'admin.attendanceTab.savedTick', 'Saved ✓'),
  ('he', 'admin.attendanceTab.savedTick', U&'\05E0\05E9\05DE\05E8 \2713'),
  ('en', 'admin.attendanceTab.fillColumnRest', 'The rest: present'),
  ('he', 'admin.attendanceTab.fillColumnRest', U&'\05D4\05E9\05D0\05E8 \05E0\05D5\05DB\05D7\05D9\05DD'),
  ('en', 'admin.attendanceTab.countsLabel', 'This meeting'),
  ('he', 'admin.attendanceTab.countsLabel', U&'\05D1\05DE\05E4\05D2\05E9 \05D4\05D6\05D4')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
