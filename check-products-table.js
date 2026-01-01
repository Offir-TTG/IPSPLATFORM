const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProducts() {
  // Get all products with their payment-related fields
  const { data: products, error } = await supabase
    .from('products')
    .select('id, type, title, payment_model, payment_plan, price, currency')
    .limit(5);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log('Products table structure and sample data:');
  console.log(JSON.stringify(products, null, 2));

  // Check if there are any enrollments
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('id, product_id, payment_plan_id, status, payment_status')
    .limit(3);

  if (enrollError) {
    console.error('Error fetching enrollments:', error);
    return;
  }

  console.log('\n\nSample enrollments:');
  console.log(JSON.stringify(enrollments, null, 2));

  // Check payment plans
  const { data: plans, error: planError } = await supabase
    .from('payment_plans')
    .select('id, plan_name, plan_type')
    .limit(5);

  if (planError) {
    console.error('Error fetching payment plans:', planError);
    return;
  }

  console.log('\n\nPayment plans:');
  console.log(JSON.stringify(plans, null, 2));
}

checkProducts();
