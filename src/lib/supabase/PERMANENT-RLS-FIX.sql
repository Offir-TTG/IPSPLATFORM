-- PERMANENT FIX for RLS Policies - No JWT Hooks Needed
-- This fixes the infinite recursion problem properly

-- The problem: Policies that check the users table create recursion
-- The solution: Use proper RLS patterns that don't create loops

-- ============================================================================
-- 1. DROP ALL EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- Other tables
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage theme" ON public.theme_config;

-- ============================================================================
-- 2. GRANT SERVICE ROLE ACCESS TO USERS TABLE
-- ============================================================================

-- First, we need to ensure the service role can bypass RLS
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT ON public.users TO anon, authenticated;

-- ============================================================================
-- 3. CREATE A HELPER FUNCTION TO CHECK IF USER IS ADMIN (No Recursion)
-- ============================================================================

-- This function uses SECURITY DEFINER and runs as postgres superuser to bypass RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = user_id
    AND role = 'admin'
  );
$$;

-- Change owner to postgres to ensure it has full access
ALTER FUNCTION public.is_admin(uuid) OWNER TO postgres;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION public.is_admin TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- 3. CREATE PROPER RLS POLICIES USING THE HELPER FUNCTION
-- ============================================================================

-- USERS TABLE POLICIES
-- Users can always view their own profile (no admin check needed)
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Admins can view all users (using helper function - no recursion!)
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (public.is_admin(auth.uid()));

-- Anyone can insert during signup (checked by application logic)
CREATE POLICY "Allow user creation"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile (but cannot change role)
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
-- Note: To prevent role changes, we'll use a trigger instead

-- Admins can update any user
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Only admins can delete users
CREATE POLICY "Admins can delete users"
ON public.users FOR DELETE
USING (public.is_admin(auth.uid()));

-- PROGRAMS TABLE POLICIES
CREATE POLICY "Admins can manage programs"
ON public.programs FOR ALL
USING (public.is_admin(auth.uid()));

-- COURSES TABLE POLICIES
CREATE POLICY "Admins can manage courses"
ON public.courses FOR ALL
USING (public.is_admin(auth.uid()));

-- ENROLLMENTS TABLE POLICIES
CREATE POLICY "Admins can manage enrollments"
ON public.enrollments FOR ALL
USING (public.is_admin(auth.uid()));

-- THEME CONFIG POLICIES
CREATE POLICY "Admins can manage theme"
ON public.theme_config FOR ALL
USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 4. ADD TRIGGER TO PREVENT USERS FROM CHANGING THEIR OWN ROLE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow role changes if the current user is an admin
  IF OLD.role != NEW.role AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.users;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- ============================================================================
-- 5. VERIFY THE FIX
-- ============================================================================

-- Test queries (run these after applying the fix):
-- As a regular user:
-- SELECT * FROM public.users WHERE id = auth.uid(); -- Should work

-- As an admin:
-- SELECT * FROM public.users; -- Should return all users

-- Check if current user is admin:
-- SELECT public.is_admin(auth.uid());
