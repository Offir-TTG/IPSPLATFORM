# Zoom Integration Guide for IPS Platform

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Zoom App Setup](#zoom-app-setup)
4. [IPS Platform Configuration](#ips-platform-configuration)
5. [Testing the Integration](#testing-the-integration)
6. [Webhook Configuration](#webhook-configuration)
7. [API Endpoints](#api-endpoints)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Zoom integration allows your IPS Platform to:
- Create and manage Zoom meetings programmatically
- Schedule meetings for courses and programs
- Receive real-time updates via webhooks
- Track attendance and recordings
- Generate SDK tokens for embedded meetings

This integration uses Zoom's **Server-to-Server OAuth** authentication method, which is the recommended approach for backend integrations.

---

## Prerequisites

Before setting up the Zoom integration, you need:

1. A **Zoom account** (Pro, Business, or Enterprise plan recommended)
2. **Admin access** to your Zoom account
3. Access to **Zoom Marketplace** to create an app
4. **Admin access** to your IPS Platform

---

## Zoom App Setup

### Step 1: Create a Server-to-Server OAuth App

1. Go to [Zoom App Marketplace](https://marketplace.zoom.us/)
2. Click **Develop** → **Build App**
3. Choose **Server-to-Server OAuth** as the app type
4. Click **Create**

### Step 2: Configure App Information

1. **App Name**: `IPS Platform Integration` (or your preferred name)
2. **Short Description**: `Integration with IPS Platform for meeting management`
3. **Company Name**: Your organization name
4. **Developer Contact**: Your email address

Click **Continue**.

### Step 3: Configure App Credentials

You'll see three important credentials:

- **Account ID**: Your Zoom account identifier
- **Client ID**: Your app's client identifier
- **Client Secret**: Your app's secret key (keep this secure!)

**⚠️ IMPORTANT**: Copy these credentials immediately. You'll need them for IPS Platform configuration.

### Step 4: Add Scopes

Click on the **Scopes** tab and add the following scopes:

**Required Scopes:**
- `meeting:write:admin` - Create and manage meetings
- `meeting:read:admin` - Read meeting information
- `recording:write:admin` - Manage recordings
- `recording:read:admin` - Access recordings
- `user:read:admin` - Read user information
- `webinar:write:admin` - Create and manage webinars (optional)
- `webinar:read:admin` - Read webinar information (optional)

Click **Continue** and then **Activate** the app.

### Step 5: (Optional) SDK Credentials for Embedded Meetings

If you want to embed Zoom meetings directly in your platform:

1. Go back to Zoom Marketplace
2. Create a new app with type **Meeting SDK**
3. Get the **SDK Key** and **SDK Secret**
4. Save these for later configuration

---

## IPS Platform Configuration

### Step 1: Access Integration Settings

1. Log in to IPS Platform as an **Admin**
2. Navigate to **Admin → Configuration → Integrations**
3. Find the **Zoom** integration card

### Step 2: Enter Zoom Credentials

Fill in the following fields with the credentials from your Zoom app:

#### Required Fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Account ID** | Your Zoom Account ID | `abc123def456` |
| **Client ID** | Your app's Client ID | `Abc123DeF456_XyZ` |
| **Client Secret** | Your app's Client Secret | `aBc123dEf456gHi789jKl012` |

#### Optional Fields (for Meeting SDK):

| Field | Description |
|-------|-------------|
| **SDK Key** | Meeting SDK Key (for embedded meetings) |
| **SDK Secret** | Meeting SDK Secret |

### Step 3: Configure Settings

Configure the default meeting settings:

| Setting | Options | Default | Description |
|---------|---------|---------|-------------|
| **Default Meeting Duration** | Number (minutes) | `60` | Default length for new meetings |
| **Auto Recording** | `none`, `local`, `cloud` | `none` | Automatic recording setting |
| **Waiting Room** | On/Off | `On` | Enable waiting room for security |
| **Join Before Host** | On/Off | `Off` | Allow participants to join early |

### Step 4: Save Configuration

1. Click **Save** to store the configuration
2. The system will validate your credentials
3. Enable the integration by toggling the switch to **On**

### Step 5: Test the Connection

1. Click the **Test Connection** button
2. You should see a success message like:
   ```
   Connected to Zoom successfully!
   Account: John Doe (john.doe@company.com)
   ```
3. If you see an error, verify your credentials and try again

---

## Testing the Integration

### Quick Test: Create a Test Meeting

You can test the integration by creating a meeting via API:

```bash
POST /api/admin/integrations/zoom/meetings
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "topic": "Test Meeting",
  "type": 2,
  "start_time": "2025-01-20T10:00:00Z",
  "duration": 30,
  "timezone": "America/New_York"
}
```

**Expected Response:**
```json
{
  "success": true,
  "meeting": {
    "id": "85746065574",
    "topic": "Test Meeting",
    "join_url": "https://zoom.us/j/85746065574?pwd=...",
    "start_url": "https://zoom.us/s/85746065574?zak=...",
    "start_time": "2025-01-20T10:00:00Z",
    "duration": 30
  }
}
```

### Verify in Zoom

1. Log in to your [Zoom web portal](https://zoom.us/)
2. Go to **Meetings**
3. You should see the test meeting listed

---

## Webhook Configuration

Webhooks allow Zoom to notify your platform about meeting events in real-time.

### Step 1: Configure Webhook URL in Zoom

1. Go to your Zoom app in [Marketplace](https://marketplace.zoom.us/)
2. Click on **Feature** → **Event Subscriptions**
3. Click **Add Event Subscription**
4. **Subscription Name**: `IPS Platform Events`
5. **Event notification endpoint URL**:
   ```
   https://your-domain.com/api/webhooks/zoom
   ```
   Replace `your-domain.com` with your actual domain.

### Step 2: Add Event Types

Select the following events to subscribe to:

**Meeting Events:**
- `meeting.started` - Notified when a meeting starts
- `meeting.ended` - Notified when a meeting ends
- `meeting.participant_joined` - Track participant join
- `meeting.participant_left` - Track participant leave

**Recording Events:**
- `recording.completed` - Notified when recording is ready
- `recording.transcript_completed` - Notified when transcript is ready

### Step 3: Verify Webhook

1. Zoom will send a verification request to your endpoint
2. The webhook will respond automatically
3. You should see **Verification successful** message

### Step 4: (Optional) Configure Webhook Security

For production environments, it's recommended to verify webhook signatures:

1. In your Zoom app settings, find the **Secret Token**
2. In IPS Platform, go to Zoom integration settings
3. Add the Secret Token in the **Webhook Secret Token** field
4. Save the configuration

---

## API Endpoints

### Meeting Management

#### List All Meetings
```http
GET /api/admin/integrations/zoom/meetings?type=upcoming
```

**Query Parameters:**
- `type`: `scheduled`, `live`, or `upcoming` (default: `upcoming`)

**Response:**
```json
{
  "success": true,
  "meetings": [...],
  "count": 5
}
```

#### Create a Meeting
```http
POST /api/admin/integrations/zoom/meetings
Content-Type: application/json

{
  "topic": "Product Demo",
  "type": 2,
  "start_time": "2025-01-25T15:00:00Z",
  "duration": 60,
  "timezone": "America/New_York",
  "password": "secure123",
  "agenda": "Demonstrate new features",
  "settings": {
    "host_video": true,
    "participant_video": true,
    "waiting_room": true
  }
}
```

#### Get Meeting Details
```http
GET /api/admin/integrations/zoom/meetings/{meeting_id}
```

#### Update a Meeting
```http
PATCH /api/admin/integrations/zoom/meetings/{meeting_id}
Content-Type: application/json

{
  "topic": "Updated Topic",
  "start_time": "2025-01-25T16:00:00Z",
  "duration": 90
}
```

#### Delete a Meeting
```http
DELETE /api/admin/integrations/zoom/meetings/{meeting_id}
```

### Webhook Endpoint

#### Zoom Webhook Receiver
```http
POST /api/webhooks/zoom
```

This endpoint automatically handles incoming webhook events from Zoom.

---

## Usage Examples

### Example 1: Create Meeting for a Course

```typescript
// When a new course session is scheduled
async function createCourseSession(courseId: string, sessionData: any) {
  const response = await fetch('/api/admin/integrations/zoom/meetings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: `${sessionData.courseName} - Session ${sessionData.sessionNumber}`,
      type: 2, // Scheduled meeting
      start_time: sessionData.startTime,
      duration: sessionData.duration,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: false,
        waiting_room: true,
        mute_upon_entry: true
      }
    })
  });

  const result = await response.json();

  if (result.success) {
    // Save meeting details to your database
    await saveSessionMeeting(courseId, {
      meetingId: result.meeting.id,
      joinUrl: result.meeting.join_url,
      startUrl: result.meeting.start_url
    });
  }
}
```

### Example 2: List Upcoming Meetings

```typescript
async function getUpcomingMeetings() {
  const response = await fetch('/api/admin/integrations/zoom/meetings?type=upcoming');
  const data = await response.json();

  if (data.success) {
    console.log(`Found ${data.count} upcoming meetings`);
    data.meetings.forEach(meeting => {
      console.log(`- ${meeting.topic} at ${meeting.start_time}`);
    });
  }
}
```

### Example 3: Handle Recording Completed Event

The webhook handler automatically processes this:

```typescript
// In webhook handler (already implemented)
async function handleRecordingCompleted(payload: any) {
  const { id, topic, recording_files } = payload.object;

  // Save recording links to database
  for (const recording of recording_files) {
    await saveRecording({
      meetingId: id,
      topic: topic,
      playUrl: recording.play_url,
      downloadUrl: recording.download_url,
      fileType: recording.file_type,
      fileSize: recording.file_size
    });
  }

  // Notify participants that recording is available
  await notifyParticipants(id, recording_files[0].play_url);
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Failed to authenticate with Zoom"

**Possible Causes:**
- Invalid Account ID, Client ID, or Client Secret
- App not activated in Zoom Marketplace
- Scopes not properly configured

**Solution:**
1. Verify all credentials are copied correctly (no extra spaces)
2. Ensure the app is **Activated** in Zoom Marketplace
3. Check that all required scopes are added

#### Issue 2: "Zoom integration is not enabled"

**Solution:**
1. Go to Admin → Integrations
2. Find Zoom integration
3. Toggle the switch to **Enable**
4. Click **Save**

#### Issue 3: Webhook not receiving events

**Possible Causes:**
- Webhook URL not accessible from internet
- SSL certificate issues
- Webhook signature verification failing

**Solution:**
1. Verify your webhook URL is publicly accessible
2. Test with: `curl https://your-domain.com/api/webhooks/zoom`
3. Check webhook logs in Zoom Marketplace app settings
4. Temporarily disable signature verification for testing

#### Issue 4: "Meeting creation failed"

**Possible Causes:**
- Invalid date/time format
- Missing required fields
- Insufficient permissions

**Solution:**
1. Use ISO 8601 format for dates: `2025-01-25T15:00:00Z`
2. Ensure `topic` and `start_time` are provided
3. Verify the **meeting:write:admin** scope is enabled

#### Issue 5: Cannot see recordings

**Possible Causes:**
- Recording not enabled in meeting settings
- Recording still processing
- Insufficient permissions

**Solution:**
1. Enable "Auto Recording" in meeting settings
2. Wait 5-10 minutes after meeting ends for processing
3. Verify **recording:read:admin** scope is enabled

---

## Best Practices

### Security

1. **Never expose credentials in client-side code**
2. **Use webhook signature verification** in production
3. **Rotate credentials** periodically
4. **Limit API access** to admin users only

### Performance

1. **Cache meeting lists** to reduce API calls
2. **Use webhooks** instead of polling for status updates
3. **Implement rate limiting** to avoid hitting Zoom API limits

### User Experience

1. **Always enable waiting rooms** for security
2. **Send meeting reminders** before scheduled time
3. **Provide clear join instructions** to participants
4. **Archive recordings** for future access

---

## Additional Resources

- [Zoom API Documentation](https://developers.zoom.us/docs/api/)
- [Server-to-Server OAuth Guide](https://developers.zoom.us/docs/internal-apps/)
- [Webhook Reference](https://developers.zoom.us/docs/api/rest/webhook-reference/)
- [Meeting SDK Documentation](https://developers.zoom.us/docs/meeting-sdk/)

---

## Support

For issues specific to the IPS Platform Zoom integration:
- Check the application logs for detailed error messages
- Review the webhook event logs in the database
- Contact your platform administrator

For Zoom-specific issues:
- Visit [Zoom Developer Forum](https://devforum.zoom.us/)
- Contact [Zoom Developer Support](https://support.zoom.us/)

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
