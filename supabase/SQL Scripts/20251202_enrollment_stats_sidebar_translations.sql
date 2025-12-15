-- ============================================================================
-- Enrollment Statistics Sidebar Translations
-- ============================================================================
-- Description: Add translations for enrollment stats in course builder sidebar
-- Author: Claude Code Assistant
-- Date: 2025-12-02

DO $$
BEGIN
  -- Add enrollment statistics sidebar translations
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  VALUES
    -- Section title
    ('lms.builder.enrollment_stats', 'en', 'Enrollment Statistics', 'admin', NULL::uuid),
    ('lms.builder.enrollment_stats', 'he', 'סטטיסטיקת הרשמות', 'admin', NULL::uuid),

    -- Total Enrollments
    ('lms.builder.total_enrollments', 'en', 'Total Enrollments', 'admin', NULL::uuid),
    ('lms.builder.total_enrollments', 'he', 'סה"כ הרשמות', 'admin', NULL::uuid),

    -- Lifetime Sales
    ('lms.builder.lifetime_sales', 'en', 'Lifetime Sales', 'admin', NULL::uuid),
    ('lms.builder.lifetime_sales', 'he', 'מכירות כוללות', 'admin', NULL::uuid),

    -- Completed
    ('lms.builder.completed', 'en', 'Completed', 'admin', NULL::uuid),
    ('lms.builder.completed', 'he', 'הושלם', 'admin', NULL::uuid),

    -- In Progress
    ('lms.builder.in_progress', 'en', 'In Progress', 'admin', NULL::uuid),
    ('lms.builder.in_progress', 'he', 'בתהליך', 'admin', NULL::uuid),

    -- Not Started
    ('lms.builder.not_started', 'en', 'Not Started', 'admin', NULL::uuid),
    ('lms.builder.not_started', 'he', 'טרם התחיל', 'admin', NULL::uuid),

    -- Students label
    ('lms.builder.students', 'en', 'students', 'admin', NULL::uuid),
    ('lms.builder.students', 'he', 'תלמידים', 'admin', NULL::uuid)

  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Enrollment statistics sidebar translations added successfully';
END$$;
