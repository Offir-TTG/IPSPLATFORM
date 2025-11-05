-- Languages and Translations Schema

-- Languages table
CREATE TABLE public.languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL CHECK (length(code) = 2), -- ISO 639-1 codes (e.g., 'en', 'he', 'es')
  name TEXT NOT NULL, -- English name (e.g., 'Hebrew', 'English')
  native_name TEXT NOT NULL, -- Native name (e.g., 'עברית', 'English')
  direction TEXT NOT NULL DEFAULT 'ltr' CHECK (direction IN ('ltr', 'rtl')),
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations table
CREATE TABLE public.translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  translation_key TEXT NOT NULL, -- e.g., 'nav.home', 'auth.login.title'
  translation_value TEXT NOT NULL,
  category TEXT, -- e.g., 'nav', 'auth', 'dashboard', 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(language_code, translation_key)
);

-- Translation keys table (master list of all available keys)
CREATE TABLE public.translation_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_translations_language ON public.translations(language_code);
CREATE INDEX idx_translations_key ON public.translations(translation_key);
CREATE INDEX idx_translations_category ON public.translations(category);
CREATE INDEX idx_translation_keys_category ON public.translation_keys(category);

-- Row Level Security (RLS) Policies
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_keys ENABLE ROW LEVEL SECURITY;

-- Everyone can view active languages
CREATE POLICY "Everyone can view active languages" ON public.languages
  FOR SELECT
  USING (is_active = true);

-- Everyone can view translations for active languages
CREATE POLICY "Everyone can view translations" ON public.translations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.languages
      WHERE code = translations.language_code
      AND is_active = true
    )
  );

-- Everyone can view translation keys
CREATE POLICY "Everyone can view translation keys" ON public.translation_keys
  FOR SELECT
  USING (true);

-- Admins can manage languages
CREATE POLICY "Admins can manage languages" ON public.languages
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage translations
CREATE POLICY "Admins can manage translations" ON public.translations
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can manage translation keys
CREATE POLICY "Admins can manage translation keys" ON public.translation_keys
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers for updated_at
CREATE TRIGGER update_languages_updated_at BEFORE UPDATE ON public.languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_translations_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default languages
INSERT INTO public.languages (code, name, native_name, direction, is_active, is_default) VALUES
  ('he', 'Hebrew', 'עברית', 'rtl', true, true),
  ('en', 'English', 'English', 'ltr', true, false);

-- Insert translation keys from existing translations
INSERT INTO public.translation_keys (key, category, description) VALUES
  -- Navigation
  ('nav.home', 'nav', 'Home page link'),
  ('nav.programs', 'nav', 'Programs page link'),
  ('nav.courses', 'nav', 'Courses page link'),
  ('nav.about', 'nav', 'About page link'),
  ('nav.contact', 'nav', 'Contact page link'),
  ('nav.login', 'nav', 'Login link'),
  ('nav.signup', 'nav', 'Sign up link'),
  ('nav.dashboard', 'nav', 'Dashboard link'),
  ('nav.settings', 'nav', 'Settings link'),
  ('nav.logout', 'nav', 'Logout link'),

  -- Homepage
  ('home.hero.title', 'home', 'Hero section title'),
  ('home.hero.subtitle', 'home', 'Hero section subtitle'),
  ('home.hero.cta', 'home', 'Call to action button'),
  ('home.hero.learnMore', 'home', 'Learn more button'),
  ('home.features.title', 'home', 'Features section title'),
  ('home.features.live', 'home', 'Live classes feature title'),
  ('home.features.liveDesc', 'home', 'Live classes feature description'),
  ('home.features.recordings', 'home', 'Recordings feature title'),
  ('home.features.recordingsDesc', 'home', 'Recordings feature description'),
  ('home.features.resources', 'home', 'Resources feature title'),
  ('home.features.resourcesDesc', 'home', 'Resources feature description'),
  ('home.features.community', 'home', 'Community feature title'),
  ('home.features.communityDesc', 'home', 'Community feature description'),

  -- Auth - Login
  ('auth.login.title', 'auth', 'Login page title'),
  ('auth.login.welcome', 'auth', 'Login welcome message'),
  ('auth.login.email', 'auth', 'Email field label'),
  ('auth.login.password', 'auth', 'Password field label'),
  ('auth.login.forgotPassword', 'auth', 'Forgot password link'),
  ('auth.login.button', 'auth', 'Login button text'),
  ('auth.login.noAccount', 'auth', 'No account message'),
  ('auth.login.signupLink', 'auth', 'Sign up link text'),

  -- Auth - Signup
  ('auth.signup.title', 'auth', 'Signup page title'),
  ('auth.signup.subtitle', 'auth', 'Signup page subtitle'),
  ('auth.signup.firstName', 'auth', 'First name field label'),
  ('auth.signup.lastName', 'auth', 'Last name field label'),
  ('auth.signup.email', 'auth', 'Email field label'),
  ('auth.signup.phone', 'auth', 'Phone field label'),
  ('auth.signup.password', 'auth', 'Password field label'),
  ('auth.signup.confirmPassword', 'auth', 'Confirm password field label'),
  ('auth.signup.passwordHint', 'auth', 'Password requirement hint'),
  ('auth.signup.button', 'auth', 'Signup button text'),
  ('auth.signup.creating', 'auth', 'Creating account message'),
  ('auth.signup.haveAccount', 'auth', 'Have account message'),
  ('auth.signup.loginLink', 'auth', 'Login link text'),

  -- Common
  ('common.loading', 'common', 'Loading message'),
  ('common.save', 'common', 'Save button'),
  ('common.cancel', 'common', 'Cancel button'),
  ('common.delete', 'common', 'Delete button'),
  ('common.edit', 'common', 'Edit button'),
  ('common.view', 'common', 'View button'),
  ('common.search', 'common', 'Search placeholder'),
  ('common.filter', 'common', 'Filter button'),
  ('common.sort', 'common', 'Sort button'),
  ('common.actions', 'common', 'Actions column'),
  ('common.status', 'common', 'Status label'),
  ('common.date', 'common', 'Date label'),
  ('common.time', 'common', 'Time label'),
  ('common.language', 'common', 'Language label');
