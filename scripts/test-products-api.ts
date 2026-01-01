import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductsAPI() {
  try {
    const { data: tenants } = await supabase.from('tenants').select('id').limit(1);
    const tenantId = tenants![0].id;

    console.log('Testing Products Report API...\n');

    // Get all enrollments with product and payment data
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        product_id,
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

    console.log(`Found ${enrollments?.length || 0} enrollments\n`);

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found.');
      return;
    }

    // Group enrollments by product
    const productMap = new Map<string, any>();

    enrollments.forEach((enrollment: any) => {
      const productId = enrollment.product_id;
      const productName = enrollment.products?.title || 'Unknown Product';

      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: productName,
          enrollmentCount: 0,
          totalRevenue: 0,
          paidCount: 0,
          totalSchedules: 0,
          planCounts: {} as Record<string, number>,
        });
      }

      const productData = productMap.get(productId);
      productData.enrollmentCount++;

      // Add payment schedule data
      const schedules = enrollment.payment_schedules || [];
      productData.totalSchedules += schedules.length;

      schedules.forEach((schedule: any) => {
        const amount = parseFloat(schedule.amount?.toString() || '0');
        productData.totalRevenue += amount;
        if (schedule.status === 'paid') {
          productData.paidCount++;
        }
      });

      // Count payment plan types
      const planType = enrollment.payment_plans?.plan_type || 'unknown';
      productData.planCounts[planType] = (productData.planCounts[planType] || 0) + 1;
    });

    // Convert map to array and calculate final metrics
    const productsData = Array.from(productMap.values()).map(product => {
      // Find most preferred plan
      let preferredPlan = 'N/A';
      let maxCount = 0;
      Object.entries(product.planCounts).forEach(([plan, count]) => {
        if (count > maxCount) {
          maxCount = count;
          preferredPlan = plan;
        }
      });

      // Calculate completion rate
      const completionRate = product.totalSchedules > 0
        ? Math.round((product.paidCount / product.totalSchedules) * 100)
        : 0;

      return {
        id: product.id,
        name: product.name,
        revenue: Math.round(product.totalRevenue * 100) / 100,
        enrollments: product.enrollmentCount,
        completion: completionRate,
        plan: preferredPlan,
      };
    });

    // Sort by revenue (highest first)
    const topProducts = productsData
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    console.log('=== Top Products by Revenue ===\n');
    topProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Revenue: $${product.revenue.toLocaleString()}`);
      console.log(`   Enrollments: ${product.enrollments}`);
      console.log(`   Completion Rate: ${product.completion}%`);
      console.log(`   Preferred Plan: ${product.plan}`);
      console.log('');
    });

    console.log('✅ Products Report data is ready!');

  } catch (error) {
    console.error('Error:', error);
  }
}

testProductsAPI();
