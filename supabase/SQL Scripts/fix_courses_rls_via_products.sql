-- Fix: "column reference course_id is ambiguous" + missing standalone-course path
--
-- Two bugs in `get_visible_courses(p_user_id)`:
--
-- 1) AMBIGUITY (42702): the function declares `course_id` as an OUT parameter
--    via `RETURNS TABLE (course_id uuid, …)`, so it's also a PL/pgSQL variable
--    in scope. The line
--      WHERE a.course_id NOT IN (SELECT course_id FROM hidden_courses)
--    has a bare `course_id` in the subquery that Postgres can't disambiguate.
--
-- 2) MISSING STANDALONE COURSE PATH: the function only sourced courses from
--    `user_programs` (program enrollments) and `user_course_overrides`. A
--    student enrolled in a `product.type='course'` product (standalone
--    course, no program) wouldn't appear anywhere → the policy hid the
--    course → /courses came back empty.
--
-- This rewrite consults `enrollments` directly so both access paths work:
--   - product.type='course'  → product.course_id is the standalone course
--   - product.type='program' → join via program_courses to the program's courses
-- and keeps `user_course_overrides` for admin grants/hides.
--
-- All `course_id` references in inner SELECTs are now qualified.

CREATE OR REPLACE FUNCTION public.get_visible_courses(p_user_id uuid)
 RETURNS TABLE(course_id uuid, source text, program_id uuid, program_name text, is_required boolean, course_order integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH
  -- Standalone course enrollments: product points directly at a course.
  standalone_course_enrollments AS (
    SELECT DISTINCT
      pr.course_id           AS course_id,
      'enrollment'::text     AS source,
      NULL::UUID             AS program_id,
      NULL::text             AS program_name,
      false                  AS is_required,
      0                      AS course_order
    FROM enrollments e
    JOIN products pr ON pr.id = e.product_id
    WHERE e.user_id = p_user_id
      AND e.status IN ('active', 'completed', 'pending')
      AND pr.type = 'course'
      AND pr.course_id IS NOT NULL
  ),

  -- Program enrollments via enrollments: every course in the enrolled program.
  program_enrollment_courses AS (
    SELECT DISTINCT
      pc.course_id           AS course_id,
      'program'::text        AS source,
      pr.program_id          AS program_id,
      prg.name               AS program_name,
      pc.is_required         AS is_required,
      pc."order"             AS course_order
    FROM enrollments e
    JOIN products pr ON pr.id = e.product_id
    JOIN programs prg ON prg.id = pr.program_id
    JOIN program_courses pc ON pc.program_id = pr.program_id
    WHERE e.user_id = p_user_id
      AND e.status IN ('active', 'completed', 'pending')
      AND pr.type = 'program'
      AND pr.program_id IS NOT NULL
  ),

  -- Admin grants: explicit course access overrides.
  granted_courses AS (
    SELECT
      uco.course_id         AS course_id,
      'granted'::text       AS source,
      NULL::UUID            AS program_id,
      NULL::text            AS program_name,
      false                 AS is_required,
      999999                AS course_order
    FROM user_course_overrides uco
    WHERE uco.user_id = p_user_id
      AND uco.access_type = 'grant'
      AND (uco.expires_at IS NULL OR uco.expires_at > NOW())
  ),

  -- Admin hides: subtract these from the final result.
  hidden_courses AS (
    SELECT uco.course_id AS course_id
    FROM user_course_overrides uco
    WHERE uco.user_id = p_user_id
      AND uco.access_type = 'hide'
      AND (uco.expires_at IS NULL OR uco.expires_at > NOW())
  ),

  all_accessible AS (
    SELECT * FROM standalone_course_enrollments
    UNION ALL
    SELECT * FROM program_enrollment_courses
    UNION ALL
    SELECT * FROM granted_courses
  )

  SELECT
    a.course_id,
    a.source,
    a.program_id,
    a.program_name,
    a.is_required,
    a.course_order
  FROM all_accessible a
  WHERE a.course_id NOT IN (SELECT hc.course_id FROM hidden_courses hc)
  ORDER BY
    CASE WHEN a.source = 'program' THEN 0 ELSE 1 END,
    a.program_name NULLS LAST,
    a.course_order;
END;
$function$;
