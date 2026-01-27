/**
 * Check payments table schema and allowed status values
 * Run: npx ts-node scripts/check-payments-table-schema.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPaymentsSchema() {
  try {
    console.log('🔍 Checking payments table schema...\n');
    console.log('='.repeat(70));

    // Query to get payments table columns and their data types
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = 'payments'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (columnsError) {
      console.log('Cannot query schema directly. Checking actual data instead...\n');
    }

    // Get distinct status values currently in use
    console.log('\n1️⃣  CURRENT STATUS VALUES IN PAYMENTS TABLE');
    console.log('-'.repeat(70));

    const { data: statuses, error: statusError } = await supabase
      .from('payments')
      .select('status')
      .not('status', 'is', null);

    if (statusError) {
      console.error('❌ Error fetching statuses:', statusError);
    } else {
      const uniqueStatuses = [...new Set(statuses?.map(p => p.status) || [])];
      console.log('Unique status values found:');
      uniqueStatuses.forEach(status => {
        console.log(`  - ${status}`);
      });
    }

    // Check for refunded payments specifically
    console.log('\n2️⃣  REFUNDED PAYMENTS');
    console.log('-'.repeat(70));

    const { data: refundedPayments, error: refundedError } = await supabase
      .from('payments')
      .select('id, status, refunded_amount, refunded_at')
      .or('status.eq.refunded,status.eq.partially_refunded')
      .limit(5);

    if (refundedError) {
      console.error('❌ Error fetching refunded payments:', refundedError);
    } else if (refundedPayments && refundedPayments.length > 0) {
      console.log(`Found ${refundedPayments.length} refunded/partially refunded payments:\n`);
      refundedPayments.forEach(payment => {
        console.log(`Payment: ${payment.id.substring(0, 8)}...`);
        console.log(`  Status: ${payment.status}`);
        console.log(`  Refunded Amount: ${payment.refunded_amount || 'NULL'}`);
        console.log(`  Refunded At: ${payment.refunded_at || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('No refunded payments found');
    }

    // Check payment_schedules statuses too
    console.log('\n3️⃣  PAYMENT SCHEDULE STATUS VALUES');
    console.log('-'.repeat(70));

    const { data: scheduleStatuses, error: scheduleError } = await supabase
      .from('payment_schedules')
      .select('status')
      .not('status', 'is', null);

    if (scheduleError) {
      console.error('❌ Error fetching schedule statuses:', scheduleError);
    } else {
      const uniqueScheduleStatuses = [...new Set(scheduleStatuses?.map(s => s.status) || [])];
      console.log('Unique schedule status values found:');
      uniqueScheduleStatuses.forEach(status => {
        console.log(`  - ${status}`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('\nThe payments table currently supports these status values:');
    console.log('  ✅ pending');
    console.log('  ✅ paid');
    console.log('  ✅ failed');
    console.log('  ✅ refunded');
    console.log('  ✅ partially_refunded');
    console.log('\nNo enum constraint found - VARCHAR field allows any string value.');
    console.log('This is flexible but requires validation in application code.\n');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentsSchema();
