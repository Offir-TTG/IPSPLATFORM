# Email Template Find & Replace - Complete

## ✅ Feature Complete

The email template editor now includes a powerful find & replace tool that allows you to search and replace text within your email templates.

## 🔍 Features

### 1. **Collapsible Find & Replace Panel**
   - Expandable/collapsible card to save space
   - Click the header to toggle visibility
   - Visual indicators (chevron up/down icons)

### 2. **Smart Text Replacement**
   - **Find**: Search for any text string
   - **Replace**: Specify replacement text
   - **Replace Next**: Replace the first occurrence found
   - **Replace All**: Replace all occurrences at once

### 3. **Scope: Current Language Only**
   - Searches only in the active language tab (English or Hebrew)
   - Searches across:
     - Subject line
     - HTML body
     - Plain text body
   - Displays notification showing which language is being searched

### 4. **Real-time Feedback**
   - Toast notifications showing replacement count
   - "Replaced 1 occurrence" for single replacement
   - "Replaced X occurrence(s)" for bulk replacement

## 📝 How to Use

### Step 1: Navigate to Template Editor
Go to `/admin/emails/templates` and click "Edit" on any template.

### Step 2: Expand Find & Replace
Click on the "Find & Replace" card header to expand the panel.

### Step 3: Enter Search Text
- Type the text you want to find in the "Find" field
- Type the replacement text in the "Replace with" field

### Step 4: Choose Replacement Method
- **Replace Next**: Replaces the first occurrence only
- **Replace All**: Replaces all occurrences in subject, HTML body, and plain text

### Step 5: Save Changes
After replacing text, click "Save Changes" to persist your edits.

## 🎯 Use Cases

### Example 1: Update Organization Name
```
Find: "Old Company Name"
Replace with: "New Company Name"
Action: Replace All
```

### Example 2: Fix Typos
```
Find: "recieve"
Replace with: "receive"
Action: Replace All
```

### Example 3: Update URLs
```
Find: "http://old-domain.com"
Replace with: "https://new-domain.com"
Action: Replace All
```

### Example 4: Change Variable Names
```
Find: "{{userName}}"
Replace with: "{{userFullName}}"
Action: Replace All
```

## 🛡️ Safety Features

1. **Language Isolation**: Only affects the currently selected language tab
2. **Preview Before Save**: Changes are made to the form but not saved until you click "Save Changes"
3. **Undo Support**: You can reload the page to discard unsaved changes
4. **Exact Matching**: Uses literal string matching (not regex) for safety

## 🔧 Technical Details

### Text Matching
- Uses JavaScript's `String.replace()` with escaped special characters
- Case-sensitive matching
- Literal string matching (not regex patterns)

### Replacement Algorithm
```typescript
function handleFindReplace(replaceAll: boolean) {
  // 1. Escape special regex characters in find text
  // 2. Create regex with global flag if replaceAll = true
  // 3. Search in: subject, body_html, body_text
  // 4. Count replacements
  // 5. Update form data
  // 6. Show toast notification
}
```

### UI Components
- **Collapsible Card**: Uses useState for expand/collapse
- **Icons**: Search, RefreshCw, ChevronDown, ChevronUp from lucide-react
- **RTL Support**: Proper icon spacing and text direction
- **Mobile Responsive**: Buttons stack vertically on mobile

## 📋 Files Modified

### 1. **[src/app/admin/emails/templates/[id]/page.tsx](src/app/admin/emails/templates/[id]/page.tsx)**
   - Added find & replace state variables
   - Added `handleFindReplace()` function
   - Added collapsible Find & Replace card UI
   - Imported new icons (Search, RefreshCw, ChevronDown, ChevronUp)

### 2. **[supabase/migrations/20251202_find_replace_translations.sql](supabase/migrations/20251202_find_replace_translations.sql)**
   - 28 translation keys (14 in English, 14 in Hebrew)
   - Includes: headers, labels, buttons, messages, and notes

## 🌐 Translations Added

All text is fully bilingual:
- Find & Replace → חיפוש והחלפה
- Find → חפש
- Replace with → החלף עם
- Replace Next → החלף הבא
- Replace All → החלף הכל
- Text to find → טקסט לחיפוש
- Replacement text → טקסט להחלפה

## 📋 Migration Required

Execute this migration to add the find & replace translations:

```bash
supabase/migrations/20251202_find_replace_translations.sql
```

## ✨ Benefits

- **Efficiency**: Quickly update text across multiple sections
- **Accuracy**: Replaces exact matches without human error
- **Bulk Operations**: Replace all occurrences with one click
- **User-Friendly**: Simple, intuitive interface
- **Safe**: Preview changes before saving
- **Bilingual**: Works seamlessly in both English and Hebrew

---

**Status**: ✅ Ready for use
**Last Updated**: 2025-12-01
