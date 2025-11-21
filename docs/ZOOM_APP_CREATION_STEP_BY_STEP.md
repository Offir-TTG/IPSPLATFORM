# How to Configure Zoom - Complete Step-by-Step Guide

## Overview

This guide will walk you through creating and configuring a Zoom Server-to-Server OAuth app for your IPS Platform integration.

**Time Required:** 10-15 minutes
**Prerequisites:** Zoom account with admin privileges

---

## Part 1: Create Your Zoom App

### Step 1: Access Zoom Marketplace

1. Open your web browser
2. Go to: **https://marketplace.zoom.us/**
3. Click the **Sign In** button in the top right
4. Log in with your Zoom account credentials

![Zoom Marketplace Homepage]

### Step 2: Navigate to App Creation

1. Once logged in, click **Develop** in the top menu bar
2. From the dropdown, select **Build App**

![Develop Menu]

### Step 3: Choose App Type

You'll see several app types. Choose **Server-to-Server OAuth**:

1. Find the card labeled **Server-to-Server OAuth**
2. Click the **Create** button on that card

![App Type Selection]

**Why Server-to-Server OAuth?**
- ✅ No user interaction required
- ✅ Perfect for backend integrations
- ✅ Automatic token management
- ✅ Most secure for server applications

---

## Part 2: Configure App Information

### Step 4: Basic Information

Fill in the following fields:

| Field | What to Enter | Example |
|-------|---------------|---------|
| **App Name** | Name of your integration | `IPS Platform Integration` |
| **Short Description** | Brief description | `LMS integration for managing online courses` |
| **Company Name** | Your organization name | `Your Company Name` |
| **Developer Name** | Your name | `John Doe` |
| **Developer Email** | Your email | `john.doe@yourcompany.com` |

![Basic Information Form]

**Tips:**
- Use a descriptive app name so you can identify it later
- The email will receive important notifications about the app
- Company name will be visible to users (if applicable)

Click **Continue** to proceed.

---

## Part 3: Get Your Credentials

### Step 5: Copy Your Credentials

You'll now see the **App Credentials** page with three important values:

```
┌─────────────────────────────────────────────┐
│ Account ID                                   │
│ abc123def456ghi789                          │
│ [Copy] button                                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Client ID                                    │
│ Abc123DeF456GhI789JkL                       │
│ [Copy] button                                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Client Secret                                │
│ xYz987WvU654TsR321QpO                       │
│ [Copy] button                                │
└─────────────────────────────────────────────┘
```

**⚠️ CRITICAL STEP:**

1. Open a text editor (Notepad, TextEdit, etc.)
2. Copy each credential and paste into your text file:

```
Zoom Credentials for IPS Platform
==================================

Account ID: [paste here]
Client ID: [paste here]
Client Secret: [paste here]
```

3. **Save this file securely** - you'll need these values in a moment
4. **NEVER share** these credentials publicly

Click **Continue** to proceed.

---

## Part 4: Configure Scopes (Permissions)

### Step 6: Add Required Scopes

Scopes define what your app can do. Click on the **Scopes** tab.

You'll see a search box and a list of available scopes.

**Add these scopes one by one:**

#### 1. Meeting Scopes

Search for and add:
- ✅ **View and manage all user meetings** (`meeting:write:admin`)
- ✅ **View all user meetings** (`meeting:read:admin`)

#### 2. Recording Scopes

Search for and add:
- ✅ **View and manage all user recordings** (`recording:write:admin`)
- ✅ **View all user recordings** (`recording:read:admin`)

#### 3. User Scopes

Search for and add:
- ✅ **View all user information** (`user:read:admin`)

#### 4. Optional: Webinar Scopes

If you plan to use webinars, also add:
- ⚪ **View and manage all user webinars** (`webinar:write:admin`)
- ⚪ **View all user webinars** (`webinar:read:admin`)

**How to add a scope:**
1. Type the scope name in the search box (e.g., "meeting")
2. Click the **+ Add** button next to each scope
3. The scope will appear in your "Added scopes" list

![Scopes Configuration]

**Your final scope list should look like this:**

```
✅ meeting:write:admin
✅ meeting:read:admin
✅ recording:write:admin
✅ recording:read:admin
✅ user:read:admin
```

Click **Continue** to proceed.

---

## Part 5: Activate Your App

### Step 7: Review and Activate

1. Review all the information you've entered
2. Click **Continue** one more time
3. You'll see an **Activate your app** button
4. Click **Activate your app**

![Activation Screen]

**Success!** You'll see a confirmation message:
```
✅ Your app has been activated successfully!
```

---

## Part 6: Configure in IPS Platform

### Step 8: Access IPS Platform Integrations

1. Open your IPS Platform in a web browser
2. Log in as an **Administrator**
3. Navigate to: **Admin** → **Configuration** → **Integrations**

![IPS Platform Navigation]

### Step 9: Find Zoom Integration

Scroll down to find the **Zoom** integration card. It will show:
- Zoom logo (video camera icon)
- "Zoom" title
- "Video conferencing and online meetings" description
- Status: "Disconnected" (gray badge)

![Zoom Integration Card]

### Step 10: Enter Your Credentials

Click on the **Zoom** tab to open the configuration panel.

Now, copy the credentials from your text file (from Step 5) and paste them into the corresponding fields:

| IPS Platform Field | Paste Value From |
|-------------------|------------------|
| **Account ID** | Your saved Account ID |
| **Client ID** | Your saved Client ID |
| **Client Secret** | Your saved Client Secret |

![Credential Fields]

**Important:**
- Make sure there are no extra spaces before or after the values
- Triple-check each value is correct
- These fields are case-sensitive

### Step 11: Configure Settings (Optional)

Scroll down to the **Settings** section and configure default meeting options:

| Setting | Recommended Value | Description |
|---------|------------------|-------------|
| **Default Meeting Duration** | `60` | Default length in minutes |
| **Auto Recording** | `cloud` or `none` | Where to save recordings |
| **Waiting Room** | Toggle **ON** | Security feature |
| **Join Before Host** | Toggle **OFF** | Prevent early joins |

![Meeting Settings]

### Step 12: Save Configuration

1. Click the **Save** button at the bottom
2. You'll see a success message: "Zoom configuration saved successfully"

---

## Part 7: Test Your Connection

### Step 13: Enable and Test

1. Find the toggle switch at the top right of the Zoom card
2. Toggle it to **ON** (it will turn blue/primary color)
3. Click the **Test Connection** button

![Test Connection Button]

### Step 14: Verify Success

You should see a success message:

```
✅ Connected to Zoom successfully!
Account: John Doe (john.doe@company.com)
```

![Success Message]

**If you see this message, congratulations!** 🎉 Your integration is working perfectly.

---

## Troubleshooting

### ❌ Error: "Failed to authenticate with Zoom"

**Possible causes:**
1. Incorrect Account ID, Client ID, or Client Secret
2. Extra spaces in the credential fields
3. App not activated in Zoom

**Solutions:**
1. Go back to Zoom Marketplace → Your Apps
2. Click on your app name
3. Verify the credentials match exactly
4. Copy them again and paste into IPS Platform
5. Make sure the app shows **Activated** status in Zoom

### ❌ Error: "Invalid credentials"

**Solution:**
1. Click the **eye icon** (👁️) next to Client Secret to reveal it
2. Verify each character matches
3. Try copying directly from Zoom again

### ❌ Error: "Missing required scopes"

**Solution:**
1. Go to Zoom Marketplace → Your Apps
2. Click on your app
3. Go to **Scopes** tab
4. Verify all 5 required scopes are added
5. If missing, add them and wait 5 minutes
6. Try testing again

### ❌ Connection works but can't create meetings

**Solution:**
1. Verify your Zoom account plan supports API access
2. Check that `meeting:write:admin` scope is added
3. Try creating a test meeting in Zoom web portal first
4. Contact Zoom support if issue persists

---

## Part 8: Optional - Configure Webhooks

Webhooks allow Zoom to notify your platform when events occur (meeting starts, ends, recordings ready, etc.).

### Step 15: Enable Event Subscriptions

1. Go back to Zoom Marketplace → Your Apps
2. Click on your app name
3. Click on **Features** in the left sidebar
4. Find **Event Subscriptions** section
5. Toggle **Event Subscriptions** to **ON**

### Step 16: Add Event Subscription

1. Click **Add Event Subscription**
2. Fill in:
   - **Subscription Name**: `IPS Platform Events`
   - **Event notification endpoint URL**:
     ```
     https://your-actual-domain.com/api/webhooks/zoom
     ```
     ⚠️ Replace `your-actual-domain.com` with your real domain

![Webhook URL Configuration]

### Step 17: Select Events

Click **Add events** and select:

**Meeting Events:**
- ✅ Start Meeting
- ✅ End Meeting
- ✅ Participant/Host joined meeting
- ✅ Participant/Host left meeting

**Recording Events:**
- ✅ All Recordings have completed
- ✅ Recording transcript files have completed

### Step 18: Save Event Subscription

1. Click **Save**
2. Zoom will send a validation request to your URL
3. Your IPS Platform will automatically respond
4. You'll see **Verified** status ✅

![Webhook Verified]

---

## Part 9: Optional - Meeting SDK (For Embedded Meetings)

If you want to embed Zoom meetings directly in your platform (instead of opening Zoom in a new window):

### Step 19: Create Meeting SDK App

1. Go to Zoom Marketplace → Develop → Build App
2. This time, choose **Meeting SDK** app type
3. Fill in basic information:
   - **App Name**: `IPS Platform SDK`
   - **Choose your app type**: SDK app
4. Click **Create**

### Step 20: Get SDK Credentials

1. You'll see:
   - **SDK Key** (Client ID)
   - **SDK Secret** (Client Secret)
2. Copy both values

### Step 21: Add to IPS Platform

1. Go back to IPS Platform → Admin → Integrations → Zoom
2. Find the **Optional: SDK Credentials** section
3. Paste:
   - **SDK Key**
   - **SDK Secret**
4. Click **Save**

Now you can embed Zoom meetings directly in your platform!

---

## Verification Checklist

Before finishing, verify you've completed all steps:

### In Zoom Marketplace:
- ✅ Created Server-to-Server OAuth app
- ✅ App is **Activated**
- ✅ All 5 required scopes added
- ✅ (Optional) Webhooks configured and verified
- ✅ (Optional) Meeting SDK app created

### In IPS Platform:
- ✅ Account ID entered correctly
- ✅ Client ID entered correctly
- ✅ Client Secret entered correctly
- ✅ Integration enabled (toggle ON)
- ✅ Test connection shows success ✅
- ✅ Default settings configured

---

## What's Next?

Now that your integration is configured:

### 1. Create Your First Test Meeting

```bash
POST /api/admin/integrations/zoom/meetings
{
  "topic": "My First Test Meeting",
  "start_time": "2025-01-25T10:00:00Z",
  "duration": 30
}
```

### 2. Check Zoom Portal

1. Go to https://zoom.us/
2. Sign in
3. Click **Meetings**
4. You should see your test meeting! 🎉

### 3. Explore More Features

- [Complete Integration Guide](./ZOOM_INTEGRATION_GUIDE.md)
- [API Reference](./ZOOM_INTEGRATION_GUIDE.md#api-endpoints)
- [Usage Examples](./ZOOM_INTEGRATION_GUIDE.md#usage-examples)

---

## Security Best Practices

### ✅ DO:
- Keep your credentials in a secure password manager
- Use environment variables in production
- Enable webhook signature verification
- Regularly rotate credentials (every 90 days)
- Limit access to admin users only

### ❌ DON'T:
- Share credentials via email or chat
- Commit credentials to version control
- Use the same app for multiple environments
- Give admin access to untrusted users
- Ignore security notifications from Zoom

---

## Getting Help

### IPS Platform Issues:
- Check application logs for detailed errors
- Review [Troubleshooting Guide](./ZOOM_INTEGRATION_GUIDE.md#troubleshooting)
- Contact your platform administrator

### Zoom API Issues:
- Visit [Zoom Developer Forum](https://devforum.zoom.us/)
- Check [Zoom API Documentation](https://developers.zoom.us/docs/api/)
- Contact [Zoom Support](https://support.zoom.us/)

### Common Questions:
- **Q: Do I need a paid Zoom account?**
  - A: Pro or higher recommended for API access and cloud recording

- **Q: Can I use the same app for testing and production?**
  - A: Better to create separate apps for each environment

- **Q: How many API calls can I make?**
  - A: Zoom has rate limits. See [Rate Limits Documentation](https://developers.zoom.us/docs/api/rest/rate-limits/)

---

## Congratulations! 🎉

You've successfully configured Zoom integration for your IPS Platform!

Your system can now:
- ✅ Create and manage meetings automatically
- ✅ Schedule sessions for courses and programs
- ✅ Track attendance and recordings
- ✅ Receive real-time event notifications

**Next:** Try creating your first meeting through the platform!

---

**Last Updated**: November 17, 2025
**Guide Version**: 1.0
**Zoom API Version**: v2
