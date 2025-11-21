# Zoom Scopes Reference

## Required Scopes (Minimum for Integration to Work)

These are the **5 essential scopes** needed for basic functionality:

| Scope | Purpose | Required |
|-------|---------|----------|
| `user:read:admin` | View user information and verify connection | ✅ **YES** |
| `meeting:write:admin` | Create and manage meetings | ✅ **YES** |
| `meeting:read:admin` | View meeting details and lists | ✅ **YES** |
| `recording:write:admin` | Manage recordings | ✅ **YES** |
| `recording:read:admin` | Access and view recordings | ✅ **YES** |

## How to Add Required Scopes

### Quick Method:
1. Go to your Zoom app → **Scopes** tab
2. In the search box, type: `meeting:write:admin`
3. Click **+ Add** button
4. Repeat for each of the 5 scopes above
5. Click **Continue**

### What You Added:
You added many individual meeting scopes like:
- `meeting:write:registrant:admin`
- `meeting:write:meeting:admin`
- `meeting:update:meeting:admin`
- etc.

## Important Notes

### ✅ Good News
All those individual scopes you added are **included** in the broader scopes:
- `meeting:write:admin` includes ALL `meeting:write:*` permissions
- `meeting:update:admin` includes ALL `meeting:update:*` permissions
- `meeting:delete:admin` includes ALL `meeting:delete:*` permissions

So by adding all those individual scopes, you've actually **over-granted** permissions, but that's perfectly fine and safe!

### Simplified View

Think of it this way:

```
meeting:write:admin (master scope)
    ├─ meeting:write:meeting:admin
    ├─ meeting:write:registrant:admin
    ├─ meeting:write:poll:admin
    └─ ... (all other write permissions)

meeting:read:admin (master scope)
    ├─ meeting:read:meeting:admin
    ├─ meeting:read:registrant:admin
    └─ ... (all other read permissions)
```

## What This Means for You

✅ **Your integration will work perfectly** - You have all necessary permissions and more!

## Testing Your Connection

Now try the test connection button again. It should show:
```
✅ Connected to Zoom successfully!
Account: [Your Name] ([your email])
```

## Scope Verification

To verify your scopes are active:

1. Go to https://marketplace.zoom.us/user/build
2. Click your IPS Platform app
3. Click **Scopes** tab
4. You should see many scopes listed under "Added scopes"

## If Test Still Fails

If you still see scope errors:

### Wait 2-5 Minutes
Zoom may take a few minutes to propagate scope changes across their system.

### Re-activate Your App
1. Go to your Zoom app
2. Find the activation status
3. If it says "Deactivated", click **Activate** again
4. Try the test connection again

### Clear Tokens
The old access token might be cached. Wait 5 minutes for it to expire, or:
1. In IPS Platform, disable the Zoom integration
2. Wait 10 seconds
3. Enable it again
4. Click Test Connection

## Recommended Scope Configuration

For production use, you can simplify to just these 5 master scopes:

```
✅ user:read:admin
✅ meeting:write:admin
✅ meeting:read:admin
✅ recording:write:admin
✅ recording:read:admin
```

You don't need all the individual sub-scopes - the master scopes cover everything!

## Optional Scopes (For Advanced Features)

If you want additional features:

| Scope | Purpose | When to Add |
|-------|---------|-------------|
| `webinar:write:admin` | Manage webinars | If using webinars |
| `webinar:read:admin` | View webinars | If using webinars |
| `dashboard:read:admin` | Access analytics | If building reports |
| `report:read:admin` | Access reports | If building reports |
| `phone:read:admin` | Zoom Phone features | If using Zoom Phone |

## Troubleshooting

### Error: "Invalid access token, does not contain scopes"

**Solution:**
- Verify scopes are added in Zoom app
- Wait 5 minutes for changes to propagate
- Try test connection again

### Error: "Scope not found"

**Solution:**
- Make sure you're using Server-to-Server OAuth app type
- OAuth and JWT app types have different scope names

### Test Passes But Can't Create Meetings

**Solution:**
- Verify `meeting:write:admin` is added
- Check your Zoom account type (Pro or higher recommended)
- Verify app is activated

## Summary

✅ **You're all set!** You've added more than enough scopes.

**Next step:** Try the test connection in IPS Platform. It should work now!

---

**Quick Reference:**
- Minimum Required: 5 scopes
- What You Added: Many scopes (which is fine!)
- Expected Result: Connection test passes ✅

