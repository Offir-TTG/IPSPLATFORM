# Email Template Category Selector - Complete

## ✅ Implementation Complete

The email template editor now includes a category selector that allows you to change the template's category (badge) directly from the editor. Save notifications and preview functionality are also working.

## 🔍 Features

### 1. **Category Selector**
   - Visual grid of all available categories
   - Click on any category badge to select it
   - Selected category is highlighted with a border
   - Categories load from custom configuration in settings
   - Falls back to default categories if no custom config exists

### 2. **Live Preview**
   - Header badge updates instantly when you select a new category
   - Shows custom labels (English or Hebrew based on language)
   - Uses custom colors from settings

### 3. **Save Behavior**
   - Category is saved to database when you click "Save Changes"
   - Shows a message when category has changed but not yet saved
   - Updates template metadata in `email_templates` table
   - Updates both English and Hebrew versions separately
   - Shows success/error toast notifications using Sonner

### 4. **Integration with Settings**
   - Uses the same category configuration from Email Settings page
   - Custom categories, labels, and colors are respected
   - Consistent badge appearance across all pages

### 5. **Toast Notifications**
   - Success notification when template is saved
   - Error notification if save fails
   - Uses `sonner` toast library (already configured in root layout)
   - Notifications appear at top-right of screen

### 6. **Preview Dialog**
   - Click Preview button to see how the email will look
   - Shows subject, HTML preview, and plain text preview
   - Respects active language (English or Hebrew)
   - Full-screen modal with proper RTL/LTR support
   - Theme design system styling

### 7. **RTL/LTR Direction Support**
   - English email content displays in LTR mode
   - Hebrew email content displays in RTL mode
   - Direction is based on content language, not interface language
   - Proper text alignment for each language
   - Container-level direction control for consistent behavior

## 📝 Changes Made

### 1. **Removed Find & Replace Feature**
   - Removed state variables (findText, replaceText, findReplaceExpanded)
   - Removed `handleFindReplace()` function
   - Removed find & replace UI card
   - Removed unused icon imports (Search, RefreshCw, ChevronDown, ChevronUp)

### 2. **Added Category Selector**
   - Added `CategoryConfig` interface
   - Added `DEFAULT_CATEGORIES` constant
   - Added `categories` state to store loaded categories
   - Added `selectedCategory` state to track selected category
   - Added `loadCategories()` function to fetch custom categories from settings
   - Added `getCategoryColor()` helper to get badge colors
   - Added `getCategoryLabel()` helper to get category labels (bilingual)
   - Updated `loadTemplate()` to set initial selected category
   - Updated `handleSave()` to save category changes

### 3. **Updated UI with Theme Design System**
   - New "Template Category" card with visual category selector
   - **Theme CSS Variables Used**:
     - Typography: `var(--font-family-heading)`, `var(--font-size-lg)`, `var(--font-weight-semibold)`
     - Colors: `hsl(var(--text-heading))`, `hsl(var(--muted-foreground))`, `hsl(var(--primary))`, `hsl(var(--border))`
     - Border radius: `var(--border-radius-lg)`
   - Grid layout showing all available categories as clickable badges
   - Active category highlighted with `hsl(var(--primary))` border and background
   - Hover effect with `hsl(var(--primary) / 0.5)` border
   - Mobile responsive grid (2 columns on mobile, auto-fill on desktop)
   - Change indicator message when category is modified
   - Header badge now shows selected category (live update)
   - Removed duplicate "System" badge - only showing category badge
   - `suppressHydrationWarning` on all translated text elements

### 4. **Fixed RTL/LTR Direction**
   - Added `dir` attribute to `TabsContent` wrapper (container level)
   - English tab: `dir="ltr"` with left text alignment
   - Hebrew tab: `dir="rtl"` with right text alignment
   - Direction based on content language, not interface language
   - Preview dialog also respects content direction

### 5. **Fixed Toast Notifications**
   - Switched from shadcn/ui `useToast` to `sonner` library
   - Changed import: `import { toast } from 'sonner';`
   - Updated all toast calls: `toast.success()` and `toast.error()`
   - Sonner's `<Toaster />` already configured in root layout

### 6. **Fixed Database Save Error**
   - Removed `updated_at` field from update query
   - `email_template_versions` table only has `created_at`, not `updated_at`
   - Update query now only updates: `subject`, `body_html`, `body_text`

## 📋 Files Modified

### [src/app/admin/emails/templates/[id]/page.tsx](src/app/admin/emails/templates/[id]/page.tsx)
**Changes**:
- Line 17: Changed from `useToast` to `import { toast } from 'sonner';`
- Lines 29-74: Added `CategoryConfig` interface and `DEFAULT_CATEGORIES`
- Lines 100-101: Added category-related state variables
- Line 101: Added `showPreview` state for preview dialog
- Lines 118-146: Added `loadCategories()` function
- Line 162: Set `selectedCategory` when template loads
- Lines 207-215: Save category changes in `handleSave()`
- Lines 231-238: Fixed save by removing `updated_at` field from update query
- Lines 248-249: Updated to use `toast.success()` from sonner
- Lines 252-253: Updated to use `toast.error()` from sonner
- Lines 256-271: Updated `getCategoryColor()` and added `getCategoryLabel()`
- Line 328: Removed duplicate "System" badge, kept only category badge
- Lines 333-334: Updated header badge to use selected category
- Lines 403-443: Replaced find & replace UI with category selector
- Line 489: Added `dir={lang === 'he' ? 'rtl' : 'ltr'}` to TabsContent wrapper
- Lines 582-680: Added preview dialog with RTL/LTR support

## 🗄️ Database Operations

### Update Template Category
When saving a template with a changed category:
```sql
UPDATE email_templates
SET template_category = 'new_category_value'
WHERE id = 'template_id';
```

### Update Template Versions
When saving template content (English and Hebrew):
```sql
UPDATE email_template_versions
SET
  subject = 'new_subject',
  body_html = 'new_html_content',
  body_text = 'new_text_content'
WHERE id = 'version_id';
```
**Note**: Do NOT include `updated_at` field - it doesn't exist in the schema.

### Load Custom Categories
```sql
SELECT settings
FROM tenant_settings
WHERE tenant_id = ?
  AND setting_key = 'email_categories';
```

## 🎨 How to Use

### Step 1: Navigate to Template Editor
Go to `/admin/emails/templates` and click "Edit" on any template.

### Step 2: Scroll to Category Section
Find the "Template Category" card below the variables section.

### Step 3: Select a Category
Click on any category badge to select it. The selected category will have:
- A colored border
- A light background tint
- The header badge updates instantly

### Step 4: Save Changes
Click "Save Changes" to persist the category change to the database.

## 🌐 Translations

All text is fully bilingual (English/Hebrew):
- Template Category → קטגוריית תבנית
- Organize your email template by selecting a category → ארגן את תבנית האימייל שלך על ידי בחירת קטגוריה
- Category → קטגוריה
- Category will be updated when you save → הקטגוריה תתעדכן כשתשמור

## 📋 Migration Required

Execute this migration to add the category editor translations:

```bash
supabase/migrations/20251202_email_editor_category_translations.sql
```

## ✨ Benefits

- **Flexibility**: Change template categories without touching the database
- **Visual**: See all available categories at a glance
- **Consistent**: Uses the same category config as the settings page
- **User-Friendly**: Click to select, visual feedback
- **Bilingual**: Category labels in both English and Hebrew
- **Live Preview**: See badge change before saving
- **Proper Direction**: English content in LTR, Hebrew content in RTL
- **Toast Notifications**: Instant feedback on save success/failure
- **Preview Dialog**: See how emails will look before sending

## 🐛 Issues Fixed

1. **Wrong Feature Implementation**: Removed find & replace, added category selector
2. **Duplicate Badges**: Removed "System" badge, kept only category badge
3. **Toast Notifications Not Working**: Switched from shadcn/ui to sonner library
4. **RTL/LTR Direction**: Fixed English content showing RTL by adding `dir` to container
5. **Database Save Error**: Removed non-existent `updated_at` field from update query

---

**Status**: ✅ Ready for use
**Last Updated**: 2025-12-02
