# Setup Instructions for Dynamic Theme System

## Prerequisites
Before testing the theme system, you need to:

1. **Be logged in as an admin user**
   - The 401 error you're seeing is because the API requires admin authentication
   - Make sure you're logged in with an admin account

## Step 1: Run Database Migrations

### 1.1 Run Theme Configuration Schema
```bash
npx supabase db execute --file src/lib/supabase/theme-config-schema.sql
```

This creates:
- `theme_configs` table
- Indexes and RLS policies
- Default theme with default colors
- Helper function `activate_theme()`

### 1.2 Run Navigation Translations
```bash
npx supabase db execute --file src/lib/supabase/admin-navigation-translations.sql
```

This fixes:
- Sidebar navigation translation mismatches
- Ensures sidebar items match page titles in both English and Hebrew

## Step 2: Verify Database

Check that the table was created:
```sql
SELECT * FROM theme_configs;
```

You should see one row with `theme_name = 'default'` and `is_active = true`.

## Step 3: Test the System

### 3.1 Test Theme Loading (Public)
1. Open your browser to http://localhost:3000
2. Open Developer Tools → Console
3. You should NOT see any errors about theme loading
4. The ThemeProvider will silently load the active theme

### 3.2 Test Theme API (Admin Required)
1. Make sure you're logged in as an admin
2. Navigate to http://localhost:3000/admin/settings/theme
3. You should see the theme configuration page

If you see 401 errors:
- You're not logged in, or
- Your user role is not 'admin'

## Step 4: Create a Simple Admin User (If Needed)

If you don't have an admin user, you can create one directly in Supabase:

```sql
-- First, sign up through your app to create a user
-- Then, update their role:
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Expected Behavior

### After Running Migrations:

1. **Theme Provider (All Pages)**
   - Automatically loads theme colors from database
   - Applies them as CSS variables
   - Works for both light and dark modes
   - No errors in console

2. **Admin Theme Page** (Once implemented)
   - Shows color pickers for all theme variables
   - Allows switching between light/dark mode editing
   - Preview button to see changes temporarily
   - Save button to apply changes permanently

3. **All Pages**
   - Automatically use dynamic theme colors
   - No code changes needed
   - Respects light/dark mode preference

## Troubleshooting

### Error: "401 Unauthorized"
**Cause:** Not logged in as admin
**Solution:** Log in with an admin account

### Error: "PGRST116" or "No rows returned"
**Cause:** Theme table doesn't exist or no active theme
**Solution:** Run the database schema SQL file

### Error: "Failed to fetch theme"
**Cause:** API endpoint issue or network problem
**Solution:**
1. Check that Next.js dev server is running
2. Check browser console for specific error
3. Verify `/api/theme` endpoint exists

### Colors Not Changing
**Cause:** Theme provider not integrated or CSS cache
**Solution:**
1. Verify ThemeProvider is in layout.tsx (already done ✓)
2. Hard refresh browser (Ctrl+Shift+R)
3. Check that theme_configs table has data

## Current Status

✅ **Completed:**
- Database schema created
- API endpoints implemented
- Theme Provider component created
- Theme Provider integrated into app layout
- Navigation translations SQL file created
- Documentation written

⏳ **Pending:**
- Run database migrations
- Test authentication as admin
- Implement color picker UI (optional - can be done later)

## Next Steps

1. Run both SQL files
2. Log in as admin
3. Test that `/api/admin/theme` returns theme data
4. Optionally create the color picker UI for `/admin/settings/theme`

The system is ready to use! Just need to run the SQL files and ensure you're authenticated as an admin.
