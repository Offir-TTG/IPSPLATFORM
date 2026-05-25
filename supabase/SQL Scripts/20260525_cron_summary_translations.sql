-- Translations for the cron-runs summary renderer (SummaryRenderer.tsx).
-- Keys mirror the `summary` JSONB fields each cron returns:
--   sent / delivered / completed / failed / errors / processed /
--   enqueued / picked / found / advanced / would_send / would_retry /
--   would_suspend / message / success / reason / total / total_overdue
-- plus the generic "Error" label used in the expanded view.
-- Global tenant (tenant_id IS NULL). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.crons.summary.sent',
      'admin.crons.summary.delivered',
      'admin.crons.summary.completed',
      'admin.crons.summary.failed',
      'admin.crons.summary.errors',
      'admin.crons.summary.processed',
      'admin.crons.summary.enqueued',
      'admin.crons.summary.picked',
      'admin.crons.summary.found',
      'admin.crons.summary.advanced',
      'admin.crons.summary.would_send',
      'admin.crons.summary.would_retry',
      'admin.crons.summary.would_suspend',
      'admin.crons.summary.message',
      'admin.crons.summary.success',
      'admin.crons.summary.reason',
      'admin.crons.summary.total',
      'admin.crons.summary.total_overdue',
      'admin.crons.summary.error',
      -- known-message map translations
      'admin.crons.message.noOverduePayments',
      'admin.crons.message.noUpcomingLessons',
      'admin.crons.message.noPendingEmails',
      'admin.crons.message.noPaymentsToRetry',
      'admin.crons.message.emailQueueDone',
      'admin.crons.message.lessonReminderDone',
      'admin.crons.message.dryRunInvoicesSkipped',
      'admin.crons.message.dryRunWouldSuspend',
      'admin.crons.message.suspendedOverdue',
      'admin.crons.message.createdInvoices',
      'admin.crons.message.dryRunWouldScan',
      'admin.crons.message.dryRunWouldSend',
      'admin.crons.message.dryRunWouldRetry',
      'admin.crons.message.retriedPayments',
      'common.yes',
      'common.no'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.crons.summary.sent',           'Sent',          'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.sent',           'נשלחו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.delivered',      'Delivered',     'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.delivered',      'נמסרו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.completed',      'Completed',     'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.completed',      'הושלמו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.failed',         'Failed',        'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.failed',         'נכשלו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.errors',         'Errors',        'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.errors',         'שגיאות',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.processed',      'Processed',     'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.processed',      'עובדו',           'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.enqueued',       'Enqueued',      'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.enqueued',       'הוכנסו לתור',     'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.picked',         'Picked',        'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.picked',         'נאספו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.found',          'Found',         'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.found',          'נמצאו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.advanced',       'Advanced',      'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.advanced',       'הוקדמו',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.would_send',     'Would send',    'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.would_send',     'היו נשלחים',     'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.would_retry',    'Would retry',   'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.would_retry',    'היו מנסים שוב',   'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.would_suspend',  'Would suspend', 'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.would_suspend',  'היו מושעים',     'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.message',        'Message',       'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.message',        'הודעה',           'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.success',        'Success',       'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.success',        'הצלחה',           'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.reason',         'Reason',        'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.reason',         'סיבה',            'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.total',          'Total',         'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.total',          'סה״כ',            'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.total_overdue',  'Overdue',       'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.total_overdue',  'באיחור',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.summary.error',          'Error',         'admin', NULL, 'admin'),
    ('he', 'admin.crons.summary.error',          'שגיאה',           'admin', NULL, 'admin'),

    -- Static cron `message` strings (translateMessage map in
    -- SummaryRenderer.tsx). The English value MUST match what the
    -- cron emits exactly so the client-side lookup hits.
    ('en', 'admin.crons.message.noOverduePayments',     'No overdue payments',                     'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.noOverduePayments',     'אין תשלומים באיחור',                          'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.noUpcomingLessons',     'No upcoming lessons',                     'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.noUpcomingLessons',     'אין שיעורים קרובים',                          'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.noPendingEmails',       'No pending emails',                       'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.noPendingEmails',       'אין אימיילים ממתינים',                         'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.noPaymentsToRetry',     'No payments to retry',                    'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.noPaymentsToRetry',     'אין תשלומים לניסיון חוזר',                      'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.emailQueueDone',        'Email queue processing completed',        'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.emailQueueDone',        'עיבוד תור האימיילים הסתיים',                    'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.lessonReminderDone',    'Lesson reminder job completed',           'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.lessonReminderDone',    'משימת תזכורות השיעורים הסתיימה',                 'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.dryRunInvoicesSkipped', 'Dry-run enabled; skipped invoice creation','admin', NULL, 'admin'),
    ('he', 'admin.crons.message.dryRunInvoicesSkipped', 'הרצת ניסיון מופעלת; דילוג על יצירת חשבוניות',     'admin', NULL, 'admin'),

    -- Dynamic patterned messages. {{0}}, {{1}}, ... are replaced
    -- client-side with the regex capture groups.
    ('en', 'admin.crons.message.dryRunWouldSuspend',  'Dry-run enabled; would suspend {{0}} enrollments', 'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.dryRunWouldSuspend',  'הרצת ניסיון מופעלת; היו מושעים {{0}} רישומים',         'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.suspendedOverdue',    'Suspended {{0}} enrollments with overdue payments', 'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.suspendedOverdue',    'הושעו {{0}} רישומים עם תשלומים באיחור',              'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.createdInvoices',     'Created {{0}} invoices, {{1}} failed',             'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.createdInvoices',     'נוצרו {{0}} חשבוניות, {{1}} נכשלו',                   'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.dryRunWouldScan',     'Dry-run enabled; would scan {{0}} lessons for reminders', 'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.dryRunWouldScan',     'הרצת ניסיון מופעלת; היו נסרקים {{0}} שיעורים לתזכורות',     'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.dryRunWouldSend',     'Dry-run enabled; would send {{0}} emails',         'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.dryRunWouldSend',     'הרצת ניסיון מופעלת; היו נשלחים {{0}} אימיילים',          'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.dryRunWouldRetry',    'Dry-run enabled; would retry {{0}} schedules',     'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.dryRunWouldRetry',    'הרצת ניסיון מופעלת; היו מנסים שוב {{0}} תזמונים',         'admin', NULL, 'admin'),
    ('en', 'admin.crons.message.retriedPayments',     'Retried {{0}} payments, {{1}} failed',             'admin', NULL, 'admin'),
    ('he', 'admin.crons.message.retriedPayments',     'בוצע ניסיון חוזר ל-{{0}} תשלומים, {{1}} נכשלו',         'admin', NULL, 'admin'),

    -- Generic yes/no for booleans rendered in the summary grid.
    ('en', 'common.yes', 'Yes', 'admin', NULL, 'admin'),
    ('he', 'common.yes', 'כן',   'admin', NULL, 'admin'),
    ('en', 'common.no',  'No',  'admin', NULL, 'admin'),
    ('he', 'common.no',  'לא',   'admin', NULL, 'admin');
END $$;
