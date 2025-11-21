# Keap (Infusionsoft) Integration Guide

## Overview

The Keap integration allows your LMS platform to sync contacts, manage tags, automate marketing campaigns, and track student engagement in Keap CRM.

## Features

- **Contact Sync**: Automatically sync student information to Keap contacts
- **Tag Management**: Apply tags to contacts based on enrollment, completion, or custom events
- **Campaign Automation**: Add contacts to Keap campaigns automatically
- **OAuth Authentication**: Secure OAuth 2.0 authentication with automatic token refresh
- **Notes & Activities**: Create notes and track activities for contacts

## Setup Instructions

### 1. Create a Keap Developer Account

1. Go to [Keap Developer Portal](https://keys.developer.infusionsoft.com/)
2. Log in with your Keap account
3. Click "Create New App"

### 2. Configure Your Keap App

1. **App Name**: Enter a descriptive name (e.g., "LMS Integration")
2. **Redirect URI**: Set to: `https://yourdomain.com/admin/config/integrations`
   - For local development: `http://localhost:3000/admin/config/integrations`
3. **Scopes**: Request "full" scope for complete API access
4. Click "Create"

### 3. Get Your Credentials

After creating the app, you'll receive:
- **Client ID**: Copy this value
- **Client Secret**: Copy this value (keep it secure!)

### 4. Configure in IPS Platform

1. Log in to your IPS Platform admin panel
2. Navigate to **Config → Integrations**
3. Click on the **Keap (Infusionsoft)** tab
4. Fill in the credentials:
   - **Client ID**: Paste your Client ID
   - **Client Secret**: Paste your Client Secret
   - Leave Access Token and Refresh Token empty (they'll be generated)

### 5. Configure Settings (Optional)

- **Auto-sync Contacts**: Enable to automatically sync new students
- **Default Tag Category**: Set a category for organizing LMS-related tags
- **Sync Frequency**: Choose how often to sync (real-time, hourly, daily, manual)

### 6. Save Configuration

Click **Save Configuration** to save your settings.

### 7. Authorize the Integration

1. Click **Test Connection**
2. You'll receive a message with an authorization URL
3. Click the authorization link
4. Log in to Keap and grant permissions
5. You'll be redirected back to the integrations page
6. The system will automatically exchange the authorization code for tokens
7. Test the connection again to verify it works

## OAuth Flow

The Keap integration uses OAuth 2.0 for authentication:

1. **Authorization**: User clicks authorization URL and grants permission
2. **Token Exchange**: System exchanges authorization code for access token and refresh token
3. **Auto-Refresh**: When access token expires, system automatically uses refresh token to get new tokens
4. **No Manual Intervention**: Once authorized, tokens refresh automatically

**For detailed OAuth flow documentation**, see [KEAP_OAUTH_FLOW.md](KEAP_OAUTH_FLOW.md) which includes:
- Complete flow diagrams
- Step-by-step process breakdown
- Token refresh mechanism
- Code examples from all files involved
- Troubleshooting guide

## API Capabilities

### Contact Management

```typescript
import { getKeapClient } from '@/lib/keap/client';

const keap = await getKeapClient();

// Create or update contact
const contact = await keap.upsertContact({
  given_name: 'John',
  family_name: 'Doe',
  email_addresses: [
    { email: 'john@example.com', field: 'EMAIL1' }
  ],
  tag_ids: [123, 456] // Apply tags
});

// Find contact by email
const existingContact = await keap.findContactByEmail('john@example.com');

// Get contact by ID
const contactDetails = await keap.getContact(123);
```

### Tag Management

```typescript
// List all tags
const tags = await keap.listTags();

// Create a new tag
const newTag = await keap.createTag(
  'LMS Student',
  'Students enrolled in LMS',
  123 // category ID (optional)
);

// Add tag to contact
await keap.addTagToContact(contactId, tagId);

// Remove tag from contact
await keap.removeTagFromContact(contactId, tagId);
```

### Campaign Management

```typescript
// List all campaigns
const campaigns = await keap.listCampaigns();

// Add contact to campaign
await keap.addContactToCampaign(contactId, campaignId);
```

### Notes & Activities

```typescript
// Create a note for a contact
await keap.createNote(
  contactId,
  'Course Enrollment',
  'Student enrolled in Advanced JavaScript course'
);
```

## Common Use Cases

### 1. Sync New Students on Enrollment

```typescript
// When a student enrolls
const keap = await getKeapClient();

// Find or create contact
let contact = await keap.findContactByEmail(student.email);
if (!contact) {
  contact = await keap.upsertContact({
    given_name: student.first_name,
    family_name: student.last_name,
    email_addresses: [{ email: student.email, field: 'EMAIL1' }]
  });
}

// Add enrollment tag
const enrollmentTag = await keap.createTag('Enrolled - Course Name');
await keap.addTagToContact(contact.id, enrollmentTag.id);

// Add to campaign
await keap.addContactToCampaign(contact.id, onboardingCampaignId);
```

### 2. Track Course Completion

```typescript
// When a student completes a course
const keap = await getKeapClient();
const contact = await keap.findContactByEmail(student.email);

if (contact) {
  // Add completion tag
  const completionTag = await keap.createTag('Completed - Course Name');
  await keap.addTagToContact(contact.id, completionTag.id);

  // Create note
  await keap.createNote(
    contact.id,
    'Course Completed',
    `Student completed ${course.title} with score: ${student.score}%`
  );
}
```

### 3. Segment Students by Progress

```typescript
// Tag students based on progress
const keap = await getKeapClient();

for (const student of students) {
  const contact = await keap.findContactByEmail(student.email);
  if (!contact) continue;

  let tag;
  if (student.progress >= 75) {
    tag = await keap.createTag('High Progress');
  } else if (student.progress >= 50) {
    tag = await keap.createTag('Medium Progress');
  } else {
    tag = await keap.createTag('Needs Attention');
  }

  await keap.addTagToContact(contact.id, tag.id);
}
```

## Troubleshooting

### Connection Test Fails

**Problem**: "Keap requires OAuth authorization"
- **Solution**: Click the authorization link in the error message and grant permissions

**Problem**: "Failed to refresh Keap token"
- **Solution**: Re-authorize the application by clicking Test Connection and following the authorization flow

**Problem**: "Invalid Client ID or Client Secret"
- **Solution**: Verify your credentials in the Keap Developer Portal match what's entered in IPS Platform

### Token Expiration

- Access tokens expire after a period (typically 24 hours)
- The system automatically refreshes tokens using the refresh token
- If refresh fails, you'll need to re-authorize the application

### API Rate Limits

Keap has API rate limits:
- **Standard**: 125 requests per second
- **If exceeded**: Implement retry logic with exponential backoff

### Common Errors

**"Contact not found"**
- Ensure the contact exists in Keap
- Check that email address is correct

**"Tag already applied"**
- This is not an error; Keap prevents duplicate tags automatically

**"Campaign sequence not available"**
- Verify the campaign is published and active in Keap

## Security Best Practices

1. **Never commit credentials**: Keep Client ID and Client Secret in environment variables
2. **Use HTTPS**: Always use HTTPS in production for OAuth redirects
3. **Rotate secrets**: Periodically rotate your Client Secret in Keap
4. **Limit permissions**: Only request the scopes you need (use "full" only if necessary)
5. **Monitor access**: Regularly review API usage in Keap dashboard

## API Documentation

For complete Keap API documentation, visit:
- [Keap REST API Docs](https://developer.infusionsoft.com/docs/rest/)
- [OAuth Guide](https://developer.infusionsoft.com/docs/rest/oauth/)
- [API Reference](https://developer.infusionsoft.com/docs/rest/reference/)

## Support

For issues with:
- **IPS Platform Integration**: Contact your platform administrator
- **Keap API**: Visit [Keap Support](https://help.keap.com/)
- **Developer Questions**: Visit [Keap Developer Community](https://community.keap.com/developer)

## Files Modified

- **Client Library**: [src/lib/keap/client.ts](../src/lib/keap/client.ts)
- **Integration Page**: [src/app/admin/config/integrations/page.tsx](../src/app/admin/config/integrations/page.tsx)
- **API Test Route**: [src/app/api/admin/integrations/[key]/test/route.ts](../src/app/api/admin/integrations/[key]/test/route.ts)
- **OAuth Callback Route**: [src/app/api/admin/integrations/keap/oauth-callback/route.ts](../src/app/api/admin/integrations/keap/oauth-callback/route.ts)
- **Translations**: [supabase/migrations/20251121_add_keap_integration_translations.sql](../supabase/migrations/20251121_add_keap_integration_translations.sql)
