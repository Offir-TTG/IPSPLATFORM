-- Payments: allow the types that schedules already use.
--
-- A paid coaching session (pay as you go) is recorded as a payment with
-- payment_type 'session', and a manual charge as 'manual'. The payments rule
-- only allowed deposit / installment / subscription / full / one_time, so
-- recording a paid session failed and the session stayed "processing".
-- The rule is rewritten from its own definition, keeping the other values.
-- Safe to rerun.
DO $$
DECLARE
  c record;
  def text;
BEGIN
  FOR c IN
    SELECT con.conname, pg_get_constraintdef(con.oid) AS def
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'payments' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%payment_type%'
      AND pg_get_constraintdef(con.oid) LIKE '%ARRAY[%'
      AND pg_get_constraintdef(con.oid) NOT LIKE '%CASE%'
  LOOP
    def := c.def;
    IF def NOT LIKE '%''session''%' THEN
      def := replace(def, '''subscription''::text', '''subscription''::text, ''session''::text');
    END IF;
    IF def NOT LIKE '%''manual''%' THEN
      def := replace(def, '''subscription''::text', '''subscription''::text, ''manual''::text');
    END IF;
    IF def <> c.def THEN
      EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', c.conname);
      EXECUTE format('ALTER TABLE public.payments ADD CONSTRAINT %I %s', c.conname, def);
      RAISE NOTICE 'Rule % on payments: widened', c.conname;
    ELSE
      RAISE NOTICE 'Rule % on payments already allows session and manual (or has another shape): %', c.conname, c.def;
    END IF;
  END LOOP;
END $$;
