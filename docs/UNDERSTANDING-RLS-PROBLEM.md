# Understanding the RLS Problem and Permanent Fix

## The Real Problem (Not JWT!)

The "permission denied for table users" error happens because of **infinite recursion in RLS policies**.

### Why Recursion Happens

Original policy from `schema.sql`:
```sql
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
```

**The problem:**
1. You try to SELECT from `users` table
2. RLS policy checks: "Are you admin?" → needs to SELECT from `users` table
3. To SELECT from `users`, RLS policy checks: "Are you admin?" → needs to SELECT from `users` table
4. **Infinite loop!** → Permission denied

### Why This Happens

When you have RLS enabled on a table, **EVERY** query to that table triggers the RLS policies, even queries **inside** the RLS policy itself!

```
User Query: SELECT * FROM users
    ↓
RLS Policy: Check if admin → SELECT role FROM users
    ↓
RLS Policy: Check if admin → SELECT role FROM users
    ↓
RLS Policy: Check if admin → SELECT role FROM users
    ↓
💥 RECURSION! → Permission Denied
```

## The Permanent Solution (No Workarounds!)

Use `SECURITY DEFINER` function to bypass RLS for internal checks:

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- ← This is the key!
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
    AND role = 'admin'
  );
END;
$$;
```

### What SECURITY DEFINER Does

- **Normal function**: Runs with the caller's permissions (subject to RLS)
- **SECURITY DEFINER**: Runs with the function owner's permissions (bypasses RLS)

So when the RLS policy calls `is_admin()`:
1. The function runs with **definer** (owner) rights
2. It can read from `users` table **without** triggering RLS
3. No recursion!

### Updated Policy (No Recursion!)

```sql
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (public.is_admin(auth.uid()));  -- Calls helper function
```

**Flow:**
```
User Query: SELECT * FROM users
    ↓
RLS Policy: Call is_admin(user_id)
    ↓
Function (SECURITY DEFINER): SELECT role FROM users (bypasses RLS)
    ↓
Function returns: true/false
    ↓
✅ No recursion! Policy evaluates cleanly
```

## How to Apply the Permanent Fix

### Step 1: Run the SQL Script
Open Supabase SQL Editor and run:
```
src/lib/supabase/PERMANENT-RLS-FIX.sql
```

This will:
- Drop all problematic policies
- Create the `is_admin()` helper function with `SECURITY DEFINER`
- Recreate all policies using the helper function
- **No JWT hooks needed!**
- **No workarounds!**

### Step 2: Verify It Works
Run these test queries in Supabase SQL Editor:

```sql
-- Test 1: Check if you're admin
SELECT public.is_admin(auth.uid());

-- Test 2: View your own profile (should always work)
SELECT * FROM public.users WHERE id = auth.uid();

-- Test 3: View all users (only works if you're admin)
SELECT * FROM public.users;
```

### Step 3: That's It!
No need to:
- ❌ Configure JWT hooks
- ❌ Add metadata
- ❌ Log out and log back in
- ❌ Change application code

The fix is **permanent** and **database-only**.

## Why This Is Better Than JWT Approach

| JWT Hooks Approach | SECURITY DEFINER Approach |
|-------------------|---------------------------|
| ❌ Requires Dashboard configuration | ✅ Pure SQL, no UI needed |
| ❌ Requires app code changes | ✅ No app changes |
| ❌ Requires users to re-login | ✅ Works immediately |
| ❌ Complex to maintain | ✅ Simple and standard |
| ❌ Depends on JWT claims | ✅ Uses database directly |

## How SECURITY DEFINER Works

Think of it like `sudo` in Linux:

```
Regular Function (SECURITY INVOKER):
  User → Function → Database (as user) → RLS checks user

SECURITY DEFINER Function:
  User → Function → Database (as function owner) → RLS bypassed
```

The function owner (usually `postgres` or your admin) has full access, so the function can read the `users` table without triggering RLS policies.

## Security Considerations

**Is SECURITY DEFINER safe?**

✅ YES, when used correctly:
- The function ONLY checks admin status
- It doesn't expose user data
- It only returns boolean (true/false)
- RLS policies still protect the actual data

❌ Would be UNSAFE:
```sql
-- DON'T DO THIS!
CREATE FUNCTION get_all_users()
RETURNS TABLE(...)
SECURITY DEFINER
AS $$ SELECT * FROM users $$; -- Exposes all users!
```

Our `is_admin()` function is safe because:
1. It only returns boolean
2. It only checks one user at a time
3. It's used internally by RLS, not exposed to end users

## Files Created

- ✅ `src/lib/supabase/PERMANENT-RLS-FIX.sql` - The permanent fix
- ✅ `UNDERSTANDING-RLS-PROBLEM.md` - This explanation

## What to Delete

You can **delete** or **ignore** these files (they're the workaround approach):
- ❌ `src/lib/supabase/fix-users-rls.sql` - JWT hooks approach
- ❌ `FIX-USERS-PERMISSION-ERROR.md` - JWT hooks guide

## Summary

**Problem**: RLS policy creates infinite recursion when checking admin role
**Root Cause**: Policy queries the same table it's protecting
**Solution**: Use `SECURITY DEFINER` function to bypass RLS for internal checks
**Result**: Clean, permanent, database-only fix with no workarounds
