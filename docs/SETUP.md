# Platform Setup Guide

## 🎯 Philosophy: Everything is Database-Driven

This platform is designed to be **100% flexible and database-driven**. Nothing is hardcoded in the codebase:

- ✅ All text content → Database (translations table)
- ✅ All languages → Database (languages table)
- ✅ All platform settings → Database (platform_settings table)
- ✅ All navigation menus → Database (navigation_items table)
- ✅ All page content → Database (page_content & page_sections tables)
- ✅ All form fields → Database (form_fields table)
- ✅ All features → Database (feature_flags table)
- ✅ All integrations → Database (integrations table)

## 📋 Setup Instructions

### Step 1: Run Database Schema

In your Supabase SQL Editor, run these files in order:

1. **Main Schema** (if not already done):
   ```sql
   -- src/lib/supabase/schema.sql
   ```

2. **Language & Translation Tables**:
   ```sql
   -- src/lib/supabase/languages-schema.sql
   ```

3. **Platform Configuration Tables**:
   ```sql
   -- src/lib/supabase/platform-config-schema.sql
   ```

4. **Seed Initial Data**:
   ```sql
   -- src/lib/supabase/seed-data.sql
   ```

### Step 2: Verify Tables Created

Check that these tables exist in Supabase:

**Core Tables:**
- `users`
- `programs`
- `courses`
- `lessons`
- `enrollments`
- `payments`

**Language & Content Tables:**
- `languages`
- `translations`
- `translation_keys`

**Configuration Tables:**
- `platform_settings`
- `navigation_items`
- `page_content`
- `page_sections`
- `email_templates`
- `form_fields`
- `feature_flags`
- `integrations`
- `theme_config`

### Step 3: First Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

### Step 4: Create First Admin User

1. Go to `http://localhost:3000/signup`
2. Create your account
3. In Supabase Table Editor → `users` table:
   - Find your user
   - Change `role` from `'student'` to `'admin'`
4. Refresh the page and you'll now have admin access

## 🌍 Language Management

### Current Languages

After running seed data, you'll have:
- **Hebrew (עברית)** - Default, RTL
- **English** - LTR

### ⚠️ CRITICAL: Translation Requirements for New Components

**EVERY time you create a new component, page, or feature, you MUST:**

1. **Create a translation SQL file** with keys for ALL text in your component
2. **Add translations for EVERY active language** (Hebrew + English minimum)
3. **Run the SQL file in Supabase** BEFORE deploying the component
4. **Test in ALL languages** to ensure nothing is hardcoded

#### Example: Adding Translations for a New Feature

**Step 1: Create SQL File** (`src/lib/supabase/my-feature-translations.sql`)

```sql
-- Translation keys for My Feature
INSERT INTO public.translation_keys (key, category, description) VALUES
  ('myFeature.title', 'myFeature', 'Feature page title'),
  ('myFeature.subtitle', 'myFeature', 'Feature page subtitle'),
  ('myFeature.action.create', 'myFeature', 'Create button'),
  ('myFeature.action.edit', 'myFeature', 'Edit button'),
  ('myFeature.action.delete', 'myFeature', 'Delete button'),
  ('myFeature.form.name', 'myFeature', 'Name field label'),
  ('myFeature.form.description', 'myFeature', 'Description field label'),
  ('myFeature.error.required', 'myFeature', 'Required field error'),
  ('myFeature.error.saveFailed', 'myFeature', 'Save failed error'),
  ('myFeature.success.saved', 'myFeature', 'Success message')
ON CONFLICT (key) DO NOTHING;

-- Hebrew translations
INSERT INTO public.translations (language_code, translation_key, translation_value, category) VALUES
  ('he', 'myFeature.title', 'כותרת התכונה', 'myFeature'),
  ('he', 'myFeature.subtitle', 'תיאור התכונה', 'myFeature'),
  ('he', 'myFeature.action.create', 'צור חדש', 'myFeature'),
  ('he', 'myFeature.action.edit', 'ערוך', 'myFeature'),
  ('he', 'myFeature.action.delete', 'מחק', 'myFeature'),
  ('he', 'myFeature.form.name', 'שם', 'myFeature'),
  ('he', 'myFeature.form.description', 'תיאור', 'myFeature'),
  ('he', 'myFeature.error.required', 'שדה חובה', 'myFeature'),
  ('he', 'myFeature.error.saveFailed', 'השמירה נכשלה', 'myFeature'),
  ('he', 'myFeature.success.saved', 'נשמר בהצלחה', 'myFeature'),

  -- English translations
  ('en', 'myFeature.title', 'Feature Title', 'myFeature'),
  ('en', 'myFeature.subtitle', 'Feature Description', 'myFeature'),
  ('en', 'myFeature.action.create', 'Create New', 'myFeature'),
  ('en', 'myFeature.action.edit', 'Edit', 'myFeature'),
  ('en', 'myFeature.action.delete', 'Delete', 'myFeature'),
  ('en', 'myFeature.form.name', 'Name', 'myFeature'),
  ('en', 'myFeature.form.description', 'Description', 'myFeature'),
  ('en', 'myFeature.error.required', 'This field is required', 'myFeature'),
  ('en', 'myFeature.error.saveFailed', 'Failed to save', 'myFeature'),
  ('en', 'myFeature.success.saved', 'Saved successfully', 'myFeature')
ON CONFLICT (language_code, translation_key) DO NOTHING;
```

**Step 2: Run SQL in Supabase**
- Open Supabase SQL Editor
- Paste and run your SQL file
- Verify data in `translation_keys` and `translations` tables

**Step 3: Use in Component**
```tsx
import { useLanguage } from '@/context/LanguageContext';

export function MyFeature() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('myFeature.title')}</h1>
      <p>{t('myFeature.subtitle')}</p>
      <button>{t('myFeature.action.create')}</button>
    </div>
  );
}
```

**Step 4: Test**
- [ ] Switch to Hebrew → All text should be in Hebrew
- [ ] Switch to English → All text should be in English
- [ ] Verify sidebar position changes (right for Hebrew, left for English)
- [ ] Check that no English text appears when Hebrew is selected

#### Translation Checklist for Every New Component

Before considering any component "complete":

- [ ] Created translation SQL file
- [ ] Added translation keys with descriptions
- [ ] Added Hebrew translations for EVERY piece of text
- [ ] Added English translations for EVERY piece of text
- [ ] Added translations for any other active languages
- [ ] Ran SQL file in Supabase
- [ ] Verified translations in database tables
- [ ] Used `t()` function for ALL text (no hardcoded strings)
- [ ] Tested in Hebrew (RTL)
- [ ] Tested in English (LTR)
- [ ] Cleared translation cache: `POST /api/translations`
- [ ] Verified no hardcoded text remains

### Adding a New Language

#### Option 1: Via Admin UI
Navigate to `/admin/config/languages` and click "Add Language"

#### Option 2: Via SQL
```sql
-- Add the language
INSERT INTO public.languages (code, name, native_name, direction, is_active, is_default)
VALUES ('es', 'Spanish', 'Español', 'ltr', true, false);

-- Option A: Copy from existing language and auto-translate
-- (Use the API endpoint: POST /api/admin/translations/auto-translate)

-- Option B: Import from JSON file
-- (Use the API endpoint: POST /api/admin/translations/import-export)

-- Option C: Manual translation
INSERT INTO public.translations (language_code, translation_key, translation_value, category)
SELECT 'es', translation_key, translation_value, category
FROM public.translations
WHERE language_code = 'en';

-- Then update each translation manually or via Admin UI
```

### Translation Management

**API Endpoints:**

1. **Get Translations** (cached):
   ```
   GET /api/translations?language=he
   ```

2. **Manage Translations** (admin only):
   ```
   GET    /api/admin/translations?language=he&category=auth
   POST   /api/admin/translations
   PUT    /api/admin/translations
   DELETE /api/admin/translations?language=he&key=nav.home
   ```

3. **Auto-Translate**:
   ```
   POST /api/admin/translations/auto-translate
   Body: {
     "source_language": "he",
     "target_language": "es",
     "keys": ["nav.home", "nav.programs"] // optional
   }
   ```

4. **Import/Export**:
   ```
   GET  /api/admin/translations/import-export?language=he&format=nested
   POST /api/admin/translations/import-export
   Body: {
     "language_code": "es",
     "translations": { ... },
     "format": "nested",
     "merge": true
   }
   ```

## 🎨 Platform Customization

### Theme Customization

Theme settings are in the `theme_config` table:
- Colors (primary, secondary, accent, etc.)
- Typography (fonts, sizes)
- Layout (border radius)
- Branding (platform name, logo text)

**Admin UI**: `/admin/settings`

### Platform Settings

General settings are in the `platform_settings` table:
- Platform name
- Logo text
- Support email/phone
- Feature toggles

**Example:**
```sql
UPDATE public.platform_settings
SET setting_value = '"My Custom School"'
WHERE setting_key = 'platform.name';
```

### Feature Flags

Enable/disable features dynamically:

```sql
-- Enable AI translation
UPDATE public.feature_flags
SET is_enabled = true
WHERE feature_key = 'ai_translation';

-- Disable community features
UPDATE public.feature_flags
SET is_enabled = false
WHERE feature_key = 'community';
```

### Navigation Menu

Customize navigation per role:

```sql
-- Add a new menu item for students
INSERT INTO public.navigation_items (translation_key, icon, href, "order", roles, is_active)
VALUES ('nav.resources', 'Library', '/resources', 5, ARRAY['student'], true);

-- Add translation for the menu item
INSERT INTO public.translations (language_code, translation_key, translation_value, category)
VALUES
  ('he', 'nav.resources', 'משאבים', 'nav'),
  ('en', 'nav.resources', 'Resources', 'nav');
```

## 📝 Adding New Content

### Add a Translation Key

1. **Register the key:**
   ```sql
   INSERT INTO public.translation_keys (key, category, description)
   VALUES ('dashboard.welcome', 'dashboard', 'Welcome message on dashboard');
   ```

2. **Add translations:**
   ```sql
   INSERT INTO public.translations (language_code, translation_key, translation_value, category)
   VALUES
     ('he', 'dashboard.welcome', 'ברוכים הבאים ללוח הבקרה', 'dashboard'),
     ('en', 'dashboard.welcome', 'Welcome to your dashboard', 'dashboard');
   ```

3. **Use in code:**
   ```tsx
   const { t } = useLanguage();
   <h1>{t('dashboard.welcome')}</h1>
   ```

### Add a Platform Setting

```sql
INSERT INTO public.platform_settings (setting_key, setting_value, setting_type, category, label, description, is_public)
VALUES (
  'features.max_upload_size',
  '10485760',
  'number',
  'features',
  'Max Upload Size',
  'Maximum file upload size in bytes',
  false
);
```

## 🚀 Development Workflow

### Adding a New Page

1. Create the page component in `src/app/`
2. Add translations for all text content
3. Add navigation item if needed
4. Test in both Hebrew and English
5. Verify RTL/LTR layouts

### Adding a New Feature

1. Add feature flag in database
2. Create translation keys for UI elements
3. Implement the feature
4. Gate it behind the feature flag
5. Test with flag enabled/disabled

### Best Practices

✅ **DO:**
- Always use `t('key')` for all user-facing text
- Store all configuration in database
- Use feature flags for new features
- Support RTL and LTR layouts
- Test with multiple languages

❌ **DON'T:**
- Hardcode any text in components
- Hardcode URLs or settings
- Assume language direction
- Skip translation for new content
- Use absolute positioning (breaks RTL)

## 🔧 Performance

### Caching Strategy

1. **Server-side** (5 minutes):
   - Translations cached in memory
   - Cleared on update via `/api/translations` POST

2. **Client-side**:
   - Language preference in localStorage
   - Translations loaded per language switch

3. **Database**:
   - Indexes on all frequently queried columns
   - RLS policies for security

### Optimization Tips

- Keep translation keys organized by category
- Use translation key prefixes consistently
- Batch translation updates
- Monitor cache hit rates
- Regular database maintenance

## 📚 Next Steps

1. **Complete Admin UI** for managing:
   - Languages
   - Translations
   - Platform settings
   - Feature flags
   - Navigation items

2. **AI Translation Integration**:
   - OpenAI GPT-4 for quality
   - Google Translate for speed
   - DeepL for accuracy

3. **Content Management**:
   - Page builder
   - Section templates
   - Visual editor

4. **Advanced Features**:
   - A/B testing for translations
   - User-specific overrides
   - Translation version history
   - Collaborative translation

## 🆘 Troubleshooting

### Translations not loading
1. Check browser console for errors
2. Verify API endpoint: `GET /api/translations?language=he`
3. Check database for translations: `SELECT * FROM translations WHERE language_code = 'he'`
4. Clear cache: `POST /api/translations`

### Language not switching
1. Check localStorage: `localStorage.getItem('language')`
2. Verify language is active in database
3. Check browser console for errors

### RTL/LTR issues
1. Verify `dir` attribute on `<html>`: `document.documentElement.dir`
2. Use `gap-X` instead of `space-x-X` in Tailwind
3. Use logical properties (start/end) instead of left/right

## 📖 Resources

- [Next.js i18n](https://nextjs.org/docs/advanced-features/i18n-routing)
- [RTL Styling Guide](https://rtlstyling.com/)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
