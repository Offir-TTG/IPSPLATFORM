# Run Enrollment Dialog Translations

## Overview
This guide shows how to apply the Hebrew and English translations for the new enrollment dialog feature.

## Migration Files to Run

Two migration files need to be executed in Supabase SQL Editor:

### 1. Enrollments Navigation Translation
**File**: `supabase/migrations/20251126_add_enrollments_navigation_translation.sql`

This adds the "Enrollments" / "רישומים" translation for the admin sidebar navigation.

### 2. Enrollment Dialog Translations
**File**: `supabase/migrations/20251126_add_enrollment_dialog_translations.sql`

This adds 48 translations (24 keys × 2 languages) for the entire enrollment dialog interface:
- Dialog header and description
- User selection dropdown
- Content type selection (Program/Course)
- Content selection dropdowns
- Payment requirement checkbox
- Expiry date and notes fields
- Alert messages
- Submit button and feedback messages

## How to Run the Migrations

### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy and paste the contents of each migration file
5. Click **"Run"** to execute
6. Verify the success message: `"Enrollment dialog translations added successfully"`

### Option 2: Using Supabase CLI

If your project is linked to Supabase CLI:

```bash
npx supabase db push --linked
```

This will automatically apply all pending migrations in the `supabase/migrations/` folder.

## Verification

After running the migrations, verify they were applied:

### Check in Supabase Dashboard

Run this query in SQL Editor:

```sql
SELECT
  translation_key,
  language_code,
  translation_value
FROM translations
WHERE translation_key LIKE 'admin.enrollments%'
ORDER BY translation_key, language_code;
```

You should see 50 rows (25 keys × 2 languages for enrollments + navigation).

### Test in the Application

1. Navigate to `/admin/enrollments` page
2. Switch language to Hebrew using the language selector
3. Click the "צור רישום" (Create Enrollment) button
4. Verify all UI elements show Hebrew translations:
   - Dialog title: "צור רישום ידני"
   - User field: "בחר משתמש"
   - Content type: "סוג תוכן"
   - Program/Course labels: "תוכנית" / "קורס"
   - All other form fields and messages

## Translation Keys Added

### Navigation
- `admin.nav.enrollments` - "Enrollments" / "רישומים"

### Dialog Interface
- `admin.enrollments.createEnrollment` - Button text
- `admin.enrollments.create.title` - Dialog title
- `admin.enrollments.create.description` - Dialog description
- `admin.enrollments.create.user` - User field label
- `admin.enrollments.create.selectUser` - User placeholder
- `admin.enrollments.create.noUsers` - Empty state message
- `admin.enrollments.create.contentType` - Content type label
- `admin.enrollments.create.program` - Program radio button
- `admin.enrollments.create.course` - Course radio button
- `admin.enrollments.create.selectProgram` - Program field label
- `admin.enrollments.create.selectCourse` - Course field label
- `admin.enrollments.create.selectProgramPlaceholder` - Program placeholder
- `admin.enrollments.create.selectCoursePlaceholder` - Course placeholder
- `admin.enrollments.create.noPrograms` - Empty state message
- `admin.enrollments.create.noCourses` - Empty state message
- `admin.enrollments.create.requirePayment` - Payment checkbox label
- `admin.enrollments.create.expiryDate` - Expiry date label
- `admin.enrollments.create.notes` - Notes label
- `admin.enrollments.create.notesPlaceholder` - Notes placeholder
- `admin.enrollments.create.alert` - Alert message
- `admin.enrollments.create.submit` - Submit button text
- `admin.enrollments.create.success` - Success toast message
- `admin.enrollments.create.error` - Error toast message
- `admin.enrollments.create.validationError` - Validation error message

## Features Enabled

Once these translations are applied, the enrollment dialog will be fully bilingual:

### English Mode
- Clear, professional UI text
- Intuitive placeholders
- Helpful error messages

### Hebrew Mode (עברית)
- Right-to-left (RTL) layout automatically applied
- Natural Hebrew translations
- Consistent terminology across admin interface

## Troubleshooting

### Problem: Translations not showing

**Solution**:
1. Clear browser cache and hard refresh (Ctrl+Shift+R)
2. Verify migrations ran successfully in Supabase
3. Check browser console for any errors

### Problem: Some text still in English when in Hebrew mode

**Solution**:
1. Verify the translation key exists in the database
2. Check that `useAdminLanguage()` hook is properly initialized
3. Ensure the `t()` function is called with the correct translation key

### Problem: Migration fails with "translation already exists"

**Solution**:
The migration uses `ON CONFLICT DO UPDATE`, so it should handle existing translations. If you still get an error:
1. Check the `tenant_id` in the migrations matches your actual tenant
2. Verify the default tenant slug is 'default' or update the migration accordingly

## Related Files

### Component Files
- `src/components/admin/CreateEnrollmentDialog.tsx` - The enrollment dialog component
- `src/app/admin/enrollments/page.tsx` - The enrollments page that uses the dialog
- `src/components/admin/AdminLayout.tsx` - Admin sidebar with navigation link

### API Endpoints
- `src/app/api/admin/enrollments/route.ts` - Program enrollment endpoint
- `src/app/api/admin/enrollments/course/route.ts` - Course enrollment endpoint

### Documentation
- `docs/HYBRID_ENROLLMENT_SYSTEM.md` - Complete system documentation

## Next Steps

After applying these translations:

1. **Test the enrollment flow end-to-end**:
   - Create a program enrollment (free)
   - Create a program enrollment (paid)
   - Create a course enrollment (free)
   - Create a course enrollment (paid)

2. **Verify data fetching**:
   - Ensure users list loads from `/api/admin/users?role=student`
   - Ensure programs list loads from `/api/admin/programs`
   - Ensure courses list loads from `/api/lms/courses`

3. **Test in both languages**:
   - Switch between English and Hebrew
   - Verify all UI elements translate correctly
   - Check RTL layout in Hebrew mode

4. **Move to next feature**:
   - Update user dashboard to show both enrollment types
   - Add enrollment history and audit trail
