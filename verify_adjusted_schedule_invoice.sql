-- Verify the adjusted schedule now has an invoice

SELECT
  id,
  scheduled_date,
  status,
  amount,
  payment_number,
  stripe_invoice_id,
  paid_date,
  adjustment_reason,
  updated_at
FROM payment_schedules
WHERE id = '028a51e1-dd3e-4b6c-9139-ba4e6f20979b';

-- Check if payment was recorded
SELECT
  id,
  amount,
  currency,
  status,
  payment_type,
  installment_number,
  stripe_invoice_id,
  paid_at,
  created_at
FROM payments
WHERE payment_schedule_id = '028a51e1-dd3e-4b6c-9139-ba4e6f20979b';
