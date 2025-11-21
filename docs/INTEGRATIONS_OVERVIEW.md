# IPS Platform - Integrations Overview

This document provides an overview of all available integrations in the IPS Platform.

---

## Available Integrations

### 1. Stripe - Payment Processing ✅
**Status**: Fully Configured

**Purpose**: Accept payments, process refunds, manage subscriptions

**Features**:
- One-time payments (enrollment fees)
- Recurring payments (monthly tuition)
- Refund processing
- Real-time webhook notifications
- Payment history tracking

**Quick Start**: [STRIPE_QUICK_START.md](./STRIPE_QUICK_START.md)
**Full Guide**: [STRIPE_SETUP_GUIDE.md](./STRIPE_SETUP_GUIDE.md)

**Webhook URL**: `/api/webhooks/stripe`

---

### 2. DocuSign - Document Signing ✅
**Status**: Fully Configured

**Purpose**: Send enrollment contracts and track signature status

**Features**:
- JWT authentication
- Template-based document sending
- Real-time signature status updates
- HMAC webhook verification
- Envelope tracking

**Quick Start**: [DOCUSIGN_QUICK_START.md](./DOCUSIGN_QUICK_START.md)
**Full Guide**: [DOCUSIGN_SETUP_GUIDE.md](./DOCUSIGN_SETUP_GUIDE.md)
**Webhook Guide**: [DOCUSIGN_WEBHOOK_SETUP.md](./DOCUSIGN_WEBHOOK_SETUP.md)

**Webhook URL**: `/api/webhooks/docusign`
**Test Endpoint**: `/api/admin/integrations/docusign/test-send`

---

### 3. Zoom - Video Conferencing
**Status**: UI Ready, Implementation Pending

**Purpose**: Create and manage video meetings for classes

**Features** (Planned):
- Create instant meetings
- Schedule future meetings
- Auto-recording
- Meeting management
- SDK integration for embedded meetings

**Credentials Needed**:
- Account ID
- Client ID
- Client Secret
- SDK Key (optional)
- SDK Secret (optional)

**Webhook URL**: `/api/webhooks/zoom`

---

### 4. SendGrid - Email Delivery
**Status**: UI Ready, Implementation Pending

**Purpose**: Send transactional emails and notifications

**Features** (Planned):
- Welcome emails
- Password reset emails
- Payment confirmations
- Contract notifications
- Marketing emails

**Credentials Needed**:
- API Key
- From Email
- From Name

**Settings**:
- Sandbox mode for testing
- Email tracking
- Click tracking

---

## Integration Architecture

### Database Schema

All integrations use the `integrations` table:

```sql
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  integration_key VARCHAR(50) NOT NULL, -- 'stripe', 'docusign', etc.
  is_enabled BOOLEAN DEFAULT FALSE,
  credentials JSONB, -- Encrypted credentials
  settings JSONB, -- Integration-specific settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Webhook Events

All webhook events are logged:

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  source VARCHAR(50) NOT NULL, -- 'stripe', 'docusign', etc.
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Common Setup Steps

### For All Integrations:

1. **Navigate to Integrations**:
   ```
   http://localhost:3000/admin/config/integrations
   ```

2. **Select Integration Tab**

3. **Fill in Credentials**
   - Get credentials from the service provider
   - Paste into the form fields

4. **Test Connection**
   - Click "Test Connection" button
   - Verify success message

5. **Enable Integration**
   - Toggle "Enabled" switch ON
   - Click "Save Configuration"

6. **Setup Webhooks** (if applicable)
   - Configure webhook URL in service provider
   - Copy webhook secret to integration settings
   - Test webhook delivery

---

## Webhook Endpoints

All webhook endpoints follow this pattern:
```
/api/webhooks/{integration_key}
```

Available endpoints:
- `/api/webhooks/stripe` - Stripe payment events
- `/api/webhooks/docusign` - DocuSign signature events
- `/api/webhooks/zoom` - Zoom meeting events (pending)

### Testing Webhooks Locally

Use localtunnel to expose your local server:

```bash
# Install (one time)
npm install -g localtunnel

# Start tunnel
npx localtunnel --port 3000

# You'll get a URL like:
# https://your-random-url.loca.lt
```

Then configure webhooks using:
```
https://your-random-url.loca.lt/api/webhooks/{integration}
```

---

## Security Features

### 1. Credential Encryption
- All credentials are encrypted in the database
- AES-256-GCM encryption
- Secure key management

### 2. Webhook Verification
- **Stripe**: Signature verification using webhook secret
- **DocuSign**: HMAC SHA-256 signature verification
- **Zoom**: Verification token validation

### 3. Rate Limiting
- API endpoints have rate limiting
- Webhook endpoints are protected
- Token-based authentication

### 4. Audit Logging
- All integration actions are logged
- Webhook events are stored
- Failed attempts are tracked

---

## Test Endpoints

### Test Connection
```
POST /api/admin/integrations/{key}/test
```

Tests the integration credentials without enabling it.

**Example**:
```javascript
fetch('/api/admin/integrations/stripe/test', {
  method: 'POST'
})
.then(r => r.json())
.then(console.log);
```

### DocuSign Test Send
```
POST /api/admin/integrations/docusign/test-send
```

Sends a test envelope using DocuSign.

**Example**:
```javascript
fetch('/api/admin/integrations/docusign/test-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    templateId: 'your-template-id',
    recipientEmail: 'test@example.com',
    recipientName: 'Test User'
  })
})
.then(r => r.json())
.then(console.log);
```

---

## Monitoring and Debugging

### Check Integration Status
```sql
SELECT
  integration_key,
  is_enabled,
  created_at,
  updated_at
FROM integrations
WHERE tenant_id = 'your-tenant-id';
```

### View Webhook Events
```sql
SELECT
  source,
  event_type,
  created_at,
  processed_at,
  payload
FROM webhook_events
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 50;
```

### Check Recent Stripe Payments
```sql
SELECT
  amount,
  currency,
  status,
  stripe_payment_intent,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 10;
```

### Check DocuSign Signatures
```sql
SELECT
  id,
  signature_status,
  signature_envelope_id,
  signature_sent_at,
  signature_completed_at
FROM enrollments
WHERE signature_envelope_id IS NOT NULL
ORDER BY updated_at DESC;
```

---

## Environment Variables

Required for integrations:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Encryption
ENCRYPTION_KEY=your_32_character_key

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Production Deployment

### Pre-deployment Checklist:

**Stripe**:
- [ ] Switch to live API keys (`sk_live_`, `pk_live_`)
- [ ] Update webhook URL to production domain
- [ ] Test with real card in test mode first
- [ ] Complete Stripe business verification

**DocuSign**:
- [ ] Switch to production DocuSign account
- [ ] Update OAuth/API base paths to production
- [ ] Regenerate production RSA keys
- [ ] Grant consent for production app
- [ ] Update Connect webhook URL

**General**:
- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Ensure SSL certificate is valid
- [ ] Enable webhook signature verification
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure log retention
- [ ] Test all integrations end-to-end
- [ ] Document production credentials (securely)

---

## Support Resources

### Stripe
- Dashboard: https://dashboard.stripe.com/
- Docs: https://stripe.com/docs
- Support: https://support.stripe.com/

### DocuSign
- Admin: https://admin.docusign.com/
- Developers: https://developers.docusign.com/
- Support: https://support.docusign.com/

### Zoom
- Dashboard: https://zoom.us/
- Developers: https://marketplace.zoom.us/
- Support: https://support.zoom.us/

### SendGrid
- Dashboard: https://app.sendgrid.com/
- Docs: https://docs.sendgrid.com/
- Support: https://support.sendgrid.com/

---

## Next Steps

1. **Implement Stripe Checkout UI** for students
2. **Add DocuSign template management** in admin
3. **Complete Zoom integration** for online classes
4. **Setup SendGrid** for email notifications
5. **Create integration dashboard** showing health status
6. **Add webhook retry logic** for failed deliveries
7. **Implement integration metrics** and reporting

---

## Questions?

Refer to the specific integration guides:
- [Stripe Setup Guide](./STRIPE_SETUP_GUIDE.md)
- [DocuSign Setup Guide](./DOCUSIGN_SETUP_GUIDE.md)
- [DocuSign Webhook Setup](./DOCUSIGN_WEBHOOK_SETUP.md)
