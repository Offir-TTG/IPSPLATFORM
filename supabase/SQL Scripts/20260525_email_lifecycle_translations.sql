-- Email schedules + queue lifecycle action translations.
-- Adds Pause / Resume / Stop / Delete-blocked copy for schedules and
-- per-row Cancel for the email queue. Global tenant (tenant_id IS NULL).
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'emails.schedules.pause',
      'emails.schedules.paused',
      'emails.schedules.pauseFailed',
      'emails.schedules.resume',
      'emails.schedules.resumed',
      'emails.schedules.resumeFailed',
      'emails.schedules.stop',
      'emails.schedules.stopped',
      'emails.schedules.stopFailed',
      'emails.schedules.stopConfirm',
      'emails.schedules.deleteBlockedSent',
      'emails.schedules.deleteBlockedQueue',
      'emails.schedules.deleteBlockedStatus',
      'emails.schedules.deleteConfirm',
      'emails.queue.selectedCount',
      'emails.queue.selectAllPending',
      'emails.queue.selectRow',
      'emails.queue.bulkCancel',
      'emails.queue.bulkCancelConfirm',
      'emails.queue.bulkCancelled',
      'emails.queue.bulkCancelFailed',
      'common.clear',
      'emails.queue.triggerType.automated',
      'emails.queue.triggerType.manual',
      'emails.queue.triggerType.scheduled',
      'emails.queue.triggerType.api',
      'emails.queue.errorMessage.cancelledByAdmin',
      'emails.queue.errorMessage.cancelledByAdminBulk',
      'emails.queue.errorMessage.schedulePaused',
      'emails.queue.errorMessage.scheduleStopped',
      'emails.queue.errorMessage.scheduleDeleted',
      'emails.queue.previewError',
      'emails.queue.variablesAvailable',
      'emails.schedules.status.paused',
      'emails.queue.preview',
      'emails.queue.cancelEmail',
      'emails.queue.cancelConfirm',
      'emails.queue.cancelled',
      'emails.queue.cancelFailed'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Schedule lifecycle actions
    ('en', 'emails.schedules.pause',              'Pause',                                                           'admin', NULL, 'admin'),
    ('he', 'emails.schedules.pause',              'השהה',                                                              'admin', NULL, 'admin'),
    ('en', 'emails.schedules.paused',             'Schedule paused',                                                 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.paused',             'התזמון הושהה',                                                       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.pauseFailed',        'Failed to pause schedule',                                        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.pauseFailed',        'השהיית התזמון נכשלה',                                                'admin', NULL, 'admin'),

    ('en', 'emails.schedules.resume',             'Resume',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.resume',             'המשך',                                                              'admin', NULL, 'admin'),
    ('en', 'emails.schedules.resumed',            'Schedule resumed',                                                'admin', NULL, 'admin'),
    ('he', 'emails.schedules.resumed',            'התזמון חודש',                                                        'admin', NULL, 'admin'),
    ('en', 'emails.schedules.resumeFailed',       'Failed to resume schedule',                                       'admin', NULL, 'admin'),
    ('he', 'emails.schedules.resumeFailed',       'חידוש התזמון נכשל',                                                  'admin', NULL, 'admin'),

    ('en', 'emails.schedules.stop',               'Stop',                                                            'admin', NULL, 'admin'),
    ('he', 'emails.schedules.stop',               'עצור',                                                              'admin', NULL, 'admin'),
    ('en', 'emails.schedules.stopped',            'Schedule stopped. {{count}} pending emails cancelled.',           'admin', NULL, 'admin'),
    ('he', 'emails.schedules.stopped',            'התזמון נעצר. {{count}} אימיילים ממתינים בוטלו.',                       'admin', NULL, 'admin'),
    ('en', 'emails.schedules.stopFailed',         'Failed to stop schedule',                                         'admin', NULL, 'admin'),
    ('he', 'emails.schedules.stopFailed',         'עצירת התזמון נכשלה',                                                 'admin', NULL, 'admin'),
    ('en', 'emails.schedules.stopConfirm',        'This will cancel all pending emails for this schedule and mark it as cancelled. Already-sent emails are unaffected. Stopped schedules cannot be resumed.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.stopConfirm',        'פעולה זו תבטל את כל האימיילים הממתינים בתזמון זה ותסמן אותו כמבוטל. אימיילים שכבר נשלחו לא יושפעו. תזמונים שנעצרו לא ניתנים לחידוש.', 'admin', NULL, 'admin'),

    ('en', 'emails.schedules.deleteBlockedSent',  'Cannot delete — emails already sent. Use Stop instead.',          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleteBlockedSent',  'לא ניתן למחוק — נשלחו כבר אימיילים. השתמש בעצור במקום.',                'admin', NULL, 'admin'),

    -- Updated delete confirmation copy (replaces the old one which
    -- didn't mention pending-queue cancellation or the sent-block).
    ('en', 'emails.schedules.deleteConfirm',      'This will permanently delete the stopped campaign. Already-sent / cancelled emails in the queue stay as history.', 'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleteConfirm',      'פעולה זו תמחק לצמיתות את הקמפיין שנעצר. אימיילים שכבר נשלחו או בוטלו בתור נשארים כהיסטוריה.', 'admin', NULL, 'admin'),

    -- New 'paused' status badge label.
    ('en', 'emails.schedules.status.paused',      'Paused',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.schedules.status.paused',      'מושהה',                                                             'admin', NULL, 'admin'),

    -- Queue per-row preview/cancel labels.
    ('en', 'emails.queue.preview',                'Preview',                                                         'admin', NULL, 'admin'),
    ('he', 'emails.queue.preview',                'תצוגה מקדימה',                                                       'admin', NULL, 'admin'),
    ('en', 'emails.queue.cancelEmail',            'Cancel send',                                                     'admin', NULL, 'admin'),
    ('he', 'emails.queue.cancelEmail',            'בטל שליחה',                                                         'admin', NULL, 'admin'),
    ('en', 'emails.queue.cancelConfirm',          'This email is still pending. Cancelling marks it as cancelled so it will not be sent. This cannot be undone.', 'admin', NULL, 'admin'),
    ('he', 'emails.queue.cancelConfirm',          'אימייל זה עדיין ממתין. ביטול יסמן אותו כמבוטל כך שלא יישלח. פעולה זו אינה הפיכה.', 'admin', NULL, 'admin'),
    ('en', 'emails.queue.cancelled',              'Email cancelled',                                                 'admin', NULL, 'admin'),
    ('he', 'emails.queue.cancelled',              'האימייל בוטל',                                                       'admin', NULL, 'admin'),
    ('en', 'emails.queue.cancelFailed',           'Failed to cancel email',                                          'admin', NULL, 'admin'),
    ('he', 'emails.queue.cancelFailed',           'ביטול האימייל נכשל',                                                 'admin', NULL, 'admin'),

    -- Schedule delete blocked by ANY queue activity (not just sent).
    ('en', 'emails.schedules.deleteBlockedQueue', 'Cannot delete — emails in queue. Use Stop instead.',               'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleteBlockedQueue', 'לא ניתן למחוק — קיימים אימיילים בתור. השתמש בעצור במקום.',              'admin', NULL, 'admin'),

    -- New simpler rule: delete only allowed once schedule is cancelled.
    ('en', 'emails.schedules.deleteBlockedStatus','Cannot delete — Stop the campaign first.',                        'admin', NULL, 'admin'),
    ('he', 'emails.schedules.deleteBlockedStatus','לא ניתן למחוק — יש לעצור את הקמפיין קודם.',                            'admin', NULL, 'admin'),

    -- Queue multi-select / bulk-cancel.
    ('en', 'emails.queue.selectedCount',          '{{count}} selected',                                              'admin', NULL, 'admin'),
    ('he', 'emails.queue.selectedCount',          '{{count}} נבחרו',                                                   'admin', NULL, 'admin'),
    ('en', 'emails.queue.selectAllPending',       'Select all pending',                                              'admin', NULL, 'admin'),
    ('he', 'emails.queue.selectAllPending',       'בחר את כל הממתינים',                                                 'admin', NULL, 'admin'),
    ('en', 'emails.queue.selectRow',              'Select',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.queue.selectRow',              'בחר',                                                                'admin', NULL, 'admin'),
    ('en', 'emails.queue.bulkCancel',             'Cancel selected',                                                 'admin', NULL, 'admin'),
    ('he', 'emails.queue.bulkCancel',             'בטל את הנבחרים',                                                     'admin', NULL, 'admin'),
    ('en', 'emails.queue.bulkCancelConfirm',      'Cancel {{count}} pending emails? They will not be sent. This cannot be undone.', 'admin', NULL, 'admin'),
    ('he', 'emails.queue.bulkCancelConfirm',      'לבטל {{count}} אימיילים ממתינים? הם לא יישלחו. פעולה זו אינה הפיכה.',     'admin', NULL, 'admin'),
    ('en', 'emails.queue.bulkCancelled',          '{{count}} emails cancelled',                                      'admin', NULL, 'admin'),
    ('he', 'emails.queue.bulkCancelled',          '{{count}} אימיילים בוטלו',                                            'admin', NULL, 'admin'),
    ('en', 'emails.queue.bulkCancelFailed',       'Failed to cancel selected emails',                                'admin', NULL, 'admin'),
    ('he', 'emails.queue.bulkCancelFailed',       'ביטול האימיילים שנבחרו נכשל',                                          'admin', NULL, 'admin'),

    -- common.clear used by the bulk-action bar.
    ('en', 'common.clear',                        'Clear',                                                           'admin', NULL, 'admin'),
    ('he', 'common.clear',                        'נקה',                                                                'admin', NULL, 'admin'),

    -- Queue trigger_type enum labels — values per the email_queue
    -- check constraint: automated / manual / scheduled / api.
    ('en', 'emails.queue.triggerType.automated',  'Automated',                                                       'admin', NULL, 'admin'),
    ('he', 'emails.queue.triggerType.automated',  'אוטומטי',                                                            'admin', NULL, 'admin'),
    ('en', 'emails.queue.triggerType.manual',     'Manual',                                                          'admin', NULL, 'admin'),
    ('he', 'emails.queue.triggerType.manual',     'ידני',                                                               'admin', NULL, 'admin'),
    ('en', 'emails.queue.triggerType.scheduled',  'Scheduled',                                                       'admin', NULL, 'admin'),
    ('he', 'emails.queue.triggerType.scheduled',  'מתוזמן',                                                             'admin', NULL, 'admin'),
    ('en', 'emails.queue.triggerType.api',        'API',                                                             'admin', NULL, 'admin'),
    ('he', 'emails.queue.triggerType.api',        'API',                                                              'admin', NULL, 'admin'),

    -- Internal error_message values we write ourselves (Cancel /
    -- Pause / Stop / Delete). External SMTP errors pass through
    -- untranslated since their content is unpredictable.
    ('en', 'emails.queue.errorMessage.cancelledByAdmin',     'Cancelled by admin',           'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.cancelledByAdmin',     'בוטל על ידי מנהל',                'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.cancelledByAdminBulk', 'Cancelled by admin (bulk)',    'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.cancelledByAdminBulk', 'בוטל על ידי מנהל (קבוצתי)',       'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.schedulePaused',       'Schedule paused',              'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.schedulePaused',       'התזמון הושהה',                    'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.scheduleStopped',      'Schedule stopped',             'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.scheduleStopped',      'התזמון נעצר',                     'admin', NULL, 'admin'),
    ('en', 'emails.queue.errorMessage.scheduleDeleted',      'Schedule deleted',             'admin', NULL, 'admin'),
    ('he', 'emails.queue.errorMessage.scheduleDeleted',      'התזמון נמחק',                     'admin', NULL, 'admin'),

    -- Preview modal diagnostics.
    ('en', 'emails.queue.previewError',           'Preview render failed',                                           'admin', NULL, 'admin'),
    ('he', 'emails.queue.previewError',           'יצירת התצוגה המקדימה נכשלה',                                          'admin', NULL, 'admin'),
    ('en', 'emails.queue.variablesAvailable',     'Variables used to render',                                        'admin', NULL, 'admin'),
    ('he', 'emails.queue.variablesAvailable',     'משתנים שבהם נעשה שימוש',                                              'admin', NULL, 'admin');

  RAISE NOTICE 'Email lifecycle action translations seeded.';
END $$;
