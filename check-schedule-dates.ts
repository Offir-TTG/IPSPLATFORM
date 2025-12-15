import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchedules() {
  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', '4975338a-c000-437b-b738-f36715409d06')
    .order('payment_number');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nPayment Schedules:');
  console.log('==================');

  // Check first schedule for metadata
  const firstSchedule = data?.[0];
  if (firstSchedule) {
    console.log('First Schedule Details:');
    console.log('  ID:', firstSchedule.id);
    console.log('  Stripe Payment Intent ID:', firstSchedule.stripe_payment_intent_id);
    console.log('  All columns:', Object.keys(firstSchedule));
    console.log('');
  }

  data?.forEach(s => {
    console.log(`${s.payment_number}. ${s.payment_type}: $${s.amount}`);
    console.log(`   Scheduled Date: ${s.scheduled_date || 'NULL'}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Stripe Intent: ${s.stripe_payment_intent_id || 'None'}`);
    console.log('');
  });
}

checkSchedules();
