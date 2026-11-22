-- Indexes for the lookups that run on every payment, webhook and enrollment
-- link. Without them each becomes a full table scan, which gets slow at
-- thousands of transactions. Safe to run more than once.
-- Your tables are small today, so these build instantly and can be pasted
-- and run in one go. (At large volume, add CONCURRENTLY and run each line
-- on its own, so the tables are not locked while building.)

-- Every enrollment link request looks the enrollment up by its key.
CREATE INDEX IF NOT EXISTS idx_enrollments_enrollment_token
  ON public.enrollments (enrollment_token) WHERE enrollment_token IS NOT NULL;

-- Webhooks and the charge routes find payments by Stripe payment id.
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent
  ON public.payments (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_enrollment
  ON public.payments (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_stripe_intent
  ON public.payment_schedules (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- The charging job: payments due, by status, oldest first.
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status_due
  ON public.payment_schedules (status, scheduled_date);
-- The retry job.
CREATE INDEX IF NOT EXISTS idx_payment_schedules_retry
  ON public.payment_schedules (next_retry_date) WHERE status = 'failed';

-- The Stripe webhook skips events it has already handled by looking up the
-- event id inside the stored payload; this makes that lookup instant.
CREATE INDEX IF NOT EXISTS idx_webhook_events_source_event_id
  ON public.webhook_events (source, (payload->>'id'));

-- Every Stripe call reads the tenant's integration.
CREATE INDEX IF NOT EXISTS idx_integrations_tenant_key
  ON public.integrations (tenant_id, integration_key);
