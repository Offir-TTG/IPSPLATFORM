# Enrollment Email Template Guide

## How Enrollment Emails Work

### Current System: Hardcoded Templates

When an admin clicks "Send Link" on an enrollment:

**Flow**:
```
Admin clicks "Send Link"
  ↓
API: /api/admin/enrollments/[id]/send-link/route.ts
  ↓
1. Fetches enrollment data (user, product, payment info)
2. Generates secure token (expires in 7 days)
3. Updates enrollment status: draft → pending
4. Calls hardcoded template function
5. Sends email via SMTP
```

### Template Location
**File**: `src/lib/email/templates/enrollmentInvitation.ts`

Two functions:
- `getEnrollmentInvitationHtml()` - HTML email
- `getEnrollmentInvitationText()` - Plain text fallback

---

## Data Mapping (Variables)

### Available Variables

```typescript
interface EnrollmentEmailData {
  userName: string;          // User's first name
  productName: string;        // Product title
  productType: string;        // program/course/workshop/etc.
  organizationName: string;   // Tenant name
  enrollmentUrl: string;      // Link: /enroll/[token]
  expiresAt: Date;           // Token expiration (7 days)
  language: string;           // 'en' or 'he'
  totalAmount?: number;       // Price
  currency?: string;          // 'USD', 'ILS', etc.
  paymentPlanName?: string;   // Payment plan name
}
```

### Data Source

```typescript
// From API: src/app/api/admin/enrollments/[id]/send-link/route.ts

const emailData = {
  // From users table
  userName: enrollment.user.first_name || enrollment.user.email.split('@')[0],

  // From products table
  productName: enrollment.product.title,
  productType: enrollment.product.type,

  // From tenants table
  organizationName: tenant.name,

  // Generated
  enrollmentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/enroll/${token}`,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

  // From enrollment table
  totalAmount: enrollment.total_amount,
  currency: enrollment.currency,

  // From payment_plans table (if linked)
  paymentPlanName: enrollment.payment_plan?.plan_name,

  // Selected by admin
  language: language || 'en'
};
```

---

## Translation Keys

Translations are fetched from the `translations` table:

| Key | English | Hebrew | Usage |
|-----|---------|--------|-------|
| `email.enrollment.subject` | Enrollment Invitation: {product} | הזמנה להרשמה: {product} | Email subject |
| `email.enrollment.title` | You're Invited to Enroll! | הוזמנת להירשם! | Header |
| `email.enrollment.greeting` | Hello {name} | שלום {name} | Greeting |
| `email.enrollment.invitation` | You have been invited to enroll in: | הוזמנת להירשם ל: | Body text |
| `email.enrollment.totalAmount` | Total Amount | סכום כולל | Price label |
| `email.enrollment.paymentPlan` | Payment Plan | תוכנית תשלום | Plan label |
| `email.enrollment.message` | Click the button below to view details... | לחץ על הכפתור למטה... | CTA text |
| `email.enrollment.cta` | View Enrollment | צפה בהרשמה | Button text |
| `email.enrollment.fallback` | Or copy this link: | או העתק את הקישור: | Link text |
| `email.enrollment.expiry` | This invitation expires in {days} days | הזמנה זו פגה בעוד {days} ימים | Expiry warning |
| `email.enrollment.footer` | If you have questions, contact support | לשאלות, צור קשר עם התמיכה | Footer |

---

## How to Customize

### Method 1: Edit Template Code

**File**: `src/lib/email/templates/enrollmentInvitation.ts`

**Change button color**:
```typescript
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); // ← Change colors
  color: white;
  padding: 16px 40px;
  // ...
}
```

**Add new section**:
```typescript
<div class="content">
  {/* ... existing content */}

  {/* New section */}
  <div class="info-box">
    <h3>${t('email.enrollment.nextSteps', 'Next Steps')}</h3>
    <ol>
      <li>${t('email.enrollment.step1', 'Click the link above')}</li>
      <li>${t('email.enrollment.step2', 'Review enrollment details')}</li>
      <li>${t('email.enrollment.step3', 'Complete payment if required')}</li>
    </ol>
  </div>
</div>
```

### Method 2: Change Translations

**In Supabase SQL Editor**:
```sql
-- Change English subject
UPDATE translations
SET translation_value = 'Join Us: {product}'
WHERE translation_key = 'email.enrollment.subject'
  AND language_code = 'en';

-- Change Hebrew button text
UPDATE translations
SET translation_value = 'לחץ כאן להרשמה'
WHERE translation_key = 'email.enrollment.cta'
  AND language_code = 'he';
```

### Method 3: Add New Variables

**1. Update interface**:
```typescript
export interface EnrollmentEmailData {
  // ... existing fields
  courseStartDate?: Date;      // ← Add new field
  instructorName?: string;     // ← Add new field
}
```

**2. Pass data from API**:
```typescript
// In route.ts
const emailData = {
  // ... existing data
  courseStartDate: product.start_date,
  instructorName: product.instructor_name
};
```

**3. Use in template**:
```typescript
${data.courseStartDate ? `
  <div class="info-row">
    <span>${t('email.enrollment.startDate', 'Start Date')}:</span>
    <strong>${formatDate(data.courseStartDate, data.language)}</strong>
  </div>
` : ''}

${data.instructorName ? `
  <div class="instructor-box">
    <p>${t('email.enrollment.instructor', 'Your Instructor')}: <strong>${data.instructorName}</strong></p>
  </div>
` : ''}
```

---

## RTL Support (Hebrew)

The template automatically handles RTL for Hebrew:

```typescript
const isRTL = data.language === 'he';

// HTML tag
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${data.language}">

// Border direction
border-${isRTL ? 'right' : 'left'}: 4px solid #667eea;

// Gradient direction
background: linear-gradient(to ${isRTL ? 'left' : 'right'}, #f8f9ff 0%, #ffffff 100%);
```

---

## Testing

### Create Test Script

**File**: `scripts/test-enrollment-email.ts`

```typescript
import { getEnrollmentInvitationHtml, getEnrollmentInvitationText } from '@/lib/email/templates/enrollmentInvitation';
import fs from 'fs';

const testData = {
  userName: 'John Doe',
  productName: 'Web Development Bootcamp',
  productType: 'program',
  organizationName: 'Tech Academy',
  enrollmentUrl: 'http://localhost:3000/enroll/test-token-123',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  language: 'en',
  totalAmount: 5000,
  currency: 'ILS',
  paymentPlanName: '4 monthly payments'
};

const translations = {
  'email.enrollment.title': 'You\'re Invited to Enroll!',
  'email.enrollment.greeting': 'Hello {name}',
  'email.enrollment.invitation': 'You have been invited to enroll in:',
  'email.enrollment.totalAmount': 'Total Amount',
  'email.enrollment.paymentPlan': 'Payment Plan',
  'email.enrollment.message': 'Click the button below to view details and complete your enrollment:',
  'email.enrollment.cta': 'View Enrollment',
  'email.enrollment.fallback': 'Or copy this link:',
  'email.enrollment.expiry': 'This invitation expires in {days} days',
  'email.enrollment.footer': 'If you have questions, please contact support.',
  'productType.program': 'Program'
};

// Generate HTML
const html = getEnrollmentInvitationHtml(testData, translations);
const text = getEnrollmentInvitationText(testData, translations);

// Save to files
fs.writeFileSync('test-email.html', html);
fs.writeFileSync('test-email.txt', text);

console.log('✅ Test emails generated:');
console.log('   - test-email.html (open in browser)');
console.log('   - test-email.txt (plain text version)');
```

**Run**:
```bash
npx tsx scripts/test-enrollment-email.ts
# Open test-email.html in browser to preview
```

---

## Complete Example

### Input (from database):

```typescript
{
  user: {
    first_name: "Sarah",
    last_name: "Cohen",
    email: "sarah.cohen@example.com"
  },
  product: {
    title: "Full-Stack Development Program",
    type: "program",
    price: 12000,
    currency: "ILS"
  },
  payment_plan: {
    plan_name: "6 monthly payments"
  },
  tenant: {
    name: "Tech Academy Israel"
  }
}
```

### Output (email sent):

**Subject**: Enrollment Invitation: Full-Stack Development Program

**Body** (simplified):
```
━━━━━━━━━━━━━━━━━━━━━
You're Invited to Enroll!
━━━━━━━━━━━━━━━━━━━━━

Hello Sarah,

You have been invited to enroll in:

┌────────────────────────┐
│ Full-Stack Development │
│ Program                │
└────────────────────────┘

Payment Information:
Total Amount: ₪12,000
Payment Plan: 6 monthly payments

Click the button below to view details:

[ View Enrollment ]

Or copy this link:
https://app.example.com/enroll/abc123xyz

⏰ This invitation expires in 7 days

━━━━━━━━━━━━━━━━━━━━━
Tech Academy Israel
If you have questions, contact support.
```

---

## Future: Database Template System

The platform has a complete database-driven email template system available but not yet integrated with enrollments.

### Benefits:
✅ Edit templates in admin UI (no code changes)
✅ Version control for templates
✅ Email analytics (open rates, click rates)
✅ A/B testing capability
✅ Scheduled/queued sending

### To Enable:
1. Navigate to `/admin/emails/templates`
2. Create template with key: `enrollment.invitation`
3. Update `send-link` API to use `sendTemplateEmail()`

---

## Quick Reference

| Task | How To |
|------|--------|
| Change subject | Update `email.enrollment.subject` translation |
| Change button text | Update `email.enrollment.cta` translation |
| Change colors | Edit CSS in `enrollmentInvitation.ts` |
| Add new field | Update interface → pass from API → use in template |
| Test changes | Run `test-enrollment-email.ts` script |
| Add logo | Add `<img>` tag in header, pass `logoUrl` variable |
| Change expiry | Modify `expiresAt` calculation in API (currently 7 days) |

---

## Files Reference

- **Template**: `src/lib/email/templates/enrollmentInvitation.ts`
- **API**: `src/app/api/admin/enrollments/[id]/send-link/route.ts`
- **Translations**: Database `translations` table
- **Types**: `src/types/email.ts`
- **SMTP**: `src/lib/email/smtp.ts`
