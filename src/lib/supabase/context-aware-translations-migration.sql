-- ============================================================================
-- CONTEXT-AWARE TRANSLATIONS MIGRATION
-- Adds support for separate admin and user-facing translations
-- ============================================================================

-- Add context column to translation_keys table
ALTER TABLE public.translation_keys
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'user' CHECK (context IN ('admin', 'user', 'both'));

-- Add context column to translations table
ALTER TABLE public.translations
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'user' CHECK (context IN ('admin', 'user', 'both'));

-- Create index for context filtering
CREATE INDEX IF NOT EXISTS idx_translation_keys_context ON public.translation_keys(context);
CREATE INDEX IF NOT EXISTS idx_translations_context ON public.translations(context);

-- Update existing translation keys to set proper context
-- Admin keys (start with 'admin.')
UPDATE public.translation_keys
SET context = 'admin'
WHERE key LIKE 'admin.%';

-- Common keys (start with 'common.')
UPDATE public.translation_keys
SET context = 'both'
WHERE key LIKE 'common.%';

-- Everything else is user-facing
UPDATE public.translation_keys
SET context = 'user'
WHERE context = 'user' AND key NOT LIKE 'admin.%' AND key NOT LIKE 'common.%';

-- Update corresponding translations with matching context
UPDATE public.translations t
SET context = tk.context
FROM public.translation_keys tk
WHERE t.translation_key = tk.key;

-- ============================================================================
-- DONE!
-- Now translations can be filtered by context (admin vs user)
-- ============================================================================
