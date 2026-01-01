const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
-- Create tenant_settings table for storing tenant-specific configuration
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
`;

async function createTable() {
  try {
    console.log('Creating tenant_settings table...\n');

    // Execute SQL using Supabase SQL Editor endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // Try alternative method - use pg connection string if available
      console.log('Direct SQL execution not available via REST API.');
      console.log('Please execute the SQL manually in Supabase SQL Editor:');
      console.log('\n--- COPY THE FOLLOWING SQL ---\n');
      console.log(sql);
      console.log('\n--- END OF SQL ---\n');
      console.log('\nSteps:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create a new query');
      console.log('4. Paste the SQL above');
      console.log('5. Run the query');
      return;
    }

    const data = await response.json();
    console.log('✅ Table created successfully!');
    console.log('Response:', data);

  } catch (error) {
    console.error('Error creating table:', error.message);
    console.log('\n\nPlease execute this SQL manually in Supabase SQL Editor:\n');
    console.log(sql);
  }
}

createTable();
