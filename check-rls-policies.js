import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

async function checkRLS() {
  console.log('Testing navigation_items table access...\n');

  // Test with service role (bypasses RLS)
  console.log('1️⃣ Testing with SERVICE ROLE key (bypasses RLS):');
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: tenants } = await adminClient
    .from('tenants')
    .select('id')
    .limit(1);

  if (!tenants || tenants.length === 0) {
    console.log('❌ No tenants found');
    return;
  }

  const tenantId = tenants[0].id;
  console.log(`   Using tenant: ${tenantId}`);

  const { data: serviceData, error: serviceError } = await adminClient
    .from('navigation_items')
    .select('*')
    .eq('tenant_id', tenantId);

  console.log(`   ✅ Service role found ${serviceData?.length || 0} items`);
  if (serviceError) {
    console.log('   ❌ Error:', serviceError);
  }

  // Test with anon key (subject to RLS)
  console.log('\n2️⃣ Testing with ANON key (subject to RLS):');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);

  const { data: anonData, error: anonError } = await anonClient
    .from('navigation_items')
    .select('*')
    .eq('tenant_id', tenantId);

  console.log(`   ${anonData?.length ? '✅' : '❌'} Anon key found ${anonData?.length || 0} items`);
  if (anonError) {
    console.log('   ❌ Error:', anonError.message);
    console.log('   This indicates RLS policies are blocking access');
  }

  // Check if RLS is enabled
  console.log('\n3️⃣ Checking RLS status:');
  const { data: tableInfo } = await adminClient
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'navigation_items')
    .single();

  console.log('   Table info:', tableInfo);

  console.log('\n💡 Solution:');
  console.log('   You need to add RLS policies to the navigation_items table.');
  console.log('   Run this SQL in Supabase:');
  console.log(`
-- Enable RLS on navigation_items
ALTER TABLE navigation_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read navigation items for their tenant
CREATE POLICY "Users can read their tenant's navigation items"
  ON navigation_items
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: Allow admins to update navigation items for their tenant
CREATE POLICY "Admins can update their tenant's navigation items"
  ON navigation_items
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
`);
}

checkRLS();
