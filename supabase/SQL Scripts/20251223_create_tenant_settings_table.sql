-- Create tenant_settings table for storing tenant-specific configuration
-- This table is used to store various tenant settings including PDF branding configuration

CREATE TABLE IF NOT EXISTS public.tenant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique setting_key per tenant
  CONSTRAINT tenant_settings_unique_key UNIQUE (tenant_id, setting_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenant_settings_tenant_id ON public.tenant_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_settings_setting_key ON public.tenant_settings(setting_key);

-- Enable RLS
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant_settings
-- Admin users can read their tenant's settings
CREATE POLICY "Admin users can view their tenant settings"
  ON public.tenant_settings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin users can insert their tenant's settings
CREATE POLICY "Admin users can insert their tenant settings"
  ON public.tenant_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin users can update their tenant's settings
CREATE POLICY "Admin users can update their tenant settings"
  ON public.tenant_settings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin users can delete their tenant's settings
CREATE POLICY "Admin users can delete their tenant settings"
  ON public.tenant_settings
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tenant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_settings_updated_at
  BEFORE UPDATE ON public.tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_settings_updated_at();

-- Add comment
COMMENT ON TABLE public.tenant_settings IS 'Stores tenant-specific configuration settings including PDF branding, email settings, etc.';
