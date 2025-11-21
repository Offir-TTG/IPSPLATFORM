# Apply Translation Migrations

You need to run these SQL migration files in your Supabase dashboard to add the Hebrew translations:

## Required Migrations (Run in Order)

### 1. LMS Programs Translations
**File**: `supabase/migrations/20251117_lms_programs_translations.sql`
**Purpose**: Adds Hebrew translations for the Programs list page

### 2. LMS Program Detail Translations
**File**: `supabase/migrations/20251117_lms_program_detail_translations.sql`
**Purpose**: Adds Hebrew translations for the Program detail page (includes the new Add Courses dialog translations)

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of each migration file
5. Click **Run** for each migration
6. Verify success message appears

### Option 2: Using Supabase CLI
```bash
# Run all pending migrations
npx supabase db push

# Or run specific migration
npx supabase db execute --file supabase/migrations/20251117_lms_programs_translations.sql
npx supabase db execute --file supabase/migrations/20251117_lms_program_detail_translations.sql
```

## Verify Translations Were Added

Run this query in SQL Editor to verify:
```sql
SELECT COUNT(*)
FROM translations
WHERE language_code = 'he'
  AND (translation_key LIKE 'lms.programs.%'
    OR translation_key LIKE 'lms.program_detail.%');
```

You should see a count showing how many Hebrew translations were added.

## Translation Keys Added

### Programs Page (20251117_lms_programs_translations.sql)
- Basic program info (title, subtitle, create button)
- Program actions (manage, edit, duplicate, delete)
- Program info labels (courses, students, weeks, max students)
- Dialog titles and descriptions
- Form fields and buttons
- Success/error messages

### Program Detail Page (20251117_lms_program_detail_translations.sql)
- Course management translations
- **NEW: Add courses dialog (bulk selection)**
  - `add_courses_title` - Dialog title
  - `add_courses_description` - Dialog description
  - `search_courses` - Search placeholder
  - `select_all` / `deselect_all` - Bulk action buttons
  - `courses_selected` - Selection count
  - `no_courses_found` / `no_available_courses` - Empty states
  - `add_courses_button` / `add_courses_count` - Action buttons
  - `courses_added` - Success message
- Student enrollment translations
- Instructor bridge link translations

## After Applying Migrations

1. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Switch language to Hebrew to see the translations
3. The Add Course dialog should now show Hebrew text when in Hebrew language mode
