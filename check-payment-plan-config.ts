import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPlanConfig() {
  console.log('🔍 Checking payment plan configuration...\n');

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id, product_id, payment_plan_id')
    .eq('id', '45e564c5-292f-45c9-9657-fd6bbd307cfd')
    .single();

  if (!enrollment) {
    console.log('Enrollment not found');
    return;
  }

  console.log('Enrollment:', enrollment.id);
  console.log('Product ID:', enrollment.product_id);
  console.log('Payment Plan ID:', enrollment.payment_plan_id);

  const { data: plan } = await supabase
    .from('payment_plans')
    .select('*')
    .eq('id', enrollment.payment_plan_id)
    .single();

  if (!plan) {
    console.log('Payment plan not found');
    return;
  }

  console.log('\n💳 Payment Plan Configuration:');
  console.log('  Name:', plan.plan_name);
  console.log('  Type:', plan.plan_type);
  console.log('  Deposit Type:', plan.deposit_type);
  console.log('  Deposit Amount:', plan.deposit_amount);
  console.log('  Deposit Percentage:', plan.deposit_percentage);
  console.log('  Installment Count:', plan.installment_count);
  console.log('  Installment Frequency:', plan.installment_frequency);

  // Calculate expected
  const { data: product } = await supabase
    .from('products')
    .select('price, title')
    .eq('id', enrollment.product_id)
    .single();

  if (product) {
    console.log('\n📦 Product:');
    console.log('  Title:', product.title);
    console.log('  Price:', product.price);

    const depositAmount = plan.deposit_type === 'percentage'
      ? product.price * (plan.deposit_percentage / 100)
      : plan.deposit_amount;

    const remainingAmount = product.price - depositAmount;
    const installmentAmount = remainingAmount / plan.installment_count;

    console.log('\n🧮 Expected Calculation:');
    console.log('  Deposit:', depositAmount.toFixed(2));
    console.log('  Remaining:', remainingAmount.toFixed(2));
    console.log('  Installments:', plan.installment_count);
    console.log('  Each Installment:', installmentAmount.toFixed(2));
    console.log('  Total:', (depositAmount + (installmentAmount * plan.installment_count)).toFixed(2));
    console.log('\n  Should be: 1 deposit + ' + plan.installment_count + ' installments = ' + (plan.installment_count + 1) + ' total payments');
  }
}

checkPlanConfig().catch(console.error);
