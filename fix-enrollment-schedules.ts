import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixEnrollment() {
  const enrollmentId = '5c812c64-7847-4425-8310-e2bb320b64d5';

  console.log('=== Fixing Enrollment Payment Schedules ===\n');

  // Get enrollment details
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('*, product:products(*)')
    .eq('id', enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    console.error('❌ Could not find enrollment:', enrollmentError?.message);
    return;
  }

  console.log('Enrollment:', enrollment.id);
  console.log('Total Amount:', enrollment.total_amount);
  console.log('Product:', enrollment.product.title);
  console.log('Payment Plan:', enrollment.product.payment_plan);
  console.log('');

  const product = enrollment.product;
  const paymentPlan = product.payment_plan || {};

  // Get the existing payment
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .single();

  if (!existingPayment) {
    console.error('❌ No payment found');
    return;
  }

  console.log('Existing Payment:');
  console.log('  Amount:', existingPayment.amount);
  console.log('  Type:', existingPayment.payment_type);
  console.log('  Stripe Intent:', existingPayment.stripe_payment_intent_id);
  console.log('');

  // Create payment schedules based on the payment plan
  console.log('Creating payment schedules...\n');

  const depositAmount = parseFloat(existingPayment.amount.toString());
  const totalAmount = parseFloat(enrollment.total_amount.toString());
  const remainingAmount = totalAmount - depositAmount;
  const installments = paymentPlan.installments || 3;
  const installmentAmount = remainingAmount / installments;

  // Get payment start date
  const paymentStartDate = enrollment.payment_start_date
    ? new Date(enrollment.payment_start_date)
    : new Date();

  // 1. Create deposit schedule
  const { data: depositSchedule, error: depositError } = await supabase
    .from('payment_schedules')
    .insert({
      tenant_id: enrollment.tenant_id,
      enrollment_id: enrollment.id,
      product_id: enrollment.product_id,
      payment_type: 'deposit',
      amount: depositAmount,
      currency: enrollment.currency,
      due_date: paymentStartDate.toISOString(),
      payment_number: 1,
      status: 'paid',
      paid_date: existingPayment.paid_at,
      stripe_payment_intent_id: existingPayment.stripe_payment_intent_id,
    })
    .select()
    .single();

  if (depositError) {
    console.error('❌ Error creating deposit schedule:', depositError.message);
    return;
  }

  console.log('✅ Created deposit schedule:', depositSchedule.id);

  // Link existing payment to the schedule
  await supabase
    .from('payments')
    .update({ payment_schedule_id: depositSchedule.id })
    .eq('id', existingPayment.id);

  console.log('✅ Linked payment to schedule');

  // 2. Create installment schedules
  for (let i = 0; i < installments; i++) {
    const dueDate = new Date(paymentStartDate);
    dueDate.setMonth(dueDate.getMonth() + (i + 1)); // Monthly installments

    const { error: installmentError } = await supabase
      .from('payment_schedules')
      .insert({
        tenant_id: enrollment.tenant_id,
        enrollment_id: enrollment.id,
        product_id: enrollment.product_id,
        payment_type: 'installment',
        amount: installmentAmount,
        currency: enrollment.currency,
        due_date: dueDate.toISOString(),
        payment_number: i + 2, // +2 because deposit is #1
        status: 'pending',
      });

    if (installmentError) {
      console.error(`❌ Error creating installment ${i + 1}:`, installmentError.message);
    } else {
      console.log(`✅ Created installment ${i + 1}: $${installmentAmount.toFixed(2)} due ${dueDate.toLocaleDateString()}`);
    }
  }

  // 3. Update enrollment status
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      paid_amount: depositAmount,
      payment_status: 'partial',
      status: 'pending', // Still pending because only deposit paid
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId);

  if (updateError) {
    console.error('❌ Error updating enrollment:', updateError.message);
  } else {
    console.log('\n✅ Updated enrollment status');
    console.log(`   Paid Amount: $${depositAmount}`);
    console.log(`   Payment Status: partial`);
    console.log(`   Status: pending`);
  }

  console.log('\n=== Fix Complete ===');
}

fixEnrollment().catch(console.error);
