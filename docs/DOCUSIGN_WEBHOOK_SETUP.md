# DocuSign Webhook Setup Guide

## Overview

DocuSign Connect allows your platform to receive real-time notifications when envelope events occur (sent, delivered, completed, declined, voided). This guide will walk you through setting up the webhook integration.

## Prerequisites

- ✅ DocuSign integration is configured and working
- ✅ Your application is accessible from the internet (for production) or use ngrok (for local development)

## Webhook Endpoint

Your webhook endpoint is:
```
https://yourdomain.com/api/webhooks/docusign
```

For local development with ngrok:
```
https://your-ngrok-url.ngrok.io/api/webhooks/docusign
```

---

## Local Development Setup (Using ngrok)

### 1. Install ngrok

Download from https://ngrok.com/download or install via:
```bash
# Windows (using Chocolatey)
choco install ngrok

# macOS (using Homebrew)
brew install ngrok

# Or download directly from ngrok.com
```

### 2. Start ngrok tunnel

```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the https URL** - this is your webhook URL.

### 3. Keep ngrok running

Keep this terminal window open while developing. The ngrok URL changes each time you restart ngrok (unless you have a paid account).

---

## DocuSign Connect Configuration

### 1. Access DocuSign Admin

1. Log into DocuSign: https://admindemo.docusign.com (sandbox) or https://admin.docusign.com (production)
2. Go to **Settings** → **Connect** → **Add Configuration**

### 2. Choose Configuration Type

- Click **Add Configuration**
- Select **Custom**

### 3. Basic Settings

Fill in the following:

**Configuration Name**: `IPS Platform Webhook`

**Description**: `Real-time webhook for enrollment contract status updates`

**URL to Publish**:
- Development: `https://your-ngrok-url.ngrok.io/api/webhooks/docusign`
- Production: `https://yourdomain.com/api/webhooks/docusign`

**Authentication**: `None` (we use HMAC signature verification instead)

### 4. Event Selection

Under **Trigger Events**, select:

✅ **Envelope Events**:
- Envelope Sent
- Envelope Delivered
- Envelope Completed
- Envelope Declined
- Envelope Voided

✅ **Recipient Events**:
- Recipient Completed
- Recipient Declined

### 5. Message Settings

**Include Data**:
- ✅ Include Envelope Documents
- ✅ Include Certificate of Completion
- ✅ Include Custom Fields

**Message Format**: `JSON`

**Include HMAC Signature**: ✅ **Enabled**

**Generate HMAC Key**: Click this button
- Copy the generated key
- Save it somewhere secure (you'll need it in Step 6)

### 6. Advanced Settings

**Retry Settings**:
- Enable Retries: ✅ Yes
- Number of Retries: `3`
- Retry Interval: `15 minutes`

**Logging**:
- Enable Logging: ✅ Yes (helpful for debugging)

### 7. Save Configuration

Click **Save** at the bottom of the page.

---

## Step 3: Add Webhook Secret to Your Platform

### 1. Copy the HMAC Key

The HMAC key you generated in DocuSign Connect settings.

### 2. Add to Integration Settings

1. Go to your IPS Platform: `/admin/config/integrations`
2. Click the **DocuSign** tab
3. Scroll to **Advanced Settings** (if you have this field)
4. Or add a new field called `webhook_secret` to your credentials

### 3. Update via Database (Alternative)

If you don't have a UI field for webhook_secret, you can add it directly to the database:

```sql
UPDATE integrations
SET credentials = jsonb_set(
  credentials,
  '{webhook_secret}',
  '"YOUR_HMAC_KEY_HERE"'
)
WHERE integration_key = 'docusign';
```

Replace `YOUR_HMAC_KEY_HERE` with the actual HMAC key from DocuSign.

---

## Step 4: Test the Webhook

### 1. Send a Test Envelope

Use the test-send endpoint we created earlier:

```javascript
fetch('/api/admin/integrations/docusign/test-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'YOUR_TEMPLATE_ID',
    recipientEmail: 'your@email.com',
    recipientName: 'Your Name'
  })
})
.then(r => r.json())
.then(console.log);
```

### 2. Check DocuSign Connect Logs

1. Go to DocuSign → Settings → Connect
2. Click on your configuration
3. Click **View Logs** or **Failures** tab
4. You should see webhook attempts being logged

### 3. Check Your Database

```sql
-- Check webhook events received
SELECT * FROM webhook_events
WHERE source = 'docusign'
ORDER BY created_at DESC
LIMIT 10;

-- Check enrollment signature status updates
SELECT id, signature_status, signature_envelope_id, signature_sent_at, signature_completed_at
FROM enrollments
WHERE signature_envelope_id IS NOT NULL
ORDER BY updated_at DESC;
```

### 4. Monitor Server Logs

Check your application logs for webhook events:
```bash
# Look for these log messages:
[DocuSign Test] Requesting token with: ...
DocuSign webhook event received: { event: 'envelope-sent', ... }
Envelope xyz123 sent for enrollment abc456
```

---

## Webhook Events Flow

Here's what happens when you send a document:

1. **envelope-sent** → Updates enrollment: `signature_status = 'sent'`
2. **envelope-delivered** → Updates enrollment: `signature_status = 'delivered'`
3. **recipient-completed** → Log recipient completion
4. **envelope-completed** → Updates enrollment: `signature_status = 'completed'`, `contract_signed = true`

Alternative flows:
- **envelope-declined** → Updates with declined reason
- **envelope-voided** → Marks as voided

---

## Troubleshooting

### Webhook Not Receiving Events

**Check 1: URL Accessibility**
```bash
# Test if your webhook URL is accessible
curl https://yourdomain.com/api/webhooks/docusign

# Should return JSON with endpoint info
```

**Check 2: ngrok Still Running**
- If using ngrok for local dev, ensure it's still running
- The ngrok URL changes each restart - update DocuSign if it changed

**Check 3: DocuSign Connect Logs**
- Go to DocuSign → Connect → Your Configuration → Logs
- Check for failed webhook attempts
- Look for error messages

**Check 4: HMAC Signature**
- If webhooks are failing with 401 errors
- Verify the webhook_secret in your database matches DocuSign
- Try temporarily disabling HMAC verification to test

### Database Updates Not Working

**Check 1: Enrollment ID in Custom Fields**
- The webhook looks for `enrollment_id` in custom fields
- Make sure you're setting this when sending envelopes

**Check 2: Database Permissions**
- Ensure the webhook has permission to update enrollments table
- Check RLS policies

**Check 3: Table Structure**
- Verify enrollments table has the required columns:
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'enrollments'
  AND column_name LIKE 'signature%';
  ```

### HMAC Signature Verification Failing

**Option 1: Temporarily Disable**
Comment out signature verification in the webhook handler for testing:
```typescript
// Skip signature verification for testing
// if (integration?.credentials?.webhook_secret && signature) {
//   const isValid = verifyDocuSignSignature(...);
//   if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
// }
```

**Option 2: Verify Secret**
- Regenerate HMAC key in DocuSign
- Update in your platform immediately
- Test again

---

## Security Best Practices

1. **Always use HTTPS** - DocuSign requires HTTPS for webhooks
2. **Verify HMAC signatures** - Prevent unauthorized webhook calls
3. **Store webhook secrets securely** - Encrypt in database
4. **Rate limiting** - Consider adding rate limits to webhook endpoint
5. **Logging** - Log all webhook events for audit trail
6. **Error handling** - Handle malformed payloads gracefully

---

## Production Checklist

Before going to production:

- [ ] Use production DocuSign account (not sandbox)
- [ ] Use real HTTPS URL (not ngrok)
- [ ] SSL certificate is valid
- [ ] HMAC signature verification is enabled
- [ ] Webhook secret is stored securely
- [ ] Error monitoring is set up
- [ ] Webhook events are logged
- [ ] Database has proper indexes on envelope_id fields
- [ ] Tested with real documents
- [ ] Verified all event types work

---

## Next Steps

Once webhooks are working:

1. ✅ Real-time status updates working
2. 📋 Add notification system for admins
3. 📋 Display signature status in enrollment UI
4. 📋 Add ability to resend contracts
5. 📋 Implement document download
6. 📋 Add signature reminders
7. 📋 Create admin dashboard for tracking

---

## Support

If you encounter issues:

1. Check DocuSign Connect logs first
2. Check your application server logs
3. Verify the webhook URL is accessible
4. Test with ngrok if local development
5. Contact DocuSign support if needed
