/**
 * Fix payment status constraint directly
 * Run: npx ts-node scripts/fix-payment-constraint-direct.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixConstraint() {
  try {
    console.log('🔧 Fixing payment status constraint...\n');
    console.log('='.repeat(70));

    // Step 1: Check current constraint
    console.log('\n1️⃣  CHECKING CURRENT CONSTRAINT');
    console.log('-'.repeat(70));

    const { data: constraints, error: checkError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT conname AS constraint_name, pg_get_constraintdef(oid) AS constraint_definition
          FROM pg_constraint
          WHERE conrelid = 'payments'::regclass AND contype = 'c'
          ORDER BY conname;
        `
      });

    if (checkError) {
      console.log('Note: Could not check constraints (this is ok)');
    } else {
      console.log('Current constraints:', constraints);
    }

    // Step 2: Drop old constraint
    console.log('\n2️⃣  DROPPING OLD CONSTRAINT');
    console.log('-'.repeat(70));

    const { error: dropError } = await supabase
      .rpc('exec_sql', {
        sql_query: 'ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;'
      });

    if (dropError) {
      console.log('⚠️  Could not drop constraint (may not exist):', dropError.message);
    } else {
      console.log('✅ Dropped old constraint');
    }

    // Step 3: Normalize 'succeeded' to 'paid'
    console.log('\n3️⃣  NORMALIZING STATUS VALUES');
    console.log('-'.repeat(70));

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'paid' })
      .eq('status', 'succeeded');

    if (updateError) {
      console.log('⚠️  Could not update statuses:', updateError.message);
    } else {
      console.log('✅ Normalized "succeeded" to "paid"');
    }

    // Step 4: Add new constraint
    console.log('\n4️⃣  ADDING NEW CONSTRAINT');
    console.log('-'.repeat(70));

    const { error: addError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          ALTER TABLE payments ADD CONSTRAINT payments_status_check
          CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded'));
        `
      });

    if (addError) {
      console.error('❌ Error adding constraint:', addError.message);
      return;
    }

    console.log('✅ Added new constraint');

    console.log('\n' + '='.repeat(70));
    console.log('✅ CONSTRAINT FIX COMPLETE!');
    console.log('='.repeat(70));
    console.log('\nAllowed payment statuses:');
    console.log('  - pending');
    console.log('  - paid');
    console.log('  - failed');
    console.log('  - refunded');
    console.log('  - partially_refunded');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
  }
}

fixConstraint();
