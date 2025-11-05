-- Test Theme System - Change primary color to bright green
-- This will make it obvious if the dynamic theme system is working

UPDATE theme_configs
SET
  light_primary = '142 76% 45%',  -- Bright green instead of blue
  light_primary_foreground = '0 0% 100%',  -- White text
  updated_at = NOW()
WHERE theme_name = 'default';

-- Verify the change
SELECT theme_name, light_primary, light_primary_foreground
FROM theme_configs
WHERE theme_name = 'default';
