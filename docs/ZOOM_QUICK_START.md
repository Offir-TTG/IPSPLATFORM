# Zoom Integration - Quick Start Guide

## 5-Minute Setup

### Step 1: Create Zoom App (2 minutes)

1. Go to https://marketplace.zoom.us/
2. Click **Develop** → **Build App**
3. Choose **Server-to-Server OAuth**
4. Fill in basic info:
   - App Name: `IPS Platform`
   - Description: `LMS Integration`
5. Copy these 3 credentials:
   - ✅ **Account ID**
   - ✅ **Client ID**
   - ✅ **Client Secret**

### Step 2: Add Scopes (1 minute)

Click **Scopes** tab and add:
- ✅ `meeting:write:admin`
- ✅ `meeting:read:admin`
- ✅ `recording:write:admin`
- ✅ `recording:read:admin`
- ✅ `user:read:admin`

Click **Continue** → **Activate your app**

### Step 3: Configure in IPS Platform (2 minutes)

1. Log in to IPS Platform as Admin
2. Go to **Admin** → **Configuration** → **Integrations**
3. Find **Zoom** card
4. Enter the 3 credentials from Step 1
5. Click **Save**
6. Toggle **Enable** switch to ON
7. Click **Test Connection** - you should see success!

## Done! 🎉

Your Zoom integration is now active.

## What You Can Do Now

### Create a Meeting

```bash
POST /api/admin/integrations/zoom/meetings
{
  "topic": "My First Meeting",
  "start_time": "2025-01-25T10:00:00Z",
  "duration": 60
}
```

### List Meetings

```bash
GET /api/admin/integrations/zoom/meetings
```

## Next Steps

- **Configure Webhooks**: [Full Guide](./ZOOM_INTEGRATION_GUIDE.md#webhook-configuration)
- **Embed Meetings**: Set up Meeting SDK (optional)
- **Customize Settings**: Adjust default meeting options

## Need Help?

See the [Complete Integration Guide](./ZOOM_INTEGRATION_GUIDE.md) for:
- Detailed troubleshooting
- API reference
- Usage examples
- Best practices

---

**⚡ Quick Tip**: Test your integration by creating a test meeting through the API. Check your Zoom portal to see it appear instantly!
