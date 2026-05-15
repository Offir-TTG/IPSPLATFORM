-- Hebrew translations for the User Notification Preferences screen
-- (covers existing tabs + the new "הגדרות אזוריות" tab).
--
-- Apply by running this in the Supabase SQL editor. The translation
-- function `t(key, fallback)` will then return Hebrew when the user's
-- language is 'he', falling back to the English literal in code if a
-- key isn't found.
--
-- Real column names (verified against add_email_triggers_translations.sql):
--   tenant_id (NULL = platform-wide), translation_key, language_code,
--   translation_value, context.

INSERT INTO translations (tenant_id, translation_key, language_code, translation_value, context) VALUES
  -- Tab labels
  (NULL, 'user.notifications.preferences.tabs.channels',   'he', 'ערוצים',            'user'),
  (NULL, 'user.notifications.preferences.tabs.categories', 'he', 'קטגוריות',          'user'),
  (NULL, 'user.notifications.preferences.tabs.quietHours', 'he', 'שעות שקט',          'user'),

  -- Channels tab
  (NULL, 'user.notifications.preferences.masterChannels',     'he', 'ערוצי משלוח',                                                                  'user'),
  (NULL, 'user.notifications.preferences.masterChannelsDesc', 'he', 'בחר באילו ערוצים תרצה לקבל התראות',                                              'user'),
  (NULL, 'user.notifications.preferences.inApp',              'he', 'התראות בתוך המערכת',                                                            'user'),
  (NULL, 'user.notifications.preferences.inAppDesc',          'he', 'התראות שמופיעות בתוך הפלטפורמה',                                                'user'),
  (NULL, 'user.notifications.preferences.email',              'he', 'התראות אימייל',                                                                 'user'),
  (NULL, 'user.notifications.preferences.emailDesc',          'he', 'קבלת התראות באמצעות אימייל',                                                    'user'),
  (NULL, 'user.notifications.preferences.sms',                'he', 'התראות SMS / WhatsApp',                                                         'user'),
  (NULL, 'user.notifications.preferences.smsDesc',            'he', 'קבלת התראות דחופות באמצעות SMS',                                                'user'),
  (NULL, 'user.notifications.preferences.smsDescDisabled',    'he', 'משלוח SMS מושבת זמנית. נחזיר את האפשרות כאשר ספק יחובר.',                       'user'),
  (NULL, 'user.notifications.preferences.smsUnavailable',     'he', 'לא זמין כרגע',                                                                  'user'),
  (NULL, 'user.notifications.preferences.smsUnavailableShort','he', 'לא זמין',                                                                       'user'),
  (NULL, 'user.notifications.preferences.phoneNumber',        'he', 'מספר טלפון לקבלת SMS',                                                          'user'),
  (NULL, 'user.notifications.preferences.phoneInvalid',       'he', 'יש להזין מספר טלפון תקין עם קידומת מדינה',                                       'user'),
  (NULL, 'user.notifications.preferences.phoneInvalidSimple', 'he', 'יש להזין מספר טלפון תקין',                                                       'user'),
  (NULL, 'user.notifications.preferences.phoneRequired',      'he', 'מספר טלפון הוא שדה חובה לקבלת SMS',                                              'user'),
  (NULL, 'user.notifications.preferences.phoneTooLong',       'he', 'מספר הטלפון ארוך מדי',                                                          'user'),

  -- Categories tab
  (NULL, 'user.notifications.preferences.categorySettings',     'he', 'קטגוריות התראות',                                                              'user'),
  (NULL, 'user.notifications.preferences.categorySettingsDesc', 'he', 'בחר באילו ערוצים להשתמש עבור כל סוג התראה',                                     'user'),
  (NULL, 'user.notifications.preferences.category',             'he', 'קטגוריה',                                                                       'user'),
  (NULL, 'user.notifications.preferences.inAppShort',           'he', 'במערכת',                                                                       'user'),
  (NULL, 'user.notifications.preferences.emailShort',           'he', 'אימייל',                                                                       'user'),
  (NULL, 'user.notifications.preferences.smsShort',             'he', 'SMS',                                                                          'user'),

  -- Quiet Hours tab
  (NULL, 'user.notifications.preferences.quietHours',     'he', 'שעות שקט',                                                                           'user'),
  (NULL, 'user.notifications.preferences.quietHoursDesc', 'he', 'לא יישלחו התראות חיצוניות (אימייל, SMS) בשעות הללו',                                  'user'),
  (NULL, 'user.notifications.preferences.quietStart',     'he', 'שעת התחלה',                                                                          'user'),
  (NULL, 'user.notifications.preferences.quietEnd',       'he', 'שעת סיום',                                                                           'user'),
  (NULL, 'user.notifications.preferences.timezone',       'he', 'אזור זמן',                                                                           'user'),

  -- Save button & global states
  (NULL, 'user.notifications.preferences.save',         'he', 'שמירת העדפות',           'user'),
  (NULL, 'user.notifications.preferences.saving',       'he', 'שומר…',                  'user'),
  (NULL, 'user.notifications.preferences.saveSuccess',  'he', 'ההעדפות נשמרו בהצלחה',   'user'),
  (NULL, 'user.notifications.preferences.saveError',    'he', 'שמירת ההעדפות נכשלה',     'user'),
  (NULL, 'user.notifications.preferences.fetchError',   'he', 'טעינת ההעדפות נכשלה',     'user'),
  (NULL, 'user.notifications.preferences.loadError',    'he', 'טעינת ההעדפות נכשלה',     'user')
-- Match the partial unique index `translations_unique_global`
-- (defined on (translation_key, language_code, context) WHERE tenant_id IS NULL).
ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL DO UPDATE
  SET translation_value = EXCLUDED.translation_value;
