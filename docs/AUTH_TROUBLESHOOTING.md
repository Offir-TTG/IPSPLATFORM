# Authentication Troubleshooting Guide

## Current Setup

### Files Modified for Unified Login
1. **`src/app/login/page.tsx`** - Unified login page for all user types
2. **`src/app/api/auth/login/route.ts`** - Login API with `@supabase/ssr` cookie management
3. **`src/lib/supabase/client.ts`** - Browser client using `createBrowserClient`
4. **`middleware.ts`** - Auth session refresh middleware
5. **`src/app/(user)/layout.tsx`** - User portal server-side guard

### Current Flow
1. User enters credentials on `/login`
2. POST to `/api/auth/login`
   - Authenticates with Supabase
   - Sets cookies via `@supabase/ssr` callbacks
   - Returns session data
3. Client receives session
   - Calls `supabase.auth.setSession()` to set client cookies
   - Waits 500ms for cookies to persist
   - Navigates via `router.push()`
4. Middleware intercepts navigation
   - Calls `supabase.auth.getUser()` to refresh session
   - Should set updated cookies on response
5. Server-side layout checks auth
   - Calls `supabase.auth.getUser()`
   - Should find authenticated session

## Issue: Session Not Persisting

**Symptom:** After login succeeds (200), navigation to `/dashboard` returns 307 redirect to `/login`

**Root Cause:** Cookies set in API route are not being read by middleware/server components

## Attempts Made

### Attempt 1: Use `@supabase/ssr` in API Route
- **Status:** Failed
- **Issue:** Cookies not propagating to subsequent requests

### Attempt 2: Add Auth Middleware
- **Status:** Failed
- **Issue:** Middleware `getUser()` returns null (can't read cookies)

### Attempt 3: Hard Navigation with `window.location.href`
- **Status:** Failed
- **Issue:** Full page reload clears in-memory session state

### Attempt 4: Client-Side Navigation with Delay
- **Status:** Testing
- **Change:** Use `router.push()` with 500ms delay instead of `window.location.href`

## Next Steps to Try

### Option A: Remove Server-Side Auth Check
Simplify by only using client-side auth and protecting routes via middleware redirects rather than server component checks.

**Changes needed:**
1. Remove auth check from `src/app/(user)/layout.tsx`
2. Add auth redirect logic to middleware
3. Rely on client-side session for all auth checks

### Option B: Use Route Handlers for Redirect
Create a dedicated auth callback route that properly sets cookies before redirecting.

**Changes needed:**
1. Create `/api/auth/set-session` route
2. Login page redirects to this route with session tokens
3. Route sets cookies and redirects to dashboard

### Option C: Simplify to Old Admin Pattern
Revert to whatever approach was working for admin login before.

**Action:** Find and examine how admin login was implemented previously

## Testing Checklist

When testing auth fixes, verify:
- [ ] Login API returns 200
- [ ] Client console shows "Session set successfully"
- [ ] Browser cookies show Supabase auth tokens
- [ ] Navigation to `/dashboard` does NOT return 307
- [ ] Dashboard loads with user data
- [ ] Page refresh keeps user logged in
- [ ] Logout clears session properly

## Supabase Cookies to Check

Look for these cookies in browser DevTools:
- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token-code-verifier`

If these cookies exist after login, the problem is in how server components read them.
If these cookies DON'T exist, the problem is in how they're being set.
