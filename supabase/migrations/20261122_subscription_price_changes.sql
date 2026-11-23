-- Scheduled price changes for memberships (subscriptions).
--
-- subscription_price_changes  one row per change an admin schedules: the new
--   price, the date it takes effect, and who it applies to:
--     'new' - only people who join on or after the date
--     'all' - also current members, from their first renewal on or after the
--             date; they get an email notice_days before the date.
--   notice_sent_at  when the notice emails went out ('all' only)
--   applied_at      when the product or plan price was moved to the new price
--   cancelled_at    a change the admin cancelled (nothing happens)
--
-- enrollments.subscription_price  the member's own price, so a later change
--   for new members never touches them: {"amount": 30, "plan_id": "...",
--   "set_at": "2026-11-22"}. Filled for current members below from their
--   latest membership payment.
--
-- Cards stay at Stripe; the platform keeps charging each period off-session,
-- now with the member's own price. Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.subscription_price_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  payment_plan_id uuid REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  old_amount numeric(10,2) NOT NULL,
  new_amount numeric(10,2) NOT NULL CHECK (new_amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  effective_date date NOT NULL,
  applies_to text NOT NULL CHECK (applies_to IN ('new', 'all')),
  notice_days integer NOT NULL DEFAULT 30 CHECK (notice_days >= 0),
  notice_sent_at timestamptz,
  applied_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscription_price_changes_product
  ON public.subscription_price_changes (product_id, effective_date)
  WHERE cancelled_at IS NULL;

-- Server-only: read and written by admin routes and the hourly job.
ALTER TABLE public.subscription_price_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_price_changes FROM anon, authenticated;

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS subscription_price jsonb;

-- Current members keep what they pay today: their latest membership payment
-- (not cancelled or refunded) becomes their own price.
UPDATE public.enrollments e
SET subscription_price = jsonb_build_object(
  'amount', last.amount,
  'plan_id', last.payment_plan_id,
  'set_at', to_char(last.scheduled_date, 'YYYY-MM-DD')
)
FROM (
  SELECT DISTINCT ON (enrollment_id) enrollment_id, amount, payment_plan_id, scheduled_date
  FROM public.payment_schedules
  WHERE payment_type = 'subscription' AND status NOT IN ('cancelled', 'refunded')
  ORDER BY enrollment_id, payment_number DESC
) AS last
WHERE e.id = last.enrollment_id AND e.subscription_price IS NULL;
