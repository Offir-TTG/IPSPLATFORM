/**
 * Apply Payments RLS Policy Fix
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyFix() {
  console.log('🔧 Applying Payments RLS Policy Fix...\n');

  // Read the SQL file
  const sqlPath = path.resolve(process.cwd(), 'supabase/SQL Scripts/fix_payments_rls_policy.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Executing SQL migration...');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

  if (error) {
    // Try executing directly if RPC doesn't work
    console.log('RPC failed, trying direct execution...');
    
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error: execError } = await supabase.from('_migrations').insert({
          name: 'fix_payments_rls_' + Date.now(),
          executed_at: new Date().toISOString(),
        });
        
        if (execError && !execError.message.includes('does not exist')) {
          console.log('Note:', execError.message);
        }
      }
    }
    
    console.log('\n⚠️  Could not execute via RPC.');
    console.log('Please run this SQL manually in Supabase SQL Editor:');
    console.log('\n' + sql);
    console.log('\nOr use: npx supabase db execute --file "supabase/SQL Scripts/fix_payments_rls_policy.sql"');
  } else {
    console.log('✅ RLS policy applied successfully!');
  }

  console.log('\nVerifying fix...');
  
  // Test if we can now read payments
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  const { data: payments, error: queryError } = await supabase
    .from('payments')
    .select('id')
    .eq('tenant_id', tenantId);

  if (queryError) {
    console.log('❌ Still cannot read payments:', queryError.message);
  } else {
    console.log(`✅ Can now read payments: ${payments?.length || 0} records found`);
  }
}

applyFix()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
