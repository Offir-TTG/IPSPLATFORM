/**
 * Check Payments Table Schema
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 Checking payments table schema...\n');

  // Try to get all payments without tenant filter
  const { data: allPayments, error } = await supabase
    .from('payments')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error querying payments:', error);
    process.exit(1);
  }

  if (allPayments && allPayments.length > 0) {
    console.log('Available columns in payments table:');
    console.log(Object.keys(allPayments[0]));
    console.log('\n');

    console.log('Sample payment record:');
    console.log(JSON.stringify(allPayments[0], null, 2));
    console.log('\n');

    // Check for refunds
    const withRefunds = allPayments.filter(p => p.refunded_amount && p.refunded_amount > 0);
    console.log(`Payments with refunds: ${withRefunds.length}`);
    if (withRefunds.length > 0) {
      console.log('Refunded payments:');
      withRefunds.forEach(p => {
        console.log(`  - ID: ${p.id}, Amount: $${p.amount}, Refunded: $${p.refunded_amount}, Status: ${p.status}`);
      });
    }
  } else {
    console.log('No payments found');
  }

  // Check if tenant_id exists
  console.log('\n');
  const { data: withTenant, error: tenantError } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', 'test');

  if (tenantError) {
    console.log('❌ payments table does NOT have tenant_id column');
    console.log('Error:', tenantError.message);
  } else {
    console.log('✅ payments table HAS tenant_id column');
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
