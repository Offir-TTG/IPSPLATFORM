-- Admin list page template (first page: Notifications): numbers strip, list states, drawer.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  -- Shared by every list page on the template
  ('en', 'admin.list.numbers', 'Numbers'),
  ('he', 'admin.list.numbers', 'מספרים'),
  ('en', 'admin.list.filteredNow', 'Filtered now'),
  ('he', 'admin.list.filteredNow', 'מסונן עכשיו'),
  ('en', 'admin.list.loadError', 'We couldn''t load the list'),
  ('he', 'admin.list.loadError', 'לא הצלחנו לטעון את הרשימה'),
  ('en', 'admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.'),
  ('he', 'admin.list.loadErrorText', 'ייתכן שהחיבור לאינטרנט נקטע. שום דבר לא נמחק.'),
  ('en', 'admin.list.retry', 'Try again'),
  ('he', 'admin.list.retry', 'לנסות שוב'),
  ('en', 'admin.list.noMatchText', 'Clear the search and filters to see the whole list.'),
  ('he', 'admin.list.noMatchText', 'אפשר לנקות את החיפוש והסינון ולראות את כל הרשימה.'),
  ('en', 'admin.nav.communications', 'Communications'),
  ('he', 'admin.nav.communications', 'תקשורת'),
  ('en', 'common.close', 'Close'),
  ('he', 'common.close', 'סגירה'),
  ('en', 'common.refresh', 'Refresh'),
  ('he', 'common.refresh', 'רענון'),
  -- Notifications
  ('en', 'admin.notifications.todayAt', 'Today, {time}'),
  ('he', 'admin.notifications.todayAt', 'היום, {time}'),
  ('en', 'admin.notifications.emptyText', 'A notification shows to students and parents in their portal, and can also go by email.'),
  ('he', 'admin.notifications.emptyText', 'התראה מופיעה לתלמידים ולהורים בפורטל, ואפשר לשלוח אותה גם במייל.'),
  ('en', 'admin.notifications.table.priority', 'Priority'),
  ('he', 'admin.notifications.table.priority', 'עדיפות'),
  ('en', 'admin.notifications.messageLabel', 'Message'),
  ('he', 'admin.notifications.messageLabel', 'ההודעה'),
  ('en', 'admin.notifications.drawer.read', 'Read'),
  ('he', 'admin.notifications.drawer.read', 'קראו'),
  ('en', 'admin.notifications.drawer.unread', 'Not read yet'),
  ('he', 'admin.notifications.drawer.unread', 'עוד לא קראו'),
  ('en', 'admin.notifications.drawer.sentTo', 'Sent to'),
  ('he', 'admin.notifications.drawer.sentTo', 'נשלחה אל'),
  ('en', 'admin.notifications.drawer.preview', 'How it looks in the portal'),
  ('he', 'admin.notifications.drawer.preview', 'איך זה נראה בפורטל'),
  ('en', 'admin.notifications.drawer.details', 'Details'),
  ('he', 'admin.notifications.drawer.details', 'פרטים'),
  -- One send to several students, courses or programs
  ('en', 'admin.notifications.nStudents', '{n} students'),
  ('he', 'admin.notifications.nStudents', '{n} תלמידים'),
  ('en', 'admin.notifications.nCourses', '{n} courses'),
  ('he', 'admin.notifications.nCourses', '{n} קורסים'),
  ('en', 'admin.notifications.nPrograms', '{n} programs'),
  ('he', 'admin.notifications.nPrograms', '{n} תוכניות'),
  ('en', 'admin.notifications.drawer.recipients', 'Who got it'),
  ('he', 'admin.notifications.drawer.recipients', 'מי קיבל'),
  ('en', 'admin.notifications.drawer.readIt', 'Read'),
  ('he', 'admin.notifications.drawer.readIt', 'קרא'),
  ('en', 'admin.notifications.drawer.notReadIt', 'Not read yet'),
  ('he', 'admin.notifications.drawer.notReadIt', 'עוד לא קרא'),
  ('en', 'admin.notifications.drawer.showAll', 'Show all {n}'),
  ('he', 'admin.notifications.drawer.showAll', 'הצגת כל ה-{n}'),
  ('en', 'admin.notifications.drawer.showFewer', 'Show fewer'),
  ('he', 'admin.notifications.drawer.showFewer', 'הצגת פחות'),
  -- Audit trail
  ('en', 'admin.audit.moreFilters', 'More filters'),
  ('he', 'admin.audit.moreFilters', 'סינונים נוספים'),
  ('en', 'admin.audit.drawer.who', 'Who'),
  ('he', 'admin.audit.drawer.who', 'מי'),
  ('en', 'admin.audit.drawer.role', 'Role'),
  ('he', 'admin.audit.drawer.role', 'תפקיד'),
  ('en', 'admin.audit.drawer.what', 'What it was about'),
  ('he', 'admin.audit.drawer.what', 'על מה'),
  ('en', 'admin.audit.drawer.name', 'Name'),
  ('he', 'admin.audit.drawer.name', 'שם'),
  ('en', 'admin.audit.drawer.changes', 'What changed'),
  ('he', 'admin.audit.drawer.changes', 'מה השתנה')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
