-- Check if Stripe webhooks are being received
-- Run this to see webhook delivery status

-- 1. Check recent webhook events
SELECT
  event_type,
  processed_at,
  (payload->>'id') as event_id,
  (payload->'data'->'object'->>'id') as object_id,
  (payload->'data'->'object'->>'status') as status
FROM webhook_events
WHERE source = 'stripe'
ORDER BY processed_at DESC
LIMIT 10;

-- 2. Check for payment_intent.succeeded events specifically
SELECT
  event_type,
  processed_at,
  (payload->'data'->'object'->>'id') as payment_intent_id,
  (payload->'data'->'object'->>'amount') as amount,
  (payload->'data'->'object'->'metadata'->>'enrollment_id') as enrollment_id,
  (payload->'data'->'object'->'metadata'->>'schedule_id') as schedule_id,
  (payload->'data'->'object'->'metadata'->>'tenant_id') as tenant_id
FROM webhook_events
WHERE source = 'stripe'
  AND event_type = 'payment_intent.succeeded'
ORDER BY processed_at DESC
LIMIT 5;

-- 3. Check for webhooks related to specific enrollment
SELECT
  event_type,
  processed_at,
  (payload->'data'->'object'->'metadata'->>'enrollment_id') as enrollment_id,
  (payload->'data'->'object'->>'id') as object_id
FROM webhook_events
WHERE source = 'stripe'
  AND payload->'data'->'object'->'metadata'->>'enrollment_id' = '15282b86-97ed-4ba3-9578-f669eaf6d9ee'
ORDER BY processed_at DESC;

-- 4. Check if any webhooks received in last hour
SELECT
  COUNT(*) as webhook_count,
  MIN(processed_at) as first_webhook,
  MAX(processed_at) as last_webhook
FROM webhook_events
WHERE source = 'stripe'
  AND processed_at > NOW() - INTERVAL '1 hour';
