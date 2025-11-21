-- Simple Integrations Table Setup for Supabase
-- Run this in your Supabase SQL Editor

-- Step 1: Create integrations table (without tenant_id for now)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_key VARCHAR(50) NOT NULL UNIQUE,
  integration_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_integrations_key ON integrations(integration_key);

-- Step 3: Enable RLS (but with permissive policies for now)
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive RLS policies
-- Allow authenticated users to read integrations
CREATE POLICY "Authenticated users can read integrations"
ON integrations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to update integrations
CREATE POLICY "Authenticated users can update integrations"
ON integrations
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert integrations
CREATE POLICY "Authenticated users can insert integrations"
ON integrations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create webhook indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- Step 7: Enable RLS for webhook_events
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Step 8: Permissive policy for webhook events
CREATE POLICY "Authenticated users can manage webhook events"
ON webhook_events
FOR ALL
USING (auth.role() = 'authenticated');

-- Step 9: Add DocuSign-related columns to enrollments table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS signature_status VARCHAR(50);
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS signature_envelope_id VARCHAR(255);
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS signature_sent_at TIMESTAMPTZ;
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS signature_completed_at TIMESTAMPTZ;
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS signature_declined_reason TEXT;
    ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Step 10: Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 11: Create trigger for integrations
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 12: Insert default integrations
INSERT INTO integrations (
  integration_key,
  integration_name,
  is_enabled,
  webhook_url
) VALUES
  ('docusign', 'DocuSign', false, '/api/webhooks/docusign'),
  ('stripe', 'Stripe', false, '/api/webhooks/stripe'),
  ('zoom', 'Zoom', false, '/api/webhooks/zoom'),
  ('sendgrid', 'SendGrid', false, null),
  ('twilio', 'Twilio', false, null)
ON CONFLICT (integration_key) DO NOTHING;

-- Step 13: Grant permissions
GRANT ALL ON integrations TO authenticated;
GRANT ALL ON webhook_events TO authenticated;

-- Verification queries:
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables WHERE table_name IN ('integrations', 'webhook_events');

SELECT 'Integrations inserted:' as status;
SELECT integration_key, integration_name, is_enabled FROM integrations;

-- If you need to reset and start over:
-- DROP TABLE IF EXISTS integrations CASCADE;
-- DROP TABLE IF EXISTS webhook_events CASCADE;