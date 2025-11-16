-- SIMPLE AND DIRECT FIX - Just disable RLS temporarily for debugging
-- This is the quickest way to verify if RLS is the problem

-- ============================================================================
-- OPTION 1: Temporarily disable RLS (FOR DEVELOPMENT/TESTING ONLY!)
-- ============================================================================

-- WARNING: This removes all security! Only use for local development!
-- DO NOT use in production!

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_config DISABLE ROW LEVEL SECURITY;

-- Now test if your app works
-- If it works, the problem is definitely RLS policies

-- ============================================================================
-- OPTION 2: Simple policies that work (re-enable after testing)
-- ============================================================================

-- To re-enable RLS with working policies, run this:

/*
-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Allow user creation" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Everyone can view active programs" ON public.programs;
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
DROP POLICY IF EXISTS "Students can view enrolled courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can view their courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Everyone can view theme" ON public.theme_config;
DROP POLICY IF EXISTS "Admins can manage theme" ON public.theme_config;

-- Create simple, permissive policies for development
-- These allow more access but won't cause recursion

-- USERS TABLE
CREATE POLICY "Allow all authenticated users to view users"
ON public.users FOR SELECT
TO authenticated
USING (true);  -- Everyone can see everyone (for development)

CREATE POLICY "Allow user creation"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update themselves"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- PROGRAMS TABLE
CREATE POLICY "Allow all to view programs"
ON public.programs FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow authenticated to manage programs"
ON public.programs FOR ALL
TO authenticated
USING (true);

-- COURSES TABLE
CREATE POLICY "Allow all to view courses"
ON public.courses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated to manage courses"
ON public.courses FOR ALL
TO authenticated
USING (true);

-- ENROLLMENTS TABLE
CREATE POLICY "Allow all to view enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated to manage enrollments"
ON public.enrollments FOR ALL
TO authenticated
USING (true);

-- THEME CONFIG TABLE
CREATE POLICY "Allow all to view theme"
ON public.theme_config FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Allow authenticated to manage theme"
ON public.theme_config FOR ALL
TO authenticated
USING (true);
*/
