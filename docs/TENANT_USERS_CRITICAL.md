# CRITICAL: tenant_users Table - Multi-Tenancy Access Control

## Overview

The `tenant_users` table is **CRITICAL** for the multi-tenancy system to work correctly. Without entries in this table, users CANNOT log in, even if they have entries in the `users` table.

## Why It's Critical

The `user_belongs_to_tenant()` database function checks the `tenant_users` table to validate user access:

```sql
CREATE OR REPLACE FUNCTION user_belongs_to_tenant(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tenant_users
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND status = 'active'
  );
END;
$$;
```

The login flow (`src/app/api/auth/login/route.ts`) calls this function:

```typescript
const hasAccess = await validateUserTenantAccess(authData.user.id, tenant.id);
if (!hasAccess) {
  await supabase.auth.signOut();
  return NextResponse.json(
    { success: false, error: 'You do not have access to this organization' },
    { status: 403 }
  );
}
```

## Table Structure

```sql
CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'owner', 'admin', 'instructor', 'student'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  UNIQUE(tenant_id, user_id)
);
```

## Critical User Creation Endpoints

Every endpoint that creates a user MUST add an entry to `tenant_users`. Here's the status:

### ✅ Correctly Implemented

1. **`/api/auth/signup` (Regular Signup)**
   - File: `src/app/api/auth/signup/route.ts`
   - Lines: 92-107
   - Creates user in `users` table
   - ✅ Adds entry to `tenant_users` with role 'student'

2. **`/api/auth/signup/organization` (Organization Creator)**
   - File: `src/app/api/auth/signup/organization/route.ts`
   - Lines: 152-159
   - Creates user and tenant
   - ✅ Adds entry to `tenant_users` with role 'owner'

3. **`/api/invitations/accept` (Invitation Accept)**
   - File: `src/app/api/invitations/accept/route.ts`
   - Lines: 200-207
   - Creates user or links existing user
   - ✅ Adds entry to `tenant_users` with role from invitation

4. **`/api/enrollments/token/:token/complete` (Enrollment Wizard Completion)** ✅ FIXED
   - File: `src/app/api/enrollments/token/[token]/complete/route.ts`
   - Lines: 282-300 (after fix)
   - Creates user account after enrollment wizard
   - ✅ NOW adds entry to `tenant_users` with role 'student'
   - **This was the bug!** Users created through enrollment wizard couldn't log in.

## The Bug That Was Fixed

### Problem
Users created through the enrollment wizard completion endpoint could NOT log in. They would get:
```
"You do not have access to this organization"
```

### Root Cause
The enrollment completion endpoint (`/api/enrollments/token/:token/complete`) was creating users in the `users` table but NOT adding them to the `tenant_users` table.

### Fix Applied
Added the following code after user creation (line 282-300):

```typescript
// CRITICAL: Add user to tenant_users table for multi-tenancy access control
const { error: tenantUserError } = await supabase
  .from('tenant_users')
  .insert({
    tenant_id: enrollment.tenant_id,
    user_id: newAuthData.user.id,
    role: 'student',
    status: 'active',
    joined_at: new Date().toISOString(),
  });

if (tenantUserError) {
  console.error('Error adding user to tenant_users:', tenantUserError);
  // This is critical for login to work - return error
  return NextResponse.json(
    { error: 'Failed to add user to tenant. Please contact support.' },
    { status: 500 }
  );
}
```

## Fix Script for Existing Users

If you have existing users who can't log in, run this SQL script:

```sql
-- Fix: Add existing users to tenant_users table
INSERT INTO tenant_users (user_id, tenant_id, role, status, joined_at)
SELECT
  u.id,
  u.tenant_id,
  u.role,
  'active',
  NOW()
FROM users u
WHERE u.tenant_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM tenant_users tu
    WHERE tu.user_id = u.id AND tu.tenant_id = u.tenant_id
  );
```

This script is available in: `fix-tenant-access.sql`

## Developer Checklist

When creating a new user creation endpoint, you MUST:

1. ✅ Create user in `auth.users` table (via Supabase Auth)
2. ✅ Create user profile in `users` table with `tenant_id`
3. ✅ **CRITICAL:** Add entry to `tenant_users` table
4. ✅ Set appropriate `role` and `status` in `tenant_users`
5. ✅ Handle errors appropriately - rollback if `tenant_users` insert fails

## Code Template

```typescript
// 1. Create auth user
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: email,
  password: password,
  email_confirm: true
});

// 2. Create user profile
const { error: userError } = await supabase
  .from('users')
  .insert({
    id: authData.user.id,
    email: email,
    first_name: firstName,
    last_name: lastName,
    tenant_id: tenantId,
    role: 'student',
    status: 'active'
  });

// 3. CRITICAL: Add to tenant_users
const { error: tenantUserError } = await supabase
  .from('tenant_users')
  .insert({
    tenant_id: tenantId,
    user_id: authData.user.id,
    role: 'student',
    status: 'active',
    joined_at: new Date().toISOString()
  });

if (tenantUserError) {
  // This is critical - return error and potentially rollback
  return NextResponse.json(
    { error: 'Failed to add user to tenant' },
    { status: 500 }
  );
}
```

## Testing

To verify a user can log in:

```sql
-- Check if user has tenant_users entry
SELECT
  u.email,
  u.tenant_id,
  t.name as tenant_name,
  tu.role,
  tu.status
FROM users u
JOIN tenants t ON t.id = u.tenant_id
LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = u.tenant_id
WHERE u.email = 'user@example.com';
```

If `tu.role` is NULL, the user CANNOT log in!

## Related Files

- **Database Functions**: `src/lib/supabase/04-tenant-rls-functions.sql`
- **Login Route**: `src/app/api/auth/login/route.ts`
- **Tenant Detection**: `src/lib/tenant/detection.ts`
- **Fix Script**: `fix-tenant-access.sql`

## History

- **2025-12-16**: Bug discovered - enrollment wizard users couldn't log in
- **2025-12-16**: Fixed enrollment completion endpoint
- **2025-12-16**: Created comprehensive fix script for existing users
- **2025-12-16**: Documented critical importance of `tenant_users` table
