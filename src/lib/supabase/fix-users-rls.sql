-- Fix RLS policies for users table to avoid infinite recursion
-- This adds role to JWT claims and updates policies

-- 1. Create a function to set custom claims in JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Fetch the user role from public.users
  SELECT role INTO user_role
  FROM public.users
  WHERE id = (event->>'user_id')::uuid;

  -- Set the claim in the JWT
  claims := event->'claims';

  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    claims := jsonb_set(claims, '{user_role}', '"student"');
  END IF;

  -- Update the 'claims' object in the original event
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;
END;
$$;

-- 2. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO postgres;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO anon;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO authenticated;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO service_role;

-- Note: After creating this function, you need to configure it in Supabase Dashboard:
-- 1. Go to Authentication > Hooks
-- 2. Enable "Custom Access Token Hook"
-- 3. Set the hook to: public.custom_access_token_hook

-- 3. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- 4. Create new policies using JWT claims (no recursion)
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
  OR
  (auth.uid() = id)
);

CREATE POLICY "Allow user creation"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
);

CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
);

-- 5. Update other table policies to use JWT claims
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
CREATE POLICY "Admins can manage programs" ON public.programs
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage theme" ON public.theme_config;
CREATE POLICY "Admins can manage theme" ON public.theme_config
FOR ALL
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  OR
  (auth.jwt() ->> 'user_role' = 'admin')
);
