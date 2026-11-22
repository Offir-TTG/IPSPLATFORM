-- Each membership plan has its own price (e.g. monthly 100, yearly 1,000),
-- so a client can switch between a product's monthly and yearly plans.
-- When empty, the product's price is used, as before. Safe to run again.

ALTER TABLE public.payment_plans ADD COLUMN IF NOT EXISTS subscription_amount numeric(10,2);

COMMENT ON COLUMN public.payment_plans.subscription_amount IS
  'Price per period for subscription plans. Empty = use the product price.';
