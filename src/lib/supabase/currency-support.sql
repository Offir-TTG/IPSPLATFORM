-- Add currency support to languages and platform

-- Add currency fields to languages table
ALTER TABLE public.languages
ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol TEXT DEFAULT '$',
ADD COLUMN IF NOT EXISTS currency_position TEXT DEFAULT 'before' CHECK (currency_position IN ('before', 'after'));

-- Update existing languages with appropriate currencies
UPDATE public.languages SET currency_code = 'ILS', currency_symbol = '₪', currency_position = 'before' WHERE code = 'he';
UPDATE public.languages SET currency_code = 'USD', currency_symbol = '$', currency_position = 'before' WHERE code = 'en';

-- Create currencies table for reference
CREATE TABLE IF NOT EXISTS public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_digits INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed common currencies
INSERT INTO public.currencies (code, name, symbol, decimal_digits) VALUES
  ('USD', 'US Dollar', '$', 2),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 2),
  ('ILS', 'Israeli Shekel', '₪', 2),
  ('JPY', 'Japanese Yen', '¥', 0),
  ('CNY', 'Chinese Yuan', '¥', 2),
  ('CAD', 'Canadian Dollar', 'CA$', 2),
  ('AUD', 'Australian Dollar', 'A$', 2),
  ('CHF', 'Swiss Franc', 'CHF', 2),
  ('INR', 'Indian Rupee', '₹', 2),
  ('BRL', 'Brazilian Real', 'R$', 2),
  ('RUB', 'Russian Ruble', '₽', 2),
  ('KRW', 'South Korean Won', '₩', 0),
  ('MXN', 'Mexican Peso', '$', 2),
  ('ZAR', 'South African Rand', 'R', 2),
  ('SGD', 'Singapore Dollar', 'S$', 2),
  ('HKD', 'Hong Kong Dollar', 'HK$', 2),
  ('NOK', 'Norwegian Krone', 'kr', 2),
  ('SEK', 'Swedish Krona', 'kr', 2),
  ('DKK', 'Danish Krone', 'kr', 2),
  ('PLN', 'Polish Zloty', 'zł', 2),
  ('THB', 'Thai Baht', '฿', 2),
  ('IDR', 'Indonesian Rupiah', 'Rp', 2),
  ('HUF', 'Hungarian Forint', 'Ft', 0),
  ('CZK', 'Czech Koruna', 'Kč', 2),
  ('IQD', 'Iraqi Dinar', 'ع.د', 3),
  ('AED', 'UAE Dirham', 'د.إ', 2),
  ('SAR', 'Saudi Riyal', '﷼', 2),
  ('EGP', 'Egyptian Pound', 'E£', 2),
  ('TRY', 'Turkish Lira', '₺', 2)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS for currencies
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- Everyone can view currencies
CREATE POLICY "Everyone can view currencies" ON public.currencies
  FOR SELECT
  USING (is_active = true);

-- Admins can manage currencies
CREATE POLICY "Admins can manage currencies" ON public.currencies
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Add platform-wide currency setting
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, category, label, description, is_public)
VALUES
  ('platform.currency.default', '"ILS"', 'string', 'business', 'Default Currency', 'Platform default currency code', true),
  ('platform.currency.display', '"symbol"', 'string', 'business', 'Currency Display', 'Show symbol or code', true),
  ('platform.currency.supported', '["ILS", "USD", "EUR"]', 'json', 'business', 'Supported Currencies', 'List of currencies users can choose from', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Add translations for currency labels
INSERT INTO public.translation_keys (key, category, description) VALUES
  ('admin.languages.currency', 'admin', 'Currency label'),
  ('admin.languages.form.currency', 'admin', 'Currency field label'),
  ('admin.languages.form.currencyHint', 'admin', 'Currency field hint')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  ('he', 'admin.languages.currency', 'מטבע', 'admin'),
  ('he', 'admin.languages.form.currency', 'מטבע', 'admin'),
  ('he', 'admin.languages.form.currencyHint', 'מטבע ברירת מחדל עבור שפה זו', 'admin'),
  ('en', 'admin.languages.currency', 'Currency', 'admin'),
  ('en', 'admin.languages.form.currency', 'Currency', 'admin'),
  ('en', 'admin.languages.form.currencyHint', 'Default currency for this language', 'admin')
ON CONFLICT (language_code, translation_key) DO NOTHING;
