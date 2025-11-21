# Keap OAuth Flow Documentation

## Overview

The Keap integration uses OAuth 2.0 authorization code flow to securely access the Keap API on behalf of the user.

## Flow Diagram

```
┌─────────┐         ┌─────────────┐         ┌──────────┐         ┌──────────┐
│  Admin  │         │ IPS Platform│         │   Keap   │         │ Database │
│  User   │         │   Frontend  │         │   OAuth  │         │          │
└────┬────┘         └──────┬──────┘         └─────┬────┘         └────┬─────┘
     │                     │                      │                    │
     │ 1. Click Test       │                      │                    │
     │   Connection        │                      │                    │
     ├────────────────────>│                      │                    │
     │                     │                      │                    │
     │                     │ 2. Check for tokens  │                    │
     │                     │──────────────────────┼───────────────────>│
     │                     │                      │                    │
     │                     │ 3. No tokens found   │                    │
     │                     │<─────────────────────┼────────────────────│
     │                     │                      │                    │
     │                     │ 4. Return auth URL   │                    │
     │ 5. See error with   │                      │                    │
     │    authorization    │                      │                    │
     │    URL              │                      │                    │
     │<────────────────────│                      │                    │
     │                     │                      │                    │
     │ 6. Click auth URL   │                      │                    │
     ├──────────────────────┼─────────────────────>│                   │
     │                     │                      │                    │
     │                     │ 7. Keap login page   │                    │
     │<─────────────────────┼──────────────────────│                   │
     │                     │                      │                    │
     │ 8. Enter credentials│                      │                    │
     │    & click Allow    │                      │                    │
     ├──────────────────────┼─────────────────────>│                   │
     │                     │                      │                    │
     │                     │ 9. Redirect with code│                    │
     │                     │<─────────────────────│                    │
     │<────────────────────│                      │                    │
     │                     │                      │                    │
     │                     │ 10. Frontend detects │                    │
     │                     │     code in URL      │                    │
     │                     │                      │                    │
     │                     │ 11. POST to oauth-   │                    │
     │                     │     callback API     │                    │
     │                     │──────────────────────┼────────────────────┤
     │                     │                      │                    │
     │                     │ 12. Exchange code    │                    │
     │                     │      for tokens      │                    │
     │                     ├─────────────────────>│                    │
     │                     │                      │                    │
     │                     │ 13. Return tokens    │                    │
     │                     │<─────────────────────│                    │
     │                     │                      │                    │
     │                     │ 14. Save tokens to   │                    │
     │                     │     database         │                    │
     │                     │──────────────────────┼───────────────────>│
     │                     │                      │                    │
     │                     │ 15. Success response │                    │
     │                     │<─────────────────────┼────────────────────│
     │                     │                      │                    │
     │ 16. Show success    │                      │                    │
     │     toast           │                      │                    │
     │<────────────────────│                      │                    │
     │                     │                      │                    │
```

## Step-by-Step Process

### Step 1-5: Initial Authorization Request

1. Admin clicks "Test Connection" button
2. Frontend sends POST to `/api/admin/integrations/keap/test`
3. Backend checks if `access_token` and `refresh_token` exist
4. If not, backend generates authorization URL:
   ```
   https://signin.infusionsoft.com/app/oauth/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=http://localhost:3000/admin/config/integrations&
     response_type=code&
     scope=full
   ```
5. Backend returns error message with authorization URL
6. Frontend displays error with the authorization link

### Step 6-9: User Authorization

7. Admin clicks the authorization URL
8. User is redirected to Keap login page
9. User enters Keap credentials
10. User reviews requested permissions (full access)
11. User clicks "Allow"
12. Keap redirects back to IPS Platform with authorization code:
    ```
    http://localhost:3000/admin/config/integrations?code=AUTHORIZATION_CODE
    ```

### Step 10-16: Token Exchange

13. Frontend `useEffect` detects `code` parameter in URL
14. Frontend sends POST to `/api/admin/integrations/keap/oauth-callback` with:
    ```json
    { "code": "AUTHORIZATION_CODE" }
    ```
15. Backend loads Keap integration from database
16. Backend extracts `client_id` and `client_secret`
17. Backend creates Basic Auth header:
    ```
    Authorization: Basic base64(client_id:client_secret)
    ```
18. Backend sends token exchange request to Keap:
    ```
    POST https://api.infusionsoft.com/token
    Content-Type: application/x-www-form-urlencoded
    Authorization: Basic base64(client_id:client_secret)

    grant_type=authorization_code&
    code=AUTHORIZATION_CODE&
    redirect_uri=http://localhost:3000/admin/config/integrations
    ```
19. Keap responds with tokens:
    ```json
    {
      "access_token": "abc123...",
      "refresh_token": "xyz789...",
      "expires_in": 86400,
      "token_type": "Bearer"
    }
    ```
20. Backend updates database with new tokens
21. Backend returns success response
22. Frontend shows success toast
23. Frontend refreshes integration data
24. Frontend cleans up URL (removes `code` parameter)

## Token Refresh Flow

Access tokens expire after 24 hours. The system automatically refreshes them:

```
┌─────────────┐         ┌──────────┐         ┌──────────┐
│ IPS Platform│         │   Keap   │         │ Database │
│   Backend   │         │   OAuth  │         │          │
└──────┬──────┘         └─────┬────┘         └────┬─────┘
       │                      │                    │
       │ 1. API call with     │                    │
       │    expired token     │                    │
       ├─────────────────────>│                    │
       │                      │                    │
       │ 2. 401 Unauthorized  │                    │
       │<─────────────────────│                    │
       │                      │                    │
       │ 3. Load refresh_token│                    │
       ├──────────────────────┼───────────────────>│
       │                      │                    │
       │ 4. POST token refresh│                    │
       ├─────────────────────>│                    │
       │  refresh_token       │                    │
       │                      │                    │
       │ 5. New tokens        │                    │
       │<─────────────────────│                    │
       │                      │                    │
       │ 6. Update database   │                    │
       ├──────────────────────┼───────────────────>│
       │                      │                    │
       │ 7. Retry API call    │                    │
       │    with new token    │                    │
       ├─────────────────────>│                    │
       │                      │                    │
       │ 8. Success           │                    │
       │<─────────────────────│                    │
       │                      │                    │
```

## Files Involved

### Frontend

**File**: `src/app/admin/config/integrations/page.tsx`

**OAuth Callback Handler**:
```typescript
useEffect(() => {
  const handleOAuthCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      const keapIntegration = integrations.find(i => i.integration_key === 'keap');

      if (keapIntegration) {
        toast.info('Processing Keap authorization...');

        const response = await fetch('/api/admin/integrations/keap/oauth-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (response.ok) {
          toast.success('Keap authorization successful!');
          await fetchIntegrations();
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          const error = await response.json();
          toast.error(`Keap authorization failed: ${error.error}`);
        }
      }
    }
  };

  if (integrations.length > 0) {
    handleOAuthCallback();
  }
}, [integrations]);
```

### Backend

**File**: `src/app/api/admin/integrations/keap/oauth-callback/route.ts`

**Token Exchange**:
```typescript
export async function POST(request: NextRequest) {
  const { code } = await request.json();

  // Get integration credentials
  const supabase = await createClient();
  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('integration_key', 'keap')
    .single();

  const { client_id, client_secret } = integration.credentials;

  // Exchange code for tokens
  const authString = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  const tokenResponse = await fetch('https://api.infusionsoft.com/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/admin/config/integrations',
    }),
  });

  const tokenData = await tokenResponse.json();

  // Save tokens
  await supabase
    .from('integrations')
    .update({
      credentials: {
        ...integration.credentials,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      },
    })
    .eq('integration_key', 'keap');

  return NextResponse.json({ success: true });
}
```

**File**: `src/app/api/admin/integrations/[key]/test/route.ts`

**Auto-Refresh Logic**:
```typescript
// If 401, try to refresh token
if (accountResponse.status === 401 && credentials.refresh_token) {
  const authString = Buffer.from(`${credentials.client_id}:${credentials.client_secret}`).toString('base64');

  const refreshResponse = await fetch('https://api.infusionsoft.com/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refresh_token
    })
  });

  const tokenData = await refreshResponse.json();

  // Update database with new tokens
  await supabase
    .from('integrations')
    .update({
      credentials: {
        ...credentials,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      }
    })
    .eq('integration_key', 'keap');
}
```

## Security Considerations

1. **Client Secret**: Stored in database, never exposed to frontend
2. **Tokens**: Stored in database, automatically refreshed
3. **HTTPS Required**: In production, OAuth redirect must use HTTPS
4. **State Parameter**: Could be added for CSRF protection (optional)
5. **Scope**: Using "full" scope - can be restricted if needed

## Testing the Flow

### Local Development

1. Ensure `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000`
2. In Keap Developer Portal, set redirect URI to: `http://localhost:3000/admin/config/integrations`
3. Configure Client ID and Client Secret in IPS Platform
4. Click "Test Connection"
5. Follow authorization link
6. Authorize in Keap
7. System automatically handles callback and token exchange

### Production

1. Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://yourdomain.com`)
2. In Keap Developer Portal, set redirect URI to: `https://yourdomain.com/admin/config/integrations`
3. Follow same steps as local development

## Troubleshooting

### "Invalid redirect_uri"
- **Cause**: Redirect URI in Keap Developer Portal doesn't match the one sent in OAuth request
- **Fix**: Ensure both use the exact same URL (including protocol and path)

### "Invalid authorization code"
- **Cause**: Authorization code was already used or expired
- **Fix**: Start the flow again (codes are single-use and expire quickly)

### "Failed to refresh token"
- **Cause**: Refresh token expired or was revoked
- **Fix**: Re-authorize the application (click Test Connection and follow authorization link)

### Token saved but still getting 401
- **Cause**: Token might be invalid or Keap API issue
- **Fix**: Try Test Connection again to trigger token refresh

## API Endpoints

### Authorization URL
```
GET https://signin.infusionsoft.com/app/oauth/authorize
  ?client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:3000/admin/config/integrations
  &response_type=code
  &scope=full
```

### Token Exchange
```
POST https://api.infusionsoft.com/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTHORIZATION_CODE
&redirect_uri=http://localhost:3000/admin/config/integrations
```

### Token Refresh
```
POST https://api.infusionsoft.com/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=REFRESH_TOKEN
```

## References

- [Keap OAuth Documentation](https://developer.infusionsoft.com/docs/rest/oauth/)
- [OAuth 2.0 RFC](https://tools.ietf.org/html/rfc6749)
- [Keap API Reference](https://developer.infusionsoft.com/docs/rest/reference/)
