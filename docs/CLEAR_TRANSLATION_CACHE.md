# Clear Translation Cache

The products page translations aren't showing because they're cached in browser localStorage.

## Option 1: Clear Cache via Browser Console

1. Open the products page: `/admin/payments/products`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Run this command:

```javascript
// Clear all translation caches
Object.keys(localStorage).forEach(key => {
  if (key.startsWith('translations_')) {
    localStorage.removeItem(key);
  }
});

// Reload the page
location.reload();
```

## Option 2: Hard Refresh

1. Make sure you've run the SQL migration: `REFRESH_PRODUCTS_TRANSLATIONS.sql`
2. On the products page, press:
   - **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`

## Option 3: Clear All Site Data

1. Open DevTools (F12)
2. Go to Application tab
3. In the left sidebar under "Storage", click "Local Storage"
4. Right-click on your domain
5. Click "Clear"
6. Reload the page

## Verify Translations Are in Database

Run this SQL query in Supabase to check if translations exist:

```sql
SELECT
  translation_key,
  language_code,
  translation_value
FROM translations
WHERE translation_key LIKE 'admin.payments.products.%'
ORDER BY translation_key, language_code;
```

You should see results like:
- `admin.payments.products.title` → 'Products' (en) / 'מוצרים' (he)
- `admin.payments.products.createProduct` → 'Create Product' (en) / 'צור מוצר' (he)
- etc.

If you don't see any results, run the SQL migration first: `supabase/SQL Scripts/REFRESH_PRODUCTS_TRANSLATIONS.sql`
