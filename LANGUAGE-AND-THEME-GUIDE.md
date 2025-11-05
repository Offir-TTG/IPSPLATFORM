# Language Context & Dark Mode Implementation Guide

## Overview

This guide explains the new **context-aware language system** and **dark mode support** that separates admin and user-facing translations.

### Key Features

✅ **Separate Language Contexts**
- Admin panels can have their own language
- User-facing pages have independent language settings
- Changing admin language doesn't affect users

✅ **Dark Mode Support**
- System preference detection
- Manual light/dark toggle
- Persistent across sessions

✅ **Backward Compatible**
- Existing code continues to work
- Gradual migration path

---

## Installation

### Step 1: Run Database Migration

```sql
-- Run this in Supabase SQL Editor
-- File: src/lib/supabase/context-aware-translations-migration.sql
```

This adds `context` column to translations tables and categorizes existing translations.

### Step 2: Update Your Root Layout

Replace `LanguageProvider` with `AppProvider`:

**Before:**
```tsx
// src/app/layout.tsx
import { LanguageProvider } from '@/context/LanguageContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
```

**After:**
```tsx
// src/app/layout.tsx
import { AppProvider } from '@/context/AppContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
```

### Step 3: Configure Tailwind for Dark Mode

Update `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  // Enable dark mode with class strategy
  darkMode: 'class',

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Your existing theme extensions
    },
  },
  plugins: [],
};

export default config;
```

---

## Usage

### Admin Components

Use `useAdminLanguage()` in admin panels:

```tsx
// src/app/admin/settings/page.tsx
'use client';

import { useAdminLanguage } from '@/context/AppContext';

export default function AdminSettingsPage() {
  const { t, language, setLanguage, availableLanguages } = useAdminLanguage();

  return (
    <div>
      <h1>{t('admin.settings.title', 'Settings')}</h1>

      {/* Language selector for admin */}
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        {availableLanguages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.native_name}
          </option>
        ))}
      </select>

      <p>{t('admin.settings.description', 'Configure your platform')}</p>
    </div>
  );
}
```

### User-Facing Components

Use `useUserLanguage()` in user-facing pages:

```tsx
// src/app/courses/page.tsx
'use client';

import { useUserLanguage } from '@/context/AppContext';

export default function CoursesPage() {
  const { t, language, setLanguage } = useUserLanguage();

  return (
    <div>
      <h1>{t('courses.title', 'Courses')}</h1>
      <p>{t('courses.description', 'Browse available courses')}</p>
    </div>
  );
}
```

### Dark Mode

Use `useTheme()` for theme management:

```tsx
'use client';

import { useTheme } from '@/context/AppContext';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, effectiveTheme, setTheme, toggleTheme, isDark } = useTheme();

  return (
    <div className="flex items-center gap-2">
      {/* Simple toggle */}
      <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Full theme selector */}
      <select value={theme} onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}>
        <option value="light">
          <Sun /> Light
        </option>
        <option value="dark">
          <Moon /> Dark
        </option>
        <option value="system">
          <Monitor /> System
        </option>
      </select>
    </div>
  );
}
```

### Styling with Dark Mode

Use Tailwind's `dark:` variant:

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  <h1 className="text-gray-900 dark:text-gray-100">
    Title
  </h1>

  <button className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700">
    Click me
  </button>
</div>
```

---

## Migration Guide

### For Existing Components

Your existing components using `useLanguage()` will continue to work (it's aliased to `useUserLanguage()`):

```tsx
// This still works!
import { useLanguage } from '@/context/AppContext';

function MyComponent() {
  const { t } = useLanguage();
  return <div>{t('my.key', 'Fallback')}</div>;
}
```

### Migrating Admin Components

1. **Find admin components:**
```bash
grep -r "useLanguage" src/app/admin
```

2. **Update imports:**
```tsx
// Before
import { useLanguage } from '@/context/LanguageContext';

// After
import { useAdminLanguage } from '@/context/AppContext';
```

3. **Update hook usage:**
```tsx
// Before
const { t } = useLanguage();

// After
const { t } = useAdminLanguage();
```

---

## Database Schema

### Context Column

The `context` column categorizes translations:

- `'admin'` - Admin panel only (e.g., `admin.settings.title`)
- `'user'` - User-facing only (e.g., `courses.title`)
- `'both'` - Shared (e.g., `common.save`)

### Automatic Categorization

The migration automatically sets context based on key prefixes:

```sql
-- Admin keys
UPDATE translation_keys SET context = 'admin'
WHERE key LIKE 'admin.%';

-- Common keys (shared)
UPDATE translation_keys SET context = 'both'
WHERE key LIKE 'common.%';

-- User keys (everything else)
UPDATE translation_keys SET context = 'user'
WHERE key NOT LIKE 'admin.%' AND key NOT LIKE 'common.%';
```

---

## API Changes

The `/api/translations` endpoint now supports a `context` parameter:

### Admin Translations

```typescript
// Fetches admin + common translations
fetch('/api/translations?language=he&context=admin')
```

### User Translations

```typescript
// Fetches user + common translations
fetch('/api/translations?language=he&context=user')
```

### All Translations

```typescript
// Fetches everything
fetch('/api/translations?language=he&context=both')
```

---

## How It Works

### Separate Storage

Admin and user languages are stored separately in localStorage:

```typescript
localStorage.setItem('admin_language', 'en');  // Admin uses English
localStorage.setItem('user_language', 'he');   // Users see Hebrew
```

### Independent Loading

```typescript
// Admin context loads admin translations
useEffect(() => {
  fetch(`/api/translations?language=${adminLanguage}&context=admin`)
    .then(res => res.json())
    .then(data => setAdminTranslations(data.data));
}, [adminLanguage]);

// User context loads user translations
useEffect(() => {
  fetch(`/api/translations?language=${userLanguage}&context=user`)
    .then(res => res.json())
    .then(data => setUserTranslations(data.data));
}, [userLanguage]);
```

### Translation Lookup

```typescript
const t = (key: string, fallback?: string, context: 'admin' | 'user' = 'user') => {
  const translations = context === 'admin' ? adminTranslations : userTranslations;
  return translations[key] || fallback || key;
};
```

---

## Examples

### Example 1: Admin Panel with Language Selector

```tsx
'use client';

import { useAdminLanguage, useTheme } from '@/context/AppContext';
import { Moon, Sun } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage, availableLanguages } = useAdminLanguage();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold dark:text-white">
            {t('admin.title', 'Admin Panel')}
          </h1>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {availableLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.native_name}
                </option>
              ))}
            </select>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDark ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
```

### Example 2: User-Facing Page

```tsx
'use client';

import { useUserLanguage } from '@/context/AppContext';

export function CourseCatalog() {
  const { t, direction } = useUserLanguage();

  return (
    <div dir={direction} className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 dark:text-white">
        {t('courses.catalog.title', 'Course Catalog')}
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-8">
        {t('courses.catalog.description', 'Browse our selection of courses')}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Course cards */}
      </div>
    </div>
  );
}
```

### Example 3: Shared Component (uses both contexts)

```tsx
'use client';

import { useApp } from '@/context/AppContext';
import { usePathname } from 'next/navigation';

export function LanguageSelector() {
  const pathname = usePathname();
  const isAdminPath = pathname.startsWith('/admin');

  const {
    adminLanguage,
    userLanguage,
    setAdminLanguage,
    setUserLanguage,
    availableLanguages,
  } = useApp();

  const currentLanguage = isAdminPath ? adminLanguage : userLanguage;
  const setLanguage = isAdminPath ? setAdminLanguage : setUserLanguage;

  return (
    <select
      value={currentLanguage}
      onChange={(e) => setLanguage(e.target.value)}
      className="px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white"
    >
      {availableLanguages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.native_name}
        </option>
      ))}
    </select>
  );
}
```

---

## Dark Mode Color Guidelines

### Background Colors

```tsx
// Page backgrounds
className="bg-white dark:bg-gray-900"

// Card/panel backgrounds
className="bg-gray-50 dark:bg-gray-800"

// Hover states
className="hover:bg-gray-100 dark:hover:bg-gray-700"
```

### Text Colors

```tsx
// Primary text
className="text-gray-900 dark:text-gray-100"

// Secondary text
className="text-gray-600 dark:text-gray-400"

// Muted text
className="text-gray-500 dark:text-gray-500"
```

### Borders

```tsx
className="border border-gray-200 dark:border-gray-700"
```

### Buttons

```tsx
// Primary button
className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"

// Secondary button
className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100"
```

---

## Testing

### Test Language Separation

1. **Open admin panel** (`/admin`)
2. **Change language to English**
3. **Open user page** (`/courses`) in new tab
4. **Verify**: User page should still be in Hebrew (or default)
5. **Change user language to Arabic**
6. **Go back to admin panel**
7. **Verify**: Admin panel should still be in English

### Test Dark Mode

1. **Click theme toggle**
2. **Verify**: Colors change immediately
3. **Refresh page**
4. **Verify**: Theme persists
5. **Set theme to "System"**
6. **Change OS theme**
7. **Verify**: App follows system preference

---

## Troubleshooting

### Issue: Translations Not Loading

**Check:**
1. Run the database migration
2. Verify `context` column exists in `translations` table
3. Check API response includes `context` parameter
4. Clear translation cache: `POST /api/translations`

### Issue: Dark Mode Not Working

**Check:**
1. Tailwind config has `darkMode: 'class'`
2. HTML has `class="dark"` when in dark mode
3. CSS classes use `dark:` variant

### Issue: Admin Language Affects Users

**Check:**
1. Using correct hook: `useAdminLanguage()` in admin, `useUserLanguage()` in user pages
2. localStorage has separate keys: `admin_language` and `user_language`
3. API calls include correct `context` parameter

---

## Performance

### Caching

Translations are cached per language AND context:

```typescript
// Separate cache entries
translationsCache.set('he:admin', adminTranslations);
translationsCache.set('he:user', userTranslations);
```

Cache duration: **5 minutes**

### Optimization Tips

1. **Use `React.memo`** for translation components
2. **Batch translation loading** on route change
3. **Clear cache** only when translations are updated
4. **Use `loading` state** to show skeleton screens

---

## Adding New Translations

### For Admin Panel

```sql
-- Add translation key
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('admin.new_feature.title', 'admin', 'New feature title', 'admin');

-- Add translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'admin.new_feature.title', 'תכונה חדשה', 'admin', 'admin'),
  ('en', 'admin.new_feature.title', 'New Feature', 'admin', 'admin');
```

### For User-Facing

```sql
-- Add translation key
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('courses.new_section', 'user', 'Course section', 'user');

-- Add translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'courses.new_section', 'קורסים', 'user', 'user'),
  ('en', 'courses.new_section', 'Courses', 'user', 'user');
```

### For Shared (Common)

```sql
-- Add translation key
INSERT INTO translation_keys (key, category, description, context) VALUES
  ('common.new_action', 'common', 'Common action', 'both');

-- Add translations
INSERT INTO translations (language_code, translation_key, translation_value, category, context) VALUES
  ('he', 'common.new_action', 'פעולה', 'common', 'both'),
  ('en', 'common.new_action', 'Action', 'common', 'both');
```

---

## API Reference

### useAdminLanguage()

Returns admin language context.

```typescript
const {
  language,        // Current admin language
  direction,       // Text direction ('rtl' | 'ltr')
  availableLanguages, // All active languages
  setLanguage,     // Change admin language
  t,               // Translation function (admin context)
  loading,         // Loading state
} = useAdminLanguage();
```

### useUserLanguage()

Returns user language context.

```typescript
const {
  language,        // Current user language
  direction,       // Text direction
  availableLanguages,
  setLanguage,     // Change user language
  t,               // Translation function (user context)
  loading,
} = useUserLanguage();
```

### useTheme()

Returns theme management.

```typescript
const {
  theme,           // Current theme setting ('light' | 'dark' | 'system')
  effectiveTheme,  // Actual theme in use ('light' | 'dark')
  setTheme,        // Change theme
  toggleTheme,     // Toggle between light/dark
  isDark,          // Boolean: is dark mode active
  isLight,         // Boolean: is light mode active
} = useTheme();
```

### useApp()

Returns full app context (all features).

```typescript
const {
  adminLanguage,
  userLanguage,
  direction,
  availableLanguages,
  setAdminLanguage,
  setUserLanguage,
  t,
  loading,
  theme,
  effectiveTheme,
  setTheme,
  toggleTheme,
} = useApp();
```

---

## Summary

✅ **Admin and user languages are now independent**
✅ **Dark mode with system preference support**
✅ **Backward compatible with existing code**
✅ **Persistent across sessions**
✅ **Performance optimized with caching**

---

*Last Updated: 2025-01-04*
*Version: 2.0.0*
