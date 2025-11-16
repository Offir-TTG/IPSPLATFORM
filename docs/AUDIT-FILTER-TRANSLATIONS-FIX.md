# Audit Filter Translations Fix

## Issue
The audit filter component category tabs are not translated because the translation keys are missing from the database.

## Missing Translation Keys

The following translation keys are used in the AuditFilters component but don't exist in the database:

- `admin.audit.filters.filters` - "Filters" button label
- `admin.audit.filters.allCategories` - "All Categories" tab
- `admin.audit.filters.category.security` - Security category
- `admin.audit.filters.category.auth` - Authentication category
- `admin.audit.filters.category.config` - Configuration category
- `admin.audit.filters.category.data` - Data category
- `admin.audit.filters.category.admin` - Admin category
- `admin.audit.filters.category.studentRecord` - Student Records category
- `admin.audit.filters.category.grade` - Grades category
- `admin.audit.filters.category.attendance` - Attendance category

## Fix

Run the SQL file to add the missing translations:

```bash
# Location of the SQL file
src/lib/supabase/audit-filter-translations.sql
```

## What the SQL Does

1. **Adds UI text keys** for all category labels and the filters button
2. **Adds Hebrew translations** for all category tabs
3. **Adds English translations** for all category tabs
4. **Verifies** the translations were added correctly

## How to Apply

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `audit-filter-translations.sql`
3. Run the SQL
4. Refresh your admin audit page
5. The category tabs should now be properly translated

## Expected Result

After running the SQL:
- Category tabs will display in Hebrew when Hebrew is selected
- Category tabs will display in English when English is selected
- All filter UI elements will be properly translated

## Files Modified

- Created: `src/lib/supabase/audit-filter-translations.sql` - SQL to add missing translations
- Already exists: `src/components/audit/AuditFilters.tsx` - Using the translation keys (no changes needed)
