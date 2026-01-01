const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentPlanName() {
  const enrollmentId = 'ac2ab7a2-6f4c-4b40-8f28-994fd37efcb4';
  const tenantId = '70d86807-7e7c-49cd-8601-98235444e2ac';
  const userLanguage = 'he'; // Test with Hebrew

  console.log('=== TESTING PAYMENT PLAN NAME IN PDF ===\n');

  // Get enrollment
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('payment_plan_id, product_id')
    .eq('id', enrollmentId)
    .single();

  console.log('Enrollment:');
  console.log('- payment_plan_id:', enrollment.payment_plan_id);
  console.log('- product_id:', enrollment.product_id);

  // Fetch translations
  const { data: translationsData } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', userLanguage);

  const translations = {};
  translationsData.forEach((t) => {
    translations[t.translation_key] = t.translation_value;
  });

  const t = (key, fallback) => translations[key] || fallback;

  let paymentPlanName = t('user.profile.billing.fullPayment', 'Payment Plan');

  if (enrollment.payment_plan_id) {
    // Using payment plan template
    const { data: paymentPlan } = await supabase
      .from('payment_plans')
      .select('plan_name')
      .eq('id', enrollment.payment_plan_id)
      .eq('tenant_id', tenantId)
      .single();

    if (paymentPlan) {
      paymentPlanName = paymentPlan.plan_name;
    }
  } else {
    // Using product's embedded payment configuration
    const { data: productPaymentInfo } = await supabase
      .from('products')
      .select('payment_model, payment_plan')
      .eq('id', enrollment.product_id)
      .eq('tenant_id', tenantId)
      .single();

    if (productPaymentInfo) {
      const paymentModel = productPaymentInfo.payment_model;
      const paymentConfig = productPaymentInfo.payment_plan || {};

      console.log('\nProduct Payment Configuration:');
      console.log('- payment_model:', paymentModel);
      console.log('- payment_plan:', JSON.stringify(paymentConfig, null, 2));

      if (paymentModel === 'one_time') {
        paymentPlanName = t('user.profile.billing.oneTimePayment', 'One-Time Payment');
      } else if (paymentModel === 'deposit_then_plan') {
        const installments = paymentConfig.installments || 1;
        if (userLanguage === 'he') {
          paymentPlanName = `מקדמה + ${installments} תשלומים`;
        } else {
          paymentPlanName = `Deposit + ${installments} Installments`;
        }
      } else if (paymentModel === 'subscription') {
        const interval = paymentConfig.subscription_interval || 'monthly';
        const baseText = t('user.profile.billing.subscription', 'Subscription');
        paymentPlanName = `${baseText} (${interval})`;
      } else if (paymentModel === 'free') {
        paymentPlanName = t('user.profile.billing.free', 'Free');
      }
    }
  }

  console.log('\n✅ Payment Plan Name for PDF (Hebrew):');
  console.log('  "' + paymentPlanName + '"');

  // Test with English too
  const { data: translationsDataEn } = await supabase
    .from('translations')
    .select('translation_key, translation_value')
    .eq('tenant_id', tenantId)
    .eq('language_code', 'en');

  const translationsEn = {};
  translationsDataEn.forEach((t) => {
    translationsEn[t.translation_key] = t.translation_value;
  });

  const tEn = (key, fallback) => translationsEn[key] || fallback;

  let paymentPlanNameEn = tEn('user.profile.billing.fullPayment', 'Payment Plan');

  if (!enrollment.payment_plan_id) {
    const { data: productPaymentInfo } = await supabase
      .from('products')
      .select('payment_model, payment_plan')
      .eq('id', enrollment.product_id)
      .eq('tenant_id', tenantId)
      .single();

    if (productPaymentInfo) {
      const paymentModel = productPaymentInfo.payment_model;
      const paymentConfig = productPaymentInfo.payment_plan || {};

      if (paymentModel === 'one_time') {
        paymentPlanNameEn = tEn('user.profile.billing.oneTimePayment', 'One-Time Payment');
      } else if (paymentModel === 'deposit_then_plan') {
        const installments = paymentConfig.installments || 1;
        paymentPlanNameEn = `Deposit + ${installments} Installments`;
      }
    }
  }

  console.log('\n✅ Payment Plan Name for PDF (English):');
  console.log('  "' + paymentPlanNameEn + '"');
}

testPaymentPlanName();
