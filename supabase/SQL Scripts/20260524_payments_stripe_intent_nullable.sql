-- Make payments.stripe_payment_intent_id nullable.
--
-- The original schema enforced NOT NULL because every payment used to
-- come from Stripe. Manual / offline payments (ACH wire, cash, check,
-- standalone) don't have a Stripe PaymentIntent — the manual recording
-- service paths (recordManualPayment, recordStandalonePayment) write
-- without one, which surfaced as:
--
--   null value in column "stripe_payment_intent_id" of relation
--   "payments" violates not-null constraint
--
-- Safe to re-run: DROP NOT NULL is a no-op once dropped.

ALTER TABLE public.payments
  ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
