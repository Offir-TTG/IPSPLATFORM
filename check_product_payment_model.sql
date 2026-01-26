-- Check the product's payment_model
SELECT 
  p.id,
  p.title,
  p.payment_model,
  p.price_amount,
  p.price_currency,
  e.id as enrollment_id,
  e.total_amount,
  e.paid_amount,
  e.enrollment_token
FROM products p
JOIN enrollments e ON e.product_id = p.id
WHERE e.enrollment_token = 'tOEXVIbum-6oKYFrIo6NaBJ2Xhuovq2X2Mj0szXfwas';
