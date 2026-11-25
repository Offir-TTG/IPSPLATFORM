import { createClient, createAdminClient } from '@/lib/supabase/server';
import { deleteEnrollmentsWithCharges } from '@/lib/payments/deleteEnrollments';
import { detectPaymentPlan, generatePaymentSchedules } from './paymentEngine';
import { getProduct } from './productService';
import { Product, PaymentPlan, PaymentSchedule } from '@/types/payments';
import type Stripe from 'stripe';
import { getStripeClient } from './getStripeClient';
import { refreshEnrollmentTotals } from './dueSchedules';
import {
  closeUnpaidInvoice,
  loadRefundablePayments,
  refundPayment,
  refundableCents,
  type RefundablePayment,
} from './refunds';

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

  // 2. Detect payment plan or use product's embedded configuration
  let detectedPlanTemplate = await detectPaymentPlan(product, tenant_id, user_metadata);
  let paymentPlan: PaymentPlan;
  let usingSyntheticPlan = false;

  if (detectedPlanTemplate) {
    // Using payment plan template
    paymentPlan = detectedPlanTemplate;
    console.log(`[EnrollmentService] Using payment plan template: ${paymentPlan.plan_name}`);
  } else {
    // No template - create synthetic plan from product's payment configuration
    console.log(`[EnrollmentService] Creating synthetic payment plan from product configuration`);

    // Fetch product with payment model to create synthetic payment plan
    const { data: productWithPaymentInfo } = await supabase
      .from('products')
      .select('payment_model, payment_plan')
      .eq('id', product_id)
      .eq('tenant_id', tenant_id)
      .single();

    if (!productWithPaymentInfo) {
      throw new Error('Product payment configuration not found');
    }

    const paymentModel = productWithPaymentInfo.payment_model;
    const paymentConfig = productWithPaymentInfo.payment_plan || {};

    // Create synthetic payment plan based on product's payment model
    if (paymentModel === 'one_time') {
      paymentPlan = {
        id: null as any,
        tenant_id,
        plan_name: 'One-Time Payment',
        plan_type: 'one_time',
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else if (paymentModel === 'deposit_then_plan') {
      paymentPlan = {
        id: null as any,
        tenant_id,
        plan_name: `Deposit + ${paymentConfig.installments || 1} Installments`,
        plan_type: 'deposit',
        deposit_type: paymentConfig.deposit_type || 'percentage',
        deposit_amount: paymentConfig.deposit_amount,
        deposit_percentage: paymentConfig.deposit_percentage,
        installment_count: paymentConfig.installments || 1,
        installment_frequency: paymentConfig.frequency || 'monthly',
        custom_frequency_days: paymentConfig.custom_frequency_days,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else if (paymentModel === 'subscription') {
      paymentPlan = {
        id: null as any,
        tenant_id,
        plan_name: 'Subscription',
        plan_type: 'subscription',
        subscription_frequency: paymentConfig.subscription_interval || 'monthly',
        subscription_trial_days: paymentConfig.trial_days,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else if (paymentModel === 'per_session') {
      // Pay as you go: nothing at enrollment; each held session is charged.
      paymentPlan = {
        id: null as any,
        tenant_id,
        plan_name: 'Per session',
        plan_type: 'per_session',
        session_amount: paymentConfig.session_amount ?? null,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
    } else if (paymentModel === 'free') {
      paymentPlan = {
        id: null as any,
        tenant_id,
        plan_name: 'Free',
        plan_type: 'one_time',
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } else {
      throw new Error(`Unsupported payment model: ${paymentModel}`);
    }

    usingSyntheticPlan = true;
  }

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
      payment_plan_id: usingSyntheticPlan ? null : paymentPlan.id, // Only set if using template, not synthetic plan
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
        using_product_payment_config: usingSyntheticPlan, // Track if using product's embedded config
      },
    })
    .select()
    .single();

  if (enrollmentError || !enrollment) {
    throw new Error(`Failed to create enrollment: ${enrollmentError?.message}`);
  }

  // Trigger enrollment.created event
  try {
    const { processTriggerEvent } = await import('@/lib/email/triggerEngine');
    await processTriggerEvent({
      eventType: 'enrollment.created',
      tenantId: tenant_id,
      eventData: {
        enrollmentId: enrollment.id,
        userId: user_id,
        productId: product_id,
        productName: product.product_name,
        productType: product.product_type,
        totalAmount: totalAmount,
        paymentStatus: 'pending',
        email: user_metadata?.email,
        userName: user_metadata?.name || user_metadata?.first_name,
        languageCode: user_metadata?.language || 'en',
      },
      userId: user_id,
      metadata: {
        enrollmentType: 'admin_created',
        ...metadata,
      },
    });
  } catch (triggerError) {
    console.error('Error processing enrollment.created trigger:', triggerError);
    // Don't fail enrollment if trigger fails
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
    paymentStartDate,
    product.currency
  );

  // 6. Insert payment schedules
  const { data: insertedSchedules, error: schedulesError } = await supabase
    .from('payment_schedules')
    .insert(schedules)
    .select();

  if (schedulesError || !insertedSchedules) {
    // Rollback enrollment if schedule creation fails
    await deleteEnrollmentsWithCharges(supabase as any, [enrollment.id]);
    throw new Error(`Failed to create payment schedules: ${schedulesError?.message}`);
  }

  // 7. Future installments are charged to the saved card on their due date by
  //    the daily cron (create-payment-invoices). Nothing is created ahead.

  // 8. Update enrollment with next payment date
  const nextSchedule = insertedSchedules.find(s => s.status === 'pending');
  if (nextSchedule) {
    await supabase
      .from('enrollments')
      .update({ next_payment_date: nextSchedule.scheduled_date })
      .eq('id', enrollment.id);
  }

  // 9. Create Stripe payment intent for immediate payment (if required)
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

    // No charge is opened here. This used the platform's own Stripe key (not
    // the tenant's), so a payment made on it reached no tenant and was never
    // recorded. The client pays on the enrollment's payment step, which uses
    // the tenant's Stripe account.
    void immediateAmount;
    void paymentType;
    void scheduleId;
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
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: enrollment.created_at,
        updated_at: enrollment.created_at,
      };
    } else if (paymentModel === 'per_session') {
      // Pay as you go: nothing at enrollment; each held session is charged.
      paymentPlan = {
        id: null as any,
        tenant_id,
        plan_name: 'Per session',
        plan_type: 'per_session',
        session_amount: paymentConfig.session_amount ?? null,
        is_active: true,
        auto_detect_enabled: false,
        auto_detect_rules: [],
        priority: 0,
        is_default: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
    } else if (paymentModel === 'free') {
      paymentPlan = {
        id: null as any, // Synthetic plan - no payment_plan_id in schedules
        tenant_id,
        plan_name: 'Free',
        plan_type: 'one_time',
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
      // A membership pays today's price (a scheduled change may have moved it
      // since the signup link was made); the enrollment's total follows.
      const currentPrice = Number((product as any).price);
      const firstTotal =
        paymentPlan?.plan_type === 'subscription' && currentPrice > 0 ? currentPrice : enrollment.total_amount;
      if (firstTotal !== enrollment.total_amount) {
        await supabase.from('enrollments').update({ total_amount: firstTotal }).eq('id', enrollment_id);
        enrollment.total_amount = firstTotal;
      }

      const generatedSchedules = generatePaymentSchedules(
        enrollment_id,
        tenant_id,
        paymentPlan,
        firstTotal,
        startDate,
        enrollment.currency || product.currency
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
          // Another request created them a moment earlier (unique payment
          // number per enrollment). Use those, never an empty list, which
          // would make the pay page think nothing is due.
          console.error('[EnrollmentService] Error creating payment schedules:', scheduleError);
          const { data: existingSchedules } = await supabase
            .from('payment_schedules')
            .select('*')
            .eq('enrollment_id', enrollment_id)
            .eq('tenant_id', tenant_id)
            .order('payment_number', { ascending: true });
          if (existingSchedules && existingSchedules.length > 0) {
            schedules = existingSchedules;
          } else {
            throw new Error('Could not create the payment schedule');
          }
        }
      }
    } catch (error) {
      console.error('[EnrollmentService] Error generating schedules on-demand:', error);
    }
  }

  // Get payments with refund information
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .eq('enrollment_id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false });

  // DEBUG: Log payment fetch results
  console.log('[EnrollmentService] Fetched payments:', {
    count: payments?.length || 0,
    error: paymentsError,
    enrollment_id,
    tenant_id
  });

  if (paymentsError) {
    console.error('[EnrollmentService] Error fetching payments:', paymentsError);
  }

  // Create payment lookup map by schedule_id to enrich schedules with refund data
  const paymentsBySchedule = new Map();
  payments?.forEach((payment: any) => {
    if (payment.payment_schedule_id) {
      paymentsBySchedule.set(payment.payment_schedule_id, payment);
      console.log('[EnrollmentService] Payment for schedule:', {
        schedule_id: payment.payment_schedule_id.substring(0, 8),
        refunded_amount: payment.refunded_amount,
        status: payment.status
      });
    }
  });

  // Enrich schedules with refund information from payments
  const enrichedSchedules = schedules?.map((schedule: any) => {
    const payment = paymentsBySchedule.get(schedule.id);

    // If there's a payment record with refund data, add it to the schedule
    if (payment && (payment.refunded_amount || payment.status === 'refunded' || payment.status === 'partially_refunded')) {
      return {
        ...schedule,
        refunded_amount: payment.refunded_amount ? parseFloat(payment.refunded_amount) : 0,
        refunded_at: payment.refunded_at,
        refund_reason: payment.refund_reason,
        payment_status: payment.status, // Add actual payment status for accurate display
      };
    }

    return schedule;
  }) || [];

  // Calculate installment amount if applicable
  let installmentAmount: number | undefined;
  if (paymentPlan && paymentPlan.plan_type === 'deposit' && paymentPlan.installment_count > 0) {
    // Find installment schedules (exclude deposit)
    const installmentSchedules = enrichedSchedules?.filter((s: any) => s.payment_type === 'installment') || [];
    if (installmentSchedules.length > 0) {
      // Use the amount from the first installment schedule
      installmentAmount = installmentSchedules[0].amount;
    } else {
      // Calculate from remaining balance
      const depositAmount = paymentPlan.deposit_amount || 0;
      const remainingBalance = enrollment.total_amount - depositAmount;
      installmentAmount = remainingBalance / paymentPlan.installment_count;
    }
  }

  return {
    enrollment,
    product,
    payment_plan: paymentPlan ? {
      ...paymentPlan,
      installment_amount: installmentAmount
    } : paymentPlan,
    schedules: enrichedSchedules,
    payments: payments || [],
  };
}

/** A cancel request the admin needs to fix, with the HTTP status to answer. */
export class CancelEnrollmentError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export type CancelEnrollmentResult = {
  /** What was actually refunded, in the enrollment's currency. */
  refunded: number;
  /** Set when the enrollment was cancelled but the refund didn't (fully) go through. */
  refundError?: string;
  /** Unpaid Stripe invoices voided so the client can't pay them any more. */
  invoicesClosed: number;
  /** Payments left alone because the client paid or is paying them right now. */
  leftOpen: number;
};

/** Every schedule status that still means money could be collected. */
const OPEN_SCHEDULE_STATUSES = ['pending', 'paused', 'adjusted', 'failed', 'overdue', 'processing'];
const CANCELABLE_INTENT = new Set(['requires_payment_method', 'requires_confirmation', 'requires_action', 'requires_capture']);

/**
 * Cancels an enrollment: nothing more is collected (unpaid invoices voided,
 * open charges cancelled, every unpaid payment cancelled) and, if asked, the
 * refund is made from the tenant's Stripe account across the paid payments,
 * newest first. A refund that fails is reported back, never hidden.
 */
export async function cancelEnrollment(
  enrollment_id: string,
  tenant_id: string,
  reason: string,
  admin_id: string,
  refund_amount?: number,
  admin_email?: string | null,
  /** More to keep with the cancellation (e.g. cancelled_by_client), stored in payment_metadata. */
  extra_metadata?: Record<string, unknown>,
): Promise<CancelEnrollmentResult> {
  const supabase = createAdminClient();

  const { data: enrollment, error: findError } = await supabase
    .from('enrollments')
    .select('id, status, payment_metadata')
    .eq('id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();
  if (findError) throw new CancelEnrollmentError(findError.message, 500);
  if (!enrollment) throw new CancelEnrollmentError('Enrollment not found', 404);
  if (enrollment.status === 'cancelled') {
    throw new CancelEnrollmentError('This enrollment is already cancelled. Refund payments from the payments page.', 409);
  }

  const requestedCents = Math.round(Number(refund_amount ?? 0) * 100);
  if (!Number.isFinite(requestedCents) || requestedCents < 0) {
    throw new CancelEnrollmentError('Refund amount must be zero or more', 400);
  }

  let stripe: Stripe | null = null;
  try {
    stripe = (await getStripeClient(tenant_id)).stripe;
  } catch {
    stripe = null;
  }

  // Check the refund can be made before changing anything.
  let refundable: RefundablePayment[] = [];
  if (requestedCents > 0) {
    if (!stripe) throw new CancelEnrollmentError('Stripe is not set up, so no refund can be made', 400);
    const loaded = await loadRefundablePayments(supabase, tenant_id, enrollment_id);
    if (!loaded.ok) throw new CancelEnrollmentError(loaded.error, 500);
    refundable = loaded.payments;
    const available = refundable.reduce((sum, p) => sum + refundableCents(p), 0);
    if (requestedCents > available) {
      throw new CancelEnrollmentError(
        `Only ${(available / 100).toFixed(2)} was paid by card and can be refunded`,
        400,
      );
    }
  }

  // Claim the cancellation, so two clicks can't both go on to refund.
  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await supabase
    .from('enrollments')
    .update({
      status: 'cancelled',
      payment_status: 'cancelled',
      payment_metadata: {
        ...((enrollment.payment_metadata as Record<string, unknown> | null) ?? {}),
        cancelled_at: now,
        cancelled_by: admin_id,
        cancellation_reason: reason,
        refund_requested: requestedCents / 100,
        ...(extra_metadata ?? {}),
      },
      updated_at: now,
    })
    .eq('id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .neq('status', 'cancelled')
    .select('id');
  if (claimError) throw new CancelEnrollmentError(`Failed to cancel enrollment: ${claimError.message}`, 500);
  if (!claimed || claimed.length === 0) {
    throw new CancelEnrollmentError('This enrollment is already cancelled', 409);
  }

  // Stop collecting: close unpaid invoices and open charges, then cancel the
  // payments. One the client has already paid is left for the webhook to record.
  const { data: openSchedules, error: schedulesError } = await supabase
    .from('payment_schedules')
    .select('id, status, stripe_invoice_id, stripe_payment_intent_id')
    .eq('enrollment_id', enrollment_id)
    .eq('tenant_id', tenant_id)
    .in('status', OPEN_SCHEDULE_STATUSES);
  if (schedulesError) throw new CancelEnrollmentError(schedulesError.message, 500);

  let invoicesClosed = 0;
  let leftOpen = 0;
  const toCancel: string[] = [];
  for (const schedule of openSchedules ?? []) {
    if (stripe && schedule.stripe_invoice_id) {
      const closed = await closeUnpaidInvoice(stripe, schedule.stripe_invoice_id);
      if (closed === 'paid' || typeof closed === 'object') {
        leftOpen++;
        continue;
      }
      if (closed === 'closed') invoicesClosed++;
    } else if (stripe && schedule.stripe_payment_intent_id) {
      try {
        const intent = await stripe.paymentIntents.retrieve(schedule.stripe_payment_intent_id);
        if (intent.status === 'succeeded' || intent.status === 'processing') {
          leftOpen++;
          continue;
        }
        if (CANCELABLE_INTENT.has(intent.status)) {
          await stripe.paymentIntents.cancel(intent.id);
        }
      } catch (error: any) {
        if (error?.code !== 'resource_missing') {
          leftOpen++;
          continue;
        }
      }
    } else if (schedule.status === 'processing') {
      // A charge is underway and Stripe can't be asked about it.
      leftOpen++;
      continue;
    }
    toCancel.push(schedule.id);
  }

  if (toCancel.length > 0) {
    const { error: cancelError } = await supabase
      .from('payment_schedules')
      .update({ status: 'cancelled', updated_at: now })
      .in('id', toCancel);
    if (cancelError) throw new CancelEnrollmentError(`Failed to cancel the payments: ${cancelError.message}`, 500);
  }

  // Refund, newest payment first.
  let refundedCents = 0;
  let refundError: string | undefined;
  for (const payment of refundable) {
    const remaining = requestedCents - refundedCents;
    if (remaining <= 0) break;
    const take = Math.min(remaining, refundableCents(payment));
    const result = await refundPayment(supabase, stripe as Stripe, payment, take, {
      tenantId: tenant_id,
      enrollmentId: enrollment_id,
      reason,
      adminId: admin_id,
      adminEmail: admin_email,
    });
    if (!result.ok) {
      refundError = result.error;
      break;
    }
    refundedCents += take;
  }

  await refreshEnrollmentTotals(supabase, enrollment_id);
  const { data: after } = await supabase
    .from('enrollments')
    .select('paid_amount, payment_metadata')
    .eq('id', enrollment_id)
    .maybeSingle();
  const everythingRefunded = refundedCents > 0 && Number(after?.paid_amount ?? 0) <= 0;
  await supabase
    .from('enrollments')
    .update({
      payment_status: everythingRefunded ? 'refunded' : 'cancelled',
      payment_metadata: {
        ...((after?.payment_metadata as Record<string, unknown> | null) ?? {}),
        refund_amount: refundedCents / 100,
        ...(refundError ? { refund_error: refundError } : {}),
      },
    })
    .eq('id', enrollment_id);

  return { refunded: refundedCents / 100, refundError, invoicesClosed, leftOpen };
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
  // Service-role client (bypasses RLS). Admin gate + tenant isolation
  // are enforced at the API route layer; we still filter by tenant_id
  // explicitly on each query below as defense-in-depth.
  const supabase = createAdminClient();

  // Get schedule
  // Read separately: the database has no schedule→enrollment relationship
  // to join on, so the joined query this used always failed and recording a
  // payment by hand never worked.
  const { data: scheduleRow } = await supabase
    .from('payment_schedules')
    .select('*')
    .eq('id', schedule_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();

  if (!scheduleRow) {
    throw new Error('Payment schedule not found');
  }
  const { data: scheduleEnrollment } = await supabase
    .from('enrollments')
    .select('id, user_id, product_id')
    .eq('id', scheduleRow.enrollment_id)
    .eq('tenant_id', tenant_id)
    .maybeSingle();
  if (!scheduleEnrollment) {
    throw new Error('Enrollment not found');
  }
  const schedule = { ...scheduleRow, enrollments: scheduleEnrollment };

  if (schedule.status === 'paid') {
    throw new Error('Payment schedule is already paid');
  }
  if (['cancelled', 'refunded'].includes(schedule.status)) {
    throw new Error(`This payment is ${schedule.status}, so it can't be recorded as paid`);
  }
  if (schedule.status === 'processing') {
    throw new Error('This payment is being charged to the card right now. Wait for the result before recording it by hand.');
  }

  // Paid outside Stripe: make any Stripe invoice or open charge for it
  // unpayable, so the client can't be charged for it as well.
  if (schedule.stripe_invoice_id || schedule.stripe_payment_intent_id) {
    let stripe: Stripe | null = null;
    try {
      stripe = (await getStripeClient(tenant_id)).stripe;
    } catch {
      stripe = null;
    }
    if (stripe && schedule.stripe_invoice_id) {
      const closed = await closeUnpaidInvoice(stripe, schedule.stripe_invoice_id);
      if (closed === 'paid') throw new Error('The client already paid this by card. Refresh the page.');
      if (typeof closed === 'object') throw new Error(`Could not close the Stripe invoice: ${closed.error}`);
    } else if (stripe && schedule.stripe_payment_intent_id) {
      const intent = await stripe.paymentIntents.retrieve(schedule.stripe_payment_intent_id).catch(() => null);
      if (intent?.status === 'succeeded' || intent?.status === 'processing') {
        throw new Error('The client already paid this by card. Refresh the page.');
      }
      if (intent && CANCELABLE_INTENT.has(intent.status)) {
        await stripe.paymentIntents.cancel(intent.id).catch(() => null);
      }
    }
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id,
      user_id: schedule.enrollments.user_id,
      enrollment_id: schedule.enrollment_id,
      payment_schedule_id: schedule_id,
      product_id: schedule.enrollments.product_id ?? null,
      payment_type: schedule.payment_type,
      installment_number: schedule.payment_number,
      paid_at: new Date().toISOString(),
      amount: schedule.amount,
      currency: schedule.currency,
      payment_method,
      transaction_id: transaction_reference || `manual_${Date.now()}`,
      status: 'paid',
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

  const { error: scheduleError } = await supabase
    .from('payment_schedules')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString(),
      payment_id: payment.id,
      next_retry_date: null,
      last_error: null,
    })
    .eq('id', schedule_id);
  if (scheduleError) {
    throw new Error(`Payment saved but the schedule wasn't updated: ${scheduleError.message}`);
  }

  // Paid amount and status worked out from the schedules (also restores
  // access after an overdue suspension).
  const totals = await refreshEnrollmentTotals(supabase, schedule.enrollment_id);
  if (!totals.ok) throw new Error(`Payment saved but the enrollment wasn't updated: ${totals.error}`);
}

/**
 * Record a *standalone* (off-schedule) manual payment.
 *
 * Unlike `recordManualPayment`, this isn't tied to any `payment_schedules`
 * row — used for one-off payments that don't fit the installment plan:
 *   • Customer over-paid an installment (apply credit later)
 *   • Application / late fee
 *   • Pre-payment before any enrollment exists
 *
 * If `enrollment_id` is provided, the payment rolls up into that
 *   enrollment's `paid_amount` and `payment_status` is recomputed.
 * If `enrollment_id` is null, the payment is logged against the user
 *   only — visible in the customer's lifetime spend but not tied to any
 *   specific enrollment.
 *
 * No `payment_schedules` rows are touched in either case.
 */
export async function recordStandalonePayment(
  tenant_id: string,
  admin_id: string,
  payload: {
    user_id: string;
    enrollment_id?: string | null;
    amount: number;
    currency?: string;
    payment_method: string;
    transaction_reference?: string;
    notes?: string;
    payment_date?: string; // ISO; defaults to now
  },
): Promise<{ payment_id: string }> {
  if (!payload.user_id) throw new Error('user_id required');
  if (!(payload.amount > 0)) throw new Error('amount must be > 0');
  if (!payload.payment_method) throw new Error('payment_method required');

  // Service-role client (bypasses RLS). The admin gate + tenant isolation
  // are enforced at the API route layer (verifyTenantAdmin) and via the
  // explicit tenant_id filter on every query below — RLS would only
  // re-do the same check at a layer that doesn't know who the caller is.
  const supabase = createAdminClient();

  // Verify user belongs to this tenant — prevents an admin from one
  // tenant logging a payment against another tenant's user.
  const { data: userRow, error: userErr } = await supabase
    .from('users')
    .select('id, tenant_id')
    .eq('id', payload.user_id)
    .single();
  if (userErr || !userRow) throw new Error('User not found');
  if (userRow.tenant_id !== tenant_id) throw new Error('User belongs to a different tenant');

  // If linked to an enrollment, verify it belongs to this user + tenant.
  // We need the current paid_amount / total_amount to recompute the
  // payment_status after the insert.
  let enrollment:
    | {
        id: string;
        paid_amount: number;
        total_amount: number;
        payment_status: string | null;
      }
    | null = null;
  if (payload.enrollment_id) {
    const { data: enr, error: enrErr } = await supabase
      .from('enrollments')
      .select('id, user_id, tenant_id, paid_amount, total_amount, payment_status')
      .eq('id', payload.enrollment_id)
      .single();
    if (enrErr || !enr) throw new Error('Enrollment not found');
    if (enr.tenant_id !== tenant_id) throw new Error('Enrollment belongs to a different tenant');
    if (enr.user_id !== payload.user_id)
      throw new Error('Enrollment does not belong to the selected user');
    enrollment = {
      id: enr.id,
      paid_amount: parseFloat(String(enr.paid_amount ?? 0)),
      total_amount: parseFloat(String(enr.total_amount ?? 0)),
      payment_status: enr.payment_status,
    };
  }

  // Insert the payment. payment_type is 'one_time' since there's no
  // schedule semantically classifying it as a deposit/installment.
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id,
      user_id: payload.user_id,
      enrollment_id: payload.enrollment_id ?? null,
      amount: payload.amount,
      currency: payload.currency || 'USD',
      payment_method: payload.payment_method,
      transaction_id: payload.transaction_reference || `manual_${Date.now()}`,
      status: 'paid',
      payment_type: 'one_time',
      metadata: {
        recorded_by: admin_id,
        notes: payload.notes,
        payment_type: 'manual_standalone',
        payment_date: payload.payment_date ?? new Date().toISOString(),
      },
    })
    .select('id')
    .single();

  if (paymentError || !payment) {
    throw new Error(`Failed to create payment record: ${paymentError?.message ?? 'unknown'}`);
  }

  // If linked to an enrollment:
  //   1. Mirror the payment as a payment_schedules row so it appears in
  //      the schedules list with a distinctive payment_type='manual'
  //      tag and is filterable like any other schedule.
  //   2. Recompute paid_amount + payment_status on the enrollment.
  //   We don't touch deposit_paid because a standalone manual payment
  //   isn't a deposit by definition.
  if (enrollment) {
    // Assign the next payment_number for this enrollment to satisfy
    // UNIQUE(enrollment_id, payment_number). MAX() is fine here — manual
    // entries are infrequent, no race-condition risk in practice.
    const { data: existing } = await supabase
      .from('payment_schedules')
      .select('payment_number')
      .eq('enrollment_id', enrollment.id)
      .order('payment_number', { ascending: false })
      .limit(1);
    const nextPaymentNumber =
      existing && existing.length > 0
        ? (existing[0].payment_number as number) + 1
        : 1;

    const nowIso = new Date().toISOString();
    const { data: scheduleRow, error: scheduleError } = await supabase.from('payment_schedules').insert({
      tenant_id,
      enrollment_id: enrollment.id,
      payment_plan_id: null, // manual entries don't belong to a plan
      payment_number: nextPaymentNumber,
      payment_type: 'manual',
      amount: payload.amount,
      currency: payload.currency || 'USD',
      original_due_date: payload.payment_date ?? nowIso,
      scheduled_date: payload.payment_date ?? nowIso,
      paid_date: payload.payment_date ?? nowIso,
      status: 'paid',
      payment_id: payment.id,
    }).select('id').single();
    if (scheduleError || !scheduleRow) {
      throw new Error(`Payment recorded but not added to the enrollment: ${scheduleError?.message ?? 'unknown'}`);
    }
    // Link both ways, so refunds and reports find the payment from its schedule.
    await supabase.from('payments').update({ payment_schedule_id: scheduleRow.id }).eq('id', payment.id);

    // Paid amount and status come from the schedules, the same way as every
    // other payment (a hand-rolled sum said "partial" on a $0-total enrollment).
    const refreshed = await refreshEnrollmentTotals(supabase, enrollment.id);
    if (!refreshed.ok) throw new Error(`Payment recorded but totals not updated: ${refreshed.error}`);
  }

  return { payment_id: payment.id };
}
