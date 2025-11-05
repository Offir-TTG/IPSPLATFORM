-- Add sidebar color columns to theme_configs table
-- Run this migration in your Supabase SQL editor

ALTER TABLE public.theme_configs
-- Light mode sidebar colors
ADD COLUMN IF NOT EXISTS light_sidebar_background TEXT DEFAULT '0 0% 100%',
ADD COLUMN IF NOT EXISTS light_sidebar_foreground TEXT DEFAULT '222.2 84% 4.9%',
ADD COLUMN IF NOT EXISTS light_sidebar_border TEXT DEFAULT '214.3 31.8% 91.4%',
ADD COLUMN IF NOT EXISTS light_sidebar_active TEXT DEFAULT '221.2 83.2% 53.3%',
ADD COLUMN IF NOT EXISTS light_sidebar_active_foreground TEXT DEFAULT '210 40% 98%',

-- Dark mode sidebar colors
ADD COLUMN IF NOT EXISTS dark_sidebar_background TEXT DEFAULT '217.2 32.6% 12%',
ADD COLUMN IF NOT EXISTS dark_sidebar_foreground TEXT DEFAULT '210 40% 98%',
ADD COLUMN IF NOT EXISTS dark_sidebar_border TEXT DEFAULT '217.2 32.6% 17.5%',
ADD COLUMN IF NOT EXISTS dark_sidebar_active TEXT DEFAULT '217.2 91.2% 59.8%',
ADD COLUMN IF NOT EXISTS dark_sidebar_active_foreground TEXT DEFAULT '222.2 47.4% 11.2%';

-- Update existing theme with default values if needed
UPDATE public.theme_configs
SET
  light_sidebar_background = COALESCE(light_sidebar_background, '0 0% 100%'),
  light_sidebar_foreground = COALESCE(light_sidebar_foreground, '222.2 84% 4.9%'),
  light_sidebar_border = COALESCE(light_sidebar_border, '214.3 31.8% 91.4%'),
  light_sidebar_active = COALESCE(light_sidebar_active, '221.2 83.2% 53.3%'),
  light_sidebar_active_foreground = COALESCE(light_sidebar_active_foreground, '210 40% 98%'),
  dark_sidebar_background = COALESCE(dark_sidebar_background, '217.2 32.6% 12%'),
  dark_sidebar_foreground = COALESCE(dark_sidebar_foreground, '210 40% 98%'),
  dark_sidebar_border = COALESCE(dark_sidebar_border, '217.2 32.6% 17.5%'),
  dark_sidebar_active = COALESCE(dark_sidebar_active, '217.2 91.2% 59.8%'),
  dark_sidebar_active_foreground = COALESCE(dark_sidebar_active_foreground, '222.2 47.4% 11.2%')
WHERE is_active = true;
