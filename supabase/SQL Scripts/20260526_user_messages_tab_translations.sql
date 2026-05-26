-- Translations for the rewritten Messages tab on /admin/users/[id].
-- Card + Table + platform-standard TabPagination. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.messages.title',
      'admin.users.activity.messages.count',
      'admin.users.activity.messages.col.name',
      'admin.users.activity.messages.col.lastMessage',
      'admin.users.activity.messages.col.when',
      'admin.users.activity.messages.col.unread'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.messages.title',           'Conversations',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.messages.title',           'שיחות',                       'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.messages.count',           '{{count}} conversations',    'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.messages.count',           '{{count}} שיחות',              'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.messages.col.name',        'Conversation',               'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.messages.col.name',        'שיחה',                        'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.messages.col.lastMessage', 'Last message',               'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.messages.col.lastMessage', 'הודעה אחרונה',                 'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.messages.col.when',        'When',                       'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.messages.col.when',        'מתי',                         'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.messages.col.unread',      'Unread',                     'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.messages.col.unread',      'לא נקראו',                     'admin', NULL, 'admin');
END $$;
