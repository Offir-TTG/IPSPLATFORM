/**
 * Check Actual Payments
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPayments() {
  const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
  const tenantId = tenants?.[0]?.id;

  console.log('💳 Actual Payments Records:\n');
  console.log(`Tenant ID: ${tenantId}\n`);

  // Query exactly as API does
  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, status, refunded_amount, paid_at')
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Query error:', error);
    return;
  }

  if (payments) {
    console.log(`Total records: ${payments.length}\n`);

    payments.forEach((p, i) => {
      console.log(`Payment ${i + 1}:`);
      console.log(`  Amount: $${p.amount}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Refunded: $${p.refunded_amount || 0}`);
      console.log(`  Refunded type: ${typeof p.refunded_amount}`);
      console.log(`  Paid at: ${p.paid_at}`);
      console.log('');
    });

    // Calculate exactly as API does
    const totalPaid = payments
      ?.filter(p => p.status !== 'failed')
      .reduce((sum, p) => sum + parseFloat(p.amount?.toString() || '0'), 0) || 0;

    console.log('🔍 Calculating refunds step by step:');
    const totalRefunded = payments
      ?.reduce((sum, p) => {
        const refunded = parseFloat(p.refunded_amount?.toString() || '0');
        console.log(`  Payment ${payments.indexOf(p) + 1}: refunded_amount=${p.refunded_amount}, parsed=${refunded}, sum=${sum} + ${refunded} = ${sum + refunded}`);
        return sum + refunded;
      }, 0) || 0;

    console.log('');
    console.log(`Total Paid (excluding failed): $${totalPaid.toFixed(2)}`);
    console.log(`Total Refunded: $${totalRefunded.toFixed(2)}`);
    console.log(`Net Revenue: $${(totalPaid - totalRefunded).toFixed(2)}`);
  }
}

checkPayments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
