-- Course materials panel (upload side panel, category cards, list), in he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'lms.materials.upload_success', 'Material uploaded successfully'),
  ('he', 'lms.materials.upload_success', U&'\05D4\05E7\05D5\05D1\05E5 \05D4\05D5\05E2\05DC\05D4'),
  ('en', 'lms.materials.upload_failed', 'Failed to upload material'),
  ('he', 'lms.materials.upload_failed', U&'\05D4\05E2\05DC\05D0\05EA \05D4\05E7\05D5\05D1\05E5 \05E0\05DB\05E9\05DC\05D4'),
  ('en', 'lms.materials.delete_success', 'Material deleted successfully'),
  ('he', 'lms.materials.delete_success', U&'\05D4\05E7\05D5\05D1\05E5 \05E0\05DE\05D7\05E7'),
  ('en', 'lms.materials.delete_failed', 'Failed to delete material'),
  ('he', 'lms.materials.delete_failed', U&'\05DE\05D7\05D9\05E7\05EA \05D4\05E7\05D5\05D1\05E5 \05E0\05DB\05E9\05DC\05D4'),
  ('en', 'lms.materials.upload_button', 'Upload Material'),
  ('he', 'lms.materials.upload_button', U&'\05D4\05E2\05DC\05D0\05EA \05E7\05D5\05D1\05E5'),
  ('en', 'lms.materials.deleteNamed', 'Delete "{title}"? This cannot be undone.'),
  ('he', 'lms.materials.deleteNamed', U&'\05DC\05DE\05D7\05D5\05E7 \05D0\05EA "{title}"? \05D0\05D9 \05D0\05E4\05E9\05E8 \05DC\05D1\05D8\05DC \05D0\05EA \05D4\05E4\05E2\05D5\05DC\05D4.'),
  ('en', 'lms.materials.no_materials', 'No materials uploaded yet. Click "Upload Material" to add course materials for students.'),
  ('he', 'lms.materials.no_materials', U&'\05E2\05D5\05D3 \05DC\05D0 \05D4\05D5\05E2\05DC\05D5 \05D7\05D5\05DE\05E8\05D9\05DD. \05DC\05D5\05D7\05E6\05D9\05DD "\05D4\05E2\05DC\05D0\05EA \05E7\05D5\05D1\05E5" \05DB\05D3\05D9 \05DC\05D4\05D5\05E1\05D9\05E3 \05D7\05D5\05DE\05E8\05D9\05DD \05DC\05EA\05DC\05DE\05D9\05D3\05D9\05DD.'),
  ('en', 'lms.materials.download', 'Download'),
  ('he', 'lms.materials.download', U&'\05D4\05D5\05E8\05D3\05D4'),
  ('en', 'lms.materials.upload_dialog_title', 'Upload Course Material'),
  ('he', 'lms.materials.upload_dialog_title', U&'\05D4\05E2\05DC\05D0\05EA \05D7\05D5\05DE\05E8 \05DC\05E7\05D5\05E8\05E1'),
  ('en', 'lms.materials.upload_dialog_desc', 'Upload PDFs, documents, videos, or other files for your students'),
  ('he', 'lms.materials.upload_dialog_desc', U&'\05E7\05D1\05E6\05D9 PDF, \05DE\05E1\05DE\05DB\05D9\05DD, \05E1\05E8\05D8\05D5\05E0\05D9\05DD \05D0\05D5 \05E7\05D1\05E6\05D9\05DD \05D0\05D7\05E8\05D9\05DD \05DC\05EA\05DC\05DE\05D9\05D3\05D9\05DD'),
  ('en', 'lms.materials.uploading', 'Uploading...'),
  ('he', 'lms.materials.uploading', U&'\05DE\05E2\05DC\05D9\05DD...'),
  ('en', 'lms.materials.replace_file', 'Replace'),
  ('he', 'lms.materials.replace_file', U&'\05D4\05D7\05DC\05E4\05D4'),
  ('en', 'lms.materials.remove_file', 'Remove the file'),
  ('he', 'lms.materials.remove_file', U&'\05D4\05E1\05E8\05EA \05D4\05E7\05D5\05D1\05E5'),
  ('en', 'lms.materials.drop_title', 'Choose a file or drag it here'),
  ('he', 'lms.materials.drop_title', U&'\05D1\05D5\05D7\05E8\05D9\05DD \05E7\05D5\05D1\05E5 \05D0\05D5 \05D2\05D5\05E8\05E8\05D9\05DD \05D0\05D5\05EA\05D5 \05DC\05DB\05D0\05DF'),
  ('en', 'lms.materials.drop_hint', 'PDF, Word, Excel, PowerPoint, images, video, audio or ZIP'),
  ('he', 'lms.materials.drop_hint', U&'PDF, Word, Excel, PowerPoint, \05EA\05DE\05D5\05E0\05D5\05EA, \05D5\05D9\05D3\05D0\05D5, \05E9\05DE\05E2 \05D0\05D5 ZIP'),
  ('en', 'lms.materials.title_label', 'Title'),
  ('he', 'lms.materials.title_label', U&'\05E9\05DD \05D4\05E7\05D5\05D1\05E5'),
  ('en', 'lms.materials.title_placeholder', 'e.g., Course Syllabus'),
  ('he', 'lms.materials.title_placeholder', U&'\05DC\05DE\05E9\05DC: \05E1\05D9\05DC\05D1\05D5\05E1 \05D4\05E7\05D5\05E8\05E1'),
  ('en', 'lms.materials.category_label', 'Category'),
  ('he', 'lms.materials.category_label', U&'\05E1\05D5\05D2'),
  ('en', 'lms.materials.description_label', 'Description (Optional)'),
  ('he', 'lms.materials.description_label', U&'\05EA\05D9\05D0\05D5\05E8 (\05DC\05D0 \05D7\05D5\05D1\05D4)'),
  ('en', 'lms.materials.description_placeholder', 'Brief description of this material...'),
  ('he', 'lms.materials.description_placeholder', U&'\05EA\05D9\05D0\05D5\05E8 \05E7\05E6\05E8 \05E9\05DC \05D4\05E7\05D5\05D1\05E5...'),
  ('en', 'lms.materials.publish_label', 'Publish immediately'),
  ('he', 'lms.materials.publish_label', U&'\05E4\05E8\05E1\05D5\05DD \05DE\05D9\05D3'),
  ('en', 'lms.materials.publish_hint', 'Off = only admins see it until you publish'),
  ('he', 'lms.materials.publish_hint', U&'\05DB\05D1\05D5\05D9 = \05E8\05E7 \05DE\05E0\05D4\05DC\05D9\05DD \05E8\05D5\05D0\05D9\05DD \05D0\05D5\05EA\05D5 \05E2\05D3 \05D4\05E4\05E8\05E1\05D5\05DD'),
  ('en', 'lms.materials.category_syllabus', 'Syllabus'),
  ('he', 'lms.materials.category_syllabus', U&'\05E1\05D9\05DC\05D1\05D5\05E1'),
  ('en', 'lms.materials.category_reading', 'Reading'),
  ('he', 'lms.materials.category_reading', U&'\05E7\05E8\05D9\05D0\05D4'),
  ('en', 'lms.materials.category_assignment', 'Assignment'),
  ('he', 'lms.materials.category_assignment', U&'\05DE\05D8\05DC\05D4'),
  ('en', 'lms.materials.category_reference', 'Reference'),
  ('he', 'lms.materials.category_reference', U&'\05E2\05D6\05E8'),
  ('en', 'lms.materials.category_other', 'Other'),
  ('he', 'lms.materials.category_other', U&'\05D0\05D7\05E8')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
