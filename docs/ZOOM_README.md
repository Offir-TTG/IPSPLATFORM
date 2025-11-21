# Zoom Integration Documentation

Complete documentation for Zoom video conferencing integration with IPS Platform.

## 📚 Documentation Index

Choose the guide that best fits your needs:

### 🚀 For Quick Setup (5-10 minutes)
- **[Quick Start Guide](./ZOOM_QUICK_START.md)** - Fastest way to get started
- **[Visual Setup Guide](./ZOOM_VISUAL_SETUP_GUIDE.md)** - Visual checklists and diagrams

### 📖 For Complete Instructions
- **[Step-by-Step App Creation](./ZOOM_APP_CREATION_STEP_BY_STEP.md)** - Detailed walkthrough with screenshots references
- **[Complete Integration Guide](./ZOOM_INTEGRATION_GUIDE.md)** - Full documentation with all features

---

## 🎯 What Can You Do?

With Zoom integration, your IPS Platform can:

✅ **Meeting Management**
- Create scheduled meetings
- Create instant meetings
- Update meeting details
- Cancel meetings
- List all meetings

✅ **Course Integration**
- Auto-create meetings for course sessions
- Provide join links to students
- Track attendance automatically
- Record sessions to cloud

✅ **Real-Time Events** (via Webhooks)
- Meeting started/ended notifications
- Participant join/leave tracking
- Recording completion alerts
- Transcript availability

✅ **Recordings & Analytics**
- Access cloud recordings
- Download recordings
- View participant reports
- Track attendance duration

---

## 🗺️ Documentation Roadmap

```
START HERE
    │
    ├─ Never set up Zoom integration before?
    │  └─> Read: Quick Start Guide (5 min)
    │
    ├─ Want step-by-step with details?
    │  └─> Read: Step-by-Step App Creation (15 min)
    │
    ├─ Need visual checklists?
    │  └─> Read: Visual Setup Guide (quick reference)
    │
    ├─ Setting up webhooks?
    │  └─> Read: Complete Integration Guide → Webhooks
    │
    ├─ Want to use the API?
    │  └─> Read: Complete Integration Guide → API Endpoints
    │
    └─ Having problems?
       └─> Read: Complete Integration Guide → Troubleshooting
```

---

## 📋 Quick Reference

### Essential URLs

| Purpose | URL |
|---------|-----|
| **Zoom Marketplace** | https://marketplace.zoom.us/ |
| **Your Zoom Apps** | https://marketplace.zoom.us/user/build |
| **Zoom API Docs** | https://developers.zoom.us/docs/api/ |
| **IPS Integrations** | `https://[your-domain]/admin/config/integrations` |

### API Endpoints (IPS Platform)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/api/admin/integrations/zoom/meetings` | List meetings |
| **POST** | `/api/admin/integrations/zoom/meetings` | Create meeting |
| **GET** | `/api/admin/integrations/zoom/meetings/[id]` | Get meeting details |
| **PATCH** | `/api/admin/integrations/zoom/meetings/[id]` | Update meeting |
| **DELETE** | `/api/admin/integrations/zoom/meetings/[id]` | Delete meeting |
| **POST** | `/api/webhooks/zoom` | Webhook receiver |

### Required Credentials

You need **3 credentials** from Zoom:
1. ✅ Account ID
2. ✅ Client ID
3. ✅ Client Secret

### Required Scopes in Zoom

Add these **5 scopes** to your Zoom app:
1. ✅ `meeting:write:admin`
2. ✅ `meeting:read:admin`
3. ✅ `recording:write:admin`
4. ✅ `recording:read:admin`
5. ✅ `user:read:admin`

---

## 🏃 Quick Start (3 Steps)

### Step 1: Create Zoom App
1. Go to https://marketplace.zoom.us/
2. Create "Server-to-Server OAuth" app
3. Add 5 required scopes
4. Copy Account ID, Client ID, Client Secret

### Step 2: Configure IPS Platform
1. Admin → Integrations → Zoom
2. Paste 3 credentials
3. Save and Enable

### Step 3: Test
1. Click "Test Connection"
2. Should show ✅ Connected!

**Detailed instructions:** [Quick Start Guide](./ZOOM_QUICK_START.md)

---

## 📊 Integration Architecture

```
┌─────────────────────────────────────────────────┐
│            IPS Platform (Your LMS)              │
│  ┌───────────────────────────────────────────┐  │
│  │         Admin Interface                   │  │
│  │  - Configure credentials                  │  │
│  │  - Test connection                        │  │
│  │  - Manage settings                        │  │
│  └───────────────────────────────────────────┘  │
│                      ↓                          │
│  ┌───────────────────────────────────────────┐  │
│  │         Zoom Client (lib/zoom)            │  │
│  │  - Authentication (S2S OAuth)             │  │
│  │  - Token management                       │  │
│  │  - API wrapper methods                    │  │
│  └───────────────────────────────────────────┘  │
│                      ↓                          │
│  ┌───────────────────────────────────────────┐  │
│  │         API Endpoints                     │  │
│  │  - Meeting CRUD operations                │  │
│  │  - Recording access                       │  │
│  │  - Webhook receiver                       │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                       ↕ HTTPS
┌─────────────────────────────────────────────────┐
│              Zoom Platform                      │
│  - OAuth Token Server                           │
│  - Meeting API                                  │
│  - Recording API                                │
│  - Webhook Events                               │
└─────────────────────────────────────────────────┘
```

---

## 🔒 Security Features

- ✅ **Server-to-Server OAuth** - Most secure authentication method
- ✅ **Token Caching** - Minimizes API calls, auto-refreshes
- ✅ **Webhook Signature Verification** - Prevents fake events
- ✅ **Admin-Only Access** - API endpoints protected
- ✅ **Tenant Isolation** - Multi-tenant support
- ✅ **Credential Encryption** - Secure storage (implement in production)

---

## 🎓 Learning Path

### For Administrators
1. Read: [Quick Start Guide](./ZOOM_QUICK_START.md)
2. Follow: Setup in IPS Platform
3. Test: Create a test meeting
4. Read: [Visual Setup Guide](./ZOOM_VISUAL_SETUP_GUIDE.md) for reference

### For Developers
1. Read: [Complete Integration Guide](./ZOOM_INTEGRATION_GUIDE.md)
2. Review: API Endpoints section
3. Study: Usage Examples
4. Explore: `src/lib/zoom/client.ts` for implementation details
5. Test: Create meetings via API

### For Support Staff
1. Read: [Visual Setup Guide](./ZOOM_VISUAL_SETUP_GUIDE.md)
2. Bookmark: Troubleshooting section
3. Keep handy: Error message solutions

---

## 💡 Common Use Cases

### Use Case 1: Schedule Course Session
```typescript
// When creating a course session
const meeting = await createMeeting({
  topic: "Advanced JavaScript - Week 3",
  start_time: "2025-01-25T10:00:00Z",
  duration: 90
});

// Save join URL to course session
await saveCourseSession({
  meetingId: meeting.id,
  joinUrl: meeting.join_url
});
```

### Use Case 2: Send Meeting Link to Students
```typescript
// Get meeting details
const meeting = await getMeeting(meetingId);

// Email students
await sendEmail({
  to: enrolledStudents,
  subject: "Your Class Meeting Link",
  body: `Join here: ${meeting.join_url}`
});
```

### Use Case 3: Track Attendance
```typescript
// Via webhook when participant joins
webhook.on('participant_joined', async (event) => {
  await recordAttendance({
    studentId: event.participant.email,
    sessionId: event.meeting_id,
    joinTime: event.join_time
  });
});
```

### Use Case 4: Archive Recordings
```typescript
// Via webhook when recording completes
webhook.on('recording_completed', async (event) => {
  await saveRecording({
    sessionId: event.meeting_id,
    playUrl: event.recording_files[0].play_url,
    downloadUrl: event.recording_files[0].download_url
  });
});
```

---

## 🐛 Troubleshooting Quick Links

| Issue | Solution Guide |
|-------|----------------|
| Connection test fails | [Troubleshooting → Issue 1](./ZOOM_INTEGRATION_GUIDE.md#issue-1-failed-to-authenticate-with-zoom) |
| Can't create meetings | [Troubleshooting → Issue 4](./ZOOM_INTEGRATION_GUIDE.md#issue-4-meeting-creation-failed) |
| Webhooks not working | [Troubleshooting → Issue 3](./ZOOM_INTEGRATION_GUIDE.md#issue-3-webhook-not-receiving-events) |
| No recordings found | [Troubleshooting → Issue 5](./ZOOM_INTEGRATION_GUIDE.md#issue-5-cannot-see-recordings) |

**Full troubleshooting:** [Complete Integration Guide → Troubleshooting](./ZOOM_INTEGRATION_GUIDE.md#troubleshooting)

---

## 📦 Package Requirements

The Zoom integration uses these npm packages:

```json
{
  "axios": "^1.6.5",           // HTTP client
  "jsonwebtoken": "^9.0.0"     // For SDK JWT generation
}
```

Already installed in your project ✅

---

## 🔄 Integration Status

### ✅ Completed Features
- Server-to-Server OAuth authentication
- Meeting CRUD operations
- Recording management
- Webhook event handling
- Admin UI configuration
- Connection testing
- Complete documentation

### 🎯 Recommended Enhancements
- Database tables for meeting/recording storage
- Attendance tracking system
- Automatic meeting creation for courses
- Email notifications
- Recording library UI
- Analytics dashboard

### 🚀 Optional Advanced Features
- Meeting SDK integration (embed meetings)
- Live streaming setup
- Breakout room management
- Polling integration
- Waiting room custom branding

---

## 📞 Getting Help

### Documentation Issues
- Unclear instructions? Open an issue with the doc name
- Found a typo? Submit a PR with the fix
- Need clarification? Ask in team chat

### Integration Issues
1. Check the relevant guide for your issue
2. Review error messages carefully
3. Check application logs
4. Verify credentials in Zoom
5. Contact platform administrator

### Zoom API Issues
- [Zoom Developer Forum](https://devforum.zoom.us/)
- [Zoom API Documentation](https://developers.zoom.us/docs/api/)
- [Zoom Support](https://support.zoom.us/)

---

## 🎯 Best Practices

### Development
- ✅ Use separate Zoom apps for dev/staging/production
- ✅ Test in sandbox before production
- ✅ Log all API calls for debugging
- ✅ Handle rate limits gracefully

### Security
- ✅ Never expose credentials in client code
- ✅ Use webhook signature verification
- ✅ Implement credential rotation
- ✅ Audit access regularly

### User Experience
- ✅ Always enable waiting rooms
- ✅ Send meeting reminders
- ✅ Provide clear join instructions
- ✅ Test meeting links before sessions

---

## 📈 Performance Tips

- **Cache meeting lists** to reduce API calls
- **Use webhooks** instead of polling
- **Batch operations** when possible
- **Implement rate limiting** on your side
- **Monitor API usage** in Zoom dashboard

---

## 🗂️ File Structure Reference

```
IPSPlatform/
├── docs/
│   ├── ZOOM_README.md                          ← You are here
│   ├── ZOOM_QUICK_START.md                     ← 5-min setup
│   ├── ZOOM_VISUAL_SETUP_GUIDE.md              ← Visual reference
│   ├── ZOOM_APP_CREATION_STEP_BY_STEP.md       ← Detailed walkthrough
│   └── ZOOM_INTEGRATION_GUIDE.md               ← Complete guide
│
├── src/
│   ├── lib/zoom/
│   │   └── client.ts                           ← Zoom API client
│   │
│   ├── app/api/
│   │   ├── admin/integrations/
│   │   │   ├── [key]/test/route.ts             ← Connection testing
│   │   │   └── zoom/
│   │   │       └── meetings/
│   │   │           ├── route.ts                ← List/Create meetings
│   │   │           └── [id]/route.ts           ← Get/Update/Delete
│   │   │
│   │   └── webhooks/
│   │       └── zoom/route.ts                   ← Webhook handler
│   │
│   └── app/admin/config/integrations/
│       └── page.tsx                            ← Admin UI (existing)
│
└── supabase/migrations/
    └── [timestamp]_integrations.sql            ← Database schema (existing)
```

---

## 🎉 Success Checklist

You've successfully set up Zoom integration when:

- ✅ Test connection shows "Connected successfully"
- ✅ Can create a meeting via API
- ✅ Meeting appears in Zoom web portal
- ✅ Join URL works in browser
- ✅ (Optional) Webhooks show as "Verified" in Zoom

---

## 📚 Additional Resources

### Official Zoom Documentation
- [API Reference](https://developers.zoom.us/docs/api/)
- [Server-to-Server OAuth](https://developers.zoom.us/docs/internal-apps/)
- [Webhook Events](https://developers.zoom.us/docs/api/rest/webhook-reference/)
- [Meeting SDK](https://developers.zoom.us/docs/meeting-sdk/)

### IPS Platform Resources
- Integration Admin UI: `/admin/config/integrations`
- API Endpoints: See [Complete Guide](./ZOOM_INTEGRATION_GUIDE.md#api-endpoints)
- Source Code: `src/lib/zoom/` and `src/app/api/.../zoom/`

---

## 🔖 Quick Links Summary

| Document | Purpose | Reading Time |
|----------|---------|--------------|
| **[Quick Start](./ZOOM_QUICK_START.md)** | Fastest setup path | 5 min |
| **[Visual Guide](./ZOOM_VISUAL_SETUP_GUIDE.md)** | Checklists & diagrams | Quick reference |
| **[Step-by-Step](./ZOOM_APP_CREATION_STEP_BY_STEP.md)** | Detailed instructions | 15 min |
| **[Complete Guide](./ZOOM_INTEGRATION_GUIDE.md)** | Full documentation | 30 min |

---

## 🎯 Start Here

**First time?** → [Quick Start Guide](./ZOOM_QUICK_START.md)

**Need details?** → [Step-by-Step Guide](./ZOOM_APP_CREATION_STEP_BY_STEP.md)

**Having issues?** → [Troubleshooting](./ZOOM_INTEGRATION_GUIDE.md#troubleshooting)

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0
**Zoom API Version:** v2
**IPS Platform Version:** Compatible with current version
