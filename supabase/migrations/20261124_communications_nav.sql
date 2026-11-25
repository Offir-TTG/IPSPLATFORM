-- One "Communications" item in the admin menu; the item itself opens the
-- Overview. Its parts: Messages, Automatic reminders, Templates, Send log, Needs
-- attention, Settings. The saved Notifications item becomes the parent; the
-- Automatic reminders item moves under it. Only for schools whose menu is
-- saved in the database (the built-in menu has it already). Safe to rerun.
UPDATE navigation_items
SET translation_key = 'admin.nav.communications_hub', icon = 'communications', href = '/admin/communications', updated_at = NOW()
WHERE href = '/admin/notifications' AND parent_id IS NOT NULL;

UPDATE navigation_items r
SET parent_id = h.id, "order" = 3, updated_at = NOW()
FROM navigation_items h
WHERE r.href = '/admin/reminders' AND h.href = '/admin/communications'
  AND h.tenant_id IS NOT DISTINCT FROM r.tenant_id AND r.parent_id IS DISTINCT FROM h.id;

INSERT INTO navigation_items (tenant_id, parent_id, translation_key, icon, href, "order", roles, is_active, is_external, created_at, updated_at)
SELECT h.tenant_id, h.id, v.key, v.icon, v.href, v.ord, ARRAY['admin','super_admin'], true, false, NOW(), NOW()
FROM navigation_items h
CROSS JOIN (VALUES
  ('admin.nav.comms_messages', 'comms_messages', '/admin/communications/messages', 2),
  ('admin.nav.comms_templates', 'comms_templates', '/admin/communications/templates', 4),
  ('admin.nav.comms_log', 'comms_log', '/admin/communications/log', 5),
  ('admin.nav.comms_attention', 'comms_attention', '/admin/communications/attention', 6),
  ('admin.nav.comms_settings', 'comms_settings', '/admin/communications/settings', 7)
) AS v(key, icon, href, ord)
WHERE h.href = '/admin/communications'
  AND NOT EXISTS (SELECT 1 FROM navigation_items x WHERE x.parent_id = h.id AND x.translation_key = v.key);

-- The item itself opens the Overview, so the menu has no separate Overview line.
DELETE FROM navigation_items WHERE translation_key = 'admin.nav.comms_overview';
