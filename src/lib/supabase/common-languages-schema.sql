-- Common Languages Reference Table
-- This table stores a reference of common world languages with all their details
-- Users can select from this list when adding a new language to their platform

CREATE TABLE IF NOT EXISTS common_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(2) NOT NULL UNIQUE, -- ISO 639-1 code
  name VARCHAR(100) NOT NULL, -- English name
  native_name VARCHAR(100) NOT NULL, -- Native name
  direction VARCHAR(3) NOT NULL DEFAULT 'ltr', -- 'ltr' or 'rtl'
  currency_code VARCHAR(3), -- ISO 4217 currency code
  currency_symbol VARCHAR(10),
  currency_position VARCHAR(10) DEFAULT 'before', -- 'before' or 'after'
  timezone VARCHAR(100), -- Common timezone for this language
  is_popular BOOLEAN DEFAULT false, -- Mark popular languages for easier access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_common_languages_code ON common_languages(code);
CREATE INDEX IF NOT EXISTS idx_common_languages_popular ON common_languages(is_popular);

-- Enable RLS
ALTER TABLE common_languages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read common languages (they're reference data)
CREATE POLICY "Common languages are publicly readable"
  ON common_languages
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can modify common languages
CREATE POLICY "Only admins can modify common languages"
  ON common_languages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Seed data with most common world languages
INSERT INTO common_languages (code, name, native_name, direction, currency_code, currency_symbol, currency_position, timezone, is_popular)
VALUES
  -- Most popular languages (marked for quick access)
  ('en', 'English', 'English', 'ltr', 'USD', '$', 'before', 'America/New_York', true),
  ('es', 'Spanish', 'Español', 'ltr', 'EUR', '€', 'before', 'Europe/Madrid', true),
  ('zh', 'Chinese', '中文', 'ltr', 'CNY', '¥', 'before', 'Asia/Shanghai', true),
  ('hi', 'Hindi', 'हिन्दी', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', true),
  ('ar', 'Arabic', 'العربية', 'rtl', 'SAR', '﷼', 'before', 'Asia/Riyadh', true),
  ('fr', 'French', 'Français', 'ltr', 'EUR', '€', 'before', 'Europe/Paris', true),
  ('de', 'German', 'Deutsch', 'ltr', 'EUR', '€', 'before', 'Europe/Berlin', true),
  ('ja', 'Japanese', '日本語', 'ltr', 'JPY', '¥', 'before', 'Asia/Tokyo', true),
  ('pt', 'Portuguese', 'Português', 'ltr', 'EUR', '€', 'before', 'Europe/Lisbon', true),
  ('ru', 'Russian', 'Русский', 'ltr', 'RUB', '₽', 'before', 'Europe/Moscow', true),
  ('he', 'Hebrew', 'עברית', 'rtl', 'ILS', '₪', 'before', 'Asia/Jerusalem', true),
  ('it', 'Italian', 'Italiano', 'ltr', 'EUR', '€', 'before', 'Europe/Rome', true),

  -- Other common languages
  ('ko', 'Korean', '한국어', 'ltr', 'KRW', '₩', 'before', 'Asia/Seoul', false),
  ('tr', 'Turkish', 'Türkçe', 'ltr', 'TRY', '₺', 'before', 'Europe/Istanbul', false),
  ('pl', 'Polish', 'Polski', 'ltr', 'PLN', 'zł', 'after', 'Europe/Warsaw', false),
  ('nl', 'Dutch', 'Nederlands', 'ltr', 'EUR', '€', 'before', 'Europe/Amsterdam', false),
  ('sv', 'Swedish', 'Svenska', 'ltr', 'SEK', 'kr', 'after', 'Europe/Stockholm', false),
  ('da', 'Danish', 'Dansk', 'ltr', 'DKK', 'kr', 'after', 'Europe/Copenhagen', false),
  ('fi', 'Finnish', 'Suomi', 'ltr', 'EUR', '€', 'before', 'Europe/Helsinki', false),
  ('no', 'Norwegian', 'Norsk', 'ltr', 'NOK', 'kr', 'after', 'Europe/Oslo', false),
  ('cs', 'Czech', 'Čeština', 'ltr', 'CZK', 'Kč', 'after', 'Europe/Prague', false),
  ('el', 'Greek', 'Ελληνικά', 'ltr', 'EUR', '€', 'before', 'Europe/Athens', false),
  ('th', 'Thai', 'ไทย', 'ltr', 'THB', '฿', 'before', 'Asia/Bangkok', false),
  ('vi', 'Vietnamese', 'Tiếng Việt', 'ltr', 'VND', '₫', 'after', 'Asia/Ho_Chi_Minh', false),
  ('id', 'Indonesian', 'Bahasa Indonesia', 'ltr', 'IDR', 'Rp', 'before', 'Asia/Jakarta', false),
  ('ms', 'Malay', 'Bahasa Melayu', 'ltr', 'MYR', 'RM', 'before', 'Asia/Kuala_Lumpur', false),
  ('ro', 'Romanian', 'Română', 'ltr', 'RON', 'lei', 'after', 'Europe/Bucharest', false),
  ('hu', 'Hungarian', 'Magyar', 'ltr', 'HUF', 'Ft', 'after', 'Europe/Budapest', false),
  ('uk', 'Ukrainian', 'Українська', 'ltr', 'UAH', '₴', 'before', 'Europe/Kiev', false),
  ('bg', 'Bulgarian', 'Български', 'ltr', 'BGN', 'лв', 'after', 'Europe/Sofia', false),
  ('hr', 'Croatian', 'Hrvatski', 'ltr', 'EUR', '€', 'before', 'Europe/Zagreb', false),
  ('sk', 'Slovak', 'Slovenčina', 'ltr', 'EUR', '€', 'before', 'Europe/Bratislava', false),
  ('sl', 'Slovenian', 'Slovenščina', 'ltr', 'EUR', '€', 'before', 'Europe/Ljubljana', false),
  ('lt', 'Lithuanian', 'Lietuvių', 'ltr', 'EUR', '€', 'before', 'Europe/Vilnius', false),
  ('lv', 'Latvian', 'Latviešu', 'ltr', 'EUR', '€', 'before', 'Europe/Riga', false),
  ('et', 'Estonian', 'Eesti', 'ltr', 'EUR', '€', 'before', 'Europe/Tallinn', false),
  ('fa', 'Persian', 'فارسی', 'rtl', 'IRR', '﷼', 'before', 'Asia/Tehran', false),
  ('ur', 'Urdu', 'اردو', 'rtl', 'PKR', '₨', 'before', 'Asia/Karachi', false),
  ('bn', 'Bengali', 'বাংলা', 'ltr', 'BDT', '৳', 'before', 'Asia/Dhaka', false),
  ('ta', 'Tamil', 'தமிழ்', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('te', 'Telugu', 'తెలుగు', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('mr', 'Marathi', 'मराठी', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('kn', 'Kannada', 'ಕನ್ನಡ', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('ml', 'Malayalam', 'മലയാളം', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('gu', 'Gujarati', 'ગુજરાતી', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('pa', 'Punjabi', 'ਪੰਜਾਬੀ', 'ltr', 'INR', '₹', 'before', 'Asia/Kolkata', false),
  ('sw', 'Swahili', 'Kiswahili', 'ltr', 'KES', 'KSh', 'before', 'Africa/Nairobi', false),
  ('af', 'Afrikaans', 'Afrikaans', 'ltr', 'ZAR', 'R', 'before', 'Africa/Johannesburg', false),
  ('ca', 'Catalan', 'Català', 'ltr', 'EUR', '€', 'before', 'Europe/Madrid', false),
  ('eu', 'Basque', 'Euskara', 'ltr', 'EUR', '€', 'before', 'Europe/Madrid', false),
  ('gl', 'Galician', 'Galego', 'ltr', 'EUR', '€', 'before', 'Europe/Madrid', false)
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE common_languages IS 'Reference table of common world languages with their default settings';
COMMENT ON COLUMN common_languages.is_popular IS 'Popular languages appear first in selection dropdowns';
