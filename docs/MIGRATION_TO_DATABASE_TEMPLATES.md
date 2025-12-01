# Migration: Hardcoded → Database Email Templates

## ✅ Migration Complete

Enrollment emails now use **database templates** instead of hardcoded templates.

---

## What Changed

### Before (Hardcoded Templates)
```typescript
// Hardcoded template functions
import { getEnrollmentInvitationHtml, getEnrollmentInvitationText } from '@/lib/email/templates/enrollmentInvitation';

const html = getEnrollmentInvitationHtml(emailData, translations);
const text = getEnrollmentInvitationText(emailData, translations);
await sendEmailViaSMTP({ to, subject, html, text });
```

### After (Database Templates)
```typescript
// Database-driven templates
import { sendTemplateEmail } from '@/lib/email/emailService';

await sendTemplateEmail({
  tenantId: userData.tenant_id,
  templateKey: 'enrollment.invitation',
  to: user.email,
  language: 'en' | 'he',
  variables: { userName, productName, enrollmentUrl, ... },
  priority: 'high'
});
```

---

## Files Modified

### 1. `/src/app/api/admin/enrollments/[id]/send-link/route.ts`

**Changes**:
- ❌ Removed: `getEnrollmentInvitationHtml`, `getEnrollmentInvitationText`
- ❌ Removed: `sendEmailViaSMTP`
- ❌ Removed: `getServerTranslations`
- ✅ Added: `sendTemplateEmail` from `@/lib/email/emailService`
- ✅ Changed: Variable `expiresAt` (Date) → `expiresIn` (number of days)

**New Logic**:
```typescript
// Calculate days until expiration
const expiresIn = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

// Send using database template
const emailResult = await sendTemplateEmail({
  tenantId: userData.tenant_id,
  templateKey: 'enrollment.invitation',
  to: enrollmentUser.email,
  language: (language || 'en') as 'en' | 'he',
  variables: {
    userName: enrollmentUser.first_name || enrollmentUser.email.split('@')[0],
    productName: product.title,
    productType: product.type,
    organizationName: tenant?.name || 'IPS Platform',
    enrollmentUrl,
    expiresIn,  // ← Days (number) instead of Date
    totalAmount: enrollment.total_amount || 0,
    currency: enrollment.currency || 'USD',
    paymentPlanName: paymentPlan?.plan_name,
  },
  priority: 'high'
});
```

---

## Setup Required

### Step 1: Seed Email Templates

The templates are already defined in `src/lib/email/systemTemplates.ts`. Run the seeding script:

```bash
# Seed for all tenants
npx tsx scripts/seed-email-templates.ts

# Or seed for specific tenant
npx tsx scripts/seed-email-templates.ts <tenant-id>
```

This creates:
- `email_templates` record with key `enrollment.invitation`
- `email_template_versions` for English (en)
- `email_template_versions` for Hebrew (he)

### Step 2: Verify Templates Exist

**SQL Query**:
```sql
SELECT
  t.template_key,
  t.template_name,
  t.is_active,
  v.language_code,
  v.is_current
FROM email_templates t
JOIN email_template_versions v ON t.id = v.template_id
WHERE t.template_key = 'enrollment.invitation'
ORDER BY v.language_code;
```

**Expected Result**:
```
template_key           | template_name          | is_active | language_code | is_current
----------------------|------------------------|-----------|---------------|------------
enrollment.invitation | Enrollment Invitation  | true      | en            | true
enrollment.invitation | Enrollment Invitation  | true      | he            | true
```

---

## Template Structure

### Database Tables

**`email_templates`**:
```sql
id: uuid
tenant_id: uuid
template_key: 'enrollment.invitation'
template_name: 'Enrollment Invitation'
template_category: 'enrollment'
description: 'Sent when admin invites a user to enroll via enrollment link'
is_system: true
is_active: true
variables: jsonb (array of variable definitions)
```

**`email_template_versions`**:
```sql
id: uuid
template_id: uuid (FK to email_templates)
language_code: 'en' | 'he'
subject: 'You're Invited to Enroll in {{productName}}!'
body_html: '<div>HTML template with {{variables}}</div>'
body_text: 'Plain text version with {{variables}}'
version: 1
is_current: true
```

### Template Variables

| Variable | Type | Required | Description | Example |
|----------|------|----------|-------------|---------|
| `userName` | string | Yes | User first name | "John" |
| `productName` | string | Yes | Product title | "Web Dev Bootcamp" |
| `productType` | string | Yes | Product type | "program" |
| `organizationName` | string | Yes | Tenant name | "Tech Academy" |
| `enrollmentUrl` | url | Yes | Enrollment link | "https://..." |
| `expiresIn` | number | Yes | Days until expiration | 7 |
| `totalAmount` | currency | No | Price | 5000 |
| `currency` | string | No | Currency code | "ILS" |
| `paymentPlanName` | string | No | Payment plan | "4 monthly payments" |

---

## Benefits of Database Templates

### 1. **Admin Control**
✅ Admins can edit templates in UI (`/admin/emails/templates`)
✅ No code changes needed for content updates
✅ Instant template updates without deployment

### 2. **Version Control**
✅ Track all template changes
✅ Roll back to previous versions
✅ See who changed what and when

### 3. **Multi-Language Support**
✅ Separate versions for each language
✅ RTL layout built into Hebrew templates
✅ Easy to add new languages

### 4. **Email Analytics**
✅ Track open rates
✅ Track click rates
✅ Measure template effectiveness

### 5. **Email Queue**
✅ Reliable delivery with retry logic
✅ Scheduled sending capability
✅ Batch email support

### 6. **Testing**
✅ Preview templates in admin UI
✅ Send test emails
✅ A/B testing capability

---

## How to Edit Templates (Admin UI)

### Option 1: Via Web Interface

1. **Navigate to Email Templates**:
   ```
   /admin/emails/templates
   ```

2. **Find Template**:
   - Locate "Enrollment Invitation"
   - Click "Edit" button

3. **Edit Content**:
   - Modify subject line
   - Edit HTML body (visual or code editor)
   - Update plain text version
   - Use Handlebars syntax: `{{variableName}}`

4. **Preview**:
   - Click "Preview"
   - Fill in test data
   - View rendered email

5. **Save**:
   - Creates new version
   - Previous version archived
   - New version becomes current

### Option 2: Via SQL

```sql
-- Update English subject
UPDATE email_template_versions
SET
  subject = 'New Subject: {{productName}}',
  updated_at = NOW()
WHERE template_id = (
  SELECT id FROM email_templates
  WHERE template_key = 'enrollment.invitation'
  AND tenant_id = '<your-tenant-id>'
)
AND language_code = 'en'
AND is_current = true;
```

---

## Variable Usage (Handlebars Syntax)

### Basic Variable
```html
<p>Hello {{userName}},</p>
```

### Conditional
```html
{{#if totalAmount}}
  <p>Total: {{formatCurrency totalAmount currency}}</p>
{{/if}}
```

### Loop
```html
{{#each items}}
  <li>{{this.name}}</li>
{{/each}}
```

### Helpers
```html
<!-- Format currency -->
{{formatCurrency 5000 "ILS"}} → ₪5,000

<!-- Format date -->
{{formatDate enrollmentDate language}} → Dec 01, 2025

<!-- Product type translation -->
{{productType}} → Uses translation key "productType.program"
```

---

## Testing

### Test Email Sending

**1. Via Admin UI**:
```
/admin/emails/templates → Select template → Preview → Send Test Email
```

**2. Via API**:
```typescript
await sendTemplateEmail({
  tenantId: 'test-tenant-id',
  templateKey: 'enrollment.invitation',
  to: 'test@example.com',
  language: 'en',
  variables: {
    userName: 'Test User',
    productName: 'Test Course',
    productType: 'course',
    organizationName: 'Test Org',
    enrollmentUrl: 'http://localhost:3000/enroll/test-token',
    expiresIn: 7,
    totalAmount: 1000,
    currency: 'USD',
  },
  priority: 'normal'
});
```

### Verify Email Queue

```sql
-- Check queued emails
SELECT
  id,
  to_email,
  subject,
  status,
  created_at,
  sent_at
FROM email_queue
WHERE template_id = (
  SELECT id FROM email_templates
  WHERE template_key = 'enrollment.invitation'
)
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue 1: Template Not Found

**Error**: `Template not found: enrollment.invitation`

**Solution**:
```bash
# Run seeding script
npx tsx scripts/seed-email-templates.ts
```

### Issue 2: Missing Variables

**Error**: `Missing required variables: userName, productName`

**Solution**: Ensure all required variables are passed:
```typescript
variables: {
  userName: 'Required',  // ← Must provide
  productName: 'Required',  // ← Must provide
  productType: 'Required',  // ← Must provide
  // ... all required variables
}
```

### Issue 3: Email Not Sending

**Check**:
1. SMTP configuration in `.env.local`
2. Email queue status
3. Error logs in `email_queue` table

```sql
SELECT
  status,
  error_message,
  attempts
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Rollback (If Needed)

If you need to temporarily go back to hardcoded templates:

1. **Revert API changes**:
```bash
git revert <commit-hash>
```

2. **Or manually restore**:
```typescript
// In route.ts
import { getEnrollmentInvitationHtml, getEnrollmentInvitationText } from '@/lib/email/templates/enrollmentInvitation';
import { sendEmailViaSMTP } from '@/lib/email/smtp';

// Use old logic
const html = getEnrollmentInvitationHtml(emailData, translations);
await sendEmailViaSMTP({ to, subject, html, text });
```

---

## Future Templates to Migrate

Other templates still using hardcoded approach (if any):
- Payment receipts
- Lesson reminders
- Password reset
- etc.

Use same migration pattern for each.

---

## Summary

✅ **Completed**:
- Migrated enrollment invitation email to database templates
- Updated send-link API
- Removed hardcoded template dependencies
- Variables mapped correctly
- Multi-language support maintained

✅ **Benefits**:
- Admins can edit templates without code changes
- Version control for all template changes
- Email analytics tracking
- Better testing and preview capabilities

✅ **Ready to Use**:
- Run seed script: `npx tsx scripts/seed-email-templates.ts`
- Test enrollment flow
- Edit templates in admin UI: `/admin/emails/templates`

---

**Migration Date**: December 2025
**Status**: ✅ Complete
