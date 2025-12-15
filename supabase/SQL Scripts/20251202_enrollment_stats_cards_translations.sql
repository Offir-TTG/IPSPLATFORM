-- ============================================================================
-- Enrollment Stats Cards Translations
-- ============================================================================
-- Description: Add translations for enrollment status stat cards
-- Author: Claude Code Assistant
-- Date: 2025-12-02

DO $$
BEGIN
  -- Add enrollment stats cards translations
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  VALUES
    -- Total stat card
    ('admin.enrollments.stats.total', 'en', 'Total', 'admin', NULL::uuid),
    ('admin.enrollments.stats.total', 'he', 'סה"כ', 'admin', NULL::uuid),
    ('admin.enrollments.stats.totalDesc', 'en', 'All enrollments', 'admin', NULL::uuid),
    ('admin.enrollments.stats.totalDesc', 'he', 'כל ההרשמות', 'admin', NULL::uuid),

    -- Draft stat card
    ('admin.enrollments.stats.draft', 'en', 'Draft', 'admin', NULL::uuid),
    ('admin.enrollments.stats.draft', 'he', 'טיוטה', 'admin', NULL::uuid),
    ('admin.enrollments.stats.draftDesc', 'en', 'Not sent yet', 'admin', NULL::uuid),
    ('admin.enrollments.stats.draftDesc', 'he', 'טרם נשלח', 'admin', NULL::uuid),

    -- Pending stat card
    ('admin.enrollments.stats.pending', 'en', 'Pending', 'admin', NULL::uuid),
    ('admin.enrollments.stats.pending', 'he', 'ממתין', 'admin', NULL::uuid),
    ('admin.enrollments.stats.pendingDesc', 'en', 'Awaiting completion', 'admin', NULL::uuid),
    ('admin.enrollments.stats.pendingDesc', 'he', 'ממתין להשלמה', 'admin', NULL::uuid),

    -- Active stat card
    ('admin.enrollments.stats.active', 'en', 'Active', 'admin', NULL::uuid),
    ('admin.enrollments.stats.active', 'he', 'פעיל', 'admin', NULL::uuid),
    ('admin.enrollments.stats.activeDesc', 'en', 'Currently enrolled', 'admin', NULL::uuid),
    ('admin.enrollments.stats.activeDesc', 'he', 'רשום כעת', 'admin', NULL::uuid),

    -- Completed stat card
    ('admin.enrollments.stats.completed', 'en', 'Completed', 'admin', NULL::uuid),
    ('admin.enrollments.stats.completed', 'he', 'הושלם', 'admin', NULL::uuid),
    ('admin.enrollments.stats.completedDesc', 'en', 'Finished', 'admin', NULL::uuid),
    ('admin.enrollments.stats.completedDesc', 'he', 'סיים', 'admin', NULL::uuid),

    -- Cancelled stat card
    ('admin.enrollments.stats.cancelled', 'en', 'Cancelled', 'admin', NULL::uuid),
    ('admin.enrollments.stats.cancelled', 'he', 'מבוטל', 'admin', NULL::uuid),
    ('admin.enrollments.stats.cancelledDesc', 'en', 'Cancelled', 'admin', NULL::uuid),
    ('admin.enrollments.stats.cancelledDesc', 'he', 'מבוטל', 'admin', NULL::uuid)
  ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Enrollment stats cards translations added successfully';
END$$;
