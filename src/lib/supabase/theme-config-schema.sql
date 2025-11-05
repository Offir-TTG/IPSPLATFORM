-- ============================================================================
-- Dynamic Theme Configuration Schema
-- ============================================================================
-- This allows admins to configure theme colors through the UI
-- Colors are stored in HSL format (Hue Saturation Lightness)
-- ============================================================================

-- Theme configurations table
CREATE TABLE IF NOT EXISTS public.theme_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  theme_name TEXT NOT NULL DEFAULT 'default',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Light mode colors (HSL format: "hue saturation% lightness%")
  light_background TEXT DEFAULT '0 0% 100%',
  light_foreground TEXT DEFAULT '222.2 84% 4.9%',
  light_card TEXT DEFAULT '0 0% 100%',
  light_card_foreground TEXT DEFAULT '222.2 84% 4.9%',
  light_popover TEXT DEFAULT '0 0% 100%',
  light_popover_foreground TEXT DEFAULT '222.2 84% 4.9%',

  light_primary TEXT DEFAULT '221.2 83.2% 53.3%',
  light_primary_foreground TEXT DEFAULT '210 40% 98%',
  light_secondary TEXT DEFAULT '210 40% 96.1%',
  light_secondary_foreground TEXT DEFAULT '222.2 47.4% 11.2%',

  light_muted TEXT DEFAULT '210 40% 96.1%',
  light_muted_foreground TEXT DEFAULT '215.4 16.3% 46.9%',
  light_accent TEXT DEFAULT '210 40% 96.1%',
  light_accent_foreground TEXT DEFAULT '222.2 47.4% 11.2%',

  light_destructive TEXT DEFAULT '0 84.2% 60.2%',
  light_destructive_foreground TEXT DEFAULT '210 40% 98%',
  light_success TEXT DEFAULT '142.1 76.2% 36.3%',
  light_success_foreground TEXT DEFAULT '355.7 100% 97.3%',
  light_warning TEXT DEFAULT '38 92% 50%',
  light_warning_foreground TEXT DEFAULT '48 96% 89%',
  light_info TEXT DEFAULT '199 89% 48%',
  light_info_foreground TEXT DEFAULT '210 40% 98%',

  light_border TEXT DEFAULT '214.3 31.8% 91.4%',
  light_input TEXT DEFAULT '214.3 31.8% 91.4%',
  light_ring TEXT DEFAULT '221.2 83.2% 53.3%',

  -- Dark mode colors
  dark_background TEXT DEFAULT '222.2 84% 4.9%',
  dark_foreground TEXT DEFAULT '210 40% 98%',
  dark_card TEXT DEFAULT '222.2 84% 4.9%',
  dark_card_foreground TEXT DEFAULT '210 40% 98%',
  dark_popover TEXT DEFAULT '222.2 84% 4.9%',
  dark_popover_foreground TEXT DEFAULT '210 40% 98%',

  dark_primary TEXT DEFAULT '217.2 91.2% 59.8%',
  dark_primary_foreground TEXT DEFAULT '222.2 47.4% 11.2%',
  dark_secondary TEXT DEFAULT '217.2 32.6% 17.5%',
  dark_secondary_foreground TEXT DEFAULT '210 40% 98%',

  dark_muted TEXT DEFAULT '217.2 32.6% 17.5%',
  dark_muted_foreground TEXT DEFAULT '215 20.2% 65.1%',
  dark_accent TEXT DEFAULT '217.2 32.6% 17.5%',
  dark_accent_foreground TEXT DEFAULT '210 40% 98%',

  dark_destructive TEXT DEFAULT '0 62.8% 30.6%',
  dark_destructive_foreground TEXT DEFAULT '210 40% 98%',
  dark_success TEXT DEFAULT '142.1 70.6% 45.3%',
  dark_success_foreground TEXT DEFAULT '144.9 80.4% 10%',
  dark_warning TEXT DEFAULT '48 96% 53%',
  dark_warning_foreground TEXT DEFAULT '26 83.3% 14.1%',
  dark_info TEXT DEFAULT '199 89% 48%',
  dark_info_foreground TEXT DEFAULT '210 40% 98%',

  dark_border TEXT DEFAULT '217.2 32.6% 17.5%',
  dark_input TEXT DEFAULT '217.2 32.6% 17.5%',
  dark_ring TEXT DEFAULT '224.3 76.3% 48%',

  -- Radius
  border_radius TEXT DEFAULT '0.5rem',

  UNIQUE(theme_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_theme_configs_active ON public.theme_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_theme_configs_name ON public.theme_configs(theme_name);

-- Row Level Security
ALTER TABLE public.theme_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can view active theme
CREATE POLICY "Everyone can view active theme" ON public.theme_configs
  FOR SELECT
  USING (is_active = true);

-- Admins can manage themes
CREATE POLICY "Admins can manage themes" ON public.theme_configs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_theme_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_theme_configs_updated_at
  BEFORE UPDATE ON public.theme_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_configs_updated_at();

-- Insert default theme
INSERT INTO public.theme_configs (
  theme_name,
  is_active,
  -- Light mode defaults (already set in column defaults, but explicit for clarity)
  light_primary,
  light_primary_foreground,
  -- Dark mode defaults
  dark_primary,
  dark_primary_foreground
) VALUES (
  'default',
  true,
  '221.2 83.2% 53.3%',  -- Blue primary
  '210 40% 98%',
  '217.2 91.2% 59.8%',
  '222.2 47.4% 11.2%'
)
ON CONFLICT (theme_name) DO NOTHING;

-- Function to activate a theme (deactivates all others)
CREATE OR REPLACE FUNCTION activate_theme(theme_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Deactivate all themes
  UPDATE public.theme_configs SET is_active = false;

  -- Activate the specified theme
  UPDATE public.theme_configs
  SET is_active = true
  WHERE id = theme_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
