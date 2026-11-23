-- Admin menu: coaching gets its own icon (it shared the Users icon).
-- Already applied; safe to rerun.
UPDATE navigation_items SET icon = 'coaching' WHERE translation_key = 'admin.nav.coaching';
