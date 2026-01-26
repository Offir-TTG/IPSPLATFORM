-- Check if these payment plans exist and are active
SELECT 
  id, 
  plan_name, 
  plan_type, 
  is_active,
  created_at
FROM payment_plans 
WHERE id IN (
  '039bd76c-5911-44bf-94e0-04c796187828',
  '3a4c253e-3b6a-4095-a9d5-f2c26bf4fa38'
);
