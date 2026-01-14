# Email Trigger Test - Complete Implementation Guide

## Overview

The email trigger test functionality allows admins to test email triggers by sending actual emails to a specified address with sample data. This document explains how the entire system works from UI to email delivery.

---

## Architecture Flow

```
User clicks Test (🧪) button
  ↓
TestTriggerDialog opens
  ↓
User enters test email address
  ↓
POST /api/admin/emails/triggers/[id]/test
  ↓
testTrigger() validates conditions
  ↓
renderEmailTemplate() fetches template from email_template_versions
  ↓
sendEmail() sends via SMTP
  ↓
Email delivered to test address
```

---

## 1. Frontend: Triggers List Page

**File:** `src/app/admin/emails/triggers/page.tsx`

### Trigger Card Display

Each trigger card shows:
- **Title row**: Trigger name, priority badge, active/inactive badge, template name
- **Description row**: Event type • Timing (e.g., "1 h 0 m before event")
- **Action buttons**: Test (🧪), Toggle power, Edit, Delete

### Test Button Click Handler

```typescript
const testTrigger = async (trigger: EmailTrigger) => {
  setTestingTrigger(trigger);
  setTestDialogOpen(true);
};
```

### Test Execution with Email

```typescript
const handleTestTriggerWithEmail = async (testEmail: string) => {
  const sampleData = getSampleEventData(testingTrigger.trigger_event);

  const response = await fetch(`/api/admin/emails/triggers/${testingTrigger.id}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventData: sampleData,
      testEmail: testEmail,
    }),
  });

  if (data.results.emailSent) {
    toast.success(`Test email sent to ${testEmail}`);
  }
};
```

### Sample Event Data Generation

```typescript
const getSampleEventData = (eventType: string): Record<string, any> => {
  const baseData = {
    userId: '00000000-0000-0000-0000-000000000000',
    email: 'test@example.com',
    userName: 'Test User',
    languageCode: 'en',
  };

  switch (eventType) {
    case 'lesson.reminder':
      return {
        ...baseData,
        lessonId: '...',
        lessonTitle: 'Sample Lesson',
        lessonStartTime: new Date(),
      };
    // ... other event types
  }
};
```

---

## 2. Test Dialog Component

**File:** `src/components/email/TestTriggerDialog.tsx`

### Features

- RTL support for Hebrew (X button on left, text right-aligned)
- Email validation
- Shows production recipient info
- Allows admin to specify test email address

### Key Props

```typescript
interface TestTriggerDialogProps {
  open: boolean;
  onClose: () => void;
  onTest: (testEmail: string) => Promise<void>;
  defaultEmail: string;          // Admin's email
  recipientEmail?: string;        // Production recipient
}
```

### Translations Used

- `triggers.test.title` - "Test Email Trigger" / "בדיקת טריגר דוא\"ל"
- `triggers.test.description` - Dialog description
- `triggers.test.emailLabel` - "Test Email Address"
- `triggers.test.send` - "Send Test Email" / "שלח דוא\"ל בדיקה"

---

## 3. Backend: Test API Endpoint

**File:** `src/app/api/admin/emails/triggers/[id]/test/route.ts`

### Request Flow

1. **Authentication & Authorization**
   - Verify user is logged in
   - Verify user has admin/super_admin role
   - Get tenant_id from user

2. **Fetch Trigger**
   - Get trigger by ID
   - Verify it belongs to the tenant

3. **Validate Trigger Conditions**
   ```typescript
   const testResult = await testTrigger(triggerId, sampleEventData, tenantId);
   ```

4. **Fetch Email Template**
   ```typescript
   const { data: template } = await supabase
     .from('email_templates')
     .select('template_key, template_name')
     .eq('id', trigger.template_id)
     .single();
   ```

5. **Render Template**
   ```typescript
   const rendered = await renderEmailTemplate({
     templateKey: template.template_key,
     tenantId: tenantId,
     languageCode: lang as 'en' | 'he',
     variables: testResult.templateVariables || {},
   });
   ```

6. **Prepare Email Content**
   - Add `[TEST]` prefix to subject
   - Add test warning banner to HTML body
   - Shows production recipient in warning

7. **Send Email**
   ```typescript
   emailResult = await sendEmail({
     to: testEmail || adminEmail,
     subject: finalSubject,
     html: finalHtml,
     text: finalText,
     tenantId: tenantId,
   });
   ```

### Response Structure

```json
{
  "success": true,
  "message": "Test email sent to offir.omer@tenafly-tg.com",
  "results": {
    "triggerName": "Lesson Reminder",
    "triggerEvent": "lesson.reminder",
    "conditionsMet": true,
    "recipient": {
      "email": "test@example.com",
      "name": "Test User",
      "userId": "...",
      "languageCode": "he"
    },
    "scheduledFor": "2026-01-14T12:00:00.000Z",
    "templateVariables": {
      "userName": "Test User",
      "lessonTitle": "Sample Lesson",
      // ... more variables
    },
    "wouldSend": true,
    "emailSent": true,
    "emailSentTo": "offir.omer@tenafly-tg.com",
    "emailResult": {
      "success": true,
      "messageId": "..."
    }
  }
}
```

---

## 4. Template Rendering Engine

**File:** `src/lib/email/renderTemplate.ts`

### How It Works

1. **Fetch Template by Key**
   ```typescript
   const { data: template } = await supabase
     .from('email_templates')
     .select('id, template_key')
     .eq('tenant_id', tenantId)
     .eq('template_key', templateKey)
     .eq('is_active', true)
     .single();
   ```

2. **Fetch Template Version**
   ```typescript
   const { data: version } = await supabase
     .from('email_template_versions')
     .select('subject, body_html, body_text')
     .eq('template_id', template.id)
     .eq('language_code', languageCode)
     .eq('is_current', true)
     .single();
   ```

3. **Variable Replacement**
   - Replaces `{{variable}}` with actual values
   - Handles conditionals: `{{#if variable}}...{{/if}}`
   - Supports helpers: `{{formatCurrency amount currency}}`
   - Supports date formatting: `{{formatDate date language}}`

4. **Returns Rendered Content**
   ```typescript
   return {
     subject: "Lesson Reminder - 30 minutes before start",
     bodyHtml: "<html>...</html>",
     bodyText: "Plain text version..."
   };
   ```

---

## 5. Email Sending (SMTP)

**File:** `src/lib/email/send.ts`

### SMTP Configuration Lookup

```typescript
async function fetchSMTPConfig(tenantId: string) {
  // Try tenant-specific config
  let { data } = await supabase
    .from('integrations')
    .select('credentials, is_enabled')
    .eq('integration_key', 'smtp')
    .eq('is_enabled', true)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  // Fallback to global config (tenant_id IS NULL)
  if (!data && tenantId) {
    const globalResult = await supabase
      .from('integrations')
      .select('credentials, is_enabled')
      .eq('integration_key', 'smtp')
      .eq('is_enabled', true)
      .is('tenant_id', null)
      .maybeSingle();

    data = globalResult.data;
  }

  return data;
}
```

### Email Sending with Nodemailer

```typescript
const transporter = nodemailer.createTransport({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: {
    user: smtpConfig.user,
    pass: smtpConfig.pass,
  },
});

const info = await transporter.sendMail({
  from: `"${smtpConfig.from_name}" <${smtpConfig.from_email}>`,
  to: options.to,
  subject: options.subject,
  text: options.text,
  html: options.html,
});

return {
  success: true,
  messageId: info.messageId,
};
```

---

## 6. Database Schema

### email_triggers Table

```sql
CREATE TABLE email_triggers (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  trigger_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  conditions JSONB,
  delay_minutes INTEGER,           -- Negative = before event, Positive = after
  send_time TIME,
  send_days_before INTEGER,
  is_active BOOLEAN DEFAULT true,
  recipient_role TEXT,
  recipient_field TEXT,
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_templates Table

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  template_name TEXT NOT NULL,
  template_key TEXT NOT NULL,       -- e.g., 'lesson.reminder'
  custom_subject JSONB,              -- { "en": "...", "he": "..." }
  custom_body JSONB,                 -- { "en": { "html": "...", "text": "..." } }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### email_template_versions Table

```sql
CREATE TABLE email_template_versions (
  id UUID PRIMARY KEY,
  template_id UUID REFERENCES email_templates(id),
  language_code TEXT NOT NULL,       -- 'en' or 'he'
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  is_current BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### integrations Table (SMTP Config)

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- NULL for global config
  integration_key TEXT NOT NULL,           -- 'smtp'
  is_enabled BOOLEAN DEFAULT true,
  credentials JSONB NOT NULL,              -- SMTP settings
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SMTP Credentials Structure:**
```json
{
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 587,
  "smtp_secure": false,
  "smtp_user": "your-email@gmail.com",
  "smtp_pass": "app-password",
  "from_email": "noreply@yourdomain.com",
  "from_name": "Your Platform Name"
}
```

---

## 7. Timing Display Logic

**File:** `src/app/admin/emails/triggers/page.tsx`

### Timing Calculation

```typescript
const getTimingDescription = (trigger: EmailTrigger): string => {
  // Specific time: "At 09:00"
  if (trigger.send_time) {
    return `${t('emails.triggers.timing.at', 'At')} ${trigger.send_time}`;
  }

  // Days before: "7 days before"
  if (trigger.send_days_before) {
    return `${trigger.send_days_before} ${t('emails.triggers.timing.daysBefore', 'days before')}`;
  }

  // Minutes before/after event
  if (trigger.delay_minutes && trigger.delay_minutes !== 0) {
    const absMinutes = Math.abs(trigger.delay_minutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;

    const isBeforeEvent = trigger.delay_minutes < 0;
    const timeDirection = isBeforeEvent
      ? t('emails.triggers.timing.beforeEvent', 'before event')
      : t('emails.triggers.timing.afterEvent', 'after event');

    if (hours > 0) {
      return `${hours} ${t('emails.triggers.timing.hoursMinutes', 'h')} ${minutes} ${t('emails.triggers.timing.minutes', 'm')} ${timeDirection}`;
    }
    return `${minutes} ${t('emails.triggers.timing.minutes', 'm')} ${timeDirection}`;
  }

  return t('emails.triggers.timing.immediately', 'Immediately');
};
```

**Examples:**
- `delay_minutes: -60` → "1 h 0 m before event" / "1 שע' 0 דק' לפני האירוע"
- `delay_minutes: -30` → "30 m before event" / "30 דק' לפני האירוע"
- `delay_minutes: 120` → "2 h 0 m after event" / "2 שע' 0 דק' אחרי האירוע"
- `send_time: "09:00"` → "At 09:00" / "בשעה 09:00"
- `send_days_before: 7` → "7 days before" / "7 ימים לפני"
- No timing set → "Immediately" / "מיידי"

---

## 8. Translations System

### Translation Keys Used

| Key | English | Hebrew |
|-----|---------|--------|
| `emails.triggers.priority.normal` | Normal | רגילה |
| `emails.triggers.priority.high` | High | גבוהה |
| `emails.triggers.priority.urgent` | Urgent | דחוף |
| `emails.triggers.priority.low` | Low | נמוכה |
| `common.active` | Active | פעיל |
| `common.inactive` | Inactive | לא פעיל |
| `emails.triggers.timing.immediately` | Immediately | מיידי |
| `emails.triggers.timing.beforeEvent` | before event | לפני האירוע |
| `emails.triggers.timing.afterEvent` | after event | אחרי האירוע |
| `emails.triggers.timing.hoursMinutes` | h | שע' |
| `emails.triggers.timing.minutes` | m | דק' |
| `triggers.test.title` | Test Email Trigger | בדיקת טריגר דוא"ל |
| `triggers.test.send` | Send Test Email | שלח דוא"ל בדיקה |
| `emails.triggers.deleteDialog.title` | Delete Trigger | מחיקת טריגר |
| `common.cancel` | Cancel | ביטול |

### Adding New Translations

**Script:** `scripts/add-trigger-card-translations.js`

```javascript
const translations = [
  { key: 'your.key', en: 'English Text', he: 'טקסט עברי' },
];

// Run: node scripts/add-trigger-card-translations.js
```

---

## 9. Test Email Content

### Subject Line
```
[TEST] Lesson Reminder - 30 minutes before start
```

### HTML Body Structure

```html
<div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
  <strong>⚠️ Test Email</strong><br/>
  This is a test email. In production, this would be sent to: test@example.com
</div>

<!-- Actual template content here -->
<h1>Lesson Reminder</h1>
<p>Hello {{userName}},</p>
<p>Your lesson "{{lessonTitle}}" starts in 30 minutes.</p>
```

### Hebrew Version

```html
<div style="background-color: #fff3cd; border: 2px solid #ffc107; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
  <strong>⚠️ אימייל בדיקה</strong><br/>
  אימייל זה נשלח כבדיקה. במצב רגיל, הוא היה נשלח אל: test@example.com
</div>

<!-- Actual template content here -->
<h1>תזכורת שיעור</h1>
<p>שלום {{userName}},</p>
<p>השיעור שלך "{{lessonTitle}}" מתחיל בעוד 30 דקות.</p>
```

---

## 10. Troubleshooting

### Email Not Sending

1. **Check SMTP Configuration**
   ```sql
   SELECT * FROM integrations
   WHERE integration_key = 'smtp' AND is_enabled = true;
   ```

2. **Check Server Logs**
   - Look for `📧 Template fetch result:` log
   - Look for `📧 Rendered template result:` log
   - Look for `📧 Email send result:` log

3. **Verify Template Exists**
   ```sql
   SELECT * FROM email_template_versions
   WHERE template_id = 'your-template-id'
   AND language_code = 'he'
   AND is_current = true;
   ```

### Template Not Rendering

1. **Check if template version exists**
2. **Check variable names match** between trigger test data and template
3. **Check template is marked as `is_current = true`**

### Wrong Language

1. **Check user's `preferred_language` in users table**
2. **Check template version exists for that language**
3. **Check fallback logic** (falls back to English if Hebrew not found)

---

## 11. Security Considerations

- ✅ Admin authentication required
- ✅ Role-based authorization (admin/super_admin only)
- ✅ Tenant isolation (triggers only accessible by tenant)
- ✅ Email validation on frontend and backend
- ✅ Test prefix added to subject to prevent confusion
- ✅ Warning banner in email body
- ✅ SMTP credentials stored encrypted in database

---

## 12. Future Enhancements

- [ ] Add email preview before sending
- [ ] Track test email history
- [ ] Support attachments in test emails
- [ ] Add CC/BCC options for testing
- [ ] Email delivery status tracking
- [ ] Rate limiting for test emails

---

## Summary

The email trigger test system provides a complete end-to-end solution for testing email triggers with:
- User-friendly UI with RTL support
- Proper template rendering with variable substitution
- Multi-language support (English/Hebrew)
- SMTP configuration with global fallback
- Comprehensive error handling and logging
- Clear visual indicators for test emails

All translations are in place, RTL works correctly, and the timing display properly handles negative values (before event) and positive values (after event) with proper spacing.
