-- Export all English translations that need Spanish translation
-- This will show you what needs to be translated to Spanish

SELECT
  tk.key,
  tk.category,
  tk.description,
  tk.context,
  en.translation_value as english_text
FROM translation_keys tk
LEFT JOIN translations en ON tk.key = en.translation_key AND en.language_code = 'en'
LEFT JOIN translations es ON tk.key = es.translation_key AND es.language_code = 'es'
WHERE es.translation_value IS NULL  -- Only keys without Spanish translation
  AND en.translation_value IS NOT NULL  -- That have English translation
ORDER BY tk.category, tk.key;

-- To export as CSV for translation, you can run:
-- \copy (SELECT tk.key, tk.category, en.translation_value as english_text FROM translation_keys tk LEFT JOIN translations en ON tk.key = en.translation_key AND en.language_code = 'en' LEFT JOIN translations es ON tk.key = es.translation_key AND es.language_code = 'es' WHERE es.translation_value IS NULL AND en.translation_value IS NOT NULL ORDER BY tk.category, tk.key) TO 'translations-to-spanish.csv' WITH CSV HEADER;
