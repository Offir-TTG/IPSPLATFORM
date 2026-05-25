-- Hebrew (and English) labels + helper text for the variable names
-- email templates expose via `email_templates.variables` JSONB.
-- The ScheduleDialog (and any future "fill template variables" UI)
-- looks these up as:
--   t('emails.templateVar.{name}',       v.name)        -> label
--   t('emails.templateVar.{name}.help',  v.description) -> helper
-- so a translation here overrides whatever was seeded on the row.
--
-- Common variables across IPSPlatform email templates: user identity,
-- LMS (program/course/lesson), Zoom (recording/meeting), payments,
-- and account chrome (links, dates, amounts).
--
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'emails.templateVar.%';

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- User identity
    ('en', 'emails.templateVar.first_name',       'First name',         'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.first_name',       'שם פרטי',             'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.last_name',        'Last name',          'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.last_name',        'שם משפחה',             'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.user_name',        'User full name',     'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.user_name',        'שם מלא',               'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.student_name',     'Student name',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.student_name',     'שם התלמיד',            'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.parent_name',      'Parent name',        'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.parent_name',      'שם ההורה',             'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.email',            'Email address',      'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.email',            'כתובת דוא״ל',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.phone',            'Phone',              'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.phone',            'טלפון',                'admin', NULL, 'admin'),

    -- Organization / tenant
    ('en', 'emails.templateVar.tenant_name',      'Organization name',  'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.tenant_name',      'שם הארגון',             'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.organization_name','Organization name',  'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.organization_name','שם הארגון',             'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.support_email',    'Support email',      'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.support_email',    'דוא״ל תמיכה',           'admin', NULL, 'admin'),

    -- LMS
    ('en', 'emails.templateVar.program_name',     'Program name',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.program_name',     'שם התוכנית',           'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.course_name',      'Course name',        'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.course_name',      'שם הקורס',             'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.course_title',     'Course title',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.course_title',     'כותרת הקורס',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.lesson_title',     'Lesson title',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.lesson_title',     'כותרת השיעור',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.lesson_date',      'Lesson date',        'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.lesson_date',      'תאריך השיעור',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.lesson_time',      'Lesson time',        'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.lesson_time',      'שעת השיעור',           'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.instructor_name',  'Instructor name',    'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.instructor_name',  'שם המדריך',            'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.product_name',     'Product name',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.product_name',     'שם המוצר',             'admin', NULL, 'admin'),

    -- Zoom / recording
    ('en', 'emails.templateVar.meeting_link',     'Meeting link',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.meeting_link',     'קישור למפגש',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.meeting_topic',    'Meeting topic',      'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.meeting_topic',    'נושא המפגש',           'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.recording_url',    'Recording URL',      'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.recording_url',    'קישור להקלטה',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.recording_link',   'Recording link',     'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.recording_link',   'קישור להקלטה',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.recording_password','Recording password','admin', NULL, 'admin'),
    ('he', 'emails.templateVar.recording_password','סיסמת ההקלטה',         'admin', NULL, 'admin'),

    -- Payments
    ('en', 'emails.templateVar.payment_amount',   'Payment amount',     'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.payment_amount',   'סכום התשלום',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.amount',           'Amount',             'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.amount',           'סכום',                 'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.currency',         'Currency',           'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.currency',         'מטבע',                 'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.payment_date',     'Payment date',       'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.payment_date',     'תאריך התשלום',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.due_date',         'Due date',           'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.due_date',         'תאריך פירעון',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.invoice_number',   'Invoice number',     'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.invoice_number',   'מספר חשבונית',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.installment_number','Installment number','admin', NULL, 'admin'),
    ('he', 'emails.templateVar.installment_number','מספר תשלום',           'admin', NULL, 'admin'),

    -- Enrollment / lifecycle
    ('en', 'emails.templateVar.enrollment_date',  'Enrollment date',    'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.enrollment_date',  'תאריך ההרשמה',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.start_date',       'Start date',         'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.start_date',       'תאריך התחלה',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.end_date',         'End date',           'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.end_date',         'תאריך סיום',           'admin', NULL, 'admin'),

    -- Action links
    ('en', 'emails.templateVar.action_url',       'Action link',        'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.action_url',       'קישור לפעולה',          'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.invitation_link',  'Invitation link',    'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.invitation_link',  'קישור להזמנה',         'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.login_url',        'Login link',         'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.login_url',        'קישור להתחברות',        'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.reset_url',        'Password reset link','admin', NULL, 'admin'),
    ('he', 'emails.templateVar.reset_url',        'קישור לאיפוס סיסמה',     'admin', NULL, 'admin'),

    -- Generic
    ('en', 'emails.templateVar.date',             'Date',               'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.date',             'תאריך',                'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.time',             'Time',               'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.time',             'שעה',                  'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.message',          'Message',            'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.message',          'הודעה',                'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.reason',           'Reason',             'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.reason',           'סיבה',                 'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.note',             'Note',               'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.note',             'הערה',                 'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.title',            'Title',              'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.title',            'כותרת',                'admin', NULL, 'admin'),
    ('en', 'emails.templateVar.subject',          'Subject',            'admin', NULL, 'admin'),
    ('he', 'emails.templateVar.subject',          'נושא',                 'admin', NULL, 'admin');

  RAISE NOTICE 'Email template variable labels seeded (% rows).', (
    SELECT COUNT(*) FROM public.translations
    WHERE tenant_id IS NULL AND translation_key LIKE 'emails.templateVar.%'
  );
END $$;
