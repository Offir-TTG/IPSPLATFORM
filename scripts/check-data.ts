import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    if (!tenants || tenants.length === 0) {
      console.log('No tenants found');
      return;
    }
    const tenantId = tenants[0].id;

    console.log('\n=== Database Data Check ===\n');

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, title')
      .eq('tenant_id', tenantId);

    console.log(`Products: ${products?.length || 0}`);
    if (productsError) console.error('Products error:', productsError);
    if (products && products.length > 0) {
      products.forEach(p => console.log(`  - ${p.title}`));
    }

    // Check enrollments with full details
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        product_id,
        user_id,
        payment_plan_id,
        products (
          id,
          title
        ),
        payment_plans (
          id,
          plan_type
        ),
        payment_schedules (
          id,
          amount,
          status
        )
      `)
      .eq('tenant_id', tenantId);

    console.log(`\nEnrollments: ${enrollments?.length || 0}`);
    if (enrollmentsError) {
      console.error('Enrollments error:', enrollmentsError);
    } else if (enrollments && enrollments.length > 0) {
      enrollments.forEach((e: any) => {
        console.log(`  - Product: ${e.products?.title || 'N/A'}`);
        console.log(`    Payment Plan: ${e.payment_plans?.plan_type || 'N/A'}`);
        console.log(`    Payment Schedules: ${e.payment_schedules?.length || 0}`);
      });
    }

    // Check payment schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('payment_schedules')
      .select('id, amount, status')
      .eq('tenant_id', tenantId);

    console.log(`\nPayment Schedules: ${schedules?.length || 0}`);
    if (schedulesError) console.error('Schedules error:', schedulesError);

    // Check payment plans
    const { data: plans, error: plansError } = await supabase
      .from('payment_plans')
      .select('id, plan_type')
      .eq('tenant_id', tenantId);

    console.log(`\nPayment Plans: ${plans?.length || 0}`);
    if (plansError) console.error('Plans error:', plansError);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkData();
