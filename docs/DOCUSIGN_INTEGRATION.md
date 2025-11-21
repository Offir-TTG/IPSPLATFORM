# DocuSign Integration Guide

## Overview
The IPS Platform integrates with DocuSign to handle electronic signatures for enrollment contracts, agreements, and other documents. This integration provides automated contract sending, signature tracking, and webhook-based status updates.

## Features

### ✅ Implemented Features
- **JWT Authentication**: Secure server-to-server authentication using RSA key pairs
- **Template-based Envelope Sending**: Send contracts using pre-configured DocuSign templates
- **Webhook Integration**: Real-time status updates via DocuSign Connect
- **Status Tracking**: Track envelope status (sent, delivered, completed, declined, voided)
- **Embedded Signing**: Support for embedded signing experiences
- **Document Management**: Download signed documents
- **Multi-tenant Support**: Each tenant can have their own DocuSign configuration

### 📋 API Endpoints

#### 1. Integration Configuration
- **GET** `/api/admin/integrations/docusign` - Get DocuSign configuration
- **PUT** `/api/admin/integrations/docusign` - Update DocuSign configuration
- **POST** `/api/admin/integrations/docusign/test` - Test DocuSign connection

#### 2. Contract Management
- **POST** `/api/enrollments/[id]/send-contract` - Send enrollment contract
- **GET** `/api/enrollments/[id]/send-contract` - Get contract status

#### 3. Webhooks
- **POST** `/api/webhooks/docusign` - DocuSign Connect webhook endpoint
- **GET** `/api/webhooks/docusign` - Get webhook configuration info

## Setup Instructions

### 1. DocuSign Account Setup

#### Create a DocuSign Developer Account
1. Go to [DocuSign Developer Center](https://developers.docusign.com/)
2. Sign up for a free developer account
3. Access the [Admin Console](https://admindemo.docusign.com/)

#### Create an Integration App
1. Navigate to **Settings** → **Integrations** → **Apps and Keys**
2. Click **Add App and Integration Key**
3. Give your app a name (e.g., "IPS Platform")
4. Save the **Integration Key** (you'll need this)

#### Configure JWT Authentication
1. In your app settings, under **Authentication**:
   - Select **JWT (JSON Web Token)**
   - Generate an RSA Keypair
   - Download and save the private key
2. Under **Redirect URIs**, add:
   - `https://your-domain.com/api/auth/docusign/callback` (for production)
   - `http://localhost:3000/api/auth/docusign/callback` (for development)

#### Get User ID
1. Go to **Settings** → **Users**
2. Click on your user
3. Copy the **User ID** (GUID format)

#### Grant Consent
1. Build the consent URL:
```
https://account-d.docusign.com/oauth/auth?
  response_type=code&
  scope=signature%20impersonation&
  client_id=YOUR_INTEGRATION_KEY&
  redirect_uri=YOUR_REDIRECT_URI
```
2. Visit the URL and grant consent

### 2. Platform Configuration

#### Configure in Admin Panel
1. Navigate to **Admin** → **Config** → **Integrations**
2. Click on **DocuSign** tab
3. Enter your credentials:
   - **Account ID**: Your DocuSign account ID
   - **Integration Key**: From your app
   - **User ID**: Your user GUID
   - **RSA Private Key**: Paste the entire private key (including BEGIN/END lines)
   - **OAuth Base Path**:
     - Sandbox: `https://account-d.docusign.com`
     - Production: `https://account.docusign.com`
   - **API Base Path**:
     - Sandbox: `https://demo.docusign.net/restapi`
     - Production: `https://www.docusign.net/restapi`
4. Click **Save**
5. Click **Test Connection** to verify

#### Configure Webhook (DocuSign Connect)
1. In DocuSign Admin, go to **Settings** → **Connect**
2. Click **Add Configuration** → **Custom**
3. Configure:
   - **Name**: IPS Platform Webhook
   - **URL to Publish**: `https://your-domain.com/api/webhooks/docusign`
   - **Events**: Select all envelope and recipient events
   - **Include Data**: Check "Include Documents" and "Include Certificate of Completion"
4. Save and note the webhook secret for HMAC verification

### 3. Template Setup

#### Create Document Templates
1. In DocuSign, go to **Templates**
2. Create a new template for each document type (e.g., "Enrollment Contract")
3. Add your document
4. Add fields (signature, date, text fields, etc.)
5. Define recipient roles (e.g., "Student", "Parent", "Administrator")
6. Save and note the **Template ID**

#### Configure Templates in Platform
1. When creating/editing a program, add the DocuSign Template ID
2. The template will be used when sending contracts for that program

## Usage Guide

### Sending Contracts

#### Automatic Sending (via API)
```javascript
// Send contract for an enrollment
const response = await fetch(`/api/enrollments/${enrollmentId}/send-contract`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const result = await response.json();
// Result contains: { envelopeId, status, message }
```

#### Manual Sending (Admin Panel)
1. Go to **Enrollments** page
2. Find the enrollment
3. Click **Send Contract** button
4. Contract will be sent to the student's email

### Tracking Status

#### Via Database
Enrollment records track signature status:
- `signature_status`: Current status (pending, sent, delivered, completed, declined, voided)
- `signature_envelope_id`: DocuSign envelope ID
- `signature_sent_at`: When contract was sent
- `signature_completed_at`: When contract was signed
- `contract_signed`: Boolean flag for quick checks

#### Via Webhooks
DocuSign Connect sends real-time updates:
1. **envelope-sent**: Contract has been sent
2. **envelope-delivered**: Recipient received the email
3. **envelope-completed**: All signatures collected
4. **envelope-declined**: Recipient declined to sign
5. **envelope-voided**: Contract was cancelled

### Error Handling

Common errors and solutions:

#### Authentication Errors
- **Error**: "DocuSign credentials are not configured"
  - **Solution**: Configure DocuSign in Admin → Integrations

- **Error**: "Failed to authenticate with DocuSign"
  - **Solution**: Check credentials, ensure JWT consent is granted

#### Template Errors
- **Error**: "No DocuSign template configured for this program"
  - **Solution**: Add template ID to program settings

- **Error**: "Template not found"
  - **Solution**: Verify template ID exists in DocuSign account

#### Webhook Errors
- **Error**: "Invalid signature"
  - **Solution**: Configure webhook secret for HMAC verification

## Database Schema

### Integrations Table
```sql
integrations {
  integration_key: 'docusign'
  integration_name: 'DocuSign'
  is_enabled: boolean
  credentials: {
    account_id: string
    integration_key: string
    user_id: string
    private_key: string (encrypted)
    oauth_base_path: string
    base_path: string
    webhook_secret: string (optional)
  }
  settings: {
    auto_send: boolean
    reminder_days: number
    expiration_days: number
  }
}
```

### Enrollments Table (DocuSign fields)
```sql
enrollments {
  signature_status: string
  signature_envelope_id: string
  signature_sent_at: timestamp
  signature_completed_at: timestamp
  signature_declined_reason: string
  contract_signed: boolean
}
```

### Programs Table (DocuSign fields)
```sql
programs {
  docusign_template_id: string
  require_signature: boolean
}
```

## Security Considerations

1. **Private Key Storage**: RSA private keys are stored encrypted in the database
2. **HMAC Verification**: Webhook payloads are verified using HMAC-SHA256
3. **JWT Expiration**: Access tokens expire after 1 hour and are refreshed automatically
4. **Audit Logging**: All contract operations are logged for compliance
5. **Role-based Access**: Only admins can configure integration, instructors can send contracts

## Testing

### Test in Sandbox
1. Use DocuSign demo environment (account-d.docusign.com)
2. Test with demo email addresses
3. Verify webhook events are received
4. Check status updates in database

### Test Checklist
- [ ] Integration configuration saves correctly
- [ ] Test connection succeeds
- [ ] Templates are accessible
- [ ] Contracts send successfully
- [ ] Webhooks update status
- [ ] Signed documents can be downloaded
- [ ] Error handling works properly

## Troubleshooting

### Debug Webhook Events
1. Check webhook events in database: `webhook_events` table
2. Use DocuSign Connect logs in admin panel
3. Verify webhook URL is accessible
4. Check server logs for webhook processing

### Common Issues

**Issue**: Contracts not sending
- Check integration is enabled
- Verify template ID is correct
- Ensure recipient email is valid
- Check DocuSign account status

**Issue**: Webhooks not received
- Verify webhook URL is publicly accessible
- Check firewall/security group settings
- Ensure SSL certificate is valid
- Review DocuSign Connect configuration

**Issue**: Authentication failing
- Regenerate RSA keypair if needed
- Re-grant JWT consent
- Check environment (sandbox vs production)
- Verify all credentials are correct

## Support Resources

- [DocuSign Developer Documentation](https://developers.docusign.com/docs/)
- [DocuSign API Reference](https://developers.docusign.com/docs/esign-rest-api/reference/)
- [DocuSign Support Center](https://support.docusign.com/)
- [JWT Authentication Guide](https://developers.docusign.com/platform/auth/jwt/)

## Next Steps

### Planned Enhancements
- [ ] Bulk contract sending
- [ ] Template management UI
- [ ] Advanced recipient routing
- [ ] PowerForm integration
- [ ] Signature reminders automation
- [ ] Contract archival system
- [ ] Multi-language template support
- [ ] Advanced analytics and reporting