-- One-time fix for the ADHD club product (0d6df700-892c-4221-a9c7-3bc7e16f93d4).
-- It was saved as a one-time payment with its monthly membership plan listed only as an
-- alternative, so enrollment links and the public site offered a single full payment.
-- This makes it a monthly subscription with that plan as the default, as the product
-- wizard now saves it. The price stays as it is. Safe to rerun.
UPDATE products p
SET payment_model = 'subscription',
    default_payment_plan_id = pl.id,
    payment_plan = COALESCE(p.payment_plan, '{}'::jsonb) || jsonb_build_object('subscription_interval', COALESCE(pl.subscription_frequency, 'monthly')),
    updated_at = NOW()
FROM payment_plans pl
WHERE p.id = '0d6df700-892c-4221-a9c7-3bc7e16f93d4'
  AND pl.id = '7e0ef5ed-49c3-41af-b241-5877932e277e'
  AND pl.plan_type = 'subscription';
