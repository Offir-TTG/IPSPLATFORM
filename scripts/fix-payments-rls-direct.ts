import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function fixRLS() {
  console.log('🔧 Fixing Payments RLS Policy...\n');

  // Step 1: Drop existing policy
  console.log('1. Dropping existing policy...');
  await supabase.rpc('exec', { 
    sql: 'DROP POLICY IF EXISTS "Admins can read payments for their tenant" ON payments'
  });
  console.log('   Done (policy dropped if it existed)');

  // Step 2: Create new policy  
  console.log('2. Creating new RLS policy...');
  const policySQL = `
    CREATE POLICY "Admins can read payments for their tenant"
    ON payments
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.tenant_id = payments.tenant_id
        AND users.role IN ('admin', 'super_admin')
      )
    )
  `;
  
  await supabase.rpc('exec', { sql: policySQL });
  console.log('   Done (policy created)');

  // Step 3: Enable RLS
  console.log('3. Ensuring RLS is enabled...');
  await supabase.rpc('exec', { 
    sql: 'ALTER TABLE payments ENABLE ROW LEVEL SECURITY'
  });
  console.log('   Done (RLS enabled)');

  console.log('\n✅ RLS policy fix complete!');
  console.log('\nPlease restart your dev server and refresh the page.');
}

fixRLS()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('\n❌ Error:', err.message);
    console.log('\n📝 Please execute this SQL manually in your Supabase Dashboard:');
    console.log('   Go to: SQL Editor in Supabase Dashboard');
    console.log('   Run this SQL:\n');
    console.log(`
DROP POLICY IF EXISTS "Admins can read payments for their tenant" ON payments;

CREATE POLICY "Admins can read payments for their tenant"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.tenant_id = payments.tenant_id
    AND users.role IN ('admin', 'super_admin')
  )
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
    `);
    process.exit(1);
  });
