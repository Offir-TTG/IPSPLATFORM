import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function markPaymentAsPaid() {
  try {
    // Get first pending payment schedule
    const { data: schedule, error: fetchError } = await supabase
      .from('payment_schedules')
      .select('id, amount, status, enrollment_id')
      .eq('status', 'pending')
      .limit(1)
      .single();

    if (fetchError || !schedule) {
      console.log('No pending payment schedules found');
      return;
    }

    console.log('\nFound pending payment schedule:');
    console.log('ID:', schedule.id);
    console.log('Amount:', schedule.amount);
    console.log('Status:', schedule.status);
    console.log('Enrollment ID:', schedule.enrollment_id);

    // Mark as paid
    const { error: updateError } = await supabase
      .from('payment_schedules')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
      })
      .eq('id', schedule.id);

    if (updateError) {
      console.error('Error updating payment schedule:', updateError);
      return;
    }

    console.log('\n✅ Payment schedule marked as paid!');
    console.log('Refresh your payment dashboard to see it in Recent Activity.');

  } catch (error) {
    console.error('Error:', error);
  }
}

markPaymentAsPaid();
