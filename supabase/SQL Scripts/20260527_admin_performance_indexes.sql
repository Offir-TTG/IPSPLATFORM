-- Performance indexes for the admin tables that grow unbounded:
-- student_grades, payments, email_queue, notifications, attendance,
-- conversation_participants. Each composite matches the actual
-- (filter cols) + (sort col DESC) pattern used by the admin pages
-- and per-user activity tabs so we avoid full scans + in-memory sorts
-- once these tables get into the millions.
--
-- IMPORTANT:
--   * CREATE INDEX CONCURRENTLY cannot run inside a transaction.
--     Each statement below must be sent as its own statement — the
--     Supabase SQL editor runs them one at a time, which is fine.
--     Do NOT wrap this file in BEGIN/COMMIT or DO $$ ... $$;.
--   * IF NOT EXISTS makes the script idempotent — re-running it is a
--     no-op for indexes that already exist.
--   * If a CONCURRENTLY build is interrupted, Postgres leaves an
--     INVALID index behind. Drop it and re-run the matching line:
--       DROP INDEX CONCURRENTLY IF EXISTS <name>;
--
-- These indexes are additive — they don't remove anything that's
-- already there.

-- ============================================================
-- student_grades — per-user grades tab
-- ============================================================
-- Pattern: WHERE student_id = $1 ORDER BY graded_at DESC NULLS LAST
-- Today's (student_id) index forces a sort of every grade a student
-- has after the fetch. This composite returns rows already ordered.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_grades_student_graded
  ON student_grades (student_id, graded_at DESC NULLS LAST);

-- ============================================================
-- payments — admin transactions list
-- ============================================================
-- Pattern: WHERE tenant_id = $1 [AND status = $2]
--          ORDER BY created_at DESC
-- Separate (tenant_id) and (created_at) indexes can't be combined
-- well; this composite does the filter + sort in one read.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_tenant_status_created
  ON payments (tenant_id, status, created_at DESC);

-- Also index the per-enrollment list used by the user activity
-- Payments tab. enrollment_id alone gets us to that user's payments,
-- and ordering by created_at descending lets the timeline render
-- without a sort.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_enrollment_created
  ON payments (enrollment_id, created_at DESC);

-- ============================================================
-- email_queue — admin queue list + per-user emails tab
-- ============================================================
-- Pattern: WHERE tenant_id = $1 [AND status IN (...)]
--          ORDER BY created_at DESC
-- Existing single-column indexes (tenant_id, status, created_at)
-- can't be merged efficiently for the queue list.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_tenant_status_created
  ON email_queue (tenant_id, status, created_at DESC);

-- Per-user emails tab matches by to_email (the user's address) and
-- orders by created_at DESC. to_email is a free-text column so an
-- index on it pays off only for exact-equality lookups, which is what
-- the API does.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_queue_to_email_created
  ON email_queue (to_email, created_at DESC);

-- ============================================================
-- notifications — per-user activity + admin list
-- ============================================================
-- Per-user pattern: WHERE user_id = $1 ORDER BY created_at DESC
-- Admin list pattern: WHERE tenant_id = $1 AND status = $2
--                     ORDER BY created_at DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_tenant_status_created
  ON notifications (tenant_id, status, created_at DESC);

-- ============================================================
-- attendance — admin attendance reports + per-user tab
-- ============================================================
-- Course-level pattern (admin reports):
--   WHERE course_id = $1 [AND attendance_date BETWEEN ...]
--   ORDER BY attendance_date DESC
-- Per-student pattern (per-user tab):
--   WHERE student_id = $1 [AND course_id = $2]
--   ORDER BY attendance_date DESC

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_course_date
  ON attendance (course_id, attendance_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_student_date
  ON attendance (student_id, attendance_date DESC);

-- ============================================================
-- conversation_participants — per-user Messages tab
-- ============================================================
-- Pattern: WHERE user_id = $1 AND left_at IS NULL
--          ORDER BY joined_at DESC
-- Partial index — only rows where left_at IS NULL count, which is
-- the steady-state majority for active users.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_participants_user_active
  ON conversation_participants (user_id, joined_at DESC)
  WHERE left_at IS NULL;
