-- UI Text Entries for Existing Translation System
-- This adds UI text configuration entries to the existing translation_keys and translations tables

-- Insert UI text keys into translation_keys
INSERT INTO translation_keys (key, category)
VALUES
  -- Platform branding
  ('platform.name', 'ui_text'),
  ('platform.tagline', 'ui_text'),

  -- Navigation
  ('nav.home', 'ui_text'),
  ('nav.courses', 'ui_text'),
  ('nav.dashboard', 'ui_text'),
  ('nav.profile', 'ui_text'),
  ('nav.settings', 'ui_text'),
  ('nav.logout', 'ui_text'),

  -- Common actions
  ('common.save', 'ui_text'),
  ('common.cancel', 'ui_text'),
  ('common.delete', 'ui_text'),
  ('common.edit', 'ui_text'),
  ('common.create', 'ui_text'),
  ('common.update', 'ui_text'),
  ('common.submit', 'ui_text'),
  ('common.loading', 'ui_text'),
  ('common.search', 'ui_text'),

  -- Messages
  ('message.success', 'ui_text'),
  ('message.error', 'ui_text'),
  ('message.saveSuccess', 'ui_text'),
  ('message.deleteSuccess', 'ui_text'),
  ('message.confirmDelete', 'ui_text')
ON CONFLICT (key) DO NOTHING;

-- Insert Hebrew UI text translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Platform branding
  ('he', 'platform.name', 'בית הספר להורות', 'ui_text', 'user'),
  ('he', 'platform.tagline', 'ללמוד, לצמוח, לשגשג', 'ui_text', 'user'),

  -- Navigation
  ('he', 'nav.home', 'בית', 'ui_text', 'user'),
  ('he', 'nav.courses', 'קורסים', 'ui_text', 'user'),
  ('he', 'nav.dashboard', 'לוח בקרה', 'ui_text', 'user'),
  ('he', 'nav.profile', 'פרופיל', 'ui_text', 'user'),
  ('he', 'nav.settings', 'הגדרות', 'ui_text', 'user'),
  ('he', 'nav.logout', 'התנתק', 'ui_text', 'user'),

  -- Common actions
  ('he', 'common.save', 'שמור', 'ui_text', 'user'),
  ('he', 'common.cancel', 'ביטול', 'ui_text', 'user'),
  ('he', 'common.delete', 'מחק', 'ui_text', 'user'),
  ('he', 'common.edit', 'ערוך', 'ui_text', 'user'),
  ('he', 'common.create', 'צור', 'ui_text', 'user'),
  ('he', 'common.update', 'עדכן', 'ui_text', 'user'),
  ('he', 'common.submit', 'שלח', 'ui_text', 'user'),
  ('he', 'common.loading', 'טוען...', 'ui_text', 'user'),
  ('he', 'common.search', 'חיפוש', 'ui_text', 'user'),

  -- Messages
  ('he', 'message.success', 'הצלחה!', 'ui_text', 'user'),
  ('he', 'message.error', 'אירעה שגיאה', 'ui_text', 'user'),
  ('he', 'message.saveSuccess', 'השינויים נשמרו בהצלחה', 'ui_text', 'user'),
  ('he', 'message.deleteSuccess', 'נמחק בהצלחה', 'ui_text', 'user'),
  ('he', 'message.confirmDelete', 'האם אתה בטוח שברצונך למחוק את זה?', 'ui_text', 'user')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context;

-- Insert English UI text translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context)
VALUES
  -- Platform branding
  ('en', 'platform.name', 'Parenting School', 'ui_text', 'user'),
  ('en', 'platform.tagline', 'Learn, Grow, Thrive', 'ui_text', 'user'),

  -- Navigation
  ('en', 'nav.home', 'Home', 'ui_text', 'user'),
  ('en', 'nav.courses', 'Courses', 'ui_text', 'user'),
  ('en', 'nav.dashboard', 'Dashboard', 'ui_text', 'user'),
  ('en', 'nav.profile', 'Profile', 'ui_text', 'user'),
  ('en', 'nav.settings', 'Settings', 'ui_text', 'user'),
  ('en', 'nav.logout', 'Logout', 'ui_text', 'user'),

  -- Common actions
  ('en', 'common.save', 'Save', 'ui_text', 'user'),
  ('en', 'common.cancel', 'Cancel', 'ui_text', 'user'),
  ('en', 'common.delete', 'Delete', 'ui_text', 'user'),
  ('en', 'common.edit', 'Edit', 'ui_text', 'user'),
  ('en', 'common.create', 'Create', 'ui_text', 'user'),
  ('en', 'common.update', 'Update', 'ui_text', 'user'),
  ('en', 'common.submit', 'Submit', 'ui_text', 'user'),
  ('en', 'common.loading', 'Loading...', 'ui_text', 'user'),
  ('en', 'common.search', 'Search', 'ui_text', 'user'),

  -- Messages
  ('en', 'message.success', 'Success!', 'ui_text', 'user'),
  ('en', 'message.error', 'An error occurred', 'ui_text', 'user'),
  ('en', 'message.saveSuccess', 'Changes saved successfully', 'ui_text', 'user'),
  ('en', 'message.deleteSuccess', 'Deleted successfully', 'ui_text', 'user'),
  ('en', 'message.confirmDelete', 'Are you sure you want to delete this?', 'ui_text', 'user')
ON CONFLICT (language_code, translation_key) DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  category = EXCLUDED.category,
  context = EXCLUDED.context;

-- Verification query
SELECT tk.key, tk.category, t.language_code, t.translation_value
FROM translation_keys tk
LEFT JOIN translations t ON t.translation_key = tk.key
WHERE tk.category = 'ui_text'
ORDER BY tk.key, t.language_code;
