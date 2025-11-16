# Dynamic Theme Configuration System

## Overview
Complete system for managing theme colors through the admin UI without editing CSS files.

## Components Created

### 1. Database Schema
**File:** `src/lib/supabase/theme-config-schema.sql`

- Creates `theme_configs` table with all color variables for light and dark modes
- Stores colors in HSL format (same as CSS variables)
- Includes function to activate themes
- RLS policies for admin access

**To Run:**
```bash
# Execute the SQL file in Supabase
npx supabase db execute --file src/lib/supabase/theme-config-schema.sql
```

### 2. API Endpoints
**Files:**
- `src/app/api/theme/route.ts` - Public endpoint to fetch active theme
- `src/app/api/admin/theme/route.ts` - Admin CRUD operations for themes

**Methods:**
- GET - Fetch theme configurations (admin: all themes, public: active theme only)
- POST - Create new theme configuration
- PUT - Update existing theme
- DELETE - Delete theme (cannot delete active theme)

### 3. Theme Provider Component
**File:** `src/components/ThemeProvider.tsx`

- Client component that fetches active theme from API
- Dynamically injects CSS variables into :root and .dark
- Runs on page load for all users
- **Already integrated** into `src/app/layout.tsx`

### 4. Color Picker UI (Need to Create)
**File:** `src/app/admin/settings/theme/page.tsx` (needs to be replaced)

The new page should include:
- Toggle between Light and Dark mode editing
- Color pickers for all theme variables
- Real-time preview button
- Save functionality
- HSL ↔ HEX conversion helpers

## How It Works

1. **Database** stores theme configurations in HSL format
2. **API** serves active theme to all pages
3. **ThemeProvider** fetches and injects CSS variables on page load
4. **Admin UI** allows editing colors with visual color pickers
5. **All pages** automatically use the dynamic theme via CSS variables

## Color Variables Structure

### Light Mode:
- `light_background`, `light_foreground`
- `light_card`, `light_card_foreground`
- `light_primary`, `light_primary_foreground`
- `light_secondary`, `light_secondary_foreground`
- `light_muted`, `light_muted_foreground`
- `light_accent`, `light_accent_foreground`
- `light_destructive`, `light_destructive_foreground`
- `light_success`, `light_success_foreground`
- `light_warning`, `light_warning_foreground`
- `light_info`, `light_info_foreground`
- `light_border`, `light_input`, `light_ring`

### Dark Mode:
- Same structure as light mode but prefixed with `dark_`

### Common:
- `border_radius` - Controls corner rounding

## Next Steps

1. **Run the database schema** to create the `theme_configs` table
2. **Replace theme settings page** with the new color picker UI
3. **Test the system**:
   - Change colors in admin UI
   - Save and verify changes apply site-wide
   - Test both light and dark modes
   - Verify preview functionality

## Benefits

✅ **No CSS file editing** - All colors managed through UI
✅ **Real-time preview** - See changes before saving
✅ **Separate light/dark** - Different colors for each mode
✅ **Automatic application** - All pages use dynamic theme
✅ **Type-safe** - TypeScript interfaces for theme config
✅ **Admin-only** - Protected by RLS policies

## Files Modified

1. `src/app/layout.tsx` - Added ThemeProvider wrapper
2. `src/app/api/admin/theme/route.ts` - Completely rewritten for new schema
3. `src/components/ThemeProvider.tsx` - Created new
4. `src/app/api/theme/route.ts` - Created new public endpoint
5. `src/lib/supabase/theme-config-schema.sql` - Created new

## Files Still Need Work

1. `src/app/admin/settings/theme/page.tsx` - Replace with color picker UI
2. Navigation translations SQL - Run to fix sidebar/page title mismatches

## Usage Example

### For Admins:
1. Navigate to Admin → Theme & Design
2. Toggle between Light/Dark mode
3. Click on any color to open color picker
4. Adjust colors using picker or HSL values
5. Click "Preview" to see changes temporarily
6. Click "Save" to apply permanently

### For All Pages:
- Pages automatically load theme on mount
- CSS variables are injected dynamically
- No code changes needed in individual pages
- Works with both light and dark modes
