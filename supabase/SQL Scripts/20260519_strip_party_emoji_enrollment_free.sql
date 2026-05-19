-- =====================================================================
-- Strip the 🎉 emoji from the "this enrollment is completely free!"
-- translation rows. The alert already carries a modern Sparkles icon
-- next to the text — the inline emoji was redundant and out of step
-- with the rest of the platform's Lucide iconography.
--
-- Idempotent: only updates rows whose value still contains the emoji.
-- =====================================================================

update public.translations
   set translation_value = regexp_replace(translation_value, '🎉\s*', '', 'g'),
       updated_at = now()
 where translation_key = 'enrollment.pricing.free'
   and translation_value like '%🎉%';
