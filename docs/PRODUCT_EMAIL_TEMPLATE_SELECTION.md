# Product-Specific Email Templates

## Overview

Each product can now have **custom email templates** for enrollment communications. This allows you to send different emails based on the product type, target audience, or business requirements.

---

## How It Works

### Template Selection Priority

When sending an enrollment email, the system uses this priority:

```
1. Product-Specific Template (if configured)
   ↓
2. Default Template (enrollment.invitation)
```

**Example Flow**:
```typescript
// Product A: Uses custom template
product_a.enrollment_invitation_template_key = 'enrollment.vip_program'
// → Sends using "enrollment.vip_program" template

// Product B: No custom template
product_b.enrollment_invitation_template_key = null
// → Sends using default "enrollment.invitation" template
```

---

## Database Schema

### Products Table - New Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `enrollment_invitation_template_key` | TEXT | Template for admin-sent enrollment invitations | `'enrollment.vip_program'` |
| `enrollment_confirmation_template_key` | TEXT | Template for enrollment completion confirmations | `'enrollment.workshop_confirmation'` |
| `enrollment_reminder_template_key` | TEXT | Template for enrollment reminders | `'enrollment.deadline_reminder'` |

**Default Behavior**: If `NULL`, uses default templates:
- Invitation: `enrollment.invitation`
- Confirmation: `enrollment.confirmation`
- Reminder: `enrollment.reminder`

---

## Use Cases

### Use Case 1: Premium vs Standard Programs

**Scenario**: You offer both premium and standard programs with different branding.

**Setup**:

1. **Create two templates**:
```sql
-- Premium program template
INSERT INTO email_templates (tenant_id, template_key, template_name, template_category, is_system)
VALUES (
  '<your-tenant-id>',
  'enrollment.premium_invitation',
  'Premium Program Invitation',
  'enrollment',
  false
);

-- Standard program template
INSERT INTO email_templates (tenant_id, template_key, template_name, template_category, is_system)
VALUES (
  '<your-tenant-id>',
  'enrollment.standard_invitation',
  'Standard Program Invitation',
  'enrollment',
  false
);
```

2. **Assign templates to products**:
```sql
-- Premium product
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.premium_invitation'
WHERE title = 'Executive Leadership Program';

-- Standard product
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.standard_invitation'
WHERE title = 'Basic Web Development';
```

3. **Result**:
   - Premium enrollments get VIP-styled emails with executive language
   - Standard enrollments get friendly, accessible emails

---

### Use Case 2: Different Languages/Markets

**Scenario**: You have products targeting different markets (e.g., US corporate vs Israeli startups).

**Setup**:

```sql
-- US Corporate template (formal English)
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.corporate_us'
WHERE type = 'program' AND target_market = 'us_corporate';

-- Israeli Startup template (casual Hebrew)
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.startup_il'
WHERE type = 'program' AND target_market = 'il_startup';
```

---

### Use Case 3: Free vs Paid Products

**Scenario**: Free trials need simpler emails, paid products need payment details.

**Setup**:

```sql
-- Free products - simple invitation
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.free_trial'
WHERE payment_model = 'free';

-- Paid products - detailed payment info
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.paid_detailed'
WHERE payment_model IN ('one_time', 'deposit_then_plan', 'subscription');
```

---

## Creating Custom Templates

### Method 1: Duplicate and Customize Existing Template

```sql
-- 1. Get existing template
SELECT id, template_key FROM email_templates WHERE template_key = 'enrollment.invitation';

-- 2. Create new template (insert into email_templates)
INSERT INTO email_templates (
  tenant_id,
  template_key,
  template_name,
  template_category,
  description,
  is_system,
  variables
)
SELECT
  tenant_id,
  'enrollment.vip_program',  -- New key
  'VIP Program Invitation',   -- New name
  template_category,
  'Custom VIP program invitation with premium styling',
  false,  -- Not a system template
  variables
FROM email_templates
WHERE template_key = 'enrollment.invitation'
  AND tenant_id = '<your-tenant-id>';

-- 3. Copy template versions (English)
INSERT INTO email_template_versions (
  template_id,
  language_code,
  subject,
  body_html,
  body_text,
  version,
  is_current
)
SELECT
  (SELECT id FROM email_templates WHERE template_key = 'enrollment.vip_program' AND tenant_id = '<your-tenant-id>'),
  'en',
  '🌟 Exclusive VIP Invitation: {{productName}}',  -- Custom subject
  '<!-- Custom HTML with premium styling -->',       -- Custom HTML
  'Custom plain text...',                            -- Custom text
  1,
  true
FROM email_template_versions
WHERE template_id = (SELECT id FROM email_templates WHERE template_key = 'enrollment.invitation')
  AND language_code = 'en'
  AND is_current = true;

-- 4. Copy Hebrew version
-- (Repeat above for language_code = 'he')
```

### Method 2: Create From Scratch (Via Admin UI)

1. Navigate to `/admin/emails/templates`
2. Click **"Create Template"**
3. Fill in:
   - **Template Key**: `enrollment.vip_program`
   - **Template Name**: `VIP Program Invitation`
   - **Category**: `enrollment`
   - **Variables**: Copy from `enrollment.invitation` or customize
4. Add English and Hebrew versions
5. Save

---

## Assigning Templates to Products

### Via SQL

```sql
-- Single product
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.vip_program'
WHERE id = '<product-id>';

-- Bulk update by type
UPDATE products
SET enrollment_invitation_template_key = 'enrollment.premium_invitation'
WHERE type = 'program' AND price > 10000;

-- Remove custom template (use default)
UPDATE products
SET enrollment_invitation_template_key = NULL
WHERE id = '<product-id>';
```

### Via Admin UI (Future Enhancement)

In the product edit form, add a template selector:

```typescript
// Product Edit Form
<FormSection title="Email Templates">
  <Select
    label="Enrollment Invitation Template"
    value={product.enrollment_invitation_template_key}
    onChange={(key) => setProduct({ ...product, enrollment_invitation_template_key: key })}
  >
    <option value="">Use Default Template</option>
    {templates
      .filter(t => t.template_category === 'enrollment')
      .map(t => (
        <option key={t.template_key} value={t.template_key}>
          {t.template_name}
        </option>
      ))}
  </Select>
</FormSection>
```

---

## Template Variables

All custom templates must support the same variables as the default template:

### Required Variables
| Variable | Type | Description |
|----------|------|-------------|
| `userName` | string | User's first name or email username |
| `productName` | string | Product title |
| `productType` | string | Product type (program, course, etc.) |
| `organizationName` | string | Tenant/organization name |
| `enrollmentUrl` | url | Enrollment link with secure token |
| `expiresIn` | number | Days until link expires |

### Optional Variables
| Variable | Type | Description |
|----------|------|-------------|
| `totalAmount` | currency | Total enrollment cost |
| `currency` | string | Currency code (USD, ILS, etc.) |
| `paymentPlanName` | string | Payment plan name |

**Variable Usage in Template**:
```html
<p>Hello {{userName}}!</p>
<h2>{{productName}}</h2>

{{#if totalAmount}}
  <p>Price: {{formatCurrency totalAmount currency}}</p>
{{/if}}

<a href="{{enrollmentUrl}}">Enroll Now</a>

<p>Link expires in {{expiresIn}} days</p>
```

---

## Code Reference

### API: Send Link Route

**File**: [src/app/api/admin/enrollments/[id]/send-link/route.ts](../src/app/api/admin/enrollments/[id]/send-link/route.ts#L127-L149)

```typescript
// Determine which email template to use
const templateKey = product.enrollment_invitation_template_key || 'enrollment.invitation';

// Send email using selected template
const emailResult = await sendTemplateEmail({
  tenantId: userData.tenant_id,
  templateKey,  // ← Uses product's template or default
  to: enrollmentUser.email,
  language: (language || 'en') as 'en' | 'he',
  variables: { /* ... */ },
  priority: 'high'
});
```

### Migration

**File**: [supabase/migrations/20251202_add_email_template_to_products.sql](../supabase/migrations/20251202_add_email_template_to_products.sql)

Adds three template fields to products table with foreign key constraints.

---

## Testing

### Test Template Selection

```typescript
// 1. Create test template
await supabase.from('email_templates').insert({
  tenant_id: 'your-tenant-id',
  template_key: 'enrollment.test_template',
  template_name: 'Test Template',
  template_category: 'enrollment',
  is_system: false,
  variables: [ /* same as default */ ]
});

// 2. Assign to product
await supabase.from('products').update({
  enrollment_invitation_template_key: 'enrollment.test_template'
}).eq('id', 'product-id');

// 3. Send enrollment link
// → Should use "enrollment.test_template" instead of default

// 4. Verify in email_queue
const { data } = await supabase
  .from('email_queue')
  .select('template_id, email_templates(template_key)')
  .order('created_at', { ascending: false })
  .limit(1);

console.log(data[0].email_templates.template_key);
// → Should show "enrollment.test_template"
```

---

## Best Practices

### 1. **Naming Convention**
Use clear, descriptive template keys:
```
✅ Good: enrollment.vip_program
✅ Good: enrollment.free_trial_welcome
✅ Good: enrollment.corporate_onboarding

❌ Bad: enrollment.temp1
❌ Bad: enrollment.new
❌ Bad: custom_template
```

### 2. **Keep Variables Consistent**
Always support the same variables as the default template to avoid errors:
```typescript
// All enrollment templates should accept:
{
  userName,
  productName,
  enrollmentUrl,
  expiresIn,
  // ... etc
}
```

### 3. **Test Before Production**
1. Create template in database
2. Send test email to yourself
3. Check rendering in multiple email clients
4. Test both English and Hebrew versions
5. Assign to product only after validation

### 4. **Document Custom Templates**
Keep a record of which products use which templates:
```sql
-- Query to see template assignments
SELECT
  p.id,
  p.title,
  p.type,
  p.enrollment_invitation_template_key,
  t.template_name
FROM products p
LEFT JOIN email_templates t
  ON t.template_key = p.enrollment_invitation_template_key
  AND t.tenant_id = p.tenant_id
WHERE p.enrollment_invitation_template_key IS NOT NULL
ORDER BY p.title;
```

---

## Troubleshooting

### Template Not Found Error

**Error**: `Template not found: enrollment.custom_template`

**Cause**: Product references template that doesn't exist

**Fix**:
```sql
-- Check if template exists
SELECT * FROM email_templates WHERE template_key = 'enrollment.custom_template';

-- If missing, either create it or reset product to default
UPDATE products
SET enrollment_invitation_template_key = NULL
WHERE enrollment_invitation_template_key = 'enrollment.custom_template';
```

### Wrong Template Being Used

**Issue**: Email uses default template despite product having custom template

**Debug**:
```sql
-- Check product configuration
SELECT
  id,
  title,
  enrollment_invitation_template_key
FROM products
WHERE id = '<product-id>';

-- Check if template is active
SELECT
  template_key,
  is_active
FROM email_templates
WHERE template_key = '<the-template-key>';
```

---

## Migration Checklist

- [x] Add template fields to products table
- [x] Add foreign key constraints
- [x] Update Product TypeScript interface
- [x] Update send-link API to use product's template
- [x] Add translations for template selection UI
- [ ] Add template selector to product edit form (UI)
- [ ] Create example custom templates
- [ ] Document template creation process

---

## Summary

✅ **What Changed**:
- Products can now specify custom email templates
- Three template types: invitation, confirmation, reminder
- Falls back to default templates if not configured

✅ **Benefits**:
- Different emails for different product types
- Customized branding per product
- Market-specific messaging
- No code changes needed - configure via database

✅ **How to Use**:
1. Create custom template in database or admin UI
2. Assign template to product via SQL or admin form
3. Send enrollment link - uses custom template automatically

---

**Last Updated**: December 2025
