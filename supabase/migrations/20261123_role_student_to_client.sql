-- Step 2 of renaming the 'student' role to 'client' (shown as "Client" / "לקוח").
--
-- RUN ONLY AFTER the code that accepts both values is deployed (src/lib/auth/roles.ts,
-- withAuth). The live site's older code lets in only 'student'; running this first
-- would lock every client out until the deploy.
--
-- 1. Every role rule (CHECK) that allows 'student' also allows 'client'. The rule is
--    rewritten from its own definition, so other allowed values are kept.
-- 2. Stored roles move from 'student' to 'client'.
-- 3. Lists anything in the database that still names 'student' (policies,
--    functions), for review. Nothing there is changed automatically.
--
-- After it runs: set NEW_CLIENT_ROLE = 'client' in src/lib/auth/roles.ts so new
-- accounts get the new value. Safe to rerun.

-- 1. Allow 'client' wherever 'student' is allowed.
DO $$
DECLARE
  c record;
  def text;
BEGIN
  FOR c IN
    SELECT con.conname, rel.relname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND con.contype = 'c'
      AND rel.relname IN ('users', 'tenant_users', 'tenant_invitations')
      AND pg_get_constraintdef(con.oid) LIKE '%''student''%'
      AND pg_get_constraintdef(con.oid) NOT LIKE '%''client''%'
  LOOP
    def := replace(c.def, '''student''::text', '''student''::text, ''client''::text');
    IF def = c.def THEN
      def := replace(c.def, '''student''', '''student'', ''client''');
    END IF;
    EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', c.relname, c.conname);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', c.relname, c.conname, def);
    RAISE NOTICE 'Rule % on %: now allows client', c.conname, c.relname;
  END LOOP;
END $$;

-- 2. Move the stored roles.
UPDATE public.users SET role = 'client' WHERE role = 'student';
UPDATE public.tenant_users SET role = 'client' WHERE role = 'student';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tenant_invitations' AND column_name = 'role') THEN
    UPDATE public.tenant_invitations SET role = 'client' WHERE role = 'student';
  END IF;
END $$;

-- 3. Review: anything in the database that still names 'student'.
SELECT 'policy' AS kind, tablename AS name, policyname AS detail
FROM pg_policies
WHERE schemaname = 'public' AND (coalesce(qual, '') LIKE '%''student''%' OR coalesce(with_check, '') LIKE '%''student''%')
UNION ALL
SELECT 'function', p.proname, left(regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g'), 160)
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' AND pg_get_functiondef(p.oid) LIKE '%''student''%';
