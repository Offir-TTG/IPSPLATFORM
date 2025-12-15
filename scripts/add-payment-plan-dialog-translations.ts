import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTranslations() {
  console.log('Adding payment plan dialog translations...\n');

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .limit(1);

  const tenantId = tenants?.[0]?.id;

  const translations = [
    // Dialog title and description
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.title',
      translation_value: 'Payment Plan Details',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.title',
      translation_value: 'פרטי תוכנית התשלום',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.description',
      translation_value: 'View payment plan configuration for this enrollment',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.description',
      translation_value: 'צפייה בהגדרות תוכנית התשלום להרשמה זו',
      category: 'admin',
      context: 'admin',
    },
    // Field labels
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.planName',
      translation_value: 'Plan Name',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.planName',
      translation_value: 'שם התוכנית',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.paymentModel',
      translation_value: 'Payment Model',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.paymentModel',
      translation_value: 'מודל תשלום',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.totalAmount',
      translation_value: 'Total Amount',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.totalAmount',
      translation_value: 'סכום כולל',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.paidAmount',
      translation_value: 'Paid Amount',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.paidAmount',
      translation_value: 'סכום ששולם',
      category: 'admin',
      context: 'admin',
    },
    // Payment model types
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.oneTime',
      translation_value: 'One-Time Payment',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.oneTime',
      translation_value: 'תשלום חד פעמי',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositThenPlan',
      translation_value: 'Deposit + Installments',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositThenPlan',
      translation_value: 'מקדמה + תשלומים',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.subscription',
      translation_value: 'Subscription',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.subscription',
      translation_value: 'מנוי',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.free',
      translation_value: 'Free',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.free',
      translation_value: 'חינם',
      category: 'admin',
      context: 'admin',
    },
    // Installment details
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.installmentDetails',
      translation_value: 'Installment Details',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.installmentDetails',
      translation_value: 'פרטי תשלומים',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositType',
      translation_value: 'Deposit Type',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositType',
      translation_value: 'סוג מקדמה',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositPercentage',
      translation_value: 'Deposit Percentage',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.depositPercentage',
      translation_value: 'אחוז מקדמה',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.numberOfInstallments',
      translation_value: 'Number of Installments',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.numberOfInstallments',
      translation_value: 'מספר תשלומים',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.frequency',
      translation_value: 'Frequency',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.frequency',
      translation_value: 'תדירות',
      category: 'admin',
      context: 'admin',
    },
    // Status fields
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.paymentStatus',
      translation_value: 'Payment Status',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.paymentStatus',
      translation_value: 'סטטוס תשלום',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.enrollmentStatus',
      translation_value: 'Enrollment Status',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.enrollmentStatus',
      translation_value: 'סטטוס הרשמה',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.nextPaymentDate',
      translation_value: 'Next Payment Date',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.nextPaymentDate',
      translation_value: 'תאריך תשלום הבא',
      category: 'admin',
      context: 'admin',
    },
    // Subscription details
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.subscriptionDetails',
      translation_value: 'Subscription Details',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.subscriptionDetails',
      translation_value: 'פרטי מנוי',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.billingInterval',
      translation_value: 'Billing Interval',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.billingInterval',
      translation_value: 'תדירות חיוב',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'admin.enrollments.paymentPlanDetails.trialDays',
      translation_value: 'Trial Days',
      category: 'admin',
      context: 'admin',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'admin.enrollments.paymentPlanDetails.trialDays',
      translation_value: 'ימי ניסיון',
      category: 'admin',
      context: 'admin',
    },
    // Common
    {
      tenant_id: tenantId,
      language_code: 'en',
      translation_key: 'common.close',
      translation_value: 'Close',
      category: 'common',
      context: 'both',
    },
    {
      tenant_id: tenantId,
      language_code: 'he',
      translation_key: 'common.close',
      translation_value: 'סגור',
      category: 'common',
      context: 'both',
    },
  ];

  for (const trans of translations) {
    const { error } = await supabase
      .from('translations')
      .upsert(trans, {
        onConflict: 'tenant_id,language_code,translation_key',
      });

    if (error) {
      console.error(`Failed to add ${trans.translation_key}:`, error);
    } else {
      console.log(`✓ Added ${trans.translation_key} (${trans.language_code})`);
    }
  }

  console.log('\n✅ All translations added!');
}

addTranslations().catch(console.error);
