-- Check which schedules still need invoices created

SELECT
  id,
  scheduled_date,
  (scheduled_date::date - CURRENT_DATE) as days_from_now,
  status,
  amount,
  payment_number,
  stripe_invoice_id,
  CASE
    WHEN stripe_invoice_id IS NULL THEN '⚠️ Needs invoice'
    ELSE '✅ Has invoice: ' || stripe_invoice_id
  END as invoice_status
FROM payment_schedules
WHERE status IN ('pending', 'failed')
  AND scheduled_date <= (CURRENT_DATE + INTERVAL '30 days')
ORDER BY scheduled_date;

-- Summary
SELECT
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN stripe_invoice_id IS NULL THEN 1 END) as needs_invoice,
  COUNT(CASE WHEN stripe_invoice_id IS NOT NULL THEN 1 END) as has_invoice
FROM payment_schedules
WHERE scheduled_date <= (CURRENT_DATE + INTERVAL '30 days')
GROUP BY status;
