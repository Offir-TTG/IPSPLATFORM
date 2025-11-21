-- Delete existing payment system translations before re-running migration
DELETE FROM translations 
WHERE translation_key LIKE 'admin.payments.%';
