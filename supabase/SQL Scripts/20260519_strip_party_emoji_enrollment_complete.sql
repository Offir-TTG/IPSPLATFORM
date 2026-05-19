-- =====================================================================
-- Strip the 🎉 emoji from the wizard's "complete" step title. The page
-- already shows a large animated emerald success badge with a check
-- icon above the title — the inline emoji on the headline was redundant
-- and out of step with the rest of the platform's Lucide iconography.
--
-- Idempotent: only updates rows whose value still contains the emoji.
-- =====================================================================

update public.translations
   set translation_value = regexp_replace(translation_value, '🎉\s*', '', 'g'),
       updated_at = now()
 where translation_key = 'enrollment.wizard.complete.congratulations'
   and translation_value like '%🎉%';
