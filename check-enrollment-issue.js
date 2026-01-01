const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnrollmentIssue() {
  // Get the problematic enrollment with full details
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('*')
    .eq('id', 'ac2ab7a2-6f4c-4b40-8f28-994fd37efcb4')
    .single();

  console.log('=== PROBLEMATIC ENROLLMENT ===');
  console.log(JSON.stringify(enrollment, null, 2));

  // Get the product this enrollment is linked to
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', enrollment.product_id)
    .single();

  console.log('\n=== PRODUCT CONFIGURATION ===');
  console.log('Product ID:', product.id);
  console.log('Product Title:', product.title);
  console.log('Payment Model:', product.payment_model);
  console.log('Payment Plan (JSONB):', JSON.stringify(product.payment_plan, null, 2));
  console.log('Price:', product.price);
  console.log('Currency:', product.currency);

  // Check if product references any payment plan templates
  console.log('\nPayment Plan Template References:');
  console.log('- default_payment_plan_id:', product.default_payment_plan_id || 'NOT SET');
  console.log('- alternative_payment_plan_ids:', product.alternative_payment_plan_ids || 'NOT SET');
  console.log('- allow_plan_selection:', product.allow_plan_selection || false);

  // Get the payment plan that was assigned to the enrollment
  if (enrollment.payment_plan_id) {
    const { data: assignedPlan } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', enrollment.payment_plan_id)
      .single();

    console.log('\n=== ASSIGNED PAYMENT PLAN (from template) ===');
    console.log('Plan ID:', assignedPlan.id);
    console.log('Plan Name:', assignedPlan.plan_name);
    console.log('Plan Type:', assignedPlan.plan_type);
    console.log('Installment Count:', assignedPlan.installment_count);
    console.log('Deposit Type:', assignedPlan.deposit_type);
    console.log('Deposit Amount:', assignedPlan.deposit_amount);
  }

  // Get payment schedules to see what was actually generated
  const { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollment.id)
    .order('payment_number', { ascending: true });

  console.log('\n=== PAYMENT SCHEDULES ===');
  console.log('Total schedules:', schedules?.length || 0);
  if (schedules && schedules.length > 0) {
    console.log('First schedule:', JSON.stringify(schedules[0], null, 2));
    console.log('Last schedule:', JSON.stringify(schedules[schedules.length - 1], null, 2));

    const depositSchedules = schedules.filter(s => s.payment_type === 'deposit');
    const installmentSchedules = schedules.filter(s => s.payment_type === 'installment');

    console.log('\nSchedule breakdown:');
    console.log('- Deposit schedules:', depositSchedules.length);
    console.log('- Installment schedules:', installmentSchedules.length);
  }

  // Analysis
  console.log('\n=== ANALYSIS ===');
  console.log('Expected behavior:');
  console.log(`- Product uses payment_model: "${product.payment_model}"`);
  console.log(`- Product payment_plan config: ${product.payment_plan.installments || 0} installments`);
  console.log(`- Enrollment should have payment_plan_id: NULL (use product config)`);

  console.log('\nActual behavior:');
  console.log(`- Enrollment has payment_plan_id: "${enrollment.payment_plan_id}"`);
  console.log(`- This points to a payment plan template with different configuration`);

  console.log('\n🔍 ROOT CAUSE:');
  console.log('The processEnrollment function incorrectly assigned a payment plan template');
  console.log('instead of using the product\'s embedded payment configuration.');
}

checkEnrollmentIssue();
