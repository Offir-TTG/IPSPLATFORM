import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStartDate() {
  const { data: product } = await supabase
    .from('products')
    .select('id, title, payment_start_date, payment_plan')
    .eq('id', '1c641cbf-9719-4204-9c6c-d82631aece04')
    .single();

  if (!product) {
    console.log('Product not found');
    return;
  }

  console.log('Product:', product.title);
  console.log('Payment Start Date:', product.payment_start_date);
  console.log('Payment Plan:', JSON.stringify(product.payment_plan, null, 2));

  // Check enrollment schedules
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (enrollment) {
    const { data: schedules } = await supabase
      .from('payment_schedules')
      .select('payment_number, payment_type, amount, scheduled_date')
      .eq('enrollment_id', enrollment.id)
      .order('payment_number', { ascending: true });

    console.log('\nPayment Schedules:');
    schedules?.forEach(s => {
      const date = new Date(s.scheduled_date);
      console.log(`  ${s.payment_number}. ${s.payment_type}: $${s.amount} - ${date.toLocaleDateString()}`);
    });
  }
}

checkStartDate().catch(console.error);
