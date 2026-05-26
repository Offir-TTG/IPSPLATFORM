-- Backfill student_grades.letter_grade.
--
-- Two-pass strategy so this script actually populates rows for EVERY
-- graded row, regardless of whether the parent course has a
-- grading_scale_id assigned:
--
--   Pass 1 — proper scale-driven backfill. For grades whose parent
--            course has a grading_scale_id, look the percentage up in
--            grade_ranges via get_letter_grade() and store that label.
--
--   Pass 2 — sensible fallback. For grades whose parent course has NO
--            grading_scale_id (so Pass 1 wrote nothing), fill from a
--            standard A/B/C/D/F mapping at 90/80/70/60. This matches
--            the original behavior so the admin/student tabs stop
--            showing empty Letter column for tenants that never set
--            up scales.
--
-- Re-running is safe: each UPDATE filters on IS DISTINCT FROM, so
-- already-correct rows aren't rewritten.

-- =====================================================
-- Pass 1: scale-driven (preferred)
-- =====================================================
WITH computed AS (
  SELECT
    sg.id                                            AS grade_id,
    get_letter_grade(sg.percentage, c.grading_scale_id) AS new_letter
  FROM student_grades sg
  JOIN grade_items gi ON gi.id = sg.grade_item_id
  JOIN courses     c  ON c.id  = gi.course_id
  WHERE sg.percentage IS NOT NULL
    AND sg.is_excused = false
    AND c.grading_scale_id IS NOT NULL
)
UPDATE student_grades sg
   SET letter_grade = computed.new_letter,
       updated_at   = NOW()
  FROM computed
 WHERE sg.id = computed.grade_id
   AND (sg.letter_grade IS DISTINCT FROM computed.new_letter)
   AND computed.new_letter <> 'N/A';

-- =====================================================
-- Pass 2: hardcoded A/B/C/D/F fallback for courses with no scale
-- =====================================================
WITH computed AS (
  SELECT
    sg.id AS grade_id,
    CASE
      WHEN sg.percentage >= 90 THEN 'A'
      WHEN sg.percentage >= 80 THEN 'B'
      WHEN sg.percentage >= 70 THEN 'C'
      WHEN sg.percentage >= 60 THEN 'D'
      ELSE 'F'
    END AS new_letter
  FROM student_grades sg
  JOIN grade_items gi ON gi.id = sg.grade_item_id
  JOIN courses     c  ON c.id  = gi.course_id
  WHERE sg.percentage IS NOT NULL
    AND sg.is_excused = false
    AND c.grading_scale_id IS NULL
)
UPDATE student_grades sg
   SET letter_grade = computed.new_letter,
       updated_at   = NOW()
  FROM computed
 WHERE sg.id = computed.grade_id
   AND (sg.letter_grade IS DISTINCT FROM computed.new_letter);
