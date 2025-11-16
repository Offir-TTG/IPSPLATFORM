-- Fix RLS Policies for Languages Table
-- The policies need to check the users table instead of JWT for admin role

-- Drop existing admin policies
DROP POLICY IF EXISTS "Admins can manage languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can manage translations" ON public.translations;
DROP POLICY IF EXISTS "Admins can manage translation keys" ON public.translation_keys;

-- Create new admin policies that check the users table
CREATE POLICY "Admins can manage languages" ON public.languages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage translations" ON public.translations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage translation keys" ON public.translation_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
