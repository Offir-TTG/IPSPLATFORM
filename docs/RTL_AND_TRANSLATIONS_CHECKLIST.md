# RTL and Translations Checklist

## Problem Summary
1. ✅ **Add Course Dialog created with bulk selection**
2. ❌ **Translations missing** - SQL migrations not applied yet
3. ✅ **RTL layout improved** - Simplified to use `dir` attribute

---

## Step 1: Apply SQL Migrations (REQUIRED)

You must run these SQL migrations in Supabase to add Hebrew translations to the database:

### Using Supabase CLI (Recommended)
```bash
cd C:\Users\OffirOmer\Documents\IPSPlatform
npx supabase db push
```

### OR Using Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy and paste **each file below** and run:

#### Migration 1: Programs Translations
File: `supabase/migrations/20251117_lms_programs_translations.sql`
```sql
-- Copy entire file contents and run
```

#### Migration 2: Program Detail Translations
File: `supabase/migrations/20251117_lms_program_detail_translations.sql`
```sql
-- Copy entire file contents and run
```

### Verify Translations
After running migrations, verify with this query:
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
- `lms.program_detail.add_courses_button` → 'הוסף קורסים'
- `lms.program_detail.add_courses_count` → 'הוסף {count} קורסים'
- `lms.program_detail.add_courses_description` → 'בחר קורס אחד או יותר להוספה לתוכנית זו'
- `lms.program_detail.add_courses_title` → 'הוסף קורסים לתוכנית'
- etc.

---

## Step 2: Test the Application

### 1. Hard Refresh Browser
- Chrome/Edge: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- This clears cached JavaScript

### 2. Switch to Hebrew Language
- In your application, change language to Hebrew (עברית)
- The UI should switch to RTL layout

### 3. Test Add Course Dialog
1. Navigate to **Admin → LMS → Programs**
2. Click on any program
3. Go to **Courses** tab
4. Click **Add Course** button
5. Verify dialog shows:
   - ✅ Hebrew title: "הוסף קורסים לתוכנית"
   - ✅ RTL layout (checkbox on right, text on left)
   - ✅ Search bar with Hebrew placeholder
   - ✅ Select All / Deselect All buttons in Hebrew
   - ✅ Course list with proper RTL alignment
   - ✅ Button text showing count: "הוסף X קורסים"

---

## Step 3: RTL Layout Explained

### What Changed
The Add Course dialog now uses a **simplified RTL approach**:

1. **DialogContent has `dir={direction}`** - This sets the base direction
2. **Removed manual `flex-row-reverse`** - Let browser handle RTL automatically
3. **Removed manual text alignment** - The `dir` attribute handles this
4. **Search icon positioning** - Still uses conditional classes for proper placement

### How It Works in RTL Mode

**English (LTR):**
```
[✓] Course Title
    Description text...
```

**Hebrew (RTL):**
```
          שם הקורס [✓]
    ...טקסט התיאור
```

The `dir="rtl"` attribute on the DialogContent automatically:
- Reverses flex direction
- Aligns text to the right
- Mirrors the layout

---

## Troubleshooting

### Issue: Translations Not Showing
**Solution**:
1. Verify migrations ran successfully in Supabase
2. Check browser console for errors
3. Hard refresh browser (Ctrl+Shift+R)
4. Verify language is set to Hebrew in app

### Issue: RTL Layout Not Working
**Solution**:
1. Verify `dir={direction}` is on DialogContent (line 861)
2. Check that `useAdminLanguage()` hook is returning correct direction
3. Inspect browser DevTools - the dialog should have `dir="rtl"` attribute

### Issue: Checkbox Package Error
If you see checkbox import errors:
```bash
npm install @radix-ui/react-checkbox
```

---

## Files Modified

### Component Code
- `src/app/admin/lms/programs/[id]/page.tsx`
  - Added bulk course selection
  - Simplified RTL layout approach
  - Added new state variables for multi-select

### Translations (SQL)
- `supabase/migrations/20251117_lms_program_detail_translations.sql`
  - Lines 57-68: Add courses dialog translations

### New Components
- `src/components/ui/checkbox.tsx` - Checkbox component created

### Dependencies Added
- `@radix-ui/react-checkbox` - For accessible checkboxes

---

## Next Steps After Testing

If translations are still not showing:
1. Share screenshot of Supabase SQL Editor showing the migration ran successfully
2. Share browser console errors (if any)
3. Share screenshot of the dialog in Hebrew mode

If RTL layout has issues:
1. Share screenshot showing the issue
2. Specify which element is not aligned correctly
3. Check browser DevTools and share the computed styles
