# Clear All Caches - Keap Translations

## The Problem
You're seeing MOST Hebrew translations working, but these 2 are still in English:
- "Filtered" (should be "מסונן")
- "With Category" (should be "עם קטגוריה")

These translations ARE in the database (we just inserted them), so this is a **caching issue**.

## Solution: Clear ALL Caches

### Step 1: Clear Browser Cache
1. Open the Keap Tags page
2. Press **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
   - This forces a hard refresh, bypassing all caches

### Step 2: Clear Server Translation Cache
In your browser console (F12), run:
```javascript
fetch('/api/translations', { method: 'POST' })
  .then(r => r.json())
  .then(d => console.log('Cache cleared:', d));
```

### Step 3: Clear Browser LocalStorage (if still not working)
In browser console:
```javascript
// Check current translations
fetch('/api/translations?language=he&context=admin')
  .then(r => r.json())
  .then(data => {
    console.log('filtered:', data.data['admin.keap.tags.filtered']);
    console.log('withCategory:', data.data['admin.keap.tags.withCategory']);
  });
```

This will show you if the API is returning the correct translations.

### Step 4: Nuclear Option - Clear Everything
If nothing works:
```javascript
// Clear all localStorage
localStorage.clear();

// Clear all server cache
fetch('/api/translations', { method: 'POST' });

// Reload page
location.reload(true);
```

## Why This Happens
The translation system has a 5-minute cache on the server side. If you:
1. Loaded the page before running the SQL
2. The cache was populated with missing translations
3. Running SQL updates DB but doesn't clear the cache automatically

The fix is to clear both browser AND server caches.

## Expected Result
After clearing caches and refreshing:
- ✅ "Filtered" → "מסונן"
- ✅ "With Category" → "עם קטגוריה"
- ✅ All 17 Hebrew tag translations working

## Verification
Open browser console and run:
```javascript
fetch('/api/translations?language=he&context=admin')
  .then(r => r.json())
  .then(data => {
    const keapKeys = Object.keys(data.data).filter(k => k.includes('keap.tags'));
    console.log('Total Keap tag translations:', keapKeys.length);
    console.log('Sample:', {
      title: data.data['admin.keap.tags.title'],
      filtered: data.data['admin.keap.tags.filtered'],
      withCategory: data.data['admin.keap.tags.withCategory']
    });
  });
```

Should show:
- Total Keap tag translations: 17
- filtered: "מסונן"
- withCategory: "עם קטגוריה"
