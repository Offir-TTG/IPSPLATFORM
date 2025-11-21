-- DIAGNOSTIC: Check Payment Translations
-- Run this to understand why translations aren't loading

-- 1. Check if payment translations exist in database
SELECT
    COUNT(*) as total_count,
    language_code,
    context
FROM translations
WHERE tenant_id = '70d86807-7e7c-49cd-8601-98235444e2ac'
AND (translation_key LIKE 'admin.payments%' OR translation_key = 'admin.nav.payments')
GROUP BY language_code, context;

-- 2. Show sample of payment translations
SELECT
    translation_key,
    translation_value,
    language_code,
    context
FROM translations
WHERE tenant_id = '70d86807-7e7c-49cd-8601-98235444e2ac'
AND translation_key IN (
    'admin.nav.payments',
    'admin.payments.title',
    'admin.payments.description',
    'admin.payments.reports',
    'admin.payments.paymentPlans'
)
ORDER BY translation_key, language_code;

-- 3. Check if there are any duplicate or conflicting translations
SELECT
    translation_key,
    COUNT(*) as count
FROM translations
WHERE tenant_id = '70d86807-7e7c-49cd-8601-98235444e2ac'
AND language_code = 'he'
AND (translation_key LIKE 'admin.payments%' OR translation_key = 'admin.nav.payments')
GROUP BY translation_key
HAVING COUNT(*) > 1;

-- 4. Check tenant_id format consistency
SELECT DISTINCT tenant_id
FROM translations
WHERE translation_key LIKE 'admin.payments%'
LIMIT 10;

-- 5. Verify the unique constraint
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'translations'::regclass
AND contype = 'u';
