# Fix: Permission Denied for Table Users

## Problem
You're getting "permission denied for table users" error because of Row Level Security (RLS) policies that create infinite recursion when checking admin permissions.

## Root Cause
The current RLS policies check the `users` table to determine if someone is an admin:
```sql
EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
```

This creates recursion: to read from `users` table → need to check if admin → need to read from `users` table → infinite loop!

## Solution

### Step 1: Run the Fix SQL Script
1. Open Supabase Dashboard → SQL Editor
2. Run the file: `src/lib/supabase/fix-users-rls.sql`
3. This will:
   - Create a custom JWT hook function
   - Update all RLS policies to use JWT claims instead of table lookups
   - Fix the infinite recursion issue

### Step 2: Configure Authentication Hook (IMPORTANT!)
After running the SQL, you MUST configure the Supabase authentication hook:

#### In Supabase Dashboard:
1. Go to your project's Supabase Dashboard
2. In the left sidebar, click **Authentication**
3. Click the **Hooks** tab
4. You'll see "No hooks configured yet" - Click the **"Add hook"** button
5. Fill in the dialog that appears:

```
Add a new hook
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hook type:          [Custom Access Token ▼]
Hook name:          custom_access_token_hook
Function type:      ○ HTTP endpoint  ● Postgres function
Postgres function:  public.custom_access_token_hook
☑ Enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    [Cancel]  [Add Hook]
```

6. Click **"Add Hook"**
7. You should now see the hook listed in your hooks table

**What you should see after adding:**
```
Hooks
┌─────────────────────────────────┬──────────────────────────────────┬─────────┐
│ Name                            │ Function                         │ Enabled │
├─────────────────────────────────┼──────────────────────────────────┼─────────┤
│ custom_access_token_hook        │ public.custom_access_token_hook  │ ✓       │
└─────────────────────────────────┴──────────────────────────────────┴─────────┘
```

### Step 3: Update User Metadata on Signup
Update your signup route to set role in user metadata:

```typescript
// In src/app/api/auth/signup/route.ts
const { data: authData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      role: 'student', // This will be added to JWT
      first_name: firstName,
      last_name: lastName,
    },
  },
});
```

### Step 4: Verify the Fix

Test with this query in Supabase SQL Editor:
```sql
-- As logged-in user, this should work now:
SELECT * FROM public.users WHERE id = auth.uid();

-- As admin, this should return all users:
SELECT * FROM public.users;
```

## Alternative Quick Fix (Temporary)

If you need a quick temporary fix while testing, you can disable RLS on the users table:

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** This removes security! Only use for local development. Never in production!

## How It Works Now

1. When user signs up, their role is stored in `user_metadata`
2. The custom JWT hook function adds `user_role` claim to JWT
3. RLS policies check JWT claims: `auth.jwt() ->> 'user_role' = 'admin'`
4. No recursion because JWT is already loaded, no table lookup needed!

## Policies Fixed

The following policies now use JWT claims:
- ✅ Users table (view, insert, update, delete)
- ✅ Programs table (admin management)
- ✅ Courses table (admin management)
- ✅ Enrollments table (admin management)
- ✅ Theme config (admin management)

## Troubleshooting

### Still getting permission denied?
1. Make sure you ran the SQL script completely
2. Verify the auth hook is enabled in Dashboard
3. Log out and log back in (to get new JWT with role claim)
4. Check if user has role in database: `SELECT * FROM auth.users`

### Admin features not working?
1. Verify user's role in `public.users` table is 'admin'
2. Check user metadata: `SELECT raw_user_meta_data FROM auth.users WHERE id = '...'`
3. Ensure auth hook is configured correctly

### Need to make existing user admin?
```sql
-- Update public.users
UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

-- Update auth.users metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your@email.com';
```

Then log out and log back in to refresh JWT.

## Files Changed
- ✅ Created: `src/lib/supabase/fix-users-rls.sql`
- ✅ Created: `FIX-USERS-PERMISSION-ERROR.md`

## Next Steps
1. Run the SQL script
2. Configure the auth hook in Supabase Dashboard
3. Test login and verify no permission errors
4. Update existing users' metadata if needed
