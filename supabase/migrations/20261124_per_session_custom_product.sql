-- Products: a custom payment setting can be "per session" (pay as you go).
--
-- products.payment_model allows 'per_session'. The price per session is kept
-- in products.payment_plan (JSON, key session_amount), like the other custom
-- settings; the product price is sessions x that price.
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
    WHERE nsp.nspname = 'public' AND rel.relname = 'products' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%payment_model%'
      AND pg_get_constraintdef(con.oid) LIKE '%ARRAY[%'
      AND pg_get_constraintdef(con.oid) NOT LIKE '%CASE%'
      AND pg_get_constraintdef(con.oid) NOT LIKE '%per_session%'
  LOOP
    def := replace(c.def, '''free''::text', '''free''::text, ''per_session''::text');
    IF def <> c.def THEN
      EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT %I', c.conname);
      EXECUTE format('ALTER TABLE public.products ADD CONSTRAINT %I %s', c.conname, def);
      RAISE NOTICE 'Rule % on products: widened', c.conname;
    ELSE
      RAISE NOTICE 'Rule % on products left as is (unexpected shape): %', c.conname, c.def;
    END IF;
  END LOOP;
END $$;
