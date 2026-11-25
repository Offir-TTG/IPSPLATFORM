-- =====================================================================
-- Keap history: past orders, their payments and card attempts, read-only
-- =====================================================================
-- What it does, in plain words:
--   Three new tables that hold a copy of the orders, payments and card
--   transactions from Keap, so they can be searched in Payments → Keap
--   history after Keap is closed. They are history only: nothing in them is
--   linked to enrollments, payments, reports or charging.
--
-- What it does NOT change:
--   - No existing table or data is touched.
--   - Nobody reads these tables except the admin pages (server side).
--
-- Safe to run more than once.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- One row per Keap order.
CREATE TABLE IF NOT EXISTS public.keap_orders (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  keap_order_id      bigint NOT NULL,
  keap_contact_id    bigint,
  -- The buyer, as written in Keap (not a client of this platform).
  first_name         text,
  last_name          text,
  email              text,
  phone              text,             -- from the Keap contact card, else the order's shipping phone
  shipping_phone     text,
  phone_checked      boolean NOT NULL DEFAULT false,
  title              text,
  keap_status        text,            -- Keap's own status (PAID / DRAFT), kept for reference
  pay_state          text NOT NULL DEFAULT 'unpaid'
                     CHECK (pay_state IN ('full', 'partial', 'unpaid', 'refunded', 'free')),
  order_type         text,
  order_date         timestamptz,
  total              numeric(12,2) NOT NULL DEFAULT 0,
  total_paid         numeric(12,2) NOT NULL DEFAULT 0,
  refund_total       numeric(12,2) NOT NULL DEFAULT 0,
  currency           text NOT NULL DEFAULT 'USD',
  items              jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{name, qty, price, type}]
  product_names      text[] NOT NULL DEFAULT '{}',
  plan               jsonb,                                -- {payments, every_days, first_amount, start}
  notes              text,
  invoice_number     bigint,
  keap_modified_at   timestamptz,
  payments_synced_at timestamptz,
  -- Lower-case text for the search box: name, email, phone, title, order number.
  search_text        text GENERATED ALWAYS AS (
                       lower(coalesce(first_name, '') || ' ' || coalesce(last_name, '') || ' ' || coalesce(email, '') || ' ' ||
                             coalesce(phone, '') || ' ' || coalesce(title, '') || ' ' || keap_order_id::text)
                     ) STORED,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, keap_order_id)
);
CREATE INDEX IF NOT EXISTS keap_orders_search_trgm ON public.keap_orders USING gin (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS keap_orders_date ON public.keap_orders (tenant_id, order_date DESC);
CREATE INDEX IF NOT EXISTS keap_orders_email ON public.keap_orders (tenant_id, lower(email));
CREATE INDEX IF NOT EXISTS keap_orders_contact ON public.keap_orders (tenant_id, keap_contact_id);
CREATE INDEX IF NOT EXISTS keap_orders_products ON public.keap_orders USING gin (product_names);

-- The payments recorded on each order (Keap's "order payments").
CREATE TABLE IF NOT EXISTS public.keap_payments (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  keap_payment_id          bigint NOT NULL,
  keap_order_id            bigint NOT NULL,
  pay_date                 timestamptz,
  amount                   numeric(12,2) NOT NULL DEFAULT 0,
  pay_status               text,
  disputed                 boolean NOT NULL DEFAULT false,
  refund_of_payment_id     bigint,
  created_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, keap_payment_id)
);
CREATE INDEX IF NOT EXISTS keap_payments_order ON public.keap_payments (tenant_id, keap_order_id);

-- Every card attempt Keap made (mostly failed retries), shown on request.
CREATE TABLE IF NOT EXISTS public.keap_transactions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  keap_transaction_id  bigint NOT NULL,
  keap_contact_id      bigint,
  order_ids            bigint[] NOT NULL DEFAULT '{}',
  amount               numeric(12,2) NOT NULL DEFAULT 0,
  status               text,
  gateway              text,
  collection_method    text,
  transaction_date     timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, keap_transaction_id)
);
CREATE INDEX IF NOT EXISTS keap_transactions_orders ON public.keap_transactions USING gin (order_ids);
CREATE INDEX IF NOT EXISTS keap_transactions_date ON public.keap_transactions (tenant_id, transaction_date DESC);

-- Server only: row security on, no policies, so only the service role reads them.
ALTER TABLE public.keap_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keap_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keap_transactions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.keap_orders IS 'Keap order history, read-only copy (Payments → Keap history). Not linked to enrollments or payments.';
COMMENT ON TABLE public.keap_payments IS 'Payments recorded on Keap orders, read-only copy.';
COMMENT ON TABLE public.keap_transactions IS 'Keap card transactions (attempts), read-only copy.';
