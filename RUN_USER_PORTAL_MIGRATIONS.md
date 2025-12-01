# Run User Portal Translation Migrations

## Problem
Translation keys are showing as raw text (e.g., `user.profile.subtitle`) because the SQL migrations haven't been executed in your Supabase database yet.

## Solution: Run Migrations in Supabase Dashboard

### Step 1: Access Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Execute Migration Files in Order

Run these 4 migration files in the Supabase SQL Editor (copy/paste the contents):

#### Migration 1: User Portal Pages (236 keys)
**File:** `supabase/migrations/20251124000001_user_portal_pages_translations.sql`
**Contains:** Dashboard, Programs, Courses, Notifications, Profile, Reports, Chat, Payments pages

#### Migration 2: Missing Portal Keys (41 keys)
**File:** `supabase/migrations/20251124000002_user_portal_missing_translations.sql`
**Contains:** Additional keys for Programs (12), Courses (21), Notifications (8)

#### Migration 3: Base Profile Keys (56 keys)
**File:** `supabase/migrations/20251124000000_user_profile_translations.sql`
**Contains:** Profile page tabs, contact info, billing, security, preferences

#### Migration 4: Profile Missing Keys (8 keys)
**File:** `supabase/migrations/20251124000003_user_profile_missing_translations.sql`
**Contains:** Role badges, billing cycles, payment status values

### Step 3: Clear Translation Cache

After running all migrations, clear the translation cache:

```bash
curl -X POST http://localhost:3000/api/translations
```

### Step 4: Refresh Browser

Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R) to see the translations.

## Expected Results

After running all migrations:
- **Total Keys Added:** 341 translation keys
- **Total Rows Inserted:** 682 rows (341 keys × 2 languages)
- All user portal pages will display in English and Hebrew
- RTL layout will work correctly for Hebrew

## Troubleshooting

If translations still don't appear:
1. Verify migrations ran successfully (check for NOTICE messages in SQL editor)
2. Verify you have a tenant in the `tenants` table
3. Clear browser cache completely
4. Check browser console for any errors

## Migration Summary

| File | Keys | Description |
|------|------|-------------|
| 20251124000000 | 56 | Profile page base translations |
| 20251124000001 | 236 | All user portal pages |
| 20251124000002 | 41 | Missing Programs, Courses, Notifications keys |
| 20251124000003 | 8 | Profile role, billing cycle, payment status |
| **TOTAL** | **341** | **Complete user portal translation coverage** |
