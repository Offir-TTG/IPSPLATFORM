import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkEnrollmentToPlan() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('\n=== Linking Enrollment to Payment Plan ===\n');

    // Get the enrollment
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, product_id, payment_plan_id')
      .eq('tenant_id', tenantId);

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found');
      return;
    }

    const enrollment = enrollments[0];
    console.log(`Enrollment ID: ${enrollment.id}`);
    console.log(`Current Payment Plan ID: ${enrollment.payment_plan_id || 'NULL'}`);

    // Get the payment plan
    const { data: plans } = await supabase
      .from('payment_plans')
      .select('id, plan_type')
      .eq('tenant_id', tenantId);

    if (!plans || plans.length === 0) {
      console.log('No payment plans found');
      return;
    }

    const plan = plans[0];
    console.log(`\nPayment Plan ID: ${plan.id}`);
    console.log(`Payment Plan Type: ${plan.plan_type}`);

    // Check if already linked
    if (enrollment.payment_plan_id === plan.id) {
      console.log('\n✓ Enrollment is already linked to this payment plan');
      return;
    }

    // Update enrollment to link to payment plan
    console.log('\n→ Updating enrollment to link to payment plan...');
    const { error: updateError } = await supabase
      .from('enrollments')
      .update({ payment_plan_id: plan.id })
      .eq('id', enrollment.id);

    if (updateError) {
      console.error('Error updating enrollment:', updateError);
      return;
    }

    console.log('✅ Successfully linked enrollment to payment plan!');

    // Verify the update
    const { data: updated } = await supabase
      .from('enrollments')
      .select('id, payment_plan_id')
      .eq('id', enrollment.id)
      .single();

    console.log(`\nVerification:`);
    console.log(`Enrollment ID: ${updated?.id}`);
    console.log(`Payment Plan ID: ${updated?.payment_plan_id}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

linkEnrollmentToPlan();
