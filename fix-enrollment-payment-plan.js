const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixEnrollment() {
  const enrollmentId = 'ac2ab7a2-6f4c-4b40-8f28-994fd37efcb4';

  console.log('=== FIXING ENROLLMENT ===');
  console.log('Enrollment ID:', enrollmentId);

  // Get current enrollment data
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('payment_plan_id, product_id, payment_metadata')
    .eq('id', enrollmentId)
    .single();

  console.log('\nCurrent state:');
  console.log('- payment_plan_id:', enrollment.payment_plan_id);
  console.log('- product_id:', enrollment.product_id);

  // Get product configuration
  const { data: product } = await supabase
    .from('products')
    .select('payment_model, payment_plan')
    .eq('id', enrollment.product_id)
    .single();

  console.log('\nProduct configuration:');
  console.log('- payment_model:', product.payment_model);
  console.log('- payment_plan:', JSON.stringify(product.payment_plan, null, 2));

  // Update enrollment to remove payment_plan_id and mark as using product config
  const { error } = await supabase
    .from('enrollments')
    .update({
      payment_plan_id: null,
      payment_metadata: {
        ...enrollment.payment_metadata,
        using_product_payment_config: true,
        fixed_at: new Date().toISOString(),
        fix_reason: 'Corrected to use product embedded payment configuration instead of incorrect template'
      }
    })
    .eq('id', enrollmentId);

  if (error) {
    console.error('\n❌ Error updating enrollment:', error);
    return;
  }

  console.log('\n✅ Enrollment fixed!');
  console.log('- payment_plan_id set to: null');
  console.log('- Will now use product\'s embedded payment configuration');
  console.log('- Payment schedules remain unchanged (already correct with 12 installments)');

  // Verify the fix
  const { data: updated } = await supabase
    .from('enrollments')
    .select('payment_plan_id, payment_metadata')
    .eq('id', enrollmentId)
    .single();

  console.log('\nVerification:');
  console.log('- payment_plan_id:', updated.payment_plan_id);
  console.log('- using_product_payment_config:', updated.payment_metadata.using_product_payment_config);
}

fixEnrollment();
