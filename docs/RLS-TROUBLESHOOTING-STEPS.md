# Step-by-Step RLS Troubleshooting

You're getting "permission denied for table users" error. Let's fix it systematically.

## Step 1: Verify It's Actually an RLS Problem

Run this in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

**Result:** If `rowsecurity` is `true`, RLS is enabled and likely causing the problem.

## Step 2: Quick Fix - Disable RLS Temporarily (Development Only!)

**⚠️ WARNING:** This removes all security! Only for local development/testing!

Run in Supabase SQL Editor:
```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

Now test your app. Does it work?

- ✅ **If it works:** The problem is definitely RLS policies. Continue to Step 3.
- ❌ **If it still fails:** The problem is something else (permissions, connection, etc.)

## Step 3: Check What User You're Running As

Run this in Supabase SQL Editor:
```sql
SELECT current_user, session_user;
SELECT auth.uid();  -- This should return your user ID
SELECT auth.role(); -- This should return 'authenticated' or 'anon'
```

**Important:**
- If you're testing in SQL Editor, you might be running as `postgres` superuser
- In your app, you're running as `authenticated` role
- The policies behave differently for each!

## Step 4: Check Your Current User's Role

```sql
SELECT id, email, role
FROM public.users
WHERE id = auth.uid();
```

**This query might fail with "permission denied"** if RLS is still enabled! That's the problem!

## Step 5: The Real Fix - Use Service Role in Your App

The issue is that your Next.js API routes might be using the `anon` key instead of the `service_role` key for admin operations.

### Check your API routes:

**BAD** (uses anon key with RLS restrictions):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // ❌ This has RLS restrictions
);
```

**GOOD** (uses service role, bypasses RLS):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ This bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

### Where to use Service Role:

✅ **Use service role in these files:**
- `src/app/api/admin/**/*.ts` - All admin API routes
- `src/lib/supabase/server.ts` - Server-side operations
- Any API route that needs to bypass RLS

❌ **Never use service role in:**
- Client-side code
- `src/lib/supabase/client.ts`
- Anywhere that exposes the key to the browser

## Step 6: Check Your Server-Side Supabase Client

Let's check your server.ts file:

<function_calls>
<invoke name="Read">
<parameter name="file_path">c:\Users\OffirOmer\Documents\IPSPlatform\src\lib\supabase\server.ts