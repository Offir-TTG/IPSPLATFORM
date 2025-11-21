-- ============================================================================
-- INTEGRATIONS TABLE
-- Stores third-party integration credentials and settings (Zoom, DocuSign, Stripe, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Integration identification
  integration_key TEXT NOT NULL UNIQUE,        -- Unique key (e.g., 'zoom', 'docusign', 'stripe')
  integration_name TEXT NOT NULL,              -- Display name (e.g., 'Zoom Meetings', 'DocuSign eSignature')

  -- Configuration
  is_enabled BOOLEAN DEFAULT false,            -- Whether integration is active
  credentials JSONB DEFAULT '{}'::jsonb,       -- Encrypted credentials (API keys, secrets, etc.)
  settings JSONB DEFAULT '{}'::jsonb,          -- Integration-specific settings
  webhook_url TEXT,                            -- Webhook endpoint for this integration

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_integrations_key ON public.integrations(integration_key);
CREATE INDEX IF NOT EXISTS idx_integrations_enabled ON public.integrations(is_enabled) WHERE is_enabled = true;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view integrations" ON public.integrations;
DROP POLICY IF EXISTS "Admins can manage integrations" ON public.integrations;

-- Only admins can view integrations
CREATE POLICY "Admins can view integrations"
  ON public.integrations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- Only admins can manage integrations
CREATE POLICY "Admins can manage integrations"
  ON public.integrations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'owner')
    )
  );

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.integrations;

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.integrations TO authenticated;
GRANT ALL ON public.integrations TO service_role;

-- ============================================================================
-- SEED DATA - Default Integration Placeholders
-- ============================================================================

INSERT INTO public.integrations (integration_key, integration_name, is_enabled, credentials, settings, webhook_url)
VALUES
  ('zoom', 'Zoom Meetings', false, '{
    "account_id": "",
    "client_id": "",
    "client_secret": "",
    "sdk_key": "",
    "sdk_secret": ""
  }'::jsonb, '{
    "default_meeting_duration": "60",
    "auto_recording": "none",
    "waiting_room": true,
    "join_before_host": false
  }'::jsonb, '/api/webhooks/zoom'),

  ('docusign', 'DocuSign eSignature', false, '{
    "account_id": "",
    "integration_key": "",
    "user_id": "",
    "private_key": "",
    "oauth_base_path": "account-d.docusign.com",
    "base_path": "https://demo.docusign.net/restapi"
  }'::jsonb, '{
    "default_template_id": "",
    "auto_send": false
  }'::jsonb, '/api/webhooks/docusign'),

  ('stripe', 'Stripe Payments', false, '{
    "publishable_key": "",
    "secret_key": "",
    "webhook_secret": ""
  }'::jsonb, '{
    "currency": "USD",
    "payment_methods": ["card"]
  }'::jsonb, '/api/webhooks/stripe')
ON CONFLICT (integration_key) DO NOTHING;

COMMENT ON TABLE public.integrations IS 'Third-party integration credentials and settings';
COMMENT ON COLUMN public.integrations.credentials IS 'JSONB containing encrypted API credentials (should be encrypted in production)';
COMMENT ON COLUMN public.integrations.settings IS 'JSONB containing integration-specific settings and preferences';
