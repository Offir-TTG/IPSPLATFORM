-- Seed Data for Parenting School Platform
-- Run this after creating all tables

-- ============================================================================
-- 1. SEED HEBREW TRANSLATIONS
-- ============================================================================

INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  -- Navigation
  ('he', 'nav.home', 'דף הבית', 'nav'),
  ('he', 'nav.programs', 'תוכניות', 'nav'),
  ('he', 'nav.courses', 'קורסים', 'nav'),
  ('he', 'nav.about', 'אודות', 'nav'),
  ('he', 'nav.contact', 'צור קשר', 'nav'),
  ('he', 'nav.login', 'התחברות', 'nav'),
  ('he', 'nav.signup', 'הרשמה', 'nav'),
  ('he', 'nav.dashboard', 'לוח בקרה', 'nav'),
  ('he', 'nav.settings', 'הגדרות', 'nav'),
  ('he', 'nav.logout', 'התנתקות', 'nav'),

  -- Homepage
  ('he', 'home.hero.title', 'ברוכים הבאים לבית הספר להורות', 'home'),
  ('he', 'home.hero.subtitle', 'למד, גדל והתפתח עם קורסים מקוונים מומחים', 'home'),
  ('he', 'home.hero.cta', 'התחל עכשיו', 'home'),
  ('he', 'home.hero.learnMore', 'למד עוד', 'home'),
  ('he', 'home.features.title', 'מה אנחנו מציעים', 'home'),
  ('he', 'home.features.live', 'שיעורים חיים', 'home'),
  ('he', 'home.features.liveDesc', 'השתתף בשיעורים חיים עם מדריכים מומחים', 'home'),
  ('he', 'home.features.recordings', 'הקלטות', 'home'),
  ('he', 'home.features.recordingsDesc', 'גישה להקלטות שיעורים בכל עת', 'home'),
  ('he', 'home.features.resources', 'משאבים', 'home'),
  ('he', 'home.features.resourcesDesc', 'חומרי למידה ומשאבים מקיפים', 'home'),
  ('he', 'home.features.community', 'קהילה', 'home'),
  ('he', 'home.features.communityDesc', 'התחבר עם הורים אחרים ושתף חוויות', 'home'),

  -- Auth - Login
  ('he', 'auth.login.title', 'התחברות לחשבון', 'auth'),
  ('he', 'auth.login.welcome', 'ברוכים השבים! אנא התחבר לחשבונך', 'auth'),
  ('he', 'auth.login.email', 'כתובת אימייל', 'auth'),
  ('he', 'auth.login.password', 'סיסמה', 'auth'),
  ('he', 'auth.login.forgotPassword', 'שכחת סיסמה?', 'auth'),
  ('he', 'auth.login.button', 'התחבר', 'auth'),
  ('he', 'auth.login.noAccount', 'אין לך חשבון?', 'auth'),
  ('he', 'auth.login.signupLink', 'הירשם', 'auth'),

  -- Auth - Signup
  ('he', 'auth.signup.title', 'צור חשבון', 'auth'),
  ('he', 'auth.signup.subtitle', 'התחל את מסע ההורות שלך היום', 'auth'),
  ('he', 'auth.signup.firstName', 'שם פרטי', 'auth'),
  ('he', 'auth.signup.lastName', 'שם משפחה', 'auth'),
  ('he', 'auth.signup.email', 'כתובת אימייל', 'auth'),
  ('he', 'auth.signup.phone', 'מספר טלפון (אופציונלי)', 'auth'),
  ('he', 'auth.signup.password', 'סיסמה', 'auth'),
  ('he', 'auth.signup.confirmPassword', 'אימות סיסמה', 'auth'),
  ('he', 'auth.signup.passwordHint', 'לפחות 8 תווים', 'auth'),
  ('he', 'auth.signup.button', 'צור חשבון', 'auth'),
  ('he', 'auth.signup.creating', 'יוצר חשבון...', 'auth'),
  ('he', 'auth.signup.haveAccount', 'כבר יש לך חשבון?', 'auth'),
  ('he', 'auth.signup.loginLink', 'התחבר', 'auth'),

  -- Common
  ('he', 'common.loading', 'טוען...', 'common'),
  ('he', 'common.save', 'שמור', 'common'),
  ('he', 'common.cancel', 'ביטול', 'common'),
  ('he', 'common.delete', 'מחק', 'common'),
  ('he', 'common.edit', 'ערוך', 'common'),
  ('he', 'common.view', 'צפה', 'common'),
  ('he', 'common.search', 'חיפוש', 'common'),
  ('he', 'common.filter', 'סינון', 'common'),
  ('he', 'common.sort', 'מיון', 'common'),
  ('he', 'common.actions', 'פעולות', 'common'),
  ('he', 'common.status', 'סטטוס', 'common'),
  ('he', 'common.date', 'תאריך', 'common'),
  ('he', 'common.time', 'שעה', 'common'),
  ('he', 'common.language', 'שפה', 'common');

-- ============================================================================
-- 2. SEED ENGLISH TRANSLATIONS
-- ============================================================================

INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  -- Navigation
  ('en', 'nav.home', 'Home', 'nav'),
  ('en', 'nav.programs', 'Programs', 'nav'),
  ('en', 'nav.courses', 'Courses', 'nav'),
  ('en', 'nav.about', 'About', 'nav'),
  ('en', 'nav.contact', 'Contact', 'nav'),
  ('en', 'nav.login', 'Login', 'nav'),
  ('en', 'nav.signup', 'Sign Up', 'nav'),
  ('en', 'nav.dashboard', 'Dashboard', 'nav'),
  ('en', 'nav.settings', 'Settings', 'nav'),
  ('en', 'nav.logout', 'Logout', 'nav'),

  -- Homepage
  ('en', 'home.hero.title', 'Welcome to Parenting School', 'home'),
  ('en', 'home.hero.subtitle', 'Learn, grow, and evolve with expert online courses', 'home'),
  ('en', 'home.hero.cta', 'Get Started', 'home'),
  ('en', 'home.hero.learnMore', 'Learn More', 'home'),
  ('en', 'home.features.title', 'What We Offer', 'home'),
  ('en', 'home.features.live', 'Live Classes', 'home'),
  ('en', 'home.features.liveDesc', 'Participate in live classes with expert instructors', 'home'),
  ('en', 'home.features.recordings', 'Recordings', 'home'),
  ('en', 'home.features.recordingsDesc', 'Access class recordings anytime', 'home'),
  ('en', 'home.features.resources', 'Resources', 'home'),
  ('en', 'home.features.resourcesDesc', 'Comprehensive learning materials and resources', 'home'),
  ('en', 'home.features.community', 'Community', 'home'),
  ('en', 'home.features.communityDesc', 'Connect with other parents and share experiences', 'home'),

  -- Auth - Login
  ('en', 'auth.login.title', 'Sign in to your account', 'auth'),
  ('en', 'auth.login.welcome', 'Welcome back! Please sign in to your account', 'auth'),
  ('en', 'auth.login.email', 'Email address', 'auth'),
  ('en', 'auth.login.password', 'Password', 'auth'),
  ('en', 'auth.login.forgotPassword', 'Forgot password?', 'auth'),
  ('en', 'auth.login.button', 'Sign in', 'auth'),
  ('en', 'auth.login.noAccount', "Don't have an account?", 'auth'),
  ('en', 'auth.login.signupLink', 'Sign up', 'auth'),

  -- Auth - Signup
  ('en', 'auth.signup.title', 'Create your account', 'auth'),
  ('en', 'auth.signup.subtitle', 'Start your parenting journey today', 'auth'),
  ('en', 'auth.signup.firstName', 'First name', 'auth'),
  ('en', 'auth.signup.lastName', 'Last name', 'auth'),
  ('en', 'auth.signup.email', 'Email address', 'auth'),
  ('en', 'auth.signup.phone', 'Phone number (optional)', 'auth'),
  ('en', 'auth.signup.password', 'Password', 'auth'),
  ('en', 'auth.signup.confirmPassword', 'Confirm password', 'auth'),
  ('en', 'auth.signup.passwordHint', 'At least 8 characters', 'auth'),
  ('en', 'auth.signup.button', 'Create account', 'auth'),
  ('en', 'auth.signup.creating', 'Creating account...', 'auth'),
  ('en', 'auth.signup.haveAccount', 'Already have an account?', 'auth'),
  ('en', 'auth.signup.loginLink', 'Sign in', 'auth'),

  -- Common
  ('en', 'common.loading', 'Loading...', 'common'),
  ('en', 'common.save', 'Save', 'common'),
  ('en', 'common.cancel', 'Cancel', 'common'),
  ('en', 'common.delete', 'Delete', 'common'),
  ('en', 'common.edit', 'Edit', 'common'),
  ('en', 'common.view', 'View', 'common'),
  ('en', 'common.search', 'Search', 'common'),
  ('en', 'common.filter', 'Filter', 'common'),
  ('en', 'common.sort', 'Sort', 'common'),
  ('en', 'common.actions', 'Actions', 'common'),
  ('en', 'common.status', 'Status', 'common'),
  ('en', 'common.date', 'Date', 'common'),
  ('en', 'common.time', 'Time', 'common'),
  ('en', 'common.language', 'Language', 'common');

-- ============================================================================
-- 3. SEED PLATFORM SETTINGS
-- ============================================================================

INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, category, label, description, is_public) VALUES
  ('platform.name', '"בית הספר להורות"', 'string', 'branding', 'Platform Name', 'The name of the platform displayed throughout the site', true),
  ('platform.logo.text', '"בית הספר להורות"', 'string', 'branding', 'Logo Text', 'Text displayed in the logo', true),
  ('platform.tagline', '"למד, גדל והתפתח עם קורסים מקוונים מומחים"', 'string', 'branding', 'Tagline', 'Platform tagline or slogan', true),
  ('platform.support.email', '"support@parentingschool.com"', 'string', 'branding', 'Support Email', 'Contact email for support', true),
  ('platform.support.phone', '"+972-50-123-4567"', 'string', 'branding', 'Support Phone', 'Contact phone number', true),

  -- Feature flags
  ('features.zoom.enabled', 'true', 'boolean', 'features', 'Enable Zoom Integration', 'Allow live classes via Zoom', false),
  ('features.stripe.enabled', 'true', 'boolean', 'features', 'Enable Stripe Payments', 'Accept payments via Stripe', false),
  ('features.docusign.enabled', 'true', 'boolean', 'features', 'Enable DocuSign', 'Digital document signing', false),
  ('features.recordings.enabled', 'true', 'boolean', 'features', 'Enable Recordings', 'Allow users to view lesson recordings', false),
  ('features.community.enabled', 'false', 'boolean', 'features', 'Enable Community', 'Enable community features and forums', false);

-- ============================================================================
-- 4. SEED NAVIGATION ITEMS
-- ============================================================================

INSERT INTO public.navigation_items (translation_key, icon, href, "order", roles, is_active) VALUES
  ('nav.home', 'Home', '/', 1, ARRAY['student', 'instructor', 'admin'], true),
  ('nav.programs', 'BookOpen', '/programs', 2, ARRAY['student', 'instructor', 'admin'], true),
  ('nav.courses', 'GraduationCap', '/courses', 3, ARRAY['student', 'instructor', 'admin'], true),
  ('nav.dashboard', 'LayoutDashboard', '/student/dashboard', 4, ARRAY['student'], true),
  ('nav.dashboard', 'LayoutDashboard', '/instructor/dashboard', 4, ARRAY['instructor'], true),
  ('nav.dashboard', 'LayoutDashboard', '/admin/dashboard', 4, ARRAY['admin'], true);

-- ============================================================================
-- 5. SEED FEATURE FLAGS
-- ============================================================================

INSERT INTO public.feature_flags (feature_key, feature_name, description, is_enabled, roles, settings) VALUES
  ('live_classes', 'Live Classes', 'Enable live video classes via Zoom', true, ARRAY['instructor', 'admin'], '{"max_participants": 100}'),
  ('recordings', 'Class Recordings', 'Enable recording and playback of classes', true, ARRAY['student', 'instructor', 'admin'], '{"retention_days": 90}'),
  ('payments', 'Payment Processing', 'Enable payment collection via Stripe', true, ARRAY['admin'], '{"currency": "ILS"}'),
  ('notifications', 'Notifications', 'Enable email and SMS notifications', true, ARRAY['student', 'instructor', 'admin'], '{"email": true, "sms": false}'),
  ('ai_translation', 'AI Translation', 'Use AI for automatic translation of content', false, ARRAY['admin'], '{"provider": "openai"}');
