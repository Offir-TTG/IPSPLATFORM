# Keap (Infusionsoft) Setup Guide - Step by Step

## Overview

This guide will walk you through setting up Keap integration for your IPS Platform. You'll need a Keap account and access to the Keap Developer Portal.

---

## Prerequisites

- Active Keap (Infusionsoft) account
- Admin access to your Keap account
- Your IPS Platform URL (e.g., `https://yourdomain.com` or `http://localhost:3000` for development)

---

## Part 1: Create a Keap Developer App

### Step 1: Access Keap Developer Portal

1. Go to [Keap Developer Portal](https://keys.developer.infusionsoft.com/)
2. Log in with your Keap account credentials
   - If you don't have access, contact your Keap account administrator

![Keap Developer Login](https://help.keap.com/hc/article_attachments/360010582631/mceclip0.png)

### Step 2: Create a New Application

1. Click the **"+ New App"** or **"Create New App"** button
2. You'll see a form to create your new application

### Step 3: Fill in Application Details

Fill in the following information:

**Application Name:**
```
IPS Platform Integration
```
(or any descriptive name you prefer)

**Description:**
```
LMS integration for syncing students, enrollments, and course progress
```

**Redirect URI:**

For **Production**:
```
https://yourdomain.com/admin/config/integrations
```

For **Development** (local testing):
```
http://localhost:3000/admin/config/integrations
```

⚠️ **IMPORTANT**: The redirect URI must match exactly. Include the protocol (`http://` or `https://`).

**App Type:**
- Select **"Server-side Application"**

**Scopes:**
- Check **"Full Access"** (recommended for complete integration)
- Or select specific scopes if you want to limit permissions:
  - ✓ Contact
  - ✓ Tags
  - ✓ Campaigns
  - ✓ Notes

### Step 4: Submit Application

1. Click **"Create"** or **"Register"** button
2. Wait for the application to be created (usually instant)

---

## Part 2: Get Your API Credentials

### Step 5: Copy Your Client ID

After creating the app, you'll see your application details:

1. Find the **"Client ID"** field
2. Click the **"Copy"** button or manually select and copy the value
3. It will look something like: `abc123def456ghi789`

**Save this value** - you'll need it for the IPS Platform configuration.

### Step 6: Copy Your Client Secret

1. Find the **"Client Secret"** field
2. Click **"Show"** to reveal the secret
3. Click the **"Copy"** button or manually select and copy the value
4. It will look something like: `aBcDeFgHiJkLmNoPqRsTuVwXyZ123456`

⚠️ **IMPORTANT**: Keep your Client Secret secure! Never commit it to version control or share it publicly.

**Save this value** - you'll need it for the IPS Platform configuration.

### Step 7: Note Your Application Status

Your application should now show as:
- Status: **Active** or **Enabled**
- Approval: May require Keap approval depending on your account type

---

## Part 3: Configure IPS Platform

### Step 8: Open IPS Platform Admin Panel

1. Log in to your IPS Platform admin panel
2. Navigate to: **Admin → Config → Integrations**
3. Click on the **"Keap (Infusionsoft)"** tab

### Step 9: Enter Your Credentials

Fill in the following fields:

**Client ID:**
```
[Paste the Client ID from Step 5]
```

**Client Secret:**
```
[Paste the Client Secret from Step 6]
```

**Access Token:**
- Leave this empty (it will be auto-generated)

**Refresh Token:**
- Leave this empty (it will be auto-generated)

### Step 10: Configure Settings (Optional)

**Auto-sync Contacts:**
- Toggle ON to automatically sync new students to Keap
- Toggle OFF for manual sync only

**Default Tag Category:**
```
LMS Students
```
(or any category name you want to use for organizing tags)

**Sync Frequency:**
- **Real-time**: Sync immediately when changes occur (recommended)
- **Hourly**: Sync every hour
- **Daily**: Sync once per day
- **Manual**: Sync only when manually triggered

### Step 11: Save Configuration

1. Click **"Save Configuration"** button
2. Wait for the success message

---

## Part 4: Authorize the Integration (OAuth)

### Step 12: Test Connection

1. Click the **"Test Connection"** button
2. You'll see a message with an authorization link

### Step 13: Authorize Access

1. **Copy the authorization URL** from the error message, or click the link if it's clickable
2. The URL will look like:
   ```
   https://signin.infusionsoft.com/app/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=...
   ```
3. Open this URL in your browser
4. You'll be redirected to Keap's authorization page

### Step 14: Grant Permissions

On the Keap authorization page:

1. **Review the permissions** your app is requesting:
   - Access to contacts
   - Access to tags
   - Access to campaigns
   - Access to notes

2. Click **"Allow"** or **"Authorize"** button

3. You'll be redirected back to your IPS Platform integrations page

### Step 15: Verify Connection

1. The page should automatically exchange the authorization code for tokens
2. If not automatic, click **"Test Connection"** again
3. You should see a success message:
   ```
   ✓ Connected to Keap account: [Your Company Name]
   ```

---

## Part 5: Verify Integration is Working

### Step 16: Check Integration Status

In the IPS Platform integrations page:

1. **Status Badge** should show: **"Connected"** (green)
2. **Enable Toggle** should be ON (blue)
3. **Access Token** and **Refresh Token** fields should now have values

### Step 17: Test Contact Sync (Optional)

To verify the integration is working:

1. Go to a student enrollment or user profile
2. Trigger a sync action (depends on your sync settings)
3. Check Keap to verify the contact was created/updated

---

## Troubleshooting

### Common Issues

#### ❌ "Invalid redirect_uri"

**Problem**: The redirect URI doesn't match what's configured in Keap.

**Solution**:
1. Go back to Keap Developer Portal
2. Edit your application
3. Make sure the Redirect URI exactly matches your IPS Platform URL
4. Save and try again

#### ❌ "Invalid client_id or client_secret"

**Problem**: Credentials don't match or were copied incorrectly.

**Solution**:
1. Go back to Keap Developer Portal
2. Copy the credentials again (make sure no extra spaces)
3. Update in IPS Platform
4. Save and test again

#### ❌ "Authorization failed" or "Access denied"

**Problem**: You didn't complete the authorization flow or denied permissions.

**Solution**:
1. Click "Test Connection" again
2. Follow the authorization link
3. Click "Allow" on the Keap page
4. Make sure you're logged into the correct Keap account

#### ❌ "Token expired" after some time

**Problem**: Access token expired (normal after 24 hours).

**Solution**:
- Don't worry! The system automatically refreshes tokens
- If it fails to refresh, just re-authorize by clicking "Test Connection"

#### ❌ "Rate limit exceeded"

**Problem**: Too many API requests in a short time.

**Solution**:
- Keap allows 125 requests per second
- If you hit this limit, wait a few seconds and try again
- Consider adjusting sync frequency to "Hourly" or "Daily"

---

## API Scopes Explained

If you didn't choose "Full Access", here's what each scope allows:

| Scope | Allows Access To |
|-------|------------------|
| **contact** | Create, read, update contacts |
| **tag** | Apply and remove tags |
| **campaign** | Add contacts to campaigns |
| **note** | Create notes on contacts |
| **opportunity** | Manage sales opportunities |
| **product** | Access product/pricing info |
| **subscription** | Manage subscriptions |

For full LMS integration, we recommend: **contact**, **tag**, **campaign**, and **note** scopes at minimum.

---

## Security Best Practices

1. ✅ **Never share your Client Secret** publicly or in version control
2. ✅ **Use environment variables** for storing credentials in production
3. ✅ **Use HTTPS** (not HTTP) in production for the redirect URI
4. ✅ **Regularly review** connected applications in your Keap account
5. ✅ **Rotate credentials** periodically (every 6-12 months)
6. ✅ **Monitor API usage** in the Keap Developer Portal
7. ✅ **Use minimal scopes** (only request what you need)

---

## What's Next?

After successful setup:

1. **Configure Tags**: Create tags in Keap for student segmentation
   - Example: "LMS - Enrolled", "LMS - Completed", "LMS - Certificate Earned"

2. **Set Up Campaigns**: Create automation campaigns in Keap
   - Welcome emails for new students
   - Course completion congratulations
   - Re-engagement for inactive students

3. **Test the Integration**:
   - Enroll a test student
   - Verify they appear in Keap
   - Check that tags are applied correctly

4. **Monitor Sync**:
   - Check sync logs regularly
   - Verify data accuracy
   - Adjust sync frequency if needed

---

## Additional Resources

- [Keap Developer Documentation](https://developer.infusionsoft.com/docs/rest/)
- [Keap API Reference](https://developer.infusionsoft.com/docs/rest/reference/)
- [OAuth 2.0 Guide](https://developer.infusionsoft.com/docs/rest/oauth/)
- [Keap Support](https://help.keap.com/)
- [Keap Developer Community](https://community.keap.com/developer)

---

## Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [Keap Integration Guide](KEAP_INTEGRATION_GUIDE.md) for API usage examples
3. Contact your IPS Platform administrator
4. Visit Keap Developer Community for API questions
5. Contact Keap Support for account-specific issues

---

## Visual Reference

### Keap Developer Portal Overview

```
┌─────────────────────────────────────────────────────────┐
│  Keap Developer Portal                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  My Applications                                        │
│  ┌───────────────────────────────────────────────┐     │
│  │  + New App                                     │     │
│  └───────────────────────────────────────────────┘     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │  IPS Platform Integration                 [Active] ││
│  │  ────────────────────────────────────────────────  ││
│  │  Client ID:     abc123...               [Copy]    ││
│  │  Client Secret: ********                [Show]    ││
│  │  Redirect URI:  https://yourdomain.com/...        ││
│  │  Scopes:        Full Access                       ││
│  │                                                    ││
│  │  [Edit]  [Delete]  [View Logs]                   ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### IPS Platform Integration Page

```
┌─────────────────────────────────────────────────────────┐
│  Integrations > Keap (Infusionsoft)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Keap (Infusionsoft)              [Connected] [Enabled] │
│  CRM and marketing automation platform                  │
│                                                          │
│  API Credentials                          [Show] [Hide] │
│  ─────────────────────────────────────────────────────  │
│  Client ID *           [abc123def456...            ]    │
│  Client Secret *       [••••••••••••••••••••••••••]    │
│  Access Token          [Generated automatically     ]    │
│  Refresh Token         [Generated automatically     ]    │
│                                                          │
│  Integration Settings                                   │
│  ─────────────────────────────────────────────────────  │
│  Auto-sync Contacts    [ON]                             │
│  Default Tag Category  [LMS Students              ]     │
│  Sync Frequency        [Real-time          ▼]           │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│  [Test Connection]           [Save Configuration]       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Last Updated**: January 2025
**Version**: 1.0
