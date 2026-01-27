/**
 * Verify Tenant RPC Functions
 *
 * This script checks if the required Supabase RPC functions exist in the database.
 * If they don't exist, it provides instructions to create them.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const requiredFunctions = [
  'get_tenant_by_slug',
  'get_tenant_by_domain',
  'user_belongs_to_tenant',
  'get_user_tenant_role',
  'is_super_admin',
  'get_user_tenants',
];

async function verifyFunctions() {
  console.log('Checking for required RPC functions...\n');

  const missingFunctions: string[] = [];

  for (const funcName of requiredFunctions) {
    try {
      // Try to query the function by calling it with a test parameter
      const { error } = await supabase.rpc(funcName as any, { p_slug: 'test' } as any);

      if (error && error.message.includes('Could not find the function')) {
        missingFunctions.push(funcName);
        console.log(`❌ ${funcName} - NOT FOUND`);
      } else {
        console.log(`✅ ${funcName} - EXISTS`);
      }
    } catch (err) {
      missingFunctions.push(funcName);
      console.log(`❌ ${funcName} - ERROR`);
    }
  }

  console.log('\n' + '='.repeat(60));

  if (missingFunctions.length > 0) {
    console.log('\n⚠️  MISSING FUNCTIONS DETECTED\n');
    console.log('The following functions are missing:');
    missingFunctions.forEach(func => console.log(`  - ${func}`));
    console.log('\nTo fix this, run the following SQL file in your Supabase SQL Editor:');
    console.log('  src/lib/supabase/04-tenant-rls-functions.sql');
    console.log('\nSteps:');
    console.log('  1. Open Supabase Dashboard: https://supabase.com/dashboard');
    console.log('  2. Go to SQL Editor');
    console.log('  3. Copy the contents of src/lib/supabase/04-tenant-rls-functions.sql');
    console.log('  4. Paste and run the SQL');
    console.log('  5. Restart your Next.js dev server\n');
    process.exit(1);
  } else {
    console.log('\n✅ All required RPC functions exist!\n');
    console.log('If you\'re still seeing errors:');
    console.log('  1. Clear your browser cache (Ctrl+Shift+Delete)');
    console.log('  2. Delete the .next folder: rm -rf .next');
    console.log('  3. Restart the dev server: npm run dev\n');
  }
}

verifyFunctions()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
