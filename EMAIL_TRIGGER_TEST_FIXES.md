# Email Trigger Test - Issues and Fixes

## Issues Found:

1. ✅ **FIXED**: Email not sending - SMTP config lookup was failing for global configs
2. ⚠️ **PENDING**: Dialog not translated to Hebrew - SQL script needs to be run
3. ⚠️ **TESTING NEEDED**: Email not going to input address - Added logging to debug
4. ⚠️ **TESTING NEEDED**: Template content not being sent - Added logging to debug

---

## Fix 1: SMTP Configuration Lookup (COMPLETED)

**File**: `src/lib/email/send.ts`

**Problem**: The SMTP lookup only checked for tenant-specific configs, but your SMTP is configured globally (tenant_id IS NULL).

**Fix Applied**: Updated the lookup to:
1. First try tenant-specific config
2. If not found, fall back to global config (tenant_id IS NULL)

**Test Result**: ✅ Direct email test successful - email sent to offir.omer@tenafly-tg.com

---

## Fix 2: Hebrew Translations (ACTION REQUIRED)

**You need to run this SQL script in Supabase:**

1. Go to Supabase Dashboard → SQL Editor
2. Open file: `supabase/SQL Scripts/add_email_triggers_translations.sql`
3. Copy all contents and paste into SQL Editor
4. Click **Run**
5. You should see: `✅ Successfully added Email Triggers translations - Total: 348 translations (174 keys × 2 languages)`

**After running SQL:**
- Hard refresh browser (Ctrl + Shift + R)
- Test dialog should now show in Hebrew

---

## Fix 3: Debugging Email Input & Template (IN PROGRESS)

**Added Logging** to track what's happening:

### Server Logs to Watch:

When you click test, you should see in your server terminal:

```
📧 Test trigger request: {
  triggerId: '...',
  testEmail: 'the-email-from-input@example.com',  // ← Should match what you typed
  userEmail: 'your-admin@email.com',
  actuallyRun: true
}

📧 Template fetch result: {
  template: { ... },  // ← Should contain template data
  templateError: null,
  template_id: '...'
}

📧 Sending test email: {
  to: 'the-email-from-input@example.com',  // ← Should match input
  subject: '[TEST] ...',
  tenantId: '...',
  templateLang: 'he' or 'en'
}

📧 Email send result: {
  success: true,
  messageId: '...'
}

✅ Email sent successfully: { ... }
```

---

## Testing Steps:

1. **Run the SQL script** (see Fix 2 above)

2. **Hard refresh browser** (Ctrl + Shift + R)

3. **Open browser DevTools** (F12) → Console tab

4. **Open server terminal** (where npm run dev is running)

5. **Test the trigger**:
   - Go to Admin → Emails → Triggers
   - Click test button (🧪) on any trigger
   - Dialog should appear in Hebrew
   - Enter email: `offir.omer@tenafly-tg.com`
   - Click "Send Test Email"

6. **Check both consoles**:
   - **Browser console**: Look for any errors
   - **Server terminal**: Should show the logs above

7. **Send me the logs** showing:
   - What email you entered in the dialog
   - What the server received in `testEmail`
   - What template data was fetched
   - Whether email was sent successfully

---

## Expected Email Content:

When the test email arrives, it should contain:

1. **Subject**: `[TEST] <actual template subject>`
2. **Yellow warning banner** at top saying it's a test
3. **Actual template content** with replaced variables
4. **Sample data** (test user, test product, etc.)

If you're NOT seeing the actual template content, the logs will show us why (template not found, empty fields, etc.).

---

## Quick Checklist:

- [ ] Run SQL script in Supabase
- [ ] Hard refresh browser
- [ ] Test trigger with your email
- [ ] Check server logs for the 4 log messages above
- [ ] Verify email arrives at the address you typed
- [ ] Verify email contains actual template content (not just "Test email body")
- [ ] Send me the server logs if issues persist

---

## Notes:

- **Email delay**: Gmail/SMTP can take 1-5 minutes to deliver. This is normal.
- **Translations**: Until you run the SQL script, dialog will show English fallback text
- **Template content**: If template fields are empty in database, you'll see fallback "Test email body"
