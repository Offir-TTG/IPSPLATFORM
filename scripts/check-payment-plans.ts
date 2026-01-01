import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPaymentPlans() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.error('No tenant found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('\n=== Payment Plans Check ===\n');

    // Get all payment plans
    const { data: plans, error: plansError } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('tenant_id', tenantId);

    if (plansError) {
      console.error('Payment Plans error:', plansError);
      return;
    }

    console.log(`Found ${plans?.length || 0} payment plans:\n`);
    plans?.forEach(plan => {
      console.log(`ID: ${plan.id}`);
      console.log(`Plan Type: ${plan.plan_type}`);
      console.log(`Product ID: ${plan.product_id || 'N/A'}`);
      console.log(`Total Amount: ${plan.total_amount || 'N/A'}`);
      console.log(`Number of Payments: ${plan.number_of_payments || 'N/A'}`);
      console.log('---');
    });

    // Get all enrollments
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('id, product_id, payment_plan_id')
      .eq('tenant_id', tenantId);

    if (enrollmentsError) {
      console.error('Enrollments error:', enrollmentsError);
      return;
    }

    console.log(`\nFound ${enrollments?.length || 0} enrollments:\n`);
    enrollments?.forEach(enrollment => {
      console.log(`Enrollment ID: ${enrollment.id}`);
      console.log(`Product ID: ${enrollment.product_id}`);
      console.log(`Payment Plan ID: ${enrollment.payment_plan_id || 'N/A'}`);

      // Find matching plan
      const matchingPlan = plans?.find(p => p.id === enrollment.payment_plan_id);
      if (matchingPlan) {
        console.log(`Plan Type: ${matchingPlan.plan_type}`);
      } else if (enrollment.payment_plan_id) {
        console.log(`Plan Type: NOT FOUND (plan_id exists but plan not found)`);
      } else {
        console.log(`Plan Type: NO PLAN ASSIGNED`);
      }
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

checkPaymentPlans();
