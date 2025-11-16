# Multitenancy Testing Guide

## 🧪 Quick Testing Checklist

This guide helps you verify that multitenancy is working correctly.

---

## Before Testing

### 1. Ensure SQL Files Are Executed
All 5 SQL files should be run in Supabase SQL Editor:
- ✅ `01-tenant-schema.sql`
- ✅ `02-add-tenant-id-columns.sql`
- ✅ `03-migrate-to-default-tenant.sql`
- ✅ `04-tenant-rls-functions.sql`
- ✅ `05-tenant-rls-policies.sql`

### 2. Check Environment Variables
In `.env.local`:
```env
NEXT_PUBLIC_MULTITENANCY_ENABLED=false  # Set to 'true' when ready to test
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=default
NEXT_PUBLIC_MAIN_DOMAIN=ipsplatform.com
```

---

## Test 1: Database Verification

### Check Default Tenant Exists
```sql
-- In Supabase SQL Editor
SELECT * FROM tenants WHERE slug = 'default';
```

**Expected Result:** Should return 1 row with "Default Organization"

### Check Data Migration
```sql
-- Verify all users have tenant_id
SELECT COUNT(*) as total_users,
       COUNT(tenant_id) as users_with_tenant
FROM users;
```

**Expected Result:** Both counts should be equal (all users have tenant_id)

### Check Tenant Users
```sql
-- Verify tenant_users was populated
SELECT
  tu.user_id,
  u.email,
  tu.role,
  t.name as tenant_name
FROM tenant_users tu
JOIN users u ON u.id = tu.user_id
JOIN tenants t ON t.id = tu.tenant_id;
```

**Expected Result:** All existing users should appear with their tenant

### Test RLS Functions
```sql
-- Test tenant lookup
SELECT * FROM get_tenant_by_slug('default');

-- Test with wrong slug (should return nothing)
SELECT * FROM get_tenant_by_slug('nonexistent');
```

---

## Test 2: Development Mode (Multitenancy Disabled)

With `NEXT_PUBLIC_MULTITENANCY_ENABLED=false`:

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Login
1. Visit `http://localhost:3000/login`
2. Login with existing credentials
3. Should redirect to dashboard successfully

### 3. Check Console
Open browser DevTools → Console

**Look for:**
- ✅ No tenant-related errors
- ✅ Tenant context initialized with "default" tenant

**Check in console:**
```javascript
// In browser console
localStorage.getItem('tenant_slug')
// Should return: "default"
```

### 4. Test Admin Features
Visit admin pages and verify they work:
- `/admin/dashboard`
- `/admin/settings/languages`
- `/admin/settings/translations`
- `/admin/settings/theme`

**Expected:** Everything works as before, scoped to default tenant

---

## Test 3: Multitenancy Enabled (Single Tenant)

Enable multitenancy but test with just the default tenant.

### 1. Update Environment
```env
NEXT_PUBLIC_MULTITENANCY_ENABLED=true
```

### 2. Restart Server
```bash
# Kill the dev server (Ctrl+C)
npm run dev
```

### 3. Test on Localhost
Visit `http://localhost:3000/login`

**Expected Behavior:**
- Middleware detects localhost → uses default tenant
- Login works normally
- After login, check browser console:

```javascript
localStorage.getItem('tenant_slug')  // "default"
localStorage.getItem('tenant_id')    // UUID of default tenant
localStorage.getItem('tenant_name')  // "Default Organization"
```

### 4. Test Tenant Context in Components

Add this to any admin page temporarily:

```typescript
import { useTenant } from '@/context/AppContext';

// In your component:
const { tenant, tenantSlug, tenantName, isAdmin } = useTenant();

console.log('Current tenant:', {
  slug: tenantSlug,
  name: tenantName,
  isAdmin
});
```

**Expected Console Output:**
```
Current tenant: {
  slug: "default",
  name: "Default Organization",
  isAdmin: true
}
```

---

## Test 4: Create Second Tenant (Optional)

To test true multitenancy, create a second tenant.

### 1. Create Test Tenant in Database
```sql
-- Create Harvard tenant
INSERT INTO tenants (
  name,
  slug,
  status,
  subscription_tier,
  admin_email,
  default_language,
  timezone,
  currency
) VALUES (
  'Harvard University',
  'harvard',
  'active',
  'enterprise',
  'admin@harvard.edu',
  'en',
  'America/New_York',
  'USD'
);
```

### 2. Create Test User for Harvard
```sql
-- First, create auth user in Supabase Auth UI
-- Then link to tenant:

-- Get the tenant ID
SELECT id FROM tenants WHERE slug = 'harvard';

-- Insert user (replace USER_ID with actual auth user ID)
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  tenant_id
) VALUES (
  'USER_ID_FROM_AUTH',
  'testuser@harvard.edu',
  'Test',
  'User',
  'admin',
  'HARVARD_TENANT_ID'
);

-- Add to tenant_users
INSERT INTO tenant_users (
  tenant_id,
  user_id,
  role,
  status
) VALUES (
  'HARVARD_TENANT_ID',
  'USER_ID_FROM_AUTH',
  'admin',
  'active'
);
```

### 3. Test Tenant Isolation

**Setup hosts file for local testing:**

Windows: `C:\Windows\System32\drivers\etc\hosts`
Mac/Linux: `/etc/hosts`

Add:
```
127.0.0.1  harvard.localhost
127.0.0.1  default.localhost
```

**Test Harvard subdomain:**
1. Visit `http://harvard.localhost:3000/login`
2. Login with Harvard test user credentials
3. Should see Harvard's data only

**Test Default subdomain:**
1. Visit `http://default.localhost:3000/login`
2. Login with default tenant user
3. Should see default tenant's data only

**Verify Isolation:**
- Default tenant admin cannot see Harvard's languages
- Harvard admin cannot see Default's translations
- Each sees only their tenant's data

---

## Test 5: Security Tests

### Test Cross-Tenant Access Prevention

1. **Login to Harvard:**
   - Visit `http://harvard.localhost:3000/login`
   - Login as Harvard user
   - Note the session cookie

2. **Try to access Default tenant:**
   - Visit `http://default.localhost:3000/admin/dashboard`
   - Should be denied or see empty data (RLS blocks it)

3. **Direct API test:**
```javascript
// In Harvard subdomain's browser console:
fetch('/api/admin/languages')
  .then(r => r.json())
  .then(console.log)
// Should only return Harvard's languages, not Default's
```

### Test RLS Policies
```sql
-- Simulate user session as default tenant admin
SELECT set_current_tenant((SELECT id FROM tenants WHERE slug = 'default'));

-- Try to query all languages (should only see default tenant's)
SELECT * FROM languages;

-- Switch to Harvard tenant
SELECT set_current_tenant((SELECT id FROM tenants WHERE slug = 'harvard'));

-- Query again (should only see Harvard's languages)
SELECT * FROM languages;
```

---

## Test 6: Super Admin Testing

### 1. Add Super Admin Email
In `.env.local`:
```env
SUPER_ADMIN_EMAILS=your-email@example.com
```

### 2. Create Super Admin User
Create a user with that email in Supabase Auth

### 3. Test Super Admin Functions
```sql
-- Replace with your super admin user ID
SELECT is_super_admin('YOUR_USER_ID');
-- Should return: true

-- Test with regular user
SELECT is_super_admin('REGULAR_USER_ID');
-- Should return: false
```

### 4. Super Admin Can Bypass RLS
```sql
-- As super admin
SELECT set_current_tenant((SELECT id FROM tenants WHERE slug = 'default'));

-- Super admins should see ALL tenants
SELECT * FROM tenants;
-- Should return all tenants (default + harvard)

-- Regular admin would only see their own tenant
```

---

## Test 7: Authentication Flow

### Test Signup
1. Visit `http://localhost:3000/signup` (or `harvard.localhost:3000/signup`)
2. Create new account
3. Verify in database:

```sql
-- Check user was created with correct tenant_id
SELECT
  u.email,
  u.tenant_id,
  t.name as tenant_name,
  tu.role
FROM users u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN tenant_users tu ON tu.user_id = u.id
WHERE u.email = 'NEW_USER_EMAIL';
```

**Expected:**
- User has tenant_id set to current tenant
- User appears in tenant_users table
- Role is 'student' by default

### Test Wrong Tenant Login
1. Create user in "default" tenant
2. Try to login at `harvard.localhost:3000/login`
3. **Expected:** Login should fail with "You do not have access to this organization"

---

## Common Issues & Solutions

### Issue: "Tenant not found" error
**Cause:** Tenant doesn't exist in database or slug is wrong
**Fix:**
```sql
SELECT * FROM tenants WHERE slug = 'YOUR_SLUG';
-- Verify tenant exists
```

### Issue: "User does not have access to this organization"
**Cause:** User not in tenant_users table
**Fix:**
```sql
INSERT INTO tenant_users (tenant_id, user_id, role, status)
VALUES ('TENANT_ID', 'USER_ID', 'admin', 'active');
```

### Issue: RLS blocking all queries
**Cause:** `set_current_tenant()` not called or failed
**Fix:** Check Supabase logs, verify RLS functions exist:
```sql
SELECT * FROM pg_proc WHERE proname LIKE '%tenant%';
```

### Issue: Cannot see any data after login
**Cause:** RLS policies blocking access
**Fix:** Verify user in tenant_users:
```sql
SELECT * FROM tenant_users
WHERE user_id = 'YOUR_USER_ID'
AND tenant_id = 'CURRENT_TENANT_ID';
```

---

## Performance Testing

### Test Query Performance with RLS
```sql
-- Check execution plan
EXPLAIN ANALYZE
SELECT * FROM languages WHERE tenant_id = 'TENANT_ID';

-- Verify indexes are used
-- Should show "Index Scan" not "Seq Scan"
```

### Load Testing
Use tool like Apache Bench or k6:
```bash
# Test login endpoint
ab -n 100 -c 10 -p login.json -T 'application/json' \
  http://localhost:3000/api/auth/login
```

---

## Quick Smoke Test Script

Run this after any changes:

```bash
# 1. Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM tenants;"

# 2. Check default tenant
psql $DATABASE_URL -c "SELECT * FROM tenants WHERE slug = 'default';"

# 3. Start server
npm run dev &

# 4. Wait for server
sleep 5

# 5. Test health endpoint (create one if needed)
curl http://localhost:3000/api/health

# 6. Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## Rollback Plan

If something goes wrong:

### Disable Multitenancy
```env
NEXT_PUBLIC_MULTITENANCY_ENABLED=false
```

### Restore from Backup
```bash
# In Supabase Dashboard:
# Settings > Database > Restore from backup
```

### Clear Local Storage
```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

## Success Criteria

✅ All database tables have tenant_id
✅ Default tenant exists and has data
✅ RLS functions exist and work
✅ RLS policies enforce isolation
✅ Login works on localhost
✅ Tenant context is set correctly
✅ Admin pages show tenant-scoped data
✅ Users cannot access other tenants' data
✅ Super admins can access all data

---

**Testing Complete? Move to Phase 4-5 (API Layer) or Phase 6 (Admin UI)**
