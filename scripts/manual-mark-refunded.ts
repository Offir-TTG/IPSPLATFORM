/**
 * Manually mark a payment schedule as refunded
 * Run: npx ts-node scripts/manual-mark-refunded.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function markAsRefunded() {
  try {
    const scheduleId = '216475a7-037d-428b-8e2d-e8d5f8ee4ac6'; // The schedule that was refunded

    console.log(`🔄 Attempting to mark schedule ${scheduleId} as refunded...\n`);

    const { data, error } = await supabase
      .from('payment_schedules')
      .update({
        status: 'refunded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select();

    if (error) {
      console.error('❌ Error updating schedule:', error);
      console.log('\nThis might be due to:');
      console.log('1. RLS policy blocking the update');
      console.log('2. Column constraints');
      console.log('3. Trigger preventing the update');
    } else {
      console.log('✅ Successfully updated schedule!');
      console.log('\nUpdated schedule:', data);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

markAsRefunded();
