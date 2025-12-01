# Complete Translation Refresh Guide

## The Problem

The translations system has THREE levels of caching:
1. **Database** - Where translations are stored
2. **Server memory cache** - API caches translations for 5 minutes
3. **Browser localStorage** - Client caches translations

When you add new translations, ALL three caches need to be refreshed.

## Complete Refresh Steps

### Step 1: Update Database
Run the SQL migration in Supabase SQL Editor:
**File**: `supabase/SQL Scripts/REFRESH_PRODUCTS_TRANSLATIONS.sql`

This will:
- Delete all existing product translations
- Insert 250+ fresh translations (English + Hebrew)

### Step 2: Clear Server Cache
Open browser console (F12) and run:

```javascript
fetch('/api/translations', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log('Server cache cleared:', d));
```

### Step 3: Clear Browser Cache
In the same console, run:

```javascript
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('translations_')) {
    localStorage.removeItem(key);
  }
});
console.log('Browser cache cleared');
```

### Step 4: Reload Page
```javascript
location.reload();
```

## One-Line Solution

Run ALL steps at once in browser console:

```javascript
(async () => {
  // Clear server cache
  const serverRes = await fetch('/api/translations', { method: 'POST' });
  console.log('Server cache:', await serverRes.json());

  // Clear browser cache
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('translations_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('Browser cache cleared');

  // Reload
  location.reload();
})();
```

## Verify It Worked

After refresh, check the browser console. You should see:
```
[Translations API] CACHE DISABLED - Fetching fresh from DB
[Translations API] Fetched XXX translations for language=he, context=admin, tenant_id=...
```

The page should now be fully translated to Hebrew.

## Common Issues

### Issue: "Nothing changed after refresh"
- Make sure you ran the SQL migration FIRST
- Check that the SQL didn't have errors
- Verify translations exist in DB:
  ```sql
  SELECT COUNT(*) FROM translations
  WHERE translation_key LIKE 'admin.payments.products.%';
  ```
  Should return ~100 rows

### Issue: "Some parts are translated, some are not"
- Different parts of the app use different context ('admin' vs 'user')
- Products page uses 'admin' context
- Make sure you cleared the `translations_admin_he` localStorage key specifically

### Issue: "It worked but broke after 5 minutes"
- Server cache expires after 5 minutes
- The API will re-fetch from database automatically
- If translations disappear after 5 minutes, it means they're not in the database
