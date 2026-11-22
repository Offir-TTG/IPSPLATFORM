-- Integration settings (Stripe, Zoom, DocuSign, Daily, ...) hold secret keys.
-- An old setup script let ANY signed-in user read and change them straight
-- from the browser. The app now reads and writes them only on the server with
-- the service key, so browsers get no access at all.
--
-- Run AFTER deploying the code that uses src/lib/integrations/store.ts.
-- The service key bypasses these rules, so the app keeps working.

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Remove every existing rule on the table, whatever it was called.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'integrations' LOOP
    EXECUTE format('DROP POLICY %I ON public.integrations', p.policyname);
  END LOOP;
END $$;

-- No rules means no access for signed-in users or visitors.
REVOKE ALL ON public.integrations FROM anon, authenticated;

-- Check: should return no rows.
SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'integrations';
