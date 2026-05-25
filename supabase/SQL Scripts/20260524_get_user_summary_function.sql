-- get_user_summary(p_user_id uuid)
--
-- Single round-trip rollup used by the new per-user activity page
-- (/admin/users/[id]) to paint the header + summary chips. Combines
-- profile, enrollment counts, lifetime spend, outstanding balance,
-- attendance rate, and last activity timestamp into one JSONB row.
--
-- SECURITY DEFINER so the function can read across tables for the
-- admin caller without each call having to inherit broad RLS grants —
-- the API route still gates by verifyTenantAdmin before invoking.
-- Safe to re-run (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public.get_user_summary(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH
  user_row AS (
    -- Login timestamp lives on auth.users (Supabase Auth maintains it),
    -- not on public.users. Joining is safe because this function is
    -- SECURITY DEFINER and runs as the owning superuser.
    SELECT
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.phone,
      u.role,
      u.status,
      (u.status = 'active') AS is_active,
      u.created_at,
      au.last_sign_in_at AS last_login_at,
      u.avatar_url,
      u.tenant_id
    FROM users u
    LEFT JOIN auth.users au ON au.id = u.id
    WHERE u.id = p_user_id
  ),
  enrollment_counts AS (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'active')::int AS active
    FROM enrollments
    WHERE user_id = p_user_id
  ),
  payment_totals AS (
    -- payments table has no user_id/student_id column; user link goes
    -- through enrollment_id. Statuses are 'pending','paid','failed',
    -- 'refunded','partially_refunded' — count paid and net out refunds.
    SELECT COALESCE(
      SUM(p.amount - COALESCE(p.refunded_amount, 0)),
      0
    )::numeric AS lifetime_spend
    FROM payments p
    WHERE p.enrollment_id IN (SELECT id FROM enrollments WHERE user_id = p_user_id)
      AND p.status IN ('paid', 'partially_refunded')
  ),
  -- Outstanding has two sources:
  --   1. Live payment_schedules with status pending/processing/failed/paused/adjusted.
  --   2. Enrollments whose payment_status is pending/partial/overdue but
  --      have NO live schedule rows (legacy / non-installment products
  --      that still owe money) — derived from total_amount - paid_amount.
  -- Sum both so we don't miss balances that only live on the enrollment row.
  outstanding_totals AS (
    SELECT COALESCE(SUM(amount), 0)::numeric AS outstanding
    FROM (
      SELECT ps.amount
      FROM payment_schedules ps
      JOIN enrollments e ON e.id = ps.enrollment_id
      WHERE e.user_id = p_user_id
        AND ps.status IN ('pending', 'processing', 'failed', 'paused', 'adjusted')

      UNION ALL

      SELECT GREATEST(
        COALESCE(e.total_amount, 0) - COALESCE(e.paid_amount, 0),
        0
      ) AS amount
      FROM enrollments e
      WHERE e.user_id = p_user_id
        AND e.payment_status IN ('pending', 'partial', 'overdue')
        AND NOT EXISTS (
          SELECT 1 FROM payment_schedules ps
          WHERE ps.enrollment_id = e.id
            AND ps.status IN ('pending', 'processing', 'failed', 'paused', 'adjusted')
        )
    ) src
  ),
  -- Overdue alerts surface on the dashboard. Two complementary signals:
  --   1. Past-due payment_schedules (installment-level precision).
  --   2. Enrollment-level payment_status='overdue' WITHOUT a past-due
  --      schedule row (legacy / non-installment products marked overdue).
  -- Combining catches both modern installment flows and legacy enrollments.
  overdue_payments AS (
    SELECT
      COUNT(*)::int AS count,
      COALESCE(SUM(amount), 0)::numeric AS amount
    FROM (
      SELECT ps.amount
      FROM payment_schedules ps
      JOIN enrollments e ON e.id = ps.enrollment_id
      WHERE e.user_id = p_user_id
        AND ps.status IN ('pending', 'failed')
        AND ps.scheduled_date < now()

      UNION ALL

      SELECT GREATEST(
        COALESCE(e.total_amount, 0) - COALESCE(e.paid_amount, 0),
        0
      ) AS amount
      FROM enrollments e
      WHERE e.user_id = p_user_id
        AND e.payment_status = 'overdue'
        AND NOT EXISTS (
          SELECT 1 FROM payment_schedules ps
          WHERE ps.enrollment_id = e.id
            AND ps.status IN ('pending', 'failed')
            AND ps.scheduled_date < now()
        )
    ) src
  ),
  failed_payments AS (
    SELECT COUNT(*)::int AS count
    FROM payment_schedules ps
    JOIN enrollments e ON e.id = ps.enrollment_id
    WHERE e.user_id = p_user_id
      AND ps.status = 'failed'
  ),
  next_payment AS (
    SELECT
      ps.scheduled_date AS due_at,
      ps.amount AS amount
    FROM payment_schedules ps
    JOIN enrollments e ON e.id = ps.enrollment_id
    WHERE e.user_id = p_user_id
      AND ps.status = 'pending'
      AND ps.scheduled_date >= now()
    ORDER BY ps.scheduled_date ASC
    LIMIT 1
  ),
  enrollments_overdue AS (
    SELECT COUNT(*)::int AS count
    FROM enrollments
    WHERE user_id = p_user_id
      AND payment_status = 'overdue'
  ),
  recent_failures AS (
    SELECT COUNT(*)::int AS count
    FROM audit_events
    WHERE (user_id = p_user_id OR student_id = p_user_id)
      AND status = 'failure'
      AND event_timestamp >= now() - INTERVAL '30 days'
  ),
  attendance_stats AS (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'present')::int AS present
    FROM attendance
    WHERE student_id = p_user_id
  ),
  last_activity AS (
    SELECT MAX(event_timestamp) AS last_at
    FROM audit_events
    WHERE user_id = p_user_id OR student_id = p_user_id
  )
  SELECT jsonb_build_object(
    'user', to_jsonb(u),
    'enrollments_total',     ec.total,
    'enrollments_active',    ec.active,
    'enrollments_overdue',   eo.count,
    'lifetime_spend',        pt.lifetime_spend,
    'outstanding',           ot.outstanding,
    'overdue_count',         op.count,
    'overdue_amount',        op.amount,
    'failed_payment_count',  fp.count,
    'next_payment_due_at',   (SELECT due_at FROM next_payment),
    'next_payment_amount',   (SELECT amount FROM next_payment),
    'attendance_total',      ast.total,
    'attendance_present',    ast.present,
    'attendance_rate',
      CASE
        WHEN ast.total > 0
          THEN ROUND(100.0 * ast.present / ast.total, 1)
        ELSE NULL
      END,
    'recent_failure_count',  rf.count,
    'last_activity_at',      la.last_at
  )
  INTO result
  FROM user_row u,
       enrollment_counts ec,
       payment_totals pt,
       outstanding_totals ot,
       overdue_payments op,
       failed_payments fp,
       enrollments_overdue eo,
       recent_failures rf,
       attendance_stats ast,
       last_activity la;

  RETURN result;
END;
$$;

-- Allow the API route (called as an authenticated admin) to invoke the
-- function. The admin gate is enforced at the API layer (verifyTenantAdmin).
GRANT EXECUTE ON FUNCTION public.get_user_summary(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_user_summary(uuid) IS
  'Returns profile + cross-table rollup (enrollments, payments, attendance, last activity) for the per-user admin activity view. Used by GET /api/admin/users/[id]/summary.';
