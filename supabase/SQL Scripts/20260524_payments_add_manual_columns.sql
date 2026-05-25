-- Add the columns the manual-payment service paths
-- (recordManualPayment, recordStandalonePayment) have been writing to.
--
-- These were referenced by the service code but never actually existed
-- in the DB — Phase A's dialog was orphaned UI so nobody triggered it
-- until the Phase B work wired a visible button. The error surfaces as
-- "Could not find the 'payment_method' column of 'payments'".
--
-- All three are nullable so existing Stripe-only rows (which don't
-- carry these) remain valid. Future inserts populate them.
--
-- After applying: in Supabase SQL Editor run `NOTIFY pgrst, 'reload schema';`
-- (or click "Reload schema cache" on the API Docs page) so PostgREST
-- picks the new columns up immediately.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id);

-- Indexes for the common lookup patterns:
--   * filter manual payments by method on reports
--   * trace a wire / check by its reference
--   * pull a user's payment history (especially the off-schedule case
--     where enrollment_id is NULL)
CREATE INDEX IF NOT EXISTS idx_payments_method      ON public.payments(payment_method) WHERE payment_method IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_txn_id      ON public.payments(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_user_id     ON public.payments(user_id)        WHERE user_id        IS NOT NULL;

-- Tell PostgREST to refresh its schema cache so the new columns are
-- visible to the REST API immediately (Supabase auto-NOTIFYs on
-- ALTER, but call it explicitly so re-running this script in any
-- order always lands a fresh cache).
NOTIFY pgrst, 'reload schema';
