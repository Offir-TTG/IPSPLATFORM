-- Check if Send Enrollment Link translations exist
SELECT 
  language_code,
  translation_key,
  translation_value,
  context
FROM translations
WHERE translation_key LIKE 'admin.enrollments.sendLink%'
ORDER BY language_code, translation_key;
