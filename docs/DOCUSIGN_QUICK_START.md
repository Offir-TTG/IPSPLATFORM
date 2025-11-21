# DocuSign Integration - Quick Start Guide

## Setup Summary

### ✅ What You've Completed

1. **Integration Configuration** - DocuSign credentials are configured
2. **Test Connection** - Authentication is working
3. **Webhook Endpoint** - Ready at `/api/webhooks/docusign`

### 📋 What's Next - Webhook Setup

## Quick Setup (5 Minutes)

### For Local Development

**1. Start ngrok** (in a new terminal):
```bash
ngrok http 3000
```
Copy the `https://` URL shown (e.g., `https://abc123.ngrok.io`)

**2. Configure DocuSign Connect**:
- Go to https://admindemo.docusign.com
- **Settings** → **Connect** → **Add Configuration** → **Custom**
- **URL**: `https://your-ngrok-url.ngrok.io/api/webhooks/docusign`
- **Events**: Select all Envelope and Recipient events
- **HMAC**: Enable and generate key
- **Save** the configuration

**3. Add HMAC Key to Platform**:
- Go to your app: `/admin/config/integrations`
- DocuSign tab
- Paste HMAC key in "Webhook Secret" field
- Click **Save**

**Done!** Now webhooks will update enrollment status automatically.

---

### For Production

**1. Configure DocuSign Connect**:
- Go to https://admin.docusign.com (production)
- **Settings** → **Connect** → **Add Configuration** → **Custom**
- **URL**: `https://yourdomain.com/api/webhooks/docusign`
- **Events**: Select all Envelope and Recipient events
- **HMAC**: Enable and generate key
- **Save** the configuration

**2. Add HMAC Key**:
- Same as local development above

---

## Test the Integration

### 1. Send a Test Document

In browser console (F12):
```javascript
fetch('/api/admin/integrations/docusign/test-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'YOUR_TEMPLATE_ID',  // Get from DocuSign
    recipientEmail: 'your@email.com',
    recipientName: 'Your Name'
  })
})
.then(r => r.json())
.then(console.log);
```

### 2. Verify Webhook Works

Check webhook events:
```sql
SELECT * FROM webhook_events
WHERE source = 'docusign'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Webhook Events

Your platform automatically handles these events:

| Event | Action |
|-------|--------|
| `envelope-sent` | Updates status to "sent" |
| `envelope-delivered` | Updates status to "delivered" |
| `envelope-completed` | Marks as completed and signed |
| `envelope-declined` | Records decline reason |
| `envelope-voided` | Marks as voided |

---

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/integrations/docusign/test` | POST | Test connection |
| `/api/admin/integrations/docusign/test-send` | POST | Send test envelope |
| `/api/webhooks/docusign` | POST | Receive webhook events |
| `/api/webhooks/docusign` | GET | Webhook info |

---

## Troubleshooting

### Webhooks not working?

1. **Check ngrok is running** (if local)
2. **Verify webhook URL** in DocuSign Connect
3. **Check DocuSign Connect logs**:
   - DocuSign → Connect → Your Configuration → Logs
4. **View received webhooks**:
   ```sql
   SELECT * FROM webhook_events WHERE source = 'docusign';
   ```

### Still having issues?

See detailed guides:
- [Complete Setup Guide](./DOCUSIGN_SETUP_GUIDE.md)
- [Webhook Setup](./DOCUSIGN_WEBHOOK_SETUP.md)
- [Integration Documentation](./DOCUSIGN_INTEGRATION.md)

---

## What's Available Now

✅ **Send Documents**: Via API or UI
✅ **Track Status**: Real-time updates via webhooks
✅ **Test Connection**: Verify credentials anytime
✅ **Audit Trail**: All events logged in database

## What's Next

📋 **Add to Enrollment Flow**: Send contracts automatically
📋 **UI Integration**: Show signature status in enrollment pages
📋 **Notifications**: Alert admins when contracts are signed
📋 **Document Download**: Retrieve signed documents
📋 **Reminders**: Auto-send signature reminders
📋 **Templates**: Manage DocuSign templates in admin panel

---

## Quick Reference

**Webhook URL** (Local): `https://your-ngrok-url.ngrok.io/api/webhooks/docusign`
**Webhook URL** (Prod): `https://yourdomain.com/api/webhooks/docusign`

**DocuSign Sandbox**: https://admindemo.docusign.com
**DocuSign Production**: https://admin.docusign.com

**Integration Page**: http://localhost:3000/admin/config/integrations
