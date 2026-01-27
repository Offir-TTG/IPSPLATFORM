/**
 * Add refund columns to payments table
 * Run: npx ts-node scripts/add-refund-columns-simple.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addColumns() {
  try {
    console.log('🔍 Checking payments table schema...\n');

    // Check if columns exist by querying the table
    const { data: sample } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (sample && sample.length > 0) {
      const columns = Object.keys(sample[0]);
      console.log('Current columns:', columns);

      const hasRefundColumns =
        columns.includes('refunded_amount') &&
        columns.includes('refunded_at') &&
        columns.includes('refund_reason');

      if (hasRefundColumns) {
        console.log('\n✅ All refund columns already exist!');
      } else {
        console.log('\n❌ Refund columns missing!');
        console.log('\nYou need to add these columns manually in Supabase SQL Editor:');
        console.log(`
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refunded_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refund_reason TEXT;

COMMENT ON COLUMN payments.refunded_amount IS 'Total amount refunded for this payment';
COMMENT ON COLUMN payments.refunded_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN payments.refund_reason IS 'Reason for the refund';
        `);
      }
    } else {
      console.log('No records in payments table to check schema');
      console.log('\nTrying to check if payments table exists...');

      const { error } = await supabase
        .from('payments')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Payments table query error:', error.message);
        if (error.message.includes('does not exist')) {
          console.log('\n❌ Payments table does not exist!');
        }
      } else {
        console.log('\n✅ Payments table exists but is empty');
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addColumns();
