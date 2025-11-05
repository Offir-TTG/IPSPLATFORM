-- ============================================================================
-- Add Typography/Font Controls to Theme Configuration
-- ============================================================================
-- This adds font family, size, and weight controls to the theme system
-- ============================================================================

-- Add typography columns to theme_configs table
ALTER TABLE public.theme_configs
ADD COLUMN IF NOT EXISTS font_family_primary TEXT DEFAULT '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
ADD COLUMN IF NOT EXISTS font_family_heading TEXT DEFAULT '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
ADD COLUMN IF NOT EXISTS font_family_mono TEXT DEFAULT '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

-- Font sizes (using rem units)
ADD COLUMN IF NOT EXISTS font_size_base TEXT DEFAULT '16px',
ADD COLUMN IF NOT EXISTS font_size_xs TEXT DEFAULT '0.75rem',
ADD COLUMN IF NOT EXISTS font_size_sm TEXT DEFAULT '0.875rem',
ADD COLUMN IF NOT EXISTS font_size_md TEXT DEFAULT '1rem',
ADD COLUMN IF NOT EXISTS font_size_lg TEXT DEFAULT '1.125rem',
ADD COLUMN IF NOT EXISTS font_size_xl TEXT DEFAULT '1.25rem',
ADD COLUMN IF NOT EXISTS font_size_2xl TEXT DEFAULT '1.5rem',
ADD COLUMN IF NOT EXISTS font_size_3xl TEXT DEFAULT '1.875rem',
ADD COLUMN IF NOT EXISTS font_size_4xl TEXT DEFAULT '2.25rem',

-- Font weights
ADD COLUMN IF NOT EXISTS font_weight_normal TEXT DEFAULT '400',
ADD COLUMN IF NOT EXISTS font_weight_medium TEXT DEFAULT '500',
ADD COLUMN IF NOT EXISTS font_weight_semibold TEXT DEFAULT '600',
ADD COLUMN IF NOT EXISTS font_weight_bold TEXT DEFAULT '700',

-- Line heights
ADD COLUMN IF NOT EXISTS line_height_tight TEXT DEFAULT '1.25',
ADD COLUMN IF NOT EXISTS line_height_normal TEXT DEFAULT '1.5',
ADD COLUMN IF NOT EXISTS line_height_relaxed TEXT DEFAULT '1.75',

-- Letter spacing
ADD COLUMN IF NOT EXISTS letter_spacing_tight TEXT DEFAULT '-0.025em',
ADD COLUMN IF NOT EXISTS letter_spacing_normal TEXT DEFAULT '0',
ADD COLUMN IF NOT EXISTS letter_spacing_wide TEXT DEFAULT '0.025em';

-- Update existing default theme with typography values
UPDATE public.theme_configs
SET
  font_family_primary = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  font_family_heading = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  font_family_mono = '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  font_size_base = '16px',
  font_weight_normal = '400',
  font_weight_medium = '500',
  font_weight_semibold = '600',
  font_weight_bold = '700'
WHERE theme_name = 'default';

COMMENT ON COLUMN public.theme_configs.font_family_primary IS 'Primary font family for body text';
COMMENT ON COLUMN public.theme_configs.font_family_heading IS 'Font family for headings';
COMMENT ON COLUMN public.theme_configs.font_family_mono IS 'Monospace font family for code';
COMMENT ON COLUMN public.theme_configs.font_size_base IS 'Base font size (typically 16px)';
COMMENT ON COLUMN public.theme_configs.font_weight_normal IS 'Normal font weight';
COMMENT ON COLUMN public.theme_configs.font_weight_bold IS 'Bold font weight';
