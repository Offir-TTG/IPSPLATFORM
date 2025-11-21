# Zoom Integration - Visual Quick Reference

## 📋 Setup Checklist

```
Part 1: Zoom Marketplace Setup
├── ☐ 1. Go to marketplace.zoom.us
├── ☐ 2. Click Develop → Build App
├── ☐ 3. Choose "Server-to-Server OAuth"
├── ☐ 4. Fill in app information
├── ☐ 5. Copy 3 credentials (Account ID, Client ID, Client Secret)
├── ☐ 6. Add 5 required scopes
└── ☐ 7. Activate app

Part 2: IPS Platform Setup
├── ☐ 8. Navigate to Admin → Integrations
├── ☐ 9. Find Zoom card
├── ☐ 10. Paste 3 credentials
├── ☐ 11. Configure settings
├── ☐ 12. Save configuration
├── ☐ 13. Enable integration (toggle ON)
└── ☐ 14. Test connection ✅
```

---

## 🎯 The 3 Essential Credentials

You need exactly **3 pieces of information** from Zoom:

```
┌──────────────────────────────────────────────────┐
│  ZOOM CREDENTIALS (Keep These Safe!)            │
├──────────────────────────────────────────────────┤
│                                                  │
│  1️⃣  Account ID                                  │
│      Example: abc123def456ghi789jkl              │
│      Where: Zoom App → App Credentials           │
│                                                  │
│  2️⃣  Client ID                                   │
│      Example: Abc123DeF456GhI789                 │
│      Where: Zoom App → App Credentials           │
│                                                  │
│  3️⃣  Client Secret                               │
│      Example: xYz987WvU654TsR321                 │
│      Where: Zoom App → App Credentials           │
│      ⚠️  Keep secret! Never share publicly!      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 🔑 Required Scopes (Copy-Paste List)

In Zoom app scopes section, search and add these **5 scopes**:

```
✅ meeting:write:admin      (Create/manage meetings)
✅ meeting:read:admin       (View meetings)
✅ recording:write:admin    (Manage recordings)
✅ recording:read:admin     (View recordings)
✅ user:read:admin          (View user info)
```

**Quick tip:** Copy the scope name (e.g., `meeting:write:admin`), paste in search box, click Add.

---

## 🗺️ Navigation Maps

### In Zoom Marketplace

```
marketplace.zoom.us
    │
    ├─> [Sign In]
    │
    ├─> Click "Develop" (top menu)
    │     │
    │     └─> Click "Build App"
    │           │
    │           └─> Choose "Server-to-Server OAuth"
    │                 │
    │                 ├─> Fill Basic Info
    │                 ├─> Copy Credentials ⭐
    │                 ├─> Add Scopes
    │                 └─> Activate
    │
    └─> [Your Apps]
          │
          └─> Click your app name
                │
                ├─> View Credentials
                ├─> Manage Scopes
                └─> Configure Features
```

### In IPS Platform

```
Login as Admin
    │
    └─> Click "Admin" (sidebar)
          │
          └─> Click "Configuration"
                │
                └─> Click "Integrations"
                      │
                      └─> Scroll to "Zoom" card
                            │
                            ├─> Click Zoom tab
                            ├─> Paste credentials ⭐
                            ├─> Configure settings
                            ├─> Click Save
                            ├─> Toggle Enable
                            └─> Click Test Connection
```

---

## ⚡ Super Quick Setup (Copy-Paste Commands)

### For Terminal Users

```bash
# 1. Open Zoom Marketplace
open https://marketplace.zoom.us/

# 2. After creating app and getting credentials,
#    save them to a file (replace with your actual values)
cat > zoom-credentials.txt << EOF
Account ID: YOUR_ACCOUNT_ID_HERE
Client ID: YOUR_CLIENT_ID_HERE
Client Secret: YOUR_CLIENT_SECRET_HERE
EOF

# 3. Open IPS Platform
open https://your-ips-platform.com/admin/config/integrations

# 4. Copy credentials from file and paste into form
cat zoom-credentials.txt
```

---

## 🎨 Visual Field Mapping

### Zoom App → IPS Platform Mapping

```
ZOOM MARKETPLACE                    IPS PLATFORM
================                    ============

App Credentials Page:               Integrations → Zoom:

┌─────────────────────┐            ┌─────────────────────┐
│ Account ID          │   ──────>  │ Account ID          │
│ abc123def456        │            │ [paste here]        │
└─────────────────────┘            └─────────────────────┘

┌─────────────────────┐            ┌─────────────────────┐
│ Client ID           │   ──────>  │ Client ID           │
│ Abc123DeF456        │            │ [paste here]        │
└─────────────────────┘            └─────────────────────┘

┌─────────────────────┐            ┌─────────────────────┐
│ Client Secret       │   ──────>  │ Client Secret       │
│ xYz987WvU654        │            │ [paste here]        │
└─────────────────────┘            └─────────────────────┘
```

---

## 🚦 Status Indicators

### In IPS Platform

```
Integration Status:

🔴 Disconnected    → Not configured yet
    ↓ (add credentials + enable)

🟡 Configured      → Credentials added but not tested
    ↓ (click Test Connection)

🟢 Connected       → Working correctly! ✅
```

### Test Connection Results

```
✅ Success Message:
┌──────────────────────────────────────────────┐
│ ✓ Connected to Zoom successfully!           │
│   Account: John Doe (john@company.com)      │
└──────────────────────────────────────────────┘

❌ Error Message Examples:
┌──────────────────────────────────────────────┐
│ ✗ Failed to authenticate with Zoom          │
│   → Check: Credentials copied correctly?    │
│   → Check: App activated in Zoom?           │
└──────────────────────────────────────────────┘
```

---

## 📊 Configuration Options Explained

### Default Meeting Duration
```
┌─────────────────────────────────────┐
│ Default Meeting Duration            │
│ [60] minutes                        │
│                                     │
│ ℹ️  Used when creating meetings    │
│    without specifying duration      │
└─────────────────────────────────────┘

Recommended: 60 minutes (1 hour)
```

### Auto Recording
```
┌─────────────────────────────────────┐
│ Auto Recording                      │
│ ○ None      (no recording)          │
│ ○ Local     (save to computer)      │
│ ● Cloud     (save to Zoom cloud) ✓  │
└─────────────────────────────────────┘

Recommended: Cloud (requires paid plan)
```

### Waiting Room
```
┌─────────────────────────────────────┐
│ Waiting Room           [ON] ⚫       │
│                                     │
│ ℹ️  Security feature - participants │
│    wait until host admits them      │
└─────────────────────────────────────┘

Recommended: ON (for security)
```

### Join Before Host
```
┌─────────────────────────────────────┐
│ Join Before Host       [OFF] ⚪      │
│                                     │
│ ℹ️  If ON, participants can join    │
│    before host starts meeting       │
└─────────────────────────────────────┘

Recommended: OFF (host must be present)
```

---

## 🎯 Common Mistakes & Fixes

### ❌ Mistake #1: Extra Spaces
```
Wrong:  " abc123def456 "  (spaces before/after)
Right:  "abc123def456"     (no spaces)
```

### ❌ Mistake #2: Wrong App Type
```
Wrong:  Choosing "OAuth" or "JWT" app
Right:  Choose "Server-to-Server OAuth" ✓
```

### ❌ Mistake #3: Missing Scopes
```
Wrong:  Adding only 2-3 scopes
Right:  Add ALL 5 required scopes ✓
```

### ❌ Mistake #4: App Not Activated
```
Wrong:  Leaving app in "Development" status
Right:  Click "Activate your app" button ✓
```

### ❌ Mistake #5: Forgot to Enable
```
Wrong:  Saving config but leaving toggle OFF
Right:  Toggle to ON and test connection ✓
```

---

## 🔍 Quick Troubleshooting Flow

```
Connection Test Failed?
    │
    ├─> Check 1: Credentials correct?
    │   ├─ Yes → Go to Check 2
    │   └─ No → Copy again from Zoom
    │
    ├─> Check 2: App activated in Zoom?
    │   ├─ Yes → Go to Check 3
    │   └─ No → Activate app in Zoom
    │
    ├─> Check 3: All 5 scopes added?
    │   ├─ Yes → Go to Check 4
    │   └─ No → Add missing scopes
    │
    ├─> Check 4: Integration enabled (toggle ON)?
    │   ├─ Yes → Go to Check 5
    │   └─ No → Toggle to ON
    │
    └─> Check 5: Still failing?
        └─ Contact support with error message
```

---

## 📱 Mobile-Friendly Quick Reference

For setup on mobile devices:

### Step 1: Zoom App (Desktop Required)
⚠️ Must use desktop browser for app creation

### Step 2: IPS Platform (Mobile OK)
✓ Can configure on mobile once you have credentials

**Tip:** Create app on desktop, then copy credentials to phone to configure IPS Platform.

---

## 🎓 Video Tutorial Timestamps

If you're watching a tutorial video, here are typical sections:

```
00:00 - Introduction
02:00 - Creating Zoom App
05:00 - Copying Credentials ⭐
07:00 - Adding Scopes ⭐
10:00 - Activating App
12:00 - IPS Platform Configuration ⭐
15:00 - Testing Connection ⭐
17:00 - Webhook Setup (Optional)
20:00 - Creating First Meeting
```

---

## 💾 Save This Quick Reference

```bash
# Bookmark these URLs:
Zoom Marketplace:     https://marketplace.zoom.us/
Your Zoom Apps:       https://marketplace.zoom.us/user/build
IPS Integrations:     https://[your-domain]/admin/config/integrations
Zoom API Docs:        https://developers.zoom.us/docs/api/

# Save credentials template:
Account ID:    ____________________________
Client ID:     ____________________________
Client Secret: ____________________________
Date Created:  ____________________________
Created By:    ____________________________
```

---

## ✅ Final Verification Checklist

Before considering setup complete:

```
In Zoom:
✓ [ ] App created
✓ [ ] App type is "Server-to-Server OAuth"
✓ [ ] All 5 scopes added
✓ [ ] App status shows "Activated"
✓ [ ] Credentials saved securely

In IPS Platform:
✓ [ ] Account ID pasted
✓ [ ] Client ID pasted
✓ [ ] Client Secret pasted
✓ [ ] Settings configured
✓ [ ] Configuration saved
✓ [ ] Integration enabled (toggle ON)
✓ [ ] Test connection shows ✅

Verification:
✓ [ ] Create test meeting via API
✓ [ ] Check meeting appears in Zoom portal
✓ [ ] Join URL works
```

---

## 🎉 Success!

If all checkboxes above are ✓, your integration is complete!

**What you can do now:**
- Create meetings programmatically
- Schedule course sessions automatically
- Track attendance
- Access recordings

**Next Steps:**
- [API Usage Examples](./ZOOM_INTEGRATION_GUIDE.md#usage-examples)
- [Webhook Configuration](./ZOOM_INTEGRATION_GUIDE.md#webhook-configuration)
- [Embed Meetings](./ZOOM_INTEGRATION_GUIDE.md#meeting-sdk)

---

**Need detailed explanations?** See [Complete Setup Guide](./ZOOM_APP_CREATION_STEP_BY_STEP.md)

**Last Updated:** November 17, 2025
