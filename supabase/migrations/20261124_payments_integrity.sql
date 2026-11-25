-- Payments integrity: one payment row per Stripe charge, one log row per Stripe event.
--
-- Several paths record the same Stripe payment (the charge itself, the
-- webhook, the catch-up check). Each looks first, but two running at the same
-- moment could both insert. These unique indexes make the second insert fail
-- (the code then reads the first row), so a payment can never be counted twice.
--
-- If duplicates already exist, the index is skipped with a NOTICE naming
-- them, instead of failing; clean those up and run this again.
-- Safe to rerun.
DO $$
DECLARE
  dup_count int;
BEGIN
  -- One payment per Stripe invoice.
  SELECT count(*) INTO dup_count FROM (
    SELECT stripe_invoice_id FROM public.payments WHERE stripe_invoice_id IS NOT NULL GROUP BY 1 HAVING count(*) > 1
  ) d;
  IF dup_count = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_invoice ON public.payments (stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped uq_payments_stripe_invoice: % invoice(s) have more than one payment row', dup_count;
  END IF;

  -- One payment per Stripe payment intent.
  SELECT count(*) INTO dup_count FROM (
    SELECT stripe_payment_intent_id FROM public.payments WHERE stripe_payment_intent_id IS NOT NULL GROUP BY 1 HAVING count(*) > 1
  ) d;
  IF dup_count = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_stripe_intent ON public.payments (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
  ELSE
    RAISE NOTICE 'Skipped uq_payments_stripe_intent: % payment intent(s) have more than one payment row', dup_count;
  END IF;

  -- One log row per Stripe event (how a repeated event is recognised).
  SELECT count(*) INTO dup_count FROM (
    SELECT payload->>'id' FROM public.webhook_events WHERE source = 'stripe' AND payload->>'id' IS NOT NULL GROUP BY 1 HAVING count(*) > 1
  ) d;
  IF dup_count = 0 THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_stripe_event ON public.webhook_events ((payload->>'id')) WHERE source = 'stripe';
  ELSE
    RAISE NOTICE 'Skipped uq_webhook_events_stripe_event: % Stripe event(s) are logged more than once', dup_count;
  END IF;
END $$;
