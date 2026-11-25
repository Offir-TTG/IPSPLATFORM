-- Admin menu: Products moves under Learning, right after Programs (it was
-- only a card on the Payments page). The items after it move down one.
-- Already applied; safe to rerun.
UPDATE navigation_items i
SET "order" = i."order" + 1, updated_at = NOW()
FROM navigation_items s
WHERE s.translation_key = 'admin.nav.learning' AND s.parent_id IS NULL
  AND i.parent_id = s.id
  AND i."order" >= 3
  AND NOT EXISTS (SELECT 1 FROM navigation_items x WHERE x.parent_id = s.id AND x.translation_key = 'admin.nav.products');

INSERT INTO navigation_items (tenant_id, parent_id, translation_key, icon, href, "order", roles, is_active, is_external, created_at, updated_at)
SELECT s.tenant_id, s.id, 'admin.nav.products', 'products', '/admin/payments/products', 3, ARRAY['admin','super_admin'], true, false, NOW(), NOW()
FROM navigation_items s
WHERE s.translation_key = 'admin.nav.learning' AND s.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM navigation_items x WHERE x.parent_id = s.id AND x.translation_key = 'admin.nav.products');
