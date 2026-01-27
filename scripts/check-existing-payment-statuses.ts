/**
 * Check what status values currently exist in payments table
 * Run: npx ts-node scripts/check-existing-payment-statuses.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkExistingStatuses() {
  try {
    console.log('🔍 Checking existing payment status values...\n');
    console.log('='.repeat(70));

    // Get all distinct status values
    const { data: payments, error } = await supabase
      .from('payments')
      .select('status, id')
      .order('status');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    // Count occurrences of each status
    const statusCounts: Record<string, number> = {};
    const statusExamples: Record<string, string[]> = {};

    payments?.forEach(payment => {
      const status = payment.status || 'NULL';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      if (!statusExamples[status]) {
        statusExamples[status] = [];
      }
      if (statusExamples[status].length < 3) {
        statusExamples[status].push(payment.id.substring(0, 8) + '...');
      }
    });

    console.log('\n📊 STATUS VALUE COUNTS');
    console.log('-'.repeat(70));

    Object.entries(statusCounts)
      .sort(([, a], [, b]) => b - a)
      .forEach(([status, count]) => {
        console.log(`\n${status}:`);
        console.log(`  Count: ${count}`);
        console.log(`  Examples: ${statusExamples[status].join(', ')}`);
      });

    // Check current constraint
    console.log('\n\n🔍 CURRENT CONSTRAINT');
    console.log('-'.repeat(70));

    const { data: constraints } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'payments'::regclass
          AND conname = 'payments_status_check';
      `
    });

    if (constraints && constraints.length > 0) {
      console.log('Current constraint definition:');
      console.log(`  ${constraints[0].definition}`);
    } else {
      console.log('No constraint found');
    }

    // Recommendations
    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(70));

    const uniqueStatuses = Object.keys(statusCounts).filter(s => s !== 'NULL');

    console.log('\nTo fix the constraint, it must include ALL these status values:');
    uniqueStatuses.forEach(status => {
      console.log(`  - '${status}'`);
    });

    console.log('\n\nSQL to fix the constraint:');
    console.log('-'.repeat(70));
    console.log('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;');
    console.log('ALTER TABLE payments ADD CONSTRAINT payments_status_check');
    console.log(`  CHECK (status IN (${uniqueStatuses.map(s => `'${s}'`).join(', ')}));`);
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkExistingStatuses();
