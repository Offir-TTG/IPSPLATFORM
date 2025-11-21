# Debug RTL and Translations

## What I See in Your Screenshot

The dialog shows:
- ❌ English text: "Add Courses to Program", "Select All", "Search courses", "Add Courses", "Cancel"
- ❌ LTR layout: Search icon on left, buttons on left
- ❌ Not RTL

This means **two issues**:

## Issue 1: Language Not Set to Hebrew

**Check your current language:**
1. Look at the top-right corner of your admin panel
2. Is there a language selector showing "English" or "עברית"?
3. If it shows English, **click it and select עברית (Hebrew)**

**If there's no language selector visible:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('admin_language')`
4. Press Enter
5. It should return `"he"` for Hebrew

**To manually set Hebrew:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.setItem('admin_language', 'he')`
4. Press Enter
5. Refresh the page (Ctrl+Shift+R)

## Issue 2: Translations Not in Database

Even if you switch to Hebrew, you won't see Hebrew text until you run the SQL migrations.

**You MUST run these migrations in Supabase:**

### Step 1: Go to Supabase Dashboard
1. https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)

### Step 2: Run First Migration
1. Click **New Query**
2. Open file: `C:\Users\OffirOmer\Documents\IPSPlatform\supabase\migrations\20251117_lms_programs_translations.sql`
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste into SQL Editor
5. Click **Run** or press Ctrl+Enter
6. Wait for green "Success" message

### Step 3: Run Second Migration
1. Click **New Query** again
2. Open file: `C:\Users\OffirOmer\Documents\IPSPlatform\supabase\migrations\20251117_lms_program_detail_translations.sql`
3. Copy ALL contents (Ctrl+A, Ctrl+C)
4. Paste into SQL Editor
5. Click **Run** or press Ctrl+Enter
6. Wait for green "Success" message

### Step 4: Verify Migrations Worked
Run this query in SQL Editor:
```sql
SELECT
  translation_key,
  translation_value
FROM translations
WHERE language_code = 'he'
  AND translation_key LIKE 'lms.program_detail.add_courses%'
ORDER BY translation_key;
```

You should see results like:
```
add_courses_button → הוסף קורסים
add_courses_count → הוסף {count} קורסים
add_courses_description → בחר קורס אחד או יותר להוספה לתוכנית זו
add_courses_title → הוסף קורסים לתוכנית
```

### Step 5: Test in Browser
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Make sure language is set to Hebrew (עברית)
3. Open the Add Course dialog
4. Should now see Hebrew text and RTL layout

## Expected Result After Fixing

When working correctly, the dialog should look like:

```
                                    ×
          הוסף קורסים לתוכנית
    בחר קורס אחד או יותר להוספה לתוכנית זו

                          🔍 ...חפש קורסים
                                בחר הכל

[Checkbox on RIGHT] שם הקורס    ✓
                  ...תיאור הקורס

                      ביטול    הוסף קורסים
```

**Key indicators it's working:**
- ✅ All text in Hebrew
- ✅ Text aligned to the right
- ✅ Search icon on the right
- ✅ Checkboxes on the right
- ✅ Cancel button on the right, Add button on the left

## Quick Checklist

- [ ] Language set to Hebrew (עברית) in admin panel
- [ ] SQL migration 1 applied (`20251117_lms_programs_translations.sql`)
- [ ] SQL migration 2 applied (`20251117_lms_program_detail_translations.sql`)
- [ ] Verified translations exist in database
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Opened Add Course dialog
- [ ] Confirmed Hebrew text appears
- [ ] Confirmed RTL layout works

## Still Not Working?

If you've done all the above and it still doesn't work:

1. **Check browser console for errors:**
   - F12 → Console tab
   - Look for red errors
   - Screenshot and share

2. **Check network requests:**
   - F12 → Network tab
   - Refresh page
   - Look for `/api/translations` request
   - Click on it → Response tab
   - Should show Hebrew translations

3. **Inspect the dialog element:**
   - Right-click on the dialog
   - Select "Inspect"
   - Check if `<div dir="rtl">` exists on the DialogContent
   - Screenshot and share
