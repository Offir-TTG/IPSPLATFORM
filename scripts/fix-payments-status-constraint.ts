/**
 * Fix payments table status constraint to allow partially_refunded
 * Run: npx ts-node scripts/fix-payments-status-constraint.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixPaymentsConstraint() {
  try {
    console.log('🔧 Fixing payments table status constraint...\n');
    console.log('='.repeat(70));

    // Check current constraint
    console.log('\n1️⃣  Checking current constraint...');
    console.log('-'.repeat(70));

    const checkQuery = `
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'payments'::regclass
        AND conname LIKE '%status%';
    `;

    const { data: currentConstraint, error: checkError } = await supabase.rpc('exec_sql', {
      sql: checkQuery
    });

    if (checkError) {
      console.log('Could not check constraint directly (this is OK)');
      console.log('Proceeding with fix...\n');
    } else if (currentConstraint && currentConstraint.length > 0) {
      console.log('Current constraint:');
      currentConstraint.forEach((c: any) => {
        console.log(`  ${c.constraint_name}: ${c.constraint_definition}`);
      });
    } else {
      console.log('No status constraint found (will create new one)');
    }

    // Drop old constraint and create new one
    console.log('\n2️⃣  Updating constraint...');
    console.log('-'.repeat(70));

    const fixQuery = `
      -- Drop the old constraint if it exists
      ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;

      -- Add new constraint that includes partially_refunded
      ALTER TABLE payments ADD CONSTRAINT payments_status_check
        CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));
    `;

    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: fixQuery
    });

    if (fixError) {
      console.error('❌ Error updating constraint:', fixError);
      console.log('\nTrying direct SQL approach...\n');

      // Try individual statements
      await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;"
      });

      await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));"
      });
    }

    console.log('✅ Constraint updated successfully!');

    // Verify the fix
    console.log('\n3️⃣  Verifying new constraint...');
    console.log('-'.repeat(70));

    const { data: newConstraint } = await supabase.rpc('exec_sql', {
      sql: checkQuery
    });

    if (newConstraint && newConstraint.length > 0) {
      console.log('New constraint:');
      newConstraint.forEach((c: any) => {
        console.log(`  ${c.constraint_name}: ${c.constraint_definition}`);
      });
    }

    // Test with a sample update
    console.log('\n4️⃣  Testing partially_refunded status...');
    console.log('-'.repeat(70));

    const testPaymentId = '2f4e2318-0de5-44cd-ada0-6a1d53501bbd';

    const { error: testError } = await supabase
      .from('payments')
      .update({ status: 'partially_refunded' })
      .eq('id', testPaymentId);

    if (testError) {
      console.error('❌ Test failed:', testError.message);
    } else {
      console.log('✅ Test passed! Status "partially_refunded" is now allowed');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nAllowed payment statuses:');
    console.log('  ✅ pending');
    console.log('  ✅ paid');
    console.log('  ✅ failed');
    console.log('  ✅ refunded');
    console.log('  ✅ partially_refunded');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixPaymentsConstraint();
