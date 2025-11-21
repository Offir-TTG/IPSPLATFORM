# Fix Keap Hebrew Translations

## Problem Found
The Keap translations are **NOT in the database yet**. The API shows 0 Keap translations.

## Solution - Run This SQL

**File to use:** `supabase/migrations/20251123_keap_translations_fix.sql`

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar

3. **Copy the SQL**
   - Open: `supabase\migrations\20251123_keap_translations_fix.sql`
   - Copy ALL the contents (lines 1-145)

4. **Paste and Run**
   - Paste into SQL Editor
   - Click "Run" button
   - You should see: "Success. No rows returned"
   - And notice message: "Successfully inserted 102 Keap translations"

5. **Verify**
   Run this query to check:
   ```sql
   SELECT COUNT(*) as keap_count
   FROM translations
   WHERE translation_key LIKE '%keap%';
   ```
   Should return: **102**

6. **Clear Cache**
   - Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Or wait 5 minutes for cache to expire automatically

## Why This Fixes It

- The SQL deletes any old/broken Keap translations
- Then inserts fresh set of 102 translations (51 English + 51 Hebrew)
- Includes all translations for:
  - Navigation (6 translations)
  - Integration config (24 translations)
  - Dashboard page (38 translations)
  - Tags page (34 translations)

## Expected Result

After running SQL and refreshing browser:
- ✅ Hebrew text will appear on Keap pages
- ✅ "Search tags..." → "חיפוש תגיות..."
- ✅ "No tags found" → "לא נמצאו תגיות"
- ✅ "Create Tag" → "צור תגית"
- ✅ All other Hebrew translations will work
