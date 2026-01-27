/**
 * Check recent payment schedules
 * Run: npx ts-node scripts/check-recent-payments.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRecentPayments() {
  try {
    console.log('🔍 Checking recent payment schedules...\n');

    // Get tenant
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    // Get all payment schedules, ordered by most recently updated
    const { data: schedules, error } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, stripe_payment_intent_id, stripe_invoice_id, payment_number, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('updated_at', { ascending: false })
      .limit(10);

    console.log('=== 10 MOST RECENTLY UPDATED PAYMENT SCHEDULES ===\n');
    if (schedules && schedules.length > 0) {
      schedules.forEach((s, idx) => {
        console.log(`${idx + 1}. Schedule ID: ${s.id.substring(0, 8)}...`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Amount: ${s.amount}`);
        console.log(`   Payment #: ${s.payment_number}`);
        console.log(`   Created: ${s.created_at}`);
        console.log(`   Updated: ${s.updated_at}`);
        console.log(`   Stripe PI: ${s.stripe_payment_intent_id || 'NULL'}`);
        console.log(`   Stripe Invoice: ${s.stripe_invoice_id || 'NULL'}`);
        console.log('');
      });

      // Count by status
      const statusCounts = schedules.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('Status breakdown of recent 10 schedules:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    } else {
      console.log('No payment schedules found');
    }

    if (error) {
      console.error('Error:', error);
    }

    // Check if payments table exists and has any records
    console.log('\n=== PAYMENTS TABLE CHECK ===\n');
    const { data: payments, error: payError } = await supabase
      .from('payments')
      .select('id, status, amount, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (payError) {
      console.error('Error querying payments table:', payError.message);
      console.log('→ Payments table may not exist or have different schema');
    } else if (payments && payments.length > 0) {
      console.log(`Found ${payments.length} payment records:`);
      payments.forEach(p => {
        console.log(`  - ID: ${p.id.substring(0, 8)}..., Status: ${p.status}, Amount: ${p.amount}`);
      });
    } else {
      console.log('No payment records found');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkRecentPayments();
