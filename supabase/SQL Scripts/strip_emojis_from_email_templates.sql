-- Strip emoji decorations from email template bodies stored in the DB.
--
-- Background
-- ----------
-- The TypeScript seed in src/lib/email/systemTemplates.ts was edited to
-- remove emojis and use modern inline SVG icons, but already-seeded rows
-- in email_template_versions still carry the old emoji-laden HTML/text.
-- Editing the seed only affects new installations.
--
-- What this does
-- --------------
-- For every template version in every tenant:
--   1. Strip the emoji glyph + trailing space from body_html and body_text.
--   2. In body_html, where the emoji used to sit inside a <strong> tag
--      (the lesson-reminder data labels), inject the matching modern
--      stroke icon (16x16 SVG, muted gray) right before the label text.
--
-- Idempotent: re-running it is a no-op because the emojis are gone after
-- the first pass and the SVG markup is unique enough not to match again.

-- ---------------------------------------------------------------------------
-- body_html: replace emoji+space inside <strong> with the matching SVG icon
-- ---------------------------------------------------------------------------
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<strong>🕐 ',
  '<strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
)
WHERE body_html LIKE '%<strong>🕐 %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<strong>⏱️ ',
  '<strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><circle cx="12" cy="14" r="8"/><polyline points="12 10 12 14 15 14"/><line x1="10" y1="2" x2="14" y2="2"/></svg>'
)
WHERE body_html LIKE '%<strong>⏱️ %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<strong>👨‍🏫 ',
  '<strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
)
WHERE body_html LIKE '%<strong>👨‍🏫 %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<strong>📍 ',
  '<strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
)
WHERE body_html LIKE '%<strong>📍 %';

-- The Date label originally was `<strong>📅 Date:` — we removed the emoji
-- in the seed; for already-seeded rows, the emoji might still be present
-- as `<strong>📅 ` (English) or `<strong>📅 ` followed by Hebrew `תאריך:`.
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<strong>📅 ',
  '<strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
)
WHERE body_html LIKE '%<strong>📅 %';

-- Video icon for the recording-available labels (📹 inside <strong>).
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<strong>📹 ',
  '<strong><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
)
WHERE body_html LIKE '%<strong>📹 %';

-- ---------------------------------------------------------------------------
-- Urgent / High Priority banner: replace the large emoji <span> with a
-- modern uppercase colored pill (matches the seed template style).
-- ---------------------------------------------------------------------------
-- English LTR variants (margin-right)
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<span style="font-size: 20px; margin-right: 8px;">⚠️</span>',
  '<span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;background:#991b1b;color:#ffffff;padding:4px 10px;border-radius:9999px;margin-right:8px;">Urgent</span>'
)
WHERE body_html LIKE '%<span style="font-size: 20px; margin-right: 8px;">⚠️</span>%';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<span style="font-size: 20px; margin-right: 8px;">🔔</span>',
  '<span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;background:#92400e;color:#ffffff;padding:4px 10px;border-radius:9999px;margin-right:8px;">High</span>'
)
WHERE body_html LIKE '%<span style="font-size: 20px; margin-right: 8px;">🔔</span>%';

-- Hebrew RTL variants (margin-left)
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<span style="font-size: 20px; margin-left: 8px;">⚠️</span>',
  '<span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.8px;background:#991b1b;color:#ffffff;padding:4px 10px;border-radius:9999px;margin-left:8px;">דחוף</span>'
)
WHERE body_html LIKE '%<span style="font-size: 20px; margin-left: 8px;">⚠️</span>%';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '<span style="font-size: 20px; margin-left: 8px;">🔔</span>',
  '<span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.8px;background:#92400e;color:#ffffff;padding:4px 10px;border-radius:9999px;margin-left:8px;">חשוב</span>'
)
WHERE body_html LIKE '%<span style="font-size: 20px; margin-left: 8px;">🔔</span>%';

-- ---------------------------------------------------------------------------
-- body_html: any LOOSE emoji+space still around (outside <strong>, e.g.
-- "<h2>📹 הקלטה זמינה</h2>" or "<p>📅 …</p>") gets the matching SVG icon
-- so the visual cue is preserved instead of being stripped.
-- ---------------------------------------------------------------------------
-- Clock (alarm) → keep semantics as plain clock icon
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '⏰ ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
)
WHERE body_html LIKE '%⏰ %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '📅 ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
)
WHERE body_html LIKE '%📅 %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '🕐 ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
)
WHERE body_html LIKE '%🕐 %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '⏱️ ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><circle cx="12" cy="14" r="8"/><polyline points="12 10 12 14 15 14"/><line x1="10" y1="2" x2="14" y2="2"/></svg>'
)
WHERE body_html LIKE '%⏱️ %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '👨‍🏫 ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
)
WHERE body_html LIKE '%👨‍🏫 %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '📍 ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
)
WHERE body_html LIKE '%📍 %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '📹 ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>'
)
WHERE body_html LIKE '%📹 %';

-- ⚠️ / 🔔 outside of the banner spans → keep with same colored pill style
-- so callouts still stand out without being a giant emoji.
UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '⚠️ ',
  '<span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;background:#991b1b;color:#ffffff;padding:2px 8px;border-radius:9999px;margin-inline-end:6px;">!</span>'
)
WHERE body_html LIKE '%⚠️ %';

UPDATE email_template_versions
SET body_html = REPLACE(
  body_html,
  '🔔 ',
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;margin-inline-end:6px;display:inline-block;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
)
WHERE body_html LIKE '%🔔 %';

-- Last sweep: any 🎉 or stray emoji glyphs with no trailing space → remove
-- (these are pure decoration, not data labels).
UPDATE email_template_versions
SET body_html = REPLACE(body_html, '🎉', '')
WHERE body_html LIKE '%🎉%';

-- ---------------------------------------------------------------------------
-- body_text: just remove the emojis — plain-text bodies don't render icons.
-- ---------------------------------------------------------------------------
UPDATE email_template_versions
SET body_text = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  body_text,
  '⏰ ', ''),
  '📅 ', ''),
  '🕐 ', ''),
  '⏱️ ', ''),
  '👨‍🏫 ', ''),
  '📍 ', ''),
  '📹 ', ''),
  '⚠️ ', ''),
  '🔔 ', ''),
  '🎉', '')
WHERE body_text ~ '[⏰📅🕐👨📍📹⚠🔔🎉⏱]';

-- ---------------------------------------------------------------------------
-- Subject lines: strip emojis there too (rare but possible).
-- ---------------------------------------------------------------------------
UPDATE email_template_versions
SET subject = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
  subject,
  '⏰ ', ''),
  '📅 ', ''),
  '🕐 ', ''),
  '⏱️ ', ''),
  '👨‍🏫 ', ''),
  '📍 ', ''),
  '📹 ', ''),
  '⚠️ ', ''),
  '🔔 ', ''),
  '🎉', '')
WHERE subject ~ '[⏰📅🕐👨📍📹⚠🔔🎉⏱]';
