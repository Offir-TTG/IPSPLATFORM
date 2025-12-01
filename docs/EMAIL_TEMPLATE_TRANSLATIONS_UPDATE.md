# Email Template Name Translations - Update

## What Was Changed

Added Hebrew translations for email template names that appear in the product form's email template selector dropdowns.

## Files Modified

### 1. **EmailTemplateSelector Component**
**File:** `src/components/products/EmailTemplateSelector.tsx`

**Changes:**
- Added `getTemplateName()` helper function to translate template names
- Updated all three dropdowns to use translated names instead of raw `template.template_name`

**How It Works:**
```typescript
function getTemplateName(template: EmailTemplate): string {
  // Convert "enrollment.invitation" -> "email_template.enrollment_invitation.name"
  const translationKey = `email_template.${template.template_key.replace('.', '_')}.name`;
  return t(translationKey, template.template_name);
}
```

### 2. **Database Migration**
**File:** `supabase/migrations/20251202_email_template_name_translations.sql`

**Translations Added:**
| Template Key | English | Hebrew |
|--------------|---------|--------|
| `enrollment.confirmation` | Enrollment Confirmation | אישור הרשמה |
| `enrollment.invitation` | Enrollment Invitation | הזמנה להרשמה |

## How to Apply

1. **Run the migration:**
   ```bash
   # In Supabase SQL Editor, run:
   # supabase/migrations/20251202_email_template_name_translations.sql
   ```

2. **Test the UI:**
   - Go to `/admin/payments/products`
   - Create or edit a product
   - Click "Email Templates" tab
   - Change language to Hebrew
   - Verify dropdown shows: "אישור הרשמה" and "הזמנה להרשמה"

## Before & After

### Before
**English:** "Enrollment Invitation"
**Hebrew:** "Enrollment Invitation" ❌ (not translated)

### After
**English:** "Enrollment Invitation"
**Hebrew:** "הזמנה להרשמה" ✅ (translated)

## Adding More Template Translations

To add translations for future custom templates:

```sql
INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context)
VALUES
  (NULL, 'email_template.your_template_key.name', 'en', 'Your Template Name', 'admin'),
  (NULL, 'email_template.your_template_key.name', 'he', 'שם התבנית שלך', 'admin')
ON CONFLICT (translation_key, language_code, context) DO UPDATE
SET translation_value = EXCLUDED.translation_value;
```

Replace dots in template_key with underscores for the translation key.

---

**Implementation Date:** December 2025
**Status:** ✅ Complete
