-- Fix the dark_primary_foreground color in theme_configs table
-- This changes the button text color from dark blue to white in dark mode
-- Date: 2025-11-21

-- Update the active theme configuration
UPDATE theme_configs
SET dark_primary_foreground = '210 40% 98%'
WHERE is_active = true;

-- Verify the change
SELECT
  theme_name,
  dark_primary AS "Dark Primary Color",
  dark_primary_foreground AS "Dark Primary Foreground (Button Text)",
  is_active AS "Is Active Theme"
FROM theme_configs
WHERE is_active = true;

-- Expected result:
-- dark_primary_foreground should now be '210 40% 98%' (light/white color)
-- This ensures buttons have white text on the primary colored background in dark mode
