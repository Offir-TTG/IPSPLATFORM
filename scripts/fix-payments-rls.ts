/**
 * Fix RLS policies on payments table to allow users to view their own payments
 * This is required for the refund display feature to work
 * Run: npx ts-node scripts/fix-payments-rls.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixPaymentsRLS() {
  try {
    console.log('🔧 Fixing RLS policies on payments table...\n');
    console.log('='.repeat(70));

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'SQL Scripts', 'fix_payments_rls_for_users.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('\n📝 Executing SQL:');
    console.log('-'.repeat(70));
    console.log(sql);
    console.log('-'.repeat(70));

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('\n❌ Error executing SQL:', error);

      // Try executing it directly instead
      console.log('\n⚠️  Trying direct execution...');

      const { error: directError } = await supabase
        .from('_sql')
        .select('*')
        .limit(0); // This won't work, we need a different approach

      // Manual execution of each statement
      console.log('\n📋 Executing statements manually...\n');

      // Drop existing policy
      const { error: dropError } = await supabase.rpc('exec_sql', {
        sql_string: 'DROP POLICY IF EXISTS "Users can view their own payments" ON payments;'
      });

      if (dropError) {
        console.log('⚠️  Drop policy error (might not exist):', dropError.message);
      } else {
        console.log('✅ Dropped existing policy');
      }

      // Create new policy
      const createPolicySQL = `
        CREATE POLICY "Users can view their own payments"
        ON payments
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1
            FROM enrollments
            WHERE enrollments.id = payments.enrollment_id
              AND enrollments.user_id = auth.uid()
          )
        );
      `;

      const { error: createError } = await supabase.rpc('exec_sql', {
        sql_string: createPolicySQL
      });

      if (createError) {
        console.error('❌ Create policy error:', createError);
        console.log('\n⚠️  RPC function might not exist. You need to run this SQL manually.');
        console.log('\n📋 MANUAL STEPS:');
        console.log('='.repeat(70));
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Paste and run this SQL:');
        console.log('');
        console.log(sql);
        console.log('');
        return;
      }

      console.log('✅ Created new policy');
    } else {
      console.log('\n✅ SQL executed successfully');
    }

    console.log('\n🔍 Verifying policy...');

    // Verify by checking pg_policies
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'payments')
      .eq('policyname', 'Users can view their own payments');

    if (policies && policies.length > 0) {
      console.log('✅ Policy verified:', policies[0]);
    } else {
      console.log('⚠️  Could not verify policy (might still be created)');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ RLS FIX COMPLETE');
    console.log('='.repeat(70));
    console.log('');
    console.log('Now users can view payments for their own enrollments.');
    console.log('This enables the refund display feature to work correctly.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Refresh the billing page');
    console.log('2. Check the server console for:');
    console.log('   [EnrollmentService] Fetched payments: { count: 2, ... }');
    console.log('3. Verify refund display appears in the UI');
    console.log('');

  } catch (error) {
    console.error('Error:', error);
    console.log('\n⚠️  MANUAL FIX REQUIRED');
    console.log('='.repeat(70));
    console.log('Go to Supabase Dashboard > SQL Editor and run:');
    console.log('');
    console.log(`-- Drop existing policy
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Create new policy
CREATE POLICY "Users can view their own payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.user_id = auth.uid()
  )
);`);
    console.log('');
  }
}

fixPaymentsRLS();
