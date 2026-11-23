-- The 'student' role is shown as "Client" / "לקוח": it covers parents and students
-- alike (everyone reaches what they enrolled in). On screen only; the database and
-- code keep the value 'student'. Updates the role labels, global and per school.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Safe to rerun.
UPDATE translations
SET translation_value = CASE language_code WHEN 'he' THEN U&'\05DC\05E7\05D5\05D7' ELSE 'Client' END,
    updated_at = NOW()
WHERE translation_key IN (
  'admin.users.roles.student',
  'admin.users.drawer.role.student',
  'admin.users.filters.role_student',
  'admin.users.role_student',
  'triggers.role.student',
  'user.profile.role.student'
)
AND language_code IN ('he', 'en');
