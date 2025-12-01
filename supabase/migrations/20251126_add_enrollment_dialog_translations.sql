-- Add complete enrollment dialog translations (English and Hebrew)
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing translations to avoid duplicates
  DELETE FROM translations WHERE translation_key IN (
    -- Create Enrollment Dialog
    'admin.enrollments.createEnrollment',
    'admin.enrollments.create.title',
    'admin.enrollments.create.description',
    'admin.enrollments.create.user',
    'admin.enrollments.create.selectUser',
    'admin.enrollments.create.noUsers',
    'admin.enrollments.create.contentType',
    'admin.enrollments.create.program',
    'admin.enrollments.create.course',
    'admin.enrollments.create.selectProgram',
    'admin.enrollments.create.selectCourse',
    'admin.enrollments.create.selectProgramPlaceholder',
    'admin.enrollments.create.selectCoursePlaceholder',
    'admin.enrollments.create.noPrograms',
    'admin.enrollments.create.noCourses',
    'admin.enrollments.create.requirePayment',
    'admin.enrollments.create.expiryDate',
    'admin.enrollments.create.notes',
    'admin.enrollments.create.notesPlaceholder',
    'admin.enrollments.create.alert',
    'admin.enrollments.create.submit',
    'admin.enrollments.create.success',
    'admin.enrollments.create.error',
    'admin.enrollments.create.validationError'
  );

  -- Insert translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, context, created_at, updated_at, tenant_id) VALUES
    -- Create Enrollment Button (English)
    ('en', 'admin.enrollments.createEnrollment', 'Create Enrollment', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Dialog Header (English)
    ('en', 'admin.enrollments.create.title', 'Create Manual Enrollment', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.description', 'Manually enroll a user in a program or course', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- User Selection (English)
    ('en', 'admin.enrollments.create.user', 'Select User', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.selectUser', 'Choose a user...', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.noUsers', 'No users found', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Content Type (English)
    ('en', 'admin.enrollments.create.contentType', 'Content Type', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.program', 'Program', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.course', 'Course', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Content Selection (English)
    ('en', 'admin.enrollments.create.selectProgram', 'Select Program', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.selectCourse', 'Select Course', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.selectProgramPlaceholder', 'Choose a program...', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.selectCoursePlaceholder', 'Choose a course...', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.noPrograms', 'No programs found', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.noCourses', 'No courses found', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Payment & Options (English)
    ('en', 'admin.enrollments.create.requirePayment', 'Require payment (enrollment pending until paid)', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.expiryDate', 'Expiry Date (Optional)', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.notes', 'Notes (Optional)', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.notesPlaceholder', 'e.g., Company-sponsored enrollment', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Alert & Actions (English)
    ('en', 'admin.enrollments.create.alert', 'This enrollment will be marked as admin-assigned and will bypass the normal purchase flow.', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.submit', 'Create Enrollment', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Messages (English)
    ('en', 'admin.enrollments.create.success', 'Enrollment created successfully', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.error', 'Failed to create enrollment', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.enrollments.create.validationError', 'Please select both user and content', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- HEBREW TRANSLATIONS
    -- =====================================================

    -- Create Enrollment Button (Hebrew)
    ('he', 'admin.enrollments.createEnrollment', 'צור רישום', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Dialog Header (Hebrew)
    ('he', 'admin.enrollments.create.title', 'צור רישום ידני', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.description', 'רשום משתמש באופן ידני לתוכנית או קורס', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- User Selection (Hebrew)
    ('he', 'admin.enrollments.create.user', 'בחר משתמש', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.selectUser', 'בחר משתמש...', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.noUsers', 'לא נמצאו משתמשים', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Content Type (Hebrew)
    ('he', 'admin.enrollments.create.contentType', 'סוג תוכן', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.program', 'תוכנית', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.course', 'קורס', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Content Selection (Hebrew)
    ('he', 'admin.enrollments.create.selectProgram', 'בחר תוכנית', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.selectCourse', 'בחר קורס', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.selectProgramPlaceholder', 'בחר תוכנית...', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.selectCoursePlaceholder', 'בחר קורס...', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.noPrograms', 'לא נמצאו תוכניות', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.noCourses', 'לא נמצאו קורסים', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Payment & Options (Hebrew)
    ('he', 'admin.enrollments.create.requirePayment', 'דרוש תשלום (הרישום ממתין עד לתשלום)', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.expiryDate', 'תאריך תפוגה (אופציונלי)', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.notes', 'הערות (אופציונלי)', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.notesPlaceholder', 'לדוגמה: רישום ממומן על ידי חברה', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Alert & Actions (Hebrew)
    ('he', 'admin.enrollments.create.alert', 'רישום זה יסומן כמוקצה על ידי מנהל ויעקוף את תהליך הרכישה הרגיל.', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.submit', 'צור רישום', 'admin', 'both', NOW(), NOW(), tenant_uuid),

    -- Messages (Hebrew)
    ('he', 'admin.enrollments.create.success', 'הרישום נוצר בהצלחה', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.error', 'נכשל ביצירת הרישום', 'admin', 'both', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.enrollments.create.validationError', 'אנא בחר גם משתמש וגם תוכן', 'admin', 'both', NOW(), NOW(), tenant_uuid)

  ON CONFLICT (translation_key, language_code, tenant_id)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    category = EXCLUDED.category,
    updated_at = NOW();

  RAISE NOTICE 'Enrollment dialog translations added successfully';
END$$;
