-- Fix: Drop the problematic policies and recreate them correctly
-- This fixes the "infinite recursion detected in policy" error

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Recreate users policies without recursion
-- Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all users (fixed: use auth metadata instead of joining users table)
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR
    id = auth.uid()
  );

-- Allow users to be inserted (for signup)
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Drop and recreate other problematic policies

-- Programs policies (fixed)
DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
CREATE POLICY "Admins can manage programs" ON public.programs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Courses policies (fixed)
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Enrollments policies (fixed)
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.enrollments;
CREATE POLICY "Admins can manage enrollments" ON public.enrollments
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
