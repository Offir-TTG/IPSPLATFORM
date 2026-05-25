-- Add the "Cron monitor" entry under the Configuration section in the
-- admin sidebar. Idempotent: if the row already exists (matched by
-- tenant_id + href), updates the metadata instead of duplicating.
--
-- Sidebar nav is DB-driven (navigation_items table, see
-- src/app/api/admin/navigation/route.ts) — editing the hardcoded
-- fallback in AdminLayout.tsx has no effect when DB rows exist, which
-- is why a previous hardcoded edit didn't appear.

DO $$
DECLARE
  tenant_uuid UUID;
  config_section_id UUID;
  next_order INTEGER;
BEGIN
  -- All known tenants get the entry. For a multi-tenant install you may
  -- want to scope this to a specific slug; here we loop so every tenant
  -- that has a Configuration section picks it up.
  FOR tenant_uuid IN SELECT id FROM tenants LOOP
    -- Resolve the parent Configuration section for this tenant. If the
    -- section doesn't exist for a given tenant, skip (don't crash).
    SELECT id INTO config_section_id
      FROM navigation_items
      WHERE tenant_id = tenant_uuid
        AND parent_id IS NULL
        AND translation_key = 'admin.nav.configuration'
      LIMIT 1;

    IF config_section_id IS NULL THEN
      RAISE NOTICE 'Tenant %: no Configuration section found, skipping', tenant_uuid;
      CONTINUE;
    END IF;

    -- Next sibling order = max + 1 so the new row lands at the end of
    -- the section instead of overwriting an existing item's slot.
    SELECT COALESCE(MAX("order"), 0) + 1 INTO next_order
      FROM navigation_items
      WHERE tenant_id = tenant_uuid
        AND parent_id = config_section_id;

    -- Idempotent insert: skip if a row with the same href already
    -- exists for this tenant (we'd rather leave whatever the admin
    -- last saved than overwrite their custom ordering/visibility).
    IF EXISTS (
      SELECT 1 FROM navigation_items
       WHERE tenant_id = tenant_uuid
         AND href = '/admin/crons'
    ) THEN
      UPDATE navigation_items
         SET is_active = true,
             parent_id = config_section_id,
             translation_key = 'admin.nav.crons',
             icon = 'crons'
       WHERE tenant_id = tenant_uuid
         AND href = '/admin/crons';
      RAISE NOTICE 'Tenant %: Cron monitor nav item already existed, refreshed metadata', tenant_uuid;
    ELSE
      INSERT INTO navigation_items (
        tenant_id, parent_id, translation_key, icon, href, is_active, "order"
      ) VALUES (
        tenant_uuid, config_section_id, 'admin.nav.crons', 'crons', '/admin/crons', true, next_order
      );
      RAISE NOTICE 'Tenant %: Cron monitor nav item inserted', tenant_uuid;
    END IF;
  END LOOP;
END$$;
