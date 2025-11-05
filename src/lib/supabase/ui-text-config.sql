-- UI Text Configuration System
-- Allows admins to customize all UI text through the admin panel

-- Create table for UI text entries
CREATE TABLE IF NOT EXISTS ui_text_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  default_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for UI text translations (per language)
CREATE TABLE IF NOT EXISTS ui_text_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_key TEXT NOT NULL REFERENCES ui_text_config(key) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(text_key, language_code)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ui_text_config_category ON ui_text_config(category);
CREATE INDEX IF NOT EXISTS idx_ui_text_config_key ON ui_text_config(key);
CREATE INDEX IF NOT EXISTS idx_ui_text_values_text_key ON ui_text_values(text_key);
CREATE INDEX IF NOT EXISTS idx_ui_text_values_language ON ui_text_values(language_code);

-- Enable RLS
ALTER TABLE ui_text_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ui_text_values ENABLE ROW LEVEL SECURITY;

-- Policies for ui_text_config
CREATE POLICY "Anyone can read UI text config"
  ON ui_text_config FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify UI text config"
  ON ui_text_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policies for ui_text_values
CREATE POLICY "Anyone can read UI text values"
  ON ui_text_values FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify UI text values"
  ON ui_text_values FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default UI text configurations
INSERT INTO ui_text_config (key, category, default_value, description)
VALUES
  -- Platform branding
  ('platform.name', 'branding', 'Parenting School', 'Main platform name displayed throughout the application'),
  ('platform.tagline', 'branding', 'Learn, Grow, Thrive', 'Platform tagline or slogan'),

  -- Navigation
  ('nav.home', 'navigation', 'Home', 'Home navigation link'),
  ('nav.courses', 'navigation', 'Courses', 'Courses navigation link'),
  ('nav.dashboard', 'navigation', 'Dashboard', 'Dashboard navigation link'),
  ('nav.profile', 'navigation', 'Profile', 'Profile navigation link'),
  ('nav.settings', 'navigation', 'Settings', 'Settings navigation link'),
  ('nav.logout', 'navigation', 'Logout', 'Logout button text'),

  -- Common actions
  ('common.save', 'actions', 'Save', 'Save button text'),
  ('common.cancel', 'actions', 'Cancel', 'Cancel button text'),
  ('common.delete', 'actions', 'Delete', 'Delete button text'),
  ('common.edit', 'actions', 'Edit', 'Edit button text'),
  ('common.create', 'actions', 'Create', 'Create button text'),
  ('common.update', 'actions', 'Update', 'Update button text'),
  ('common.submit', 'actions', 'Submit', 'Submit button text'),
  ('common.loading', 'actions', 'Loading...', 'Loading state text'),
  ('common.search', 'actions', 'Search', 'Search input placeholder'),

  -- Messages
  ('message.success', 'messages', 'Success!', 'Generic success message'),
  ('message.error', 'messages', 'An error occurred', 'Generic error message'),
  ('message.saveSuccess', 'messages', 'Changes saved successfully', 'Save success message'),
  ('message.deleteSuccess', 'messages', 'Deleted successfully', 'Delete success message'),
  ('message.confirmDelete', 'messages', 'Are you sure you want to delete this?', 'Delete confirmation message'),

  -- Authentication
  ('auth.login.title', 'authentication', 'Login', 'Login page title'),
  ('auth.login.welcome', 'authentication', 'Welcome back', 'Login welcome message'),
  ('auth.signup.title', 'authentication', 'Sign Up', 'Signup page title'),
  ('auth.logout.confirm', 'authentication', 'Are you sure you want to logout?', 'Logout confirmation message')
ON CONFLICT (key) DO NOTHING;

-- Insert default Hebrew translations
INSERT INTO ui_text_values (text_key, language_code, value)
VALUES
  -- Platform branding
  ('platform.name', 'he', 'בית הספר להורות'),
  ('platform.tagline', 'he', 'ללמוד, לצמוח, לשגשג'),

  -- Navigation
  ('nav.home', 'he', 'בית'),
  ('nav.courses', 'he', 'קורסים'),
  ('nav.dashboard', 'he', 'לוח בקרה'),
  ('nav.profile', 'he', 'פרופיל'),
  ('nav.settings', 'he', 'הגדרות'),
  ('nav.logout', 'he', 'התנתק'),

  -- Common actions
  ('common.save', 'he', 'שמור'),
  ('common.cancel', 'he', 'ביטול'),
  ('common.delete', 'he', 'מחק'),
  ('common.edit', 'he', 'ערוך'),
  ('common.create', 'he', 'צור'),
  ('common.update', 'he', 'עדכן'),
  ('common.submit', 'he', 'שלח'),
  ('common.loading', 'he', 'טוען...'),
  ('common.search', 'he', 'חיפוש'),

  -- Messages
  ('message.success', 'he', 'הצלחה!'),
  ('message.error', 'he', 'אירעה שגיאה'),
  ('message.saveSuccess', 'he', 'השינויים נשמרו בהצלחה'),
  ('message.deleteSuccess', 'he', 'נמחק בהצלחה'),
  ('message.confirmDelete', 'he', 'האם אתה בטוח שברצונך למחוק את זה?'),

  -- Authentication
  ('auth.login.title', 'he', 'התחברות'),
  ('auth.login.welcome', 'he', 'ברוכים הבאים בחזרה'),
  ('auth.signup.title', 'he', 'הרשמה'),
  ('auth.logout.confirm', 'he', 'האם אתה בטוח שברצונך להתנתק?')
ON CONFLICT (text_key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Insert default English translations
INSERT INTO ui_text_values (text_key, language_code, value)
VALUES
  -- Platform branding
  ('platform.name', 'en', 'Parenting School'),
  ('platform.tagline', 'en', 'Learn, Grow, Thrive'),

  -- Navigation
  ('nav.home', 'en', 'Home'),
  ('nav.courses', 'en', 'Courses'),
  ('nav.dashboard', 'en', 'Dashboard'),
  ('nav.profile', 'en', 'Profile'),
  ('nav.settings', 'en', 'Settings'),
  ('nav.logout', 'en', 'Logout'),

  -- Common actions
  ('common.save', 'en', 'Save'),
  ('common.cancel', 'en', 'Cancel'),
  ('common.delete', 'en', 'Delete'),
  ('common.edit', 'en', 'Edit'),
  ('common.create', 'en', 'Create'),
  ('common.update', 'en', 'Update'),
  ('common.submit', 'en', 'Submit'),
  ('common.loading', 'en', 'Loading...'),
  ('common.search', 'en', 'Search'),

  -- Messages
  ('message.success', 'en', 'Success!'),
  ('message.error', 'en', 'An error occurred'),
  ('message.saveSuccess', 'en', 'Changes saved successfully'),
  ('message.deleteSuccess', 'en', 'Deleted successfully'),
  ('message.confirmDelete', 'en', 'Are you sure you want to delete this?'),

  -- Authentication
  ('auth.login.title', 'en', 'Login'),
  ('auth.login.welcome', 'en', 'Welcome back'),
  ('auth.signup.title', 'en', 'Sign Up'),
  ('auth.logout.confirm', 'en', 'Are you sure you want to logout?')
ON CONFLICT (text_key, language_code) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create function to get UI text for a language
CREATE OR REPLACE FUNCTION get_ui_text(p_language_code TEXT DEFAULT 'en')
RETURNS TABLE (
  key TEXT,
  value TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.key,
    COALESCE(v.value, c.default_value) as value,
    c.category
  FROM ui_text_config c
  LEFT JOIN ui_text_values v ON v.text_key = c.key AND v.language_code = p_language_code
  ORDER BY c.category, c.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification query
SELECT * FROM ui_text_config ORDER BY category, key;
SELECT * FROM ui_text_values WHERE language_code IN ('he', 'en') ORDER BY text_key, language_code;
