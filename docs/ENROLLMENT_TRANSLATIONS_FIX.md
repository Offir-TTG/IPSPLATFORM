# Enrollment Dialog Translation Fix

## Problem

The Create Enrollment dialog and "Create Enrollment" button were not showing Hebrew translations even though the translations were added to the database.

## Root Cause

The translations were inserted with `context='user'` (default value) but the API endpoint filters translations by the `context` field:
- Admin interface requests: `context='admin'` or `context='both'`
- User interface requests: `context='user'` or `context='both'`

Since our enrollment dialog translations had `context='user'`, they were not being returned when the admin interface requested translations with `context='admin'`.

## Solution

1. **Updated all enrollment translations** to have `context='both'` so they're available in both admin and user contexts
2. **Cleared server-side API cache** to remove cached translations
3. **Browser localStorage cache** needs to be cleared by the user

## What Was Fixed

### Database Updates
- Updated 190 enrollment-related translations from `context='user'` to `context='both'`
- This includes all keys starting with `admin.enrollments`

### Migration Files Updated
- ✅ `supabase/migrations/20251126_add_enrollment_dialog_translations.sql` - Now includes `context='both'`
- ✅ `scripts/apply-enrollment-translations.ts` - Now includes `context='both'`

### Verification
- ✅ Database contains correct translations with `context='both'`
- ✅ API endpoint returns translations correctly
- ✅ Server-side cache cleared

## How to See the Translations

### Method 1: Use the Clear Cache Page (Easiest)

1. Navigate to: `http://localhost:3000/clear-cache.html`
2. Click "Clear Translation Cache"
3. Click "Reload Page"
4. Go to `/admin/enrollments` and switch to Hebrew
5. Click "צור רישום" - the dialog should now be in Hebrew!

### Method 2: Manual Browser Cache Clear

1. Open your browser on `http://localhost:3000`
2. Open DevTools (F12)
3. Go to Console tab
4. Paste this code:

```javascript
localStorage.removeItem("translations_admin_he");
localStorage.removeItem("translations_admin_en");
localStorage.removeItem("translations_user_he");
localStorage.removeItem("translations_user_en");
location.reload();
```

5. Press Enter
6. Navigate to `/admin/enrollments`
7. Switch to Hebrew (עברית)
8. Click the "Create Enrollment" button
9. All text should now be in Hebrew!

## Translations Available

### English
- **Button**: "Create Enrollment"
- **Dialog Title**: "Create Manual Enrollment"
- **Dialog Description**: "Manually enroll a user in a program or course"
- **Form Fields**: User, Content Type, Program/Course selection, Payment options, Expiry date, Notes
- **Messages**: Success, error, validation messages

### Hebrew (עברית)
- **Button**: "צור רישום"
- **Dialog Title**: "צור רישום ידני"
- **Dialog Description**: "רשום משתמש באופן ידני לתוכנית או קורס"
- **Form Fields**: All fields translated including "בחר משתמש", "סוג תוכן", "תוכנית/קורס", etc.
- **Messages**: All success/error messages in Hebrew

## Technical Details

### Translation System Architecture

The platform uses a two-tier caching system:

1. **Server-side cache** (in-memory, 5 minutes)
   - Located in `/api/translations` route
   - Cleared with POST request to `/api/translations`

2. **Client-side cache** (localStorage, persistent)
   - Keys: `translations_admin_he`, `translations_admin_en`, etc.
   - Must be manually cleared by user or via script

### API Endpoint Behavior

```typescript
GET /api/translations?language=he&context=admin
```

Returns translations where:
- `language_code = 'he'`
- `context IN ('admin', 'both')`
- `tenant_id = user.tenant_id OR tenant_id IS NULL`

### Translation Record Structure

```typescript
{
  id: UUID,
  language_code: 'he' | 'en',
  translation_key: 'admin.enrollments.create.title',
  translation_value: 'צור רישום ידני',
  category: 'admin',      // For grouping/filtering
  context: 'both',        // 'admin' | 'user' | 'both' - determines availability
  tenant_id: UUID,
  created_at: timestamp,
  updated_at: timestamp
}
```

**Important**: The API filters by `context`, not `category`!

## Verification Scripts

### Check Translations in Database
```bash
npx tsx scripts/verify-enrollment-translations.ts
```

### Clear All Caches
```bash
npx tsx scripts/clear-translation-cache.ts
```

### Fix Context Field (if needed)
```bash
npx tsx scripts/fix-enrollment-translations-context.ts
```

## Files Modified

### Core Components
- `src/components/admin/CreateEnrollmentDialog.tsx` - Uses `t()` with translation keys
- `src/app/admin/enrollments/page.tsx` - "Create Enrollment" button
- `src/components/admin/AdminLayout.tsx` - Navigation sidebar link

### Translation Files
- `supabase/migrations/20251126_add_enrollment_dialog_translations.sql` - SQL migration
- `supabase/migrations/20251126_add_enrollments_navigation_translation.sql` - Nav translation
- `scripts/apply-enrollment-translations.ts` - TypeScript migration script

### Utility Scripts
- `scripts/clear-translation-cache.ts` - Clear caches and verify
- `scripts/fix-enrollment-translations-context.ts` - Fix context field
- `scripts/verify-enrollment-translations.ts` - Verify translations
- `public/clear-cache.html` - User-friendly cache clearing page

## Testing Checklist

- [ ] Navigate to `/admin/enrollments`
- [ ] Switch language to Hebrew (עברית)
- [ ] Verify "Enrollments" sidebar link shows "רישומים"
- [ ] Verify "Create Enrollment" button shows "צור רישום"
- [ ] Click the button to open dialog
- [ ] Verify dialog title: "צור רישום ידני"
- [ ] Verify all form labels are in Hebrew
- [ ] Verify placeholders are in Hebrew
- [ ] Verify radio buttons show "תוכנית" and "קורס"
- [ ] Verify checkbox text is in Hebrew
- [ ] Verify alert message is in Hebrew
- [ ] Verify submit button shows "צור רישום"
- [ ] Switch back to English and verify all text is in English

## Future Prevention

When adding new translations, always include the `context` field:

```sql
INSERT INTO translations (
  language_code,
  translation_key,
  translation_value,
  category,
  context,        -- Don't forget this!
  tenant_id
) VALUES (
  'en',
  'admin.something.key',
  'Some Value',
  'admin',
  'both',          -- or 'admin' or 'user'
  tenant_uuid
);
```

## Related Documentation

- [HYBRID_ENROLLMENT_SYSTEM.md](./HYBRID_ENROLLMENT_SYSTEM.md) - Complete enrollment system docs
- [RUN_ENROLLMENT_TRANSLATIONS.md](./RUN_ENROLLMENT_TRANSLATIONS.md) - Original translation instructions
- [Translation System Architecture] - (TODO: Create comprehensive translation docs)

## Summary

✅ **Fixed**: All enrollment dialog translations now have `context='both'`
✅ **Verified**: API returns translations correctly
✅ **Action Required**: Users must clear browser localStorage cache
✅ **Tool Provided**: `http://localhost:3000/clear-cache.html` for easy cache clearing

The Hebrew translations are now fully functional and will appear after clearing the browser cache!
