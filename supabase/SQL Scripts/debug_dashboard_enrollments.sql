-- =====================================================
-- Debug Dashboard Enrollments Issue
-- Run this to diagnose why only 1 out of 2 programs shows
-- =====================================================

-- Step 1: Check all active enrollments with product details
SELECT
  '=== ALL ACTIVE ENROLLMENTS ===' as section,
  e.id as enrollment_id,
  e.user_id,
  u.email as user_email,
  e.tenant_id,
  e.status,
  e.product_id,
  e.enrolled_at
FROM enrollments e
LEFT JOIN users u ON u.id = e.user_id
WHERE e.status = 'active'
ORDER BY e.enrolled_at DESC;

-- Step 2: Check product details for those enrollments
SELECT
  '=== PRODUCTS TABLE ===' as section,
  p.id as product_id,
  p.tenant_id,
  p.type,
  p.title,
  p.program_id,
  p.course_id,
  p.is_active,
  p.created_at
FROM products p
WHERE p.is_active = true
ORDER BY p.created_at DESC;

-- Step 3: Check programs referenced by products
SELECT
  '=== PROGRAMS TABLE ===' as section,
  prog.id as program_id,
  prog.tenant_id,
  prog.name,
  prog.is_active,
  prog.created_at
FROM programs prog
WHERE prog.is_active = true
ORDER BY prog.created_at DESC;

-- Step 4: Check what the dashboard function returns for each user
-- (You'll need to replace USER_ID with actual user IDs from step 1)
-- SELECT get_user_dashboard_v3('USER_ID_HERE'::uuid) -> 'enrollments' as dashboard_result;

-- Step 5: Join enrollments with products and programs to see the full picture
SELECT
  '=== FULL JOIN ANALYSIS ===' as section,
  e.id as enrollment_id,
  e.user_id,
  u.email as user_email,
  e.status as enrollment_status,
  e.enrolled_at,
  e.product_id,
  prod.id as product_exists,
  prod.title as product_title,
  prod.program_id as prod_program_id,
  prod.course_id as prod_course_id,
  prog_via_product.name as program_name,
  course_via_product.title as course_name,
  prog_via_product.is_active as program_is_active,
  course_via_product.is_active as course_is_active
FROM enrollments e
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs prog_via_product ON prog_via_product.id = prod.program_id
LEFT JOIN courses course_via_product ON course_via_product.id = prod.course_id
WHERE e.status = 'active'
ORDER BY e.enrolled_at DESC;

-- Step 6: Check if there are any tenant mismatches
SELECT
  '=== TENANT MISMATCH CHECK ===' as section,
  e.id as enrollment_id,
  e.tenant_id as enrollment_tenant,
  u.tenant_id as user_tenant,
  prod.tenant_id as product_tenant,
  prog.tenant_id as program_tenant,
  CASE
    WHEN e.tenant_id = u.tenant_id AND
         (prod.tenant_id IS NULL OR e.tenant_id = prod.tenant_id) AND
         (prog.tenant_id IS NULL OR e.tenant_id = prog.tenant_id)
    THEN 'OK'
    ELSE 'MISMATCH'
  END as status
FROM enrollments e
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN products prod ON prod.id = e.product_id
LEFT JOIN programs prog ON prog.id = prod.program_id
WHERE e.status = 'active';
