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

    console.log('Testing Products Report API (Final Version)...\n');

    // Get all enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, product_id, payment_plan_id')
      .eq('tenant_id', tenantId);

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found.');
      return;
    }

    console.log(`Found ${enrollments.length} enrollments\n`);

    // Get enrollment IDs
    const enrollmentIds = enrollments.map(e => e.id);

    // Get all products for these enrollments
    const productIds = [...new Set(enrollments.map(e => e.product_id).filter(Boolean))];
    const { data: products } = await supabase
      .from('products')
      .select('id, title')
      .in('id', productIds);

    console.log(`Found ${products?.length || 0} products`);

    // Get all payment schedules for these enrollments
    const { data: paymentSchedules } = await supabase
      .from('payment_schedules')
      .select('enrollment_id, amount, status, payment_type')
      .in('enrollment_id', enrollmentIds);

    console.log(`Found ${paymentSchedules?.length || 0} payment schedules\n`);

    // Get all payment plans for these enrollments
    const planIds = [...new Set(enrollments.map(e => e.payment_plan_id).filter(Boolean))];
    let paymentPlans: any[] = [];
    if (planIds.length > 0) {
      const { data } = await supabase
        .from('payment_plans')
        .select('id, plan_type')
        .in('id', planIds);
      paymentPlans = data || [];
    }

    // Create lookup maps
    const productMap = new Map(products?.map(p => [p.id, p.title]) || []);
    const planMap = new Map(paymentPlans.map(p => [p.id, p.plan_type]));
    const schedulesByEnrollment = new Map<string, any[]>();

    paymentSchedules?.forEach(schedule => {
      if (!schedulesByEnrollment.has(schedule.enrollment_id)) {
        schedulesByEnrollment.set(schedule.enrollment_id, []);
      }
      schedulesByEnrollment.get(schedule.enrollment_id)!.push(schedule);
    });

    // Group enrollments by product
    const productStatsMap = new Map<string, any>();

    enrollments.forEach((enrollment: any) => {
      const productId = enrollment.product_id;
      const productName = productMap.get(productId) || 'Unknown Product';

      if (!productStatsMap.has(productId)) {
        productStatsMap.set(productId, {
          id: productId,
          name: productName,
          enrollmentCount: 0,
          totalRevenue: 0,
          paidCount: 0,
          totalSchedules: 0,
          planCounts: {} as Record<string, number>,
        });
      }

      const productData = productStatsMap.get(productId);
      productData.enrollmentCount++;

      // Add payment schedule data
      const schedules = schedulesByEnrollment.get(enrollment.id) || [];
      productData.totalSchedules += schedules.length;

      schedules.forEach((schedule: any) => {
        const amount = parseFloat(schedule.amount?.toString() || '0');
        productData.totalRevenue += amount;
        if (schedule.status === 'paid') {
          productData.paidCount++;
        }
      });

      // Count payment plan types
      const planType = enrollment.payment_plan_id
        ? (planMap.get(enrollment.payment_plan_id) || 'unknown')
        : 'unknown';
      productData.planCounts[planType] = (productData.planCounts[planType] || 0) + 1;
    });

    // Convert map to array and calculate final metrics
    const productsData = Array.from(productStatsMap.values()).map(product => {
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
