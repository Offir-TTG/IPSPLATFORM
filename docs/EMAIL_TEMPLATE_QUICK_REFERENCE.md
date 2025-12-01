# Email Templates - Quick Reference

## 📋 Quick Links

| Location | URL/Path | Purpose |
|----------|----------|---------|
| **Template List UI** | `/admin/emails/templates` | View all email templates |
| **Template Editor UI** | `/admin/emails/templates/[id]` | Edit template (not yet implemented) |
| **Template Definitions** | `src/lib/email/systemTemplates.ts` | Default system templates |
| **Template Service** | `src/lib/email/emailService.ts` | Send template emails |
| **Template Engine** | `src/lib/email/templateEngine.ts` | Handlebars rendering |

---

## 🎯 How to Map Data to Email Templates

### Step 1: Define Template Variables

In `src/lib/email/systemTemplates.ts`:

```typescript
{
  key: 'enrollment.invitation',
  variables: [
    { name: 'userName', required: true, type: 'string' },
    { name: 'productName', required: true, type: 'string' },
    { name: 'enrollmentUrl', required: true, type: 'url' },
    { name: 'expiresIn', required: true, type: 'number' },
    // ... more variables
  ]
}
```

### Step 2: Map Data in API

In `src/app/api/admin/enrollments/[id]/send-link/route.ts`:

```typescript
const emailResult = await sendTemplateEmail({
  templateKey: product.enrollment_invitation_template_key || 'enrollment.invitation',
  variables: {
    userName: enrollmentUser.first_name || enrollmentUser.email.split('@')[0],
    productName: product.title,
    enrollmentUrl: `${APP_URL}/enroll/${token}`,
    expiresIn: Math.ceil((expiresAt - now) / (24*60*60*1000)),
    // ... map all required variables
  }
});
```

### Step 3: Use Variables in Template

In database (`email_template_versions.body_html`):

```html
<p>Hello {{userName}}!</p>
<h2>{{productName}}</h2>
<a href="{{enrollmentUrl}}">Enroll Now</a>
<p>Expires in {{expiresIn}} days</p>

{{#if totalAmount}}
  <p>Price: {{formatCurrency totalAmount currency}}</p>
{{/if}}
```

---

## 🔧 Common Tasks

### View Templates in Database

```sql
SELECT
  t.template_key,
  t.template_name,
  t.is_active,
  v.language_code,
  v.subject
FROM email_templates t
JOIN email_template_versions v ON t.id = v.template_id
WHERE v.is_current = true
ORDER BY t.template_category, t.template_name;
```

### Edit Template Subject

```sql
UPDATE email_template_versions
SET subject = 'New Subject: {{productName}}'
WHERE template_id = (
  SELECT id FROM email_templates
  WHERE template_key = 'enrollment.invitation'
  AND tenant_id = '<your-tenant-id>'
)
AND language_code = 'en'
AND is_current = true;
```

### Create Custom Template for Specific Product

```sql
-- 1. Create template
INSERT INTO email_templates (
  tenant_id,
  template_key,
  template_name,
  template_category,
  is_system,
  variables
) VALUES (
  '<your-tenant-id>',
  'enrollment.vip_program',
  'VIP Program Invitation',
  'enrollment',
  false,
  '[{"name":"userName","required":true,"type":"string"}]'::jsonb
);

-- 2. Add English version
INSERT INTO email_template_versions (
  template_id,
  language_code,
  subject,
  body_html,
  body_text
) VALUES (
  (SELECT id FROM email_templates WHERE template_key = 'enrollment.vip_program'),
  'en',
  '🌟 VIP Invitation: {{productName}}',
  '<div><!-- Your custom HTML --></div>',
  'Plain text version...'
);

-- 3. Assign to product
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.vip_program'
WHERE title = 'Executive Leadership Program';
```

### Test Email

```sql
-- Check last 5 sent emails
SELECT
  to_email,
  subject,
  status,
  error_message,
  sent_at,
  created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 5;

-- View template variables used
SELECT
  to_email,
  template_variables
FROM email_queue
WHERE template_id = (
  SELECT id FROM email_templates WHERE template_key = 'enrollment.invitation'
)
ORDER BY created_at DESC
LIMIT 1;
```

---

## 🎨 Template Syntax (Handlebars)

### Variables

```handlebars
{{variableName}}
```

### Conditionals

```handlebars
{{#if totalAmount}}
  Total: {{formatCurrency totalAmount currency}}
{{/if}}

{{#if paymentPlanName}}
  Plan: {{paymentPlanName}}
{{else}}
  Pay in full
{{/if}}
```

### Helpers

```handlebars
{{formatCurrency 299 "USD"}}        → $299.00
{{formatCurrency 1500 "ILS"}}       → ₪1,500.00
{{formatDate enrollmentDate "en"}}  → December 01, 2025
{{formatTime lessonTime "he"}}      → 14:30
```

### Comparisons

```handlebars
{{#if (gt expiresIn 5)}}
  Plenty of time!
{{/if}}

{{#if (eq productType "program")}}
  This is a program
{{/if}}
```

---

## 📊 Template Selection Flow

```
User Action: Admin clicks "Send Link" on enrollment
                    ↓
┌──────────────────────────────────────────────────────┐
│ 1. API: /api/admin/enrollments/[id]/send-link       │
│    - Fetches product details                         │
│    - Checks product.enrollment_invitation_template_key│
└───────────────────┬──────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│ 2. Template Selection Logic                         │
│                                                      │
│    if (product.enrollment_invitation_template_key) { │
│      templateKey = product.enrollment_invitation_template_key;│
│    } else {                                          │
│      templateKey = 'enrollment.invitation'; // default│
│    }                                                 │
└───────────────────┬──────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│ 3. emailService.sendTemplateEmail()                  │
│    - Fetches template from email_templates table     │
│    - Gets correct language version                   │
│    - Validates required variables                    │
└───────────────────┬──────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│ 4. templateEngine.renderEmailTemplate()              │
│    - Compiles Handlebars template                    │
│    - Substitutes variables                           │
│    - Generates HTML and plain text                   │
└───────────────────┬──────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│ 5. Email Sent                                        │
│    - Queued in email_queue table                     │
│    - Sent via SMTP                                   │
│    - Status tracked in database                      │
└──────────────────────────────────────────────────────┘
```

---

## 🗂️ Database Tables

### email_templates
```
id (UUID)
tenant_id (UUID)
template_key (TEXT) ← Unique identifier
template_name (TEXT)
template_category (TEXT) ← 'enrollment', 'payment', etc.
is_system (BOOLEAN)
is_active (BOOLEAN)
variables (JSONB) ← Array of variable definitions
```

### email_template_versions
```
id (UUID)
template_id (UUID) ← FK to email_templates
language_code (TEXT) ← 'en' or 'he'
subject (TEXT)
body_html (TEXT) ← Handlebars template
body_text (TEXT) ← Plain text version
is_current (BOOLEAN)
```

### products (new fields)
```
enrollment_invitation_template_key (TEXT) ← Custom template
enrollment_confirmation_template_key (TEXT)
enrollment_reminder_template_key (TEXT)
```

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `MIGRATION_TO_DATABASE_TEMPLATES.md` | Complete migration from hardcoded to database templates |
| `PRODUCT_EMAIL_TEMPLATE_SELECTION.md` | How to assign different templates to different products |
| `EMAIL_TEMPLATE_QUICK_REFERENCE.md` | This file - quick reference |

---

## 🚀 Next Steps

1. **Run migration**:
   ```bash
   npx supabase migration up
   ```

2. **Verify templates exist**:
   ```bash
   npx tsx scripts/seed-email-templates.ts
   ```

3. **Test enrollment flow**:
   - Create enrollment
   - Click "Send Link"
   - Check email received

4. **Customize templates** (optional):
   - Create custom template via SQL
   - Assign to specific products
   - Test with real enrollment

---

## 🆘 Support

- **Templates not showing**: Check `/admin/emails/templates` and run seed script
- **Wrong template used**: Verify `product.enrollment_invitation_template_key` value
- **Missing variables error**: Ensure all required variables are passed in API
- **Email not sending**: Check `email_queue` table for error messages

---

**Last Updated**: December 2025
