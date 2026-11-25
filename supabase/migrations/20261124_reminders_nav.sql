-- Automatic reminders in the admin menu, after Notifications in the section
-- that holds it. Only for schools whose menu is saved in the database; the
-- built-in menu has it already. Adds only what's missing. Safe to rerun.
INSERT INTO navigation_items (tenant_id, parent_id, translation_key, icon, href, "order", roles, is_active, is_external, created_at, updated_at)
SELECT n.tenant_id, n.parent_id, 'admin.nav.reminders', 'reminders', '/admin/reminders', n."order" + 1, ARRAY['admin','super_admin'], true, false, NOW(), NOW()
FROM navigation_items n
WHERE n.href = '/admin/notifications'
  AND NOT EXISTS (SELECT 1 FROM navigation_items x WHERE x.tenant_id IS NOT DISTINCT FROM n.tenant_id AND x.href = '/admin/reminders');
