-- Add a modern video icon to the "Recording Available" template heading.
--
-- The template `recording.available` stores a full HTML document in
-- body_html with a green header band and an `<h1>` for the title. The
-- heading currently has no icon — we insert an inline SVG video icon
-- (stroke="currentColor" so it adapts to the heading's white text color)
-- right before the headline text.
--
-- Idempotent: the WHERE clause matches only on the plain `<h1>title</h1>`,
-- so once the SVG has been inserted re-running the script is a no-op.

-- Hebrew variant
UPDATE email_template_versions v
SET body_html = REPLACE(
  body_html,
  '<h1>הקלטה זמינה</h1>',
  '<h1><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-inline-end:10px;display:inline-block;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>הקלטה זמינה</h1>'
)
FROM email_templates t
WHERE v.template_id = t.id
  AND t.template_key = 'recording.available'
  AND v.language_code = 'he'
  AND v.body_html LIKE '%<h1>הקלטה זמינה</h1>%';

-- English variant (guess: "Recording Available" — adjust if your row
-- uses a different heading; the WHERE clause will simply be a no-op).
UPDATE email_template_versions v
SET body_html = REPLACE(
  body_html,
  '<h1>Recording Available</h1>',
  '<h1><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-inline-end:10px;display:inline-block;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>Recording Available</h1>'
)
FROM email_templates t
WHERE v.template_id = t.id
  AND t.template_key = 'recording.available'
  AND v.language_code = 'en'
  AND v.body_html LIKE '%<h1>Recording Available</h1>%';
