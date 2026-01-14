# Grading System Setup Instructions

## Step-by-Step Setup

Follow these steps in order to set up the complete grading system:

### Step 1: Create Database Tables

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `run-this-sql.sql` (in the root directory)
4. Copy all the contents
5. Paste into the SQL Editor
6. Click **RUN**

This will create 8 tables:
- `grading_scales` - Grading scale definitions (A-F, Pass/Fail, etc.)
- `grade_ranges` - Grade ranges within each scale (A = 90-100, B = 80-89, etc.)
- `grade_categories` - Category weights (Homework 20%, Exams 50%, etc.)
- `course_grading_config` - Per-course grading configuration
- `assignment_grades` - Individual assignment grades
- `course_grades` - Final course grades
- `grade_history` - Audit trail of all grade changes
- `student_gpa` - Cumulative GPA tracking

### Step 2: Add Translations

After the tables are created, add the UI translations:

1. Still in **SQL Editor**
2. Open the file: `supabase/SQL Scripts/20251215_grading_translations.sql`
3. Copy all the contents
4. Paste into the SQL Editor
5. Click **RUN**

You should see: ✅ All grading translations added successfully!

This adds translations for:
- Navigation link ("Grading")
- Grading Scales page (title, subtitle, buttons)
- Create Scale dialog (form fields, labels)
- Scale types (Letter, Numeric, Pass/Fail, Custom)
- All UI text in both English and Hebrew

### Step 3: (Optional) Setup Default Grading Scale

To automatically create a standard A-F grading scale with all grade ranges:

```bash
npx tsx scripts/setup-default-grading-scale.ts
```

This will create:
- A "Standard Letter Grade (A-F)" scale with 13 grade ranges
- From A+ (97-100) down to F (0-59)
- With proper GPA values (4.0 for A down to 0.0 for F)
- Color-coded ranges
- Set as the default scale

### Step 4: Verify Everything Works

1. Navigate to: http://localhost:3000/admin/grading/scales
2. You should see:
   - "Grading" link in the admin sidebar under "Learning"
   - The Grading Scales page loads without errors
   - If you ran step 3, you'll see the default scale
   - "Create Scale" button works and opens a dialog
3. Try creating a new grading scale:
   - Click "Create Scale"
   - Fill in the form
   - Click "Create"
   - Should see success message

## What You Can Do Now

After setup, you can:

✅ **Create multiple grading scales** for different course types
✅ **Define custom grade ranges** for each scale
✅ **Set one scale as default** for new courses
✅ **Manage active/inactive scales**
✅ **Configure course-specific grading** (coming soon in course settings)
✅ **Grade assignments** (UI coming soon)
✅ **Track student progress** (UI coming soon)

## Troubleshooting

**500 Error when creating a scale?**
- Make sure you ran Step 1 first to create the database tables
- Check Supabase logs for the specific error

**Translations not showing?**
- Make sure you ran Step 2
- Check that your tenant_id in the SQL file matches your actual tenant_id
- Clear your browser cache

**"Table doesn't exist" error?**
- You need to run the schema SQL (Step 1) first
- Check Supabase Table Editor to verify tables were created

## Files Reference

- `run-this-sql.sql` - Complete database schema (Step 1)
- `supabase/SQL Scripts/20251215_grading_translations.sql` - All UI translations (Step 2)
- `scripts/setup-default-grading-scale.ts` - Default scale setup (Step 3)
- `src/app/admin/grading/scales/page.tsx` - Grading Scales UI page
- `src/app/api/admin/grading/scales/route.ts` - API endpoints
- `src/types/grading.ts` - TypeScript type definitions
- `src/lib/grading/gradeCalculator.ts` - Grade calculation engine
- `docs/GRADING_SYSTEM_OVERVIEW.md` - Full system documentation
