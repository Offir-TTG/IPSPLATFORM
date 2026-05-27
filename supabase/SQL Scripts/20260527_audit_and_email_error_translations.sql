-- Two unrelated translation gaps surfaced today, bundled into one
-- runnable script:
--
-- 1. Email queue error_message values WE write to email_queue (the
--    cancellation reasons) had no Hebrew. They appeared raw in the
--    /admin/emails/queue table AND in the per-user UserEmailsTab.
--
-- 2. Audit-trail field labels (`audit.field.<column>`) — the existing
--    seed (20260515_audit_log_translations.sql) only covers ~19
--    columns. Anything else that gets edited shows up as the raw
--    snake_case column name. Adding the long-tail of profile,
--    contact, social, course, enrollment, payment, and lesson fields
--    so most UPDATE rows render with friendly labels.
--
-- All entries are tenant_id=NULL so they apply across every tenant.
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND (
      translation_key LIKE 'emails.queue.errorMessage.%'
      OR translation_key IN (
        -- Contact / address
        'audit.field.contact_email', 'audit.field.contact_phone',
        'audit.field.website', 'audit.field.bio',
        'audit.field.address', 'audit.field.address_line1', 'audit.field.address_line2',
        'audit.field.city', 'audit.field.state', 'audit.field.country',
        'audit.field.postal_code', 'audit.field.zip_code',
        'audit.field.date_of_birth', 'audit.field.gender',
        -- Social
        'audit.field.instagram_url', 'audit.field.facebook_url',
        'audit.field.twitter_url', 'audit.field.linkedin_url',
        'audit.field.youtube_url', 'audit.field.tiktok_url',
        -- Course / lesson
        'audit.field.name', 'audit.field.slug', 'audit.field.content',
        'audit.field.video_url', 'audit.field.image_url', 'audit.field.thumbnail_url',
        'audit.field.level', 'audit.field.category', 'audit.field.category_id',
        'audit.field.course_id', 'audit.field.lesson_id', 'audit.field.module_id',
        'audit.field.tenant_id', 'audit.field.is_published', 'audit.field.is_visible',
        'audit.field.display_order', 'audit.field.max_points', 'audit.field.due_date',
        -- Enrollment
        'audit.field.enrollment_status', 'audit.field.enrolled_at',
        'audit.field.completed_at', 'audit.field.certificate_url',
        'audit.field.product_id', 'audit.field.paid_amount', 'audit.field.total_amount',
        'audit.field.payment_status',
        -- Payment
        'audit.field.payment_method', 'audit.field.transaction_id',
        'audit.field.paid_at', 'audit.field.refunded_amount', 'audit.field.refund_reason',
        'audit.field.payment_type', 'audit.field.payment_plan_id',
        'audit.field.scheduled_date', 'audit.field.original_due_date',
        -- User account
        'audit.field.username', 'audit.field.email_verified',
        'audit.field.last_login_at', 'audit.field.tags',
        -- Misc
        'audit.field.notes', 'audit.field.metadata', 'audit.field.settings',
        'audit.field.created_at', 'audit.field.updated_at', 'audit.field.deleted_at'
      )
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- ─── Email queue error messages ───
    ('en', 'emails.queue.errorMessage.cancelledByAdmin',     'Cancelled by admin',         'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.cancelledByAdmin',     'בוטל ע״י מנהל',                'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.cancelledByAdminBulk', 'Cancelled by admin (bulk)',  'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.cancelledByAdminBulk', 'בוטל ע״י מנהל (קבוצתי)',       'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.schedulePaused',       'Schedule paused',            'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.schedulePaused',       'תזמון מושהה',                  'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.scheduleStopped',      'Schedule stopped',           'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.scheduleStopped',      'תזמון הופסק',                  'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.scheduleDeleted',      'Schedule deleted',           'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.scheduleDeleted',      'תזמון נמחק',                   'admin', NULL, 'admin'),

    -- ─── Audit field labels: contact / address ───
    ('en', 'audit.field.contact_email', 'Contact Email',  'admin', NULL, 'admin'),
    ('he', 'audit.field.contact_email', 'אימייל ליצירת קשר', 'admin', NULL, 'admin'),
    ('en', 'audit.field.contact_phone', 'Contact Phone',  'admin', NULL, 'admin'),
    ('he', 'audit.field.contact_phone', 'טלפון ליצירת קשר', 'admin', NULL, 'admin'),
    ('en', 'audit.field.website',       'Website',        'admin', NULL, 'admin'),
    ('he', 'audit.field.website',       'אתר אינטרנט',      'admin', NULL, 'admin'),
    ('en', 'audit.field.bio',           'Bio',            'admin', NULL, 'admin'),
    ('he', 'audit.field.bio',           'אודות',           'admin', NULL, 'admin'),
    ('en', 'audit.field.address',       'Address',        'admin', NULL, 'admin'),
    ('he', 'audit.field.address',       'כתובת',           'admin', NULL, 'admin'),
    ('en', 'audit.field.address_line1', 'Address Line 1', 'admin', NULL, 'admin'),
    ('he', 'audit.field.address_line1', 'כתובת שורה 1',     'admin', NULL, 'admin'),
    ('en', 'audit.field.address_line2', 'Address Line 2', 'admin', NULL, 'admin'),
    ('he', 'audit.field.address_line2', 'כתובת שורה 2',     'admin', NULL, 'admin'),
    ('en', 'audit.field.city',          'City',           'admin', NULL, 'admin'),
    ('he', 'audit.field.city',          'עיר',             'admin', NULL, 'admin'),
    ('en', 'audit.field.state',         'State',          'admin', NULL, 'admin'),
    ('he', 'audit.field.state',         'מחוז',            'admin', NULL, 'admin'),
    ('en', 'audit.field.country',       'Country',        'admin', NULL, 'admin'),
    ('he', 'audit.field.country',       'מדינה',           'admin', NULL, 'admin'),
    ('en', 'audit.field.postal_code',   'Postal Code',    'admin', NULL, 'admin'),
    ('he', 'audit.field.postal_code',   'מיקוד',           'admin', NULL, 'admin'),
    ('en', 'audit.field.zip_code',      'ZIP Code',       'admin', NULL, 'admin'),
    ('he', 'audit.field.zip_code',      'מיקוד',           'admin', NULL, 'admin'),
    ('en', 'audit.field.date_of_birth', 'Date of Birth',  'admin', NULL, 'admin'),
    ('he', 'audit.field.date_of_birth', 'תאריך לידה',       'admin', NULL, 'admin'),
    ('en', 'audit.field.gender',        'Gender',         'admin', NULL, 'admin'),
    ('he', 'audit.field.gender',        'מגדר',            'admin', NULL, 'admin'),

    -- ─── Audit field labels: social ───
    ('en', 'audit.field.instagram_url', 'Instagram URL', 'admin', NULL, 'admin'),
    ('he', 'audit.field.instagram_url', 'קישור אינסטגרם',    'admin', NULL, 'admin'),
    ('en', 'audit.field.facebook_url',  'Facebook URL',  'admin', NULL, 'admin'),
    ('he', 'audit.field.facebook_url',  'קישור פייסבוק',     'admin', NULL, 'admin'),
    ('en', 'audit.field.twitter_url',   'Twitter URL',   'admin', NULL, 'admin'),
    ('he', 'audit.field.twitter_url',   'קישור טוויטר',      'admin', NULL, 'admin'),
    ('en', 'audit.field.linkedin_url',  'LinkedIn URL',  'admin', NULL, 'admin'),
    ('he', 'audit.field.linkedin_url',  'קישור לינקדאין',     'admin', NULL, 'admin'),
    ('en', 'audit.field.youtube_url',   'YouTube URL',   'admin', NULL, 'admin'),
    ('he', 'audit.field.youtube_url',   'קישור יוטיוב',       'admin', NULL, 'admin'),
    ('en', 'audit.field.tiktok_url',    'TikTok URL',    'admin', NULL, 'admin'),
    ('he', 'audit.field.tiktok_url',    'קישור טיקטוק',       'admin', NULL, 'admin'),

    -- ─── Audit field labels: course / lesson ───
    ('en', 'audit.field.name',          'Name',          'admin', NULL, 'admin'),
    ('he', 'audit.field.name',          'שם',             'admin', NULL, 'admin'),
    ('en', 'audit.field.slug',          'Slug',          'admin', NULL, 'admin'),
    ('he', 'audit.field.slug',          'מזהה כתובת',       'admin', NULL, 'admin'),
    ('en', 'audit.field.content',       'Content',       'admin', NULL, 'admin'),
    ('he', 'audit.field.content',       'תוכן',           'admin', NULL, 'admin'),
    ('en', 'audit.field.video_url',     'Video URL',     'admin', NULL, 'admin'),
    ('he', 'audit.field.video_url',     'קישור וידאו',      'admin', NULL, 'admin'),
    ('en', 'audit.field.image_url',     'Image URL',     'admin', NULL, 'admin'),
    ('he', 'audit.field.image_url',     'קישור תמונה',      'admin', NULL, 'admin'),
    ('en', 'audit.field.thumbnail_url', 'Thumbnail URL', 'admin', NULL, 'admin'),
    ('he', 'audit.field.thumbnail_url', 'קישור תמונה ממוזערת', 'admin', NULL, 'admin'),
    ('en', 'audit.field.level',         'Level',         'admin', NULL, 'admin'),
    ('he', 'audit.field.level',         'רמה',            'admin', NULL, 'admin'),
    ('en', 'audit.field.category',      'Category',      'admin', NULL, 'admin'),
    ('he', 'audit.field.category',      'קטגוריה',         'admin', NULL, 'admin'),
    ('en', 'audit.field.category_id',   'Category',      'admin', NULL, 'admin'),
    ('he', 'audit.field.category_id',   'קטגוריה',         'admin', NULL, 'admin'),
    ('en', 'audit.field.course_id',     'Course',        'admin', NULL, 'admin'),
    ('he', 'audit.field.course_id',     'קורס',           'admin', NULL, 'admin'),
    ('en', 'audit.field.lesson_id',     'Lesson',        'admin', NULL, 'admin'),
    ('he', 'audit.field.lesson_id',     'שיעור',          'admin', NULL, 'admin'),
    ('en', 'audit.field.module_id',     'Module',        'admin', NULL, 'admin'),
    ('he', 'audit.field.module_id',     'מודול',          'admin', NULL, 'admin'),
    ('en', 'audit.field.tenant_id',     'Tenant',        'admin', NULL, 'admin'),
    ('he', 'audit.field.tenant_id',     'דייר',           'admin', NULL, 'admin'),
    ('en', 'audit.field.is_published',  'Published',     'admin', NULL, 'admin'),
    ('he', 'audit.field.is_published',  'מפורסם',         'admin', NULL, 'admin'),
    ('en', 'audit.field.is_visible',    'Visible',       'admin', NULL, 'admin'),
    ('he', 'audit.field.is_visible',    'נראה',           'admin', NULL, 'admin'),
    ('en', 'audit.field.display_order', 'Display Order', 'admin', NULL, 'admin'),
    ('he', 'audit.field.display_order', 'סדר הצגה',        'admin', NULL, 'admin'),
    ('en', 'audit.field.max_points',    'Max Points',    'admin', NULL, 'admin'),
    ('he', 'audit.field.max_points',    'נקודות מקסימום',   'admin', NULL, 'admin'),
    ('en', 'audit.field.due_date',      'Due Date',      'admin', NULL, 'admin'),
    ('he', 'audit.field.due_date',      'תאריך יעד',        'admin', NULL, 'admin'),

    -- ─── Audit field labels: enrollment ───
    ('en', 'audit.field.enrollment_status', 'Enrollment Status', 'admin', NULL, 'admin'),
    ('he', 'audit.field.enrollment_status', 'סטטוס רישום',         'admin', NULL, 'admin'),
    ('en', 'audit.field.enrolled_at',       'Enrolled At',       'admin', NULL, 'admin'),
    ('he', 'audit.field.enrolled_at',       'תאריך רישום',         'admin', NULL, 'admin'),
    ('en', 'audit.field.completed_at',      'Completed At',      'admin', NULL, 'admin'),
    ('he', 'audit.field.completed_at',      'תאריך השלמה',         'admin', NULL, 'admin'),
    ('en', 'audit.field.certificate_url',   'Certificate URL',   'admin', NULL, 'admin'),
    ('he', 'audit.field.certificate_url',   'קישור תעודה',         'admin', NULL, 'admin'),
    ('en', 'audit.field.product_id',        'Product',           'admin', NULL, 'admin'),
    ('he', 'audit.field.product_id',        'מוצר',               'admin', NULL, 'admin'),
    ('en', 'audit.field.paid_amount',       'Paid Amount',       'admin', NULL, 'admin'),
    ('he', 'audit.field.paid_amount',       'סכום ששולם',          'admin', NULL, 'admin'),
    ('en', 'audit.field.total_amount',      'Total Amount',      'admin', NULL, 'admin'),
    ('he', 'audit.field.total_amount',      'סכום כולל',           'admin', NULL, 'admin'),
    ('en', 'audit.field.payment_status',    'Payment Status',    'admin', NULL, 'admin'),
    ('he', 'audit.field.payment_status',    'סטטוס תשלום',         'admin', NULL, 'admin'),

    -- ─── Audit field labels: payment ───
    ('en', 'audit.field.payment_method',    'Payment Method',    'admin', NULL, 'admin'),
    ('he', 'audit.field.payment_method',    'אמצעי תשלום',         'admin', NULL, 'admin'),
    ('en', 'audit.field.transaction_id',    'Transaction ID',    'admin', NULL, 'admin'),
    ('he', 'audit.field.transaction_id',    'מזהה עסקה',           'admin', NULL, 'admin'),
    ('en', 'audit.field.paid_at',           'Paid At',           'admin', NULL, 'admin'),
    ('he', 'audit.field.paid_at',           'תאריך תשלום',         'admin', NULL, 'admin'),
    ('en', 'audit.field.refunded_amount',   'Refunded Amount',   'admin', NULL, 'admin'),
    ('he', 'audit.field.refunded_amount',   'סכום שהוחזר',         'admin', NULL, 'admin'),
    ('en', 'audit.field.refund_reason',     'Refund Reason',     'admin', NULL, 'admin'),
    ('he', 'audit.field.refund_reason',     'סיבת ההחזר',          'admin', NULL, 'admin'),
    ('en', 'audit.field.payment_type',      'Payment Type',      'admin', NULL, 'admin'),
    ('he', 'audit.field.payment_type',      'סוג תשלום',           'admin', NULL, 'admin'),
    ('en', 'audit.field.payment_plan_id',   'Payment Plan',      'admin', NULL, 'admin'),
    ('he', 'audit.field.payment_plan_id',   'תוכנית תשלום',         'admin', NULL, 'admin'),
    ('en', 'audit.field.scheduled_date',    'Scheduled Date',    'admin', NULL, 'admin'),
    ('he', 'audit.field.scheduled_date',    'תאריך מתוזמן',         'admin', NULL, 'admin'),
    ('en', 'audit.field.original_due_date', 'Original Due Date', 'admin', NULL, 'admin'),
    ('he', 'audit.field.original_due_date', 'תאריך יעד מקורי',      'admin', NULL, 'admin'),

    -- ─── Audit field labels: user account ───
    ('en', 'audit.field.username',       'Username',         'admin', NULL, 'admin'),
    ('he', 'audit.field.username',       'שם משתמש',           'admin', NULL, 'admin'),
    ('en', 'audit.field.email_verified', 'Email Verified',   'admin', NULL, 'admin'),
    ('he', 'audit.field.email_verified', 'אימייל מאומת',        'admin', NULL, 'admin'),
    ('en', 'audit.field.last_login_at',  'Last Login',       'admin', NULL, 'admin'),
    ('he', 'audit.field.last_login_at',  'התחברות אחרונה',      'admin', NULL, 'admin'),
    ('en', 'audit.field.tags',           'Tags',             'admin', NULL, 'admin'),
    ('he', 'audit.field.tags',           'תגיות',              'admin', NULL, 'admin'),

    -- ─── Audit field labels: misc ───
    ('en', 'audit.field.notes',      'Notes',      'admin', NULL, 'admin'),
    ('he', 'audit.field.notes',      'הערות',       'admin', NULL, 'admin'),
    ('en', 'audit.field.metadata',   'Metadata',   'admin', NULL, 'admin'),
    ('he', 'audit.field.metadata',   'מטא-נתונים',   'admin', NULL, 'admin'),
    ('en', 'audit.field.settings',   'Settings',   'admin', NULL, 'admin'),
    ('he', 'audit.field.settings',   'הגדרות',      'admin', NULL, 'admin'),
    ('en', 'audit.field.created_at', 'Created At', 'admin', NULL, 'admin'),
    ('he', 'audit.field.created_at', 'נוצר ב',      'admin', NULL, 'admin'),
    ('en', 'audit.field.updated_at', 'Updated At', 'admin', NULL, 'admin'),
    ('he', 'audit.field.updated_at', 'עודכן ב',     'admin', NULL, 'admin'),
    ('en', 'audit.field.deleted_at', 'Deleted At', 'admin', NULL, 'admin'),
    ('he', 'audit.field.deleted_at', 'נמחק ב',      'admin', NULL, 'admin');
END $$;
