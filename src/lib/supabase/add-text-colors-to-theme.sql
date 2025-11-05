-- ============================================================================
-- Add Text Color Controls to Theme Configuration
-- ============================================================================
-- This adds specific text color controls for typography elements
-- ============================================================================

-- Add text color columns to theme_configs table
ALTER TABLE public.theme_configs
-- Light mode text colors
ADD COLUMN IF NOT EXISTS light_text_body TEXT DEFAULT '222.2 84% 4.9%',
ADD COLUMN IF NOT EXISTS light_text_heading TEXT DEFAULT '222.2 84% 4.9%',
ADD COLUMN IF NOT EXISTS light_text_muted TEXT DEFAULT '215.4 16.3% 46.9%',
ADD COLUMN IF NOT EXISTS light_text_link TEXT DEFAULT '221.2 83.2% 53.3%',

-- Dark mode text colors
ADD COLUMN IF NOT EXISTS dark_text_body TEXT DEFAULT '210 40% 98%',
ADD COLUMN IF NOT EXISTS dark_text_heading TEXT DEFAULT '210 40% 98%',
ADD COLUMN IF NOT EXISTS dark_text_muted TEXT DEFAULT '215 20.2% 65.1%',
ADD COLUMN IF NOT EXISTS dark_text_link TEXT DEFAULT '217.2 91.2% 59.8%';

-- Update existing default theme with text color values
UPDATE public.theme_configs
SET
  light_text_body = '222.2 84% 4.9%',
  light_text_heading = '222.2 84% 4.9%',
  light_text_muted = '215.4 16.3% 46.9%',
  light_text_link = '221.2 83.2% 53.3%',
  dark_text_body = '210 40% 98%',
  dark_text_heading = '210 40% 98%',
  dark_text_muted = '215 20.2% 65.1%',
  dark_text_link = '217.2 91.2% 59.8%'
WHERE theme_name = 'default';

COMMENT ON COLUMN public.theme_configs.light_text_body IS 'Light mode body text color (HSL)';
COMMENT ON COLUMN public.theme_configs.light_text_heading IS 'Light mode heading text color (HSL)';
COMMENT ON COLUMN public.theme_configs.light_text_muted IS 'Light mode muted text color (HSL)';
COMMENT ON COLUMN public.theme_configs.light_text_link IS 'Light mode link text color (HSL)';
COMMENT ON COLUMN public.theme_configs.dark_text_body IS 'Dark mode body text color (HSL)';
COMMENT ON COLUMN public.theme_configs.dark_text_heading IS 'Dark mode heading text color (HSL)';
COMMENT ON COLUMN public.theme_configs.dark_text_muted IS 'Dark mode muted text color (HSL)';
COMMENT ON COLUMN public.theme_configs.dark_text_link IS 'Dark mode link text color (HSL)';
