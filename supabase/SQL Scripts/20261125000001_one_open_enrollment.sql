-- =====================================================================
-- One open enrollment per client, product (and child)
-- =====================================================================
-- What it does, in plain words:
--   A client may have only ONE enrollment that is still open ("draft" =
--   not sent yet, or "pending" = waiting for the client) in the same
--   product. For coaching, one per child. The app already checks this
--   everywhere ("start or continue", src/lib/payments/openEnrollment.ts);
--   this is the safety net in the database, so two clicks at the same
--   moment can't create a second one.
--
-- What it does NOT change:
--   - Active, suspended, completed and cancelled enrollments are not
--     limited: cancelled ones stay as history and a former client can
--     enroll again.
--   - Guest enrollments (no client yet, user_id empty) are not limited.
--   - No data is changed or deleted.
--
-- Before running: run STEP 1 alone. If it returns rows, those clients
-- already have two open enrollments in one product; cancel or delete the
-- extra ones first, or STEP 2 will fail ("could not create unique index").
-- Safe to run more than once.
-- =====================================================================

-- STEP 1 (check first): clients with more than one open enrollment in one product (+ child)
SELECT
  e.tenant_id,
  e.user_id,
  u.email,
  e.product_id,
  p.title AS product,
  e.child_id,
  COUNT(*) AS open_enrollments,
  ARRAY_AGG(e.id || ' (' || e.status || ', ' || to_char(e.created_at, 'YYYY-MM-DD') || ')' ORDER BY e.created_at) AS enrollments
FROM public.enrollments e
LEFT JOIN public.users u ON u.id = e.user_id
LEFT JOIN public.products p ON p.id = e.product_id
WHERE e.user_id IS NOT NULL
  AND e.status IN ('draft', 'pending')
GROUP BY e.tenant_id, e.user_id, u.email, e.product_id, p.title, e.child_id
HAVING COUNT(*) > 1
ORDER BY u.email, p.title;

-- STEP 2: the lock
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_one_open_per_client_product
  ON public.enrollments (
    tenant_id,
    user_id,
    product_id,
    COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE user_id IS NOT NULL
    AND status IN ('draft', 'pending');

COMMENT ON INDEX public.enrollments_one_open_per_client_product IS
  'At most one open (draft/pending) enrollment per client, product and child. See src/lib/payments/openEnrollment.ts.';
