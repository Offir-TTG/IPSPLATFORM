import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkRaw() {
  const { data, error } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', '7051d98f-6709-403a-9fbd-b4a7dcaa6e73')
    .not('stripe_payment_intent_id', 'is', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Schedules with payment intent IDs:');
  console.log(JSON.stringify(data, null, 2));
}

checkRaw().catch(console.error);
