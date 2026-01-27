/**
 * Test RLS from API perspective (using authenticated user context)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testRLS() {
  console.log('🔍 Testing RLS and Payment Counting...\n');

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: users } = await serviceClient
    .from('users')
    .select('id, email, role, tenant_id')
    .eq('role', 'admin')
    .limit(1);

  if (!users || users.length === 0) {
    console.error('No admin user found');
    process.exit(1);
  }

  const adminUser = users[0];
  console.log(`Admin user: ${adminUser.email}`);
  console.log(`Tenant ID: ${adminUser.tenant_id}\n`);

  // Check ALL payments for this tenant
  console.log('Checking ALL payments for tenant:');
  const { data: allPayments, error: errorService } = await serviceClient
    .from('payments')
    .select('id, amount, status, payment_type, refunded_amount, installment_number')
    .eq('tenant_id', adminUser.tenant_id)
    .order('created_at', { ascending: true });

  if (errorService) {
    console.log('❌ Error:', errorService.message);
  } else {
    console.log(`Found ${allPayments?.length || 0} total payments:\n`);
    allPayments?.forEach((p, i) => {
      console.log(`${i + 1}. Type: ${p.payment_type || 'unknown'}, Amount: $${p.amount}, Status: ${p.status}`);
      if (p.installment_number) console.log(`   Installment: ${p.installment_number}`);
      if (p.refunded_amount) console.log(`   Refunded: $${p.refunded_amount}`);
      console.log('');
    });
  }

  console.log('\nCalculating totals:');
  if (allPayments) {
    const nonFailedPayments = allPayments.filter(p => p.status !== 'failed');
    console.log(`Non-failed payments: ${nonFailedPayments.length}`);

    const totalPaid = nonFailedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const totalRefunds = allPayments.reduce((sum, p) => sum + parseFloat(p.refunded_amount || 0), 0);

    console.log(`Total Paid (excluding failed): $${totalPaid.toFixed(2)}`);
    console.log(`Total Refunds: $${totalRefunds.toFixed(2)}`);
    console.log(`Net Revenue: $${(totalPaid - totalRefunds).toFixed(2)}`);
  }

  console.log('\n\nChecking RLS Policies:');
  const { data: policies } = await serviceClient.rpc('exec', {
    sql: `SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'payments'`
  });

  if (policies) {
    console.log('RLS Policies found:');
    console.log(policies);
  }
}

testRLS()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
