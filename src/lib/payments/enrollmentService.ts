import { createClient } from '@/lib/supabase/server';
import { detectPaymentPlan, generatePaymentSchedules } from './paymentEngine';
import { getProduct } from './productService';
import { Product, PaymentPlan, PaymentSchedule } from '@/types/payments';

export interface EnrollmentRequest {
  user_id: string;
  product_id: string;
  start_date?: Date;
  metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export interface EnrollmentResponse {
  enrollment_id: string;
  product: Product;
  payment_plan: PaymentPlan;
  total_amount: number;
  deposit_amount?: number;
  schedules: PaymentSchedule[];
  stripe_client_secret?: string;
  next_payment_date?: string;
  requires_immediate_payment: boolean;
}

/**
 * Process a new enrollment with payment system integration
 *
 * This function:
 * 1. Validates the product exists and is active
 * 2. Detects the appropriate payment plan
 * 3. Creates the enrollment record with payment tracking
 * 4. Generates payment schedules
 * 5. Creates Stripe payment intent for immediate payment (deposit/full payment)
 * 6. Returns enrollment details and payment information
 */
export async function processEnrollment(
  request: EnrollmentRequest,
  tenant_id: string
): Promise<EnrollmentResponse> {
  const supabase = await createClient();
  const { user_id, product_id, start_date, metadata, user_metadata } = request;

  // 1. Get and validate product
  const product = await getProduct(product_id, tenant_id);

  if (!product) {
    throw new Error('Product not found');
  }

  if (!product.is_active) {
    throw new Error('Product is not active');
  }

  // 2. Detect payment plan
  const paymentPlan = await detectPaymentPlan(product, tenant_id, user_metadata);

  // 3. Calculate amounts
  const totalAmount = product.price;
  let depositAmount: number | undefined;
  let requiresImmediatePayment = false;

  switch (paymentPlan.plan_type) {
    case 'one_time':
      requiresImmediatePayment = true;
      break;
    case 'deposit':
      if (paymentPlan.deposit_type === 'percentage') {
        depositAmount = totalAmount * (paymentPlan.deposit_percentage! / 100);
      } else {
        depositAmount = paymentPlan.deposit_amount!;
      }
      requiresImmediatePayment = true;
      break;
    case 'installments':
      // First installment is immediate
      requiresImmediatePayment = true;
      break;
    case 'subscription':
      // First subscription payment is immediate
      requiresImmediatePayment = true;
      break;
  }

  // 4. Create enrollment record
  // Use provided start_date, or current date if not specified
  // Do NOT copy from product - enrollment has its own payment_start_date that should be set explicitly
  const enrolledAt = new Date();

  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .insert({
      tenant_id,
      user_id,
      product_id,
      program_id: product.product_type === 'program' ? product.product_id : null,
      course_id: product.product_type === 'course' ? product.product_id : null,
      payment_plan_id: paymentPlan.id,
      total_amount: totalAmount,
      paid_amount: 0,
      payment_status: 'pending',
      deposit_paid: false,
      status: 'draft', // Start as draft, will change to pending when email is sent, then active when user completes enrollment
      enrolled_at: enrolledAt.toISOString(),
      payment_start_date: start_date?.toISOString() || null, // Use explicitly provided start_date, or null to use default later
      payment_metadata: {
        ...metadata,
        enrollment_processed_at: new Date().toISOString(),
        auto_detected_plan: !product.forced_payment_plan_id,
      },
    })
    .select()
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error(`Failed to create enrollment: ${enrollmentError?.message}`);
  }

  // 5. Generate payment schedules
  // Use enrollment's payment_start_date if set, otherwise use current date
  const paymentStartDate = enrollment.payment_start_date
    ? new Date(enrollment.payment_start_date)
    : new Date();

  const schedules = generatePaymentSchedules(
    enrollment.id,
    tenant_id,
    paymentPlan,
    totalAmount,
    paymentStartDate
  );

  // 6. Insert payment schedules
  const { data: insertedSchedules, error: schedulesError } = await supabase
    .from('payment_schedules')
    .insert(schedules)
    .select();

  if (schedulesError || !insertedSchedules) {
    // Rollback enrollment if schedule creation fails
    await supabase.from('enrollments').delete().eq('id', enrollment.id);
    throw new Error(`Failed to create payment schedules: ${schedulesError?.message}`);
  }

  // 7. Update enrollment with next payment date
  const nextSchedule = insertedSchedules.find(s => s.status === 'pending');
  if (nextSchedule) {
    await supabase
      .from('enrollments')
      .update({ next_payment_date: nextSchedule.scheduled_date })
      .eq('id', enrollment.id);
  }

  // 8. Create Stripe payment intent for immediate payment (if required)
  let stripeClientSecret: string | undefined;
  let paymentIntentId: string | undefined;

  if (requiresImmediatePayment && process.env.STRIPE_SECRET_KEY) {
    // Calculate immediate payment amount
    let immediateAmount: number;
    let paymentType: 'deposit' | 'installment' | 'subscription' | 'full';
    let scheduleId: string | undefined;

    if (paymentPlan.plan_type === 'one_time') {
      immediateAmount = totalAmount;
      paymentType = 'full';
      scheduleId = insertedSchedules[0]?.id;
    } else if (paymentPlan.plan_type === 'deposit') {
      immediateAmount = depositAmount!;
      paymentType = 'deposit';
      scheduleId = insertedSchedules.find(s => s.payment_type === 'deposit')?.id;
    } else if (paymentPlan.plan_type === 'installments') {
      // First installment
      const firstSchedule = insertedSchedules.find(s => s.payment_number === 1);
      immediateAmount = firstSchedule?.amount || 0;
      paymentType = 'installment';
      scheduleId = firstSchedule?.id;
    } else {
      // First subscription payment
      const firstSchedule = insertedSchedules.find(s => s.payment_number === 1);
      immediateAmount = firstSchedule?.amount || 0;
      paymentType = 'subscription';
      scheduleId = firstSchedule?.id;
    }

    try {
      // Import Stripe service dynamically to avoid issues if not configured
      const { createPaymentIntent } = await import('./stripeService');

      const result = await createPaymentIntent(
        {
          enrollment_id: enrollment.id,
          amount: immediateAmount,
          currency: product.currency,
          payment_type: paymentType,
          schedule_id: scheduleId,
          metadata: {
            user_id: user_id,
            product_type: product.product_type,
            payment_plan_name: paymentPlan.plan_name,
          },
        },
        tenant_id,
        user_id
      );

      stripeClientSecret = result.client_secret;
      paymentIntentId = result.payment_intent_id;

      // Update schedule with Stripe payment intent ID
      if (scheduleId) {
        await supabase
          .from('payment_schedules')
          .update({
            status: 'processing',
            metadata: {
              stripe_payment_intent_id: paymentIntentId,
            },
          })
          .eq('id', scheduleId);
      }
    } catch (error: any) {
      console.error('Error creating Stripe payment intent:', error);
      // Don't fail enrollment if Stripe fails - can process payment manually later
    }
  }

  return {
    enrollment_id: enrollment.id,
    product,
    payment_plan: paymentPlan,
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    schedules: insertedSchedules,
    stripe_client_secret: stripeClientSecret,
    next_payment_date: nextSchedule?.scheduled_date,
    requires_immediate_payment: requiresImmediatePayment,
  };
}

/**
 * Get enrollment payment details
 */
export async function getEnrollmentPaymentDetails(
  enrollment_id: string,
  tenant_id: string,
  supabaseClient?: any // Optional admin client for unauthenticated access
): Promise<{
  enrollment: any;
  product: Product;
  payment_plan: PaymentPlan;
  schedules: PaymentSchedule[];
  payments: any[];
}> {
  const supabase = supabaseClient || await createClient();

  // Get enrollment with relations
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select(`
      *,
      users!enrollments_user_id_fkey(id, first_name, last_name, email)
    `)
    .eq('id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get product
  const product = await getProduct(enrollment.product_id, tenant_id);
  if (!product) {
    throw new Error('Product not found');
  }

  // Get payment plan (either from template or from product payment model)
  let paymentPlan: any;

  if (enrollment.payment_plan_id) {
    // Using payment plan template
    const { data: planData } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', enrollment.payment_plan_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!planData) {
      throw new Error('Payment plan not found');
    }
    paymentPlan = planData;
  } else {
    // No template - fetch product with payment model to generate synthetic payment plan
    // This handles enrollments created with direct payment model configuration
    const { data: productWithPaymentInfo } = await supabase
      .from('products')
      .select('payment_model, payment_plan')
      .eq('id', enrollment.product_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!productWithPaymentInfo) {
      throw new Error('Product payment configuration not found');
    }

    const paymentModel = productWithPaymentInfo.payment_model;
    const paymentConfig = productWithPaymentInfo.payment_plan || {};

    if (paymentModel === 'one_time') {
      paymentPlan = {
        id: null as any, // Synthetic plan - no payment_plan_id in schedules
        tenant_id,
        plan_name: 'One-Time Payment',
        plan_type: 'one_time',
        currency: product.currency,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: enrollment.created_at,
        updated_at: enrollment.created_at,
      };
    } else if (paymentModel === 'deposit_then_plan') {
      paymentPlan = {
        id: null as any, // Synthetic plan - no payment_plan_id in schedules
        tenant_id,
        plan_name: 'Deposit + Installments',
        plan_type: 'deposit',
        deposit_type: paymentConfig.deposit_type || 'percentage',
        deposit_amount: paymentConfig.deposit_amount,
        deposit_percentage: paymentConfig.deposit_percentage,
        installment_count: paymentConfig.installments || 1,
        installment_frequency: paymentConfig.frequency || 'monthly',
        currency: product.currency,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: enrollment.created_at,
        updated_at: enrollment.created_at,
      };
    } else if (paymentModel === 'subscription') {
      paymentPlan = {
        id: null as any, // Synthetic plan - no payment_plan_id in schedules
        tenant_id,
        plan_name: 'Subscription',
        plan_type: 'subscription',
        subscription_frequency: paymentConfig.subscription_interval || 'monthly',
        currency: product.currency,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: enrollment.created_at,
        updated_at: enrollment.created_at,
      };
    } else if (paymentModel === 'free') {
      paymentPlan = {
        id: null as any, // Synthetic plan - no payment_plan_id in schedules
        tenant_id,
        plan_name: 'Free',
        plan_type: 'one_time',
        currency: product.currency,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: enrollment.created_at,
        updated_at: enrollment.created_at,
      };
    } else {
      throw new Error(`Unsupported payment model: ${paymentModel}`);
    }
  }

  // Get schedules
  let { data: schedules } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('enrollment_id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .order('payment_number', { ascending: true });

  // If no schedules exist and enrollment requires payment, generate them on-demand
  if ((!schedules || schedules.length === 0) && enrollment.total_amount > 0 && !enrollment.payment_waived) {
    try {
      const { generatePaymentSchedules } = await import('./paymentEngine');

      // Determine start date with priority: enrollment.payment_start_date → product.payment_start_date → enrollment.created_at
      // Parse as local midnight to keep dates consistent
      let startDate: Date;
      if (enrollment.payment_start_date) {
        // Enrollment has explicit start date - parse as local midnight
        const dateOnly = enrollment.payment_start_date.split('T')[0]; // Extract YYYY-MM-DD
        startDate = new Date(dateOnly + 'T00:00:00');
        console.log(`[EnrollmentService] Using enrollment payment_start_date: ${dateOnly} → ${startDate.toISOString()}`);
      } else if ((product as any).payment_start_date) {
        // Product has default start date - parse as local midnight
        const dateOnly = (product as any).payment_start_date.split('T')[0];
        startDate = new Date(dateOnly + 'T00:00:00');
        console.log(`[EnrollmentService] Using product payment_start_date: ${dateOnly} → ${startDate.toISOString()}`);
      } else {
        // Fallback to enrollment creation date
        startDate = new Date(enrollment.created_at || enrollment.enrolled_at || new Date());
        console.log(`[EnrollmentService] Using enrollment created_at: ${startDate.toISOString()}`);
      }

      // Generate schedules using correct function signature: (enrollmentId, tenantId, plan, totalAmount, startDate)
      const generatedSchedules = generatePaymentSchedules(
        enrollment_id,
        tenant_id,
        paymentPlan,
        enrollment.total_amount,
        startDate
      );

      if (generatedSchedules && generatedSchedules.length > 0) {
        // The generatePaymentSchedules function already includes all required fields
        const { data: insertedSchedules, error: scheduleError } = await supabase
          .from('payment_schedules')
          .insert(generatedSchedules)
          .select('*');

        if (!scheduleError && insertedSchedules) {
          schedules = insertedSchedules;
          console.log(`[EnrollmentService] Auto-generated ${schedules.length} payment schedules for enrollment ${enrollment_id} starting ${startDate.toISOString().split('T')[0]}`);
        } else {
          console.error('[EnrollmentService] Error creating payment schedules:', scheduleError);
        }
      }
    } catch (error) {
      console.error('[EnrollmentService] Error generating schedules on-demand:', error);
    }
  }

  // Get payments
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('enrollment_id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });

  return {
    enrollment,
    product,
    payment_plan: paymentPlan,
    schedules: schedules || [],
    payments: payments || [],
  };
}

/**
 * Cancel an enrollment and handle payment refunds
 */
export async function cancelEnrollment(
  enrollment_id: string,
  tenant_id: string,
  reason: string,
  admin_id: string,
  refund_amount?: number
): Promise<void> {
  const supabase = await createClient();

  // Update enrollment status
  const { error: updateError } = await supabase
    .from('enrollments')
    .update({
      payment_status: 'cancelled',
      status: 'cancelled',
      payment_metadata: {
        cancelled_at: new Date().toISOString(),
        cancelled_by: admin_id,
        cancellation_reason: reason,
        refund_amount: refund_amount || 0,
      },
    })
    .eq('id', enrollment_id)
    .eq('tenant_id', tenant_id);

  if (updateError) {
    throw new Error(`Failed to cancel enrollment: ${updateError.message}`);
  }

  // Cancel all pending payment schedules
  await supabase
    .from('payment_schedules')
    .update({ status: 'cancelled' })
    .eq('enrollment_id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .in('status', ['pending', 'paused', 'adjusted']);

  // Process refund through Stripe if refund_amount > 0
  if (refund_amount && refund_amount > 0 && process.env.STRIPE_SECRET_KEY) {
    try {
      // Get the most recent paid payment with Stripe payment intent
      const { data: payment } = await supabase
        .from('payments')
        .select('stripe_payment_intent_id')
        .eq('enrollment_id', enrollment_id)
        .eq('tenant_id', tenant_id)
        .eq('status', 'completed')
        .not('stripe_payment_intent_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (payment?.stripe_payment_intent_id) {
        const { processRefund } = await import('./stripeService');

        await processRefund(
          payment.stripe_payment_intent_id,
          tenant_id,
          refund_amount,
          reason
        );
      }
    } catch (error: any) {
      console.error('Error processing Stripe refund:', error);
      // Don't fail cancellation if refund fails - can process manually
    }
  }
}

/**
 * Mark a payment schedule as paid (manual payment recording)
 */
export async function recordManualPayment(
  schedule_id: string,
  tenant_id: string,
  admin_id: string,
  payment_method: string,
  transaction_reference?: string,
  notes?: string
): Promise<void> {
  const supabase = await createClient();

  // Get schedule
  const { data: schedule } = await supabase
    .from('payment_schedules')
    .select('*, enrollments!inner(id, paid_amount, total_amount, payment_status)')
    .eq('id', schedule_id)
    .eq('tenant_id', tenant_id)
    .single();

  if (!schedule) {
    throw new Error('Payment schedule not found');
  }

  if (schedule.status === 'paid') {
    throw new Error('Payment schedule is already paid');
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id,
      user_id: schedule.enrollments.user_id,
      enrollment_id: schedule.enrollment_id,
      amount: schedule.amount,
      currency: schedule.currency,
      payment_method,
      transaction_id: transaction_reference || `manual_${Date.now()}`,
      status: 'completed',
      metadata: {
        recorded_by: admin_id,
        notes,
        payment_type: 'manual',
        schedule_id: schedule_id,
      },
    })
    .select()
    .single();

  if (paymentError || !payment) {
    throw new Error(`Failed to create payment record: ${paymentError?.message}`);
  }

  // Update schedule status
  await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
    })
    .eq('id', schedule_id);

  // Update enrollment paid amount
  const enrollment = schedule.enrollments;
  const newPaidAmount = parseFloat(enrollment.paid_amount.toString()) + parseFloat(schedule.amount.toString());
  const isFullyPaid = newPaidAmount >= parseFloat(enrollment.total_amount.toString());

  await supabase
    .from('enrollments')
    .update({
      paid_amount: newPaidAmount,
      payment_status: isFullyPaid ? 'paid' : 'partial',
      deposit_paid: schedule.payment_type === 'deposit' ? true : enrollment.deposit_paid,
    })
    .eq('id', schedule.enrollment_id);
}
