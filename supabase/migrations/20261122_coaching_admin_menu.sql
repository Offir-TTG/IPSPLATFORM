-- Adds "אימון ילדים" (child coaching) to the admin menu saved in the database,
-- as one link under "לימודים" (admin.nav.learning), after Enrollments. The
-- coaching pages have their own tabs (requests, children, coaches, intake).
-- The saved menu replaces the built-in one, so the link must be added here.
-- RUN AFTER DEPLOYING the code with the /admin/coaching pages, or the live
-- admin shows a link that 404s. Safe to run more than once.
DO $$
DECLARE t record; enrollments_order int;
BEGIN
  FOR t IN
    SELECT tenant_id, id AS learning_id FROM navigation_items
    WHERE translation_key = 'admin.nav.learning' AND parent_id IS NULL
  LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM navigation_items WHERE tenant_id = t.tenant_id AND translation_key = 'admin.nav.coaching'
    );
    -- Place it right after Enrollments: make room, then insert.
    SELECT "order" INTO enrollments_order FROM navigation_items
      WHERE tenant_id = t.tenant_id AND parent_id = t.learning_id AND translation_key = 'admin.nav.enrollments';
    IF enrollments_order IS NULL THEN
      SELECT COALESCE(MAX("order"), 0) INTO enrollments_order FROM navigation_items
        WHERE tenant_id = t.tenant_id AND parent_id = t.learning_id;
    END IF;
    UPDATE navigation_items SET "order" = "order" + 1
      WHERE tenant_id = t.tenant_id AND parent_id = t.learning_id AND "order" > enrollments_order;
    INSERT INTO navigation_items (parent_id, translation_key, icon, href, "order", roles, is_active, is_external, tenant_id)
    VALUES (t.learning_id, 'admin.nav.coaching', 'users', '/admin/coaching', enrollments_order + 1,
            ARRAY['admin','super_admin'], true, false, t.tenant_id);
  END LOOP;
END $$;
