-- Payment plans: a fifth type, "per session" (pay as you go).
--
-- Nothing is charged at enrollment; only the card is saved. Each session is
-- charged to the saved card when the team marks it held: one payment_schedules
-- row (payment_type 'session') per session, linked to that session, so the same
-- session can never be charged twice.
--
-- 1. payment_plans.plan_type allows 'per_session' (any CHECK is rewritten from
--    its own definition, keeping the other values).
-- 2. payment_plans.session_amount: the plan's own price per session; empty =
--    the product's price (as subscription_amount does for memberships).
-- 3. payment_schedules.payment_type allows 'session'.
-- 4. payment_schedules.coaching_session_id: the session a charge is for
--    (unique, so one charge per session).
-- Safe to rerun.

-- 1 + 3. Widen the CHECK rules that list the allowed values.
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
    WHERE nsp.nspname = 'public' AND con.contype = 'c'
      -- Only the "value is one of a list" rules; other rules that mention the
      -- type (such as the CASE rule on required fields) are left alone.
      AND pg_get_constraintdef(con.oid) LIKE '%ARRAY[%'
      AND pg_get_constraintdef(con.oid) NOT LIKE '%CASE%'
      AND (
        (rel.relname = 'payment_plans' AND pg_get_constraintdef(con.oid) LIKE '%plan_type%' AND pg_get_constraintdef(con.oid) NOT LIKE '%per_session%')
        OR (rel.relname = 'payment_schedules' AND pg_get_constraintdef(con.oid) LIKE '%payment_type%' AND pg_get_constraintdef(con.oid) NOT LIKE '%''session''%')
      )
  LOOP
    IF c.relname = 'payment_plans' THEN
      def := replace(c.def, '''subscription''::text', '''subscription''::text, ''per_session''::text');
      IF def = c.def THEN def := replace(c.def, '''subscription''', '''subscription'', ''per_session'''); END IF;
    ELSE
      def := replace(c.def, '''manual''::text', '''manual''::text, ''session''::text');
      IF def = c.def THEN def := replace(c.def, '''manual''', '''manual'', ''session'''); END IF;
    END IF;
    IF def <> c.def THEN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', c.relname, c.conname);
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', c.relname, c.conname, def);
      RAISE NOTICE 'Rule % on %: widened', c.conname, c.relname;
    ELSE
      RAISE NOTICE 'Rule % on % left as is (unexpected shape): %', c.conname, c.relname, c.def;
    END IF;
  END LOOP;
END $$;

-- 2. The plan's own price per session.
ALTER TABLE public.payment_plans ADD COLUMN IF NOT EXISTS session_amount numeric(10,2) CHECK (session_amount IS NULL OR session_amount > 0);

-- 4. One charge per held session.
ALTER TABLE public.payment_schedules ADD COLUMN IF NOT EXISTS coaching_session_id uuid REFERENCES public.coaching_sessions(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_schedules_one_per_session
  ON public.payment_schedules (coaching_session_id)
  WHERE coaching_session_id IS NOT NULL;
