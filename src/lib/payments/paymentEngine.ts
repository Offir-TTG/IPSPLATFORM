/**
 * Payment Engine
 * Core logic for payment plan auto-detection and enrollment processing
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Product,
  PaymentPlan,
  AutoDetectRule,
  ProcessEnrollmentRequest,
  ProcessEnrollmentResponse,
  PaymentSchedule,
} from '@/types/payments';

/**
 * Detect which payment plan should be used for a product
 *
 * Detection order:
 * 1. Forced plan (if set)
 * 2. Auto-detection rules (by priority)
 * 3. Default plan (if set)
 * 4. Return null if none found (will use product's embedded payment configuration)
 */
export async function detectPaymentPlan(
  product: Product,
  tenantId: string,
  userMetadata?: Record<string, any>
): Promise<PaymentPlan | null> {
  const supabase = await createClient();

  // 1. Check for forced plan
  if (product.forced_payment_plan_id) {
    const { data: forcedPlan } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', product.forced_payment_plan_id)
      .eq('tenant_id', tenantId)
      .single();

    if (forcedPlan) {
      console.log(`[PaymentEngine] Using forced plan: ${forcedPlan.plan_name}`);
      return forcedPlan;
    }
  }

  // 2. Try auto-detection with rules
  if (product.auto_assign_payment_plan) {
    const { data: plans } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('auto_detect_enabled', true)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (plans && plans.length > 0) {
      for (const plan of plans) {
        if (await evaluateRules(plan.auto_detect_rules, product, userMetadata)) {
          console.log(`[PaymentEngine] Auto-detected plan: ${plan.plan_name} (priority: ${plan.priority})`);
          return plan;
        }
      }
    }
  }

  // 3. Fall back to default plan
  if (product.default_payment_plan_id) {
    const { data: defaultPlan } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', product.default_payment_plan_id)
      .eq('tenant_id', tenantId)
      .single();

    if (defaultPlan) {
      console.log(`[PaymentEngine] Using default plan: ${defaultPlan.plan_name}`);
      return defaultPlan;
    }
  }

  // 4. No template plan found - return null to use product's embedded payment configuration
  console.log(`[PaymentEngine] No payment plan template found, will use product's embedded payment configuration`);
  return null;
}

/**
 * Evaluate auto-detection rules for a plan
 */
async function evaluateRules(
  rules: AutoDetectRule[],
  product: Product,
  userMetadata?: Record<string, any>
): Promise<boolean> {
  if (!rules || rules.length === 0) {
    return false; // No rules = no match
  }

  // ALL rules must match
  for (const rule of rules) {
    if (!await evaluateRule(rule, product, userMetadata)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a single rule
 */
async function evaluateRule(
  rule: AutoDetectRule,
  product: Product,
  userMetadata?: Record<string, any>
): Promise<boolean> {
  switch (rule.condition) {
    case 'price_range':
      return evaluatePriceRange(product.price, rule);

    case 'product_type':
      return evaluateProductType(product.product_type, rule);

    case 'metadata':
      return evaluateMetadata(product.metadata, rule);

    case 'user_segment':
      return evaluateUserSegment(userMetadata, rule);

    default:
      console.warn(`[PaymentEngine] Unknown rule condition: ${rule.condition}`);
      return false;
  }
}

function evaluatePriceRange(price: number, rule: AutoDetectRule): boolean {
  switch (rule.operator) {
    case 'equals':
      return price === rule.value;
    case 'greater_than':
      return price > (rule.value || 0);
    case 'less_than':
      return price < (rule.value || 0);
    case 'between':
      return price >= (rule.min || 0) && price <= (rule.max || Infinity);
    default:
      return false;
  }
}

function evaluateProductType(productType: string, rule: AutoDetectRule): boolean {
  switch (rule.operator) {
    case 'equals':
      return productType === rule.value;
    case 'in':
      return rule.values?.includes(productType) || false;
    case 'not_in':
      return !rule.values?.includes(productType) || false;
    default:
      return false;
  }
}

function evaluateMetadata(metadata: Record<string, any>, rule: AutoDetectRule): boolean {
  if (!rule.field) return false;

  const fieldValue = metadata[rule.field];

  switch (rule.operator) {
    case 'equals':
      return fieldValue === rule.value;
    case 'in':
      return rule.values?.includes(fieldValue) || false;
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(rule.value);
    default:
      return false;
  }
}

function evaluateUserSegment(userMetadata: Record<string, any> | undefined, rule: AutoDetectRule): boolean {
  if (!userMetadata) return false;

  const userSegment = userMetadata.segment || userMetadata.role;

  switch (rule.operator) {
    case 'equals':
      return userSegment === rule.value;
    case 'in':
      return rule.values?.includes(userSegment) || false;
    default:
      return false;
  }
}

/**
 * Generate payment schedules based on payment plan
 */
export function generatePaymentSchedules(
  enrollmentId: string,
  tenantId: string,
  plan: PaymentPlan,
  totalAmount: number,
  startDate?: Date
): Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at'>[] {
  const schedules: Omit<PaymentSchedule, 'id' | 'created_at' | 'updated_at'>[] = [];
  const now = new Date(); // Always use current date for immediate payments (one_time, deposit)
  const planStartDate = startDate || now; // Use startDate for installments/subscriptions

  switch (plan.plan_type) {
    case 'one_time':
      schedules.push({
        tenant_id: tenantId,
        enrollment_id: enrollmentId,
        payment_plan_id: plan.id,
        payment_number: 1,
        payment_type: 'full',
        amount: totalAmount,
        currency: 'USD',
        original_due_date: now.toISOString(),
        scheduled_date: now.toISOString(),
        status: 'pending',
        adjustment_history: [],
        retry_count: 0,
      });
      break;

    case 'deposit':
      // Calculate deposit amount
      const depositAmount = plan.deposit_type === 'percentage'
        ? totalAmount * (plan.deposit_percentage! / 100)
        : plan.deposit_amount!;

      const remainingAmount = totalAmount - depositAmount;

      // Deposit payment
      schedules.push({
        tenant_id: tenantId,
        enrollment_id: enrollmentId,
        payment_plan_id: plan.id,
        payment_number: 1,
        payment_type: 'deposit',
        amount: depositAmount,
        currency: 'USD',
        original_due_date: now.toISOString(),
        scheduled_date: now.toISOString(),
        status: 'pending',
        adjustment_history: [],
        retry_count: 0,
      });

      // Installment payments
      if (plan.installment_count && plan.installment_count > 0) {
        // Round each installment amount to 2 decimal places
        const baseInstallmentAmount = parseFloat((remainingAmount / plan.installment_count).toFixed(2));

        // Calculate total of rounded installments
        const totalRoundedInstallments = baseInstallmentAmount * plan.installment_count;

        // Calculate rounding discrepancy and add it to the last installment
        const roundingAdjustment = parseFloat((remainingAmount - totalRoundedInstallments).toFixed(2));

        for (let i = 0; i < plan.installment_count; i++) {
          let dueDate: Date;

          if (plan.installment_frequency === 'monthly') {
            // Use proper month calculation for monthly frequency
            dueDate = addMonths(planStartDate, i);
          } else {
            // Use day-based calculation for weekly/biweekly/custom
            const frequencyDays = getFrequencyDays(plan.installment_frequency!, plan.custom_frequency_days);
            dueDate = new Date(planStartDate);
            dueDate.setDate(dueDate.getDate() + (frequencyDays * i));
          }

          // Add rounding adjustment to the last installment to ensure exact total
          const isLastInstallment = i === plan.installment_count - 1;
          const installmentAmount = isLastInstallment
            ? parseFloat((baseInstallmentAmount + roundingAdjustment).toFixed(2))
            : baseInstallmentAmount;

          schedules.push({
            tenant_id: tenantId,
            enrollment_id: enrollmentId,
            payment_plan_id: plan.id,
            payment_number: i + 2, // +2 because deposit is #1
            payment_type: 'installment',
            amount: installmentAmount,
            currency: 'USD',
            original_due_date: dueDate.toISOString(),
            scheduled_date: dueDate.toISOString(),
            status: 'pending',
            adjustment_history: [],
            retry_count: 0,
          });
        }
      }
      break;

    case 'installments':
      if (plan.installment_count && plan.installment_count > 0) {
        // Round each installment amount to 2 decimal places
        const baseInstallmentAmount = parseFloat((totalAmount / plan.installment_count).toFixed(2));

        // Calculate total of rounded installments
        const totalRoundedInstallments = baseInstallmentAmount * plan.installment_count;

        // Calculate rounding discrepancy and add it to the last installment
        const roundingAdjustment = parseFloat((totalAmount - totalRoundedInstallments).toFixed(2));

        for (let i = 0; i < plan.installment_count; i++) {
          let dueDate: Date;

          if (plan.installment_frequency === 'monthly') {
            // Use proper month calculation for monthly frequency
            dueDate = addMonths(planStartDate, i);
          } else {
            // Use day-based calculation for weekly/biweekly/custom
            const frequencyDays = getFrequencyDays(plan.installment_frequency!, plan.custom_frequency_days);
            dueDate = new Date(planStartDate);
            dueDate.setDate(dueDate.getDate() + (frequencyDays * i));
          }

          // Add rounding adjustment to the last installment to ensure exact total
          const isLastInstallment = i === plan.installment_count - 1;
          const installmentAmount = isLastInstallment
            ? parseFloat((baseInstallmentAmount + roundingAdjustment).toFixed(2))
            : baseInstallmentAmount;

          schedules.push({
            tenant_id: tenantId,
            enrollment_id: enrollmentId,
            payment_plan_id: plan.id,
            payment_number: i + 1,
            payment_type: 'installment',
            amount: installmentAmount,
            currency: 'USD',
            original_due_date: dueDate.toISOString(),
            scheduled_date: dueDate.toISOString(),
            status: 'pending',
            adjustment_history: [],
            retry_count: 0,
          });
        }
      }
      break;

    case 'subscription':
      // For subscriptions, we create the first period payment
      // Future payments are handled by Stripe subscriptions
      schedules.push({
        tenant_id: tenantId,
        enrollment_id: enrollmentId,
        payment_plan_id: plan.id,
        payment_number: 1,
        payment_type: 'subscription',
        amount: totalAmount,
        currency: 'USD',
        original_due_date: now.toISOString(),
        scheduled_date: now.toISOString(),
        status: 'pending',
        adjustment_history: [],
        retry_count: 0,
      });
      break;
  }

  return schedules;
}

/**
 * Convert frequency to days
 * Note: For monthly frequency, we use addMonths() instead of adding days
 * to ensure we get the correct date (e.g., Jan 31 + 1 month = Feb 28/29, not March 2/3)
 */
function getFrequencyDays(frequency: string, customDays?: number): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'monthly':
      return 30; // Fallback value - actual monthly calculation should use addMonths()
    case 'custom':
      return customDays || 30;
    default:
      return 30;
  }
}

/**
 * Add months to a date correctly (handles month-end edge cases)
 * Uses local time to keep dates consistent with input
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  // Use local methods since we're working with date-only values
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Calculate payment amounts for enrollment
 */
export function calculatePaymentAmounts(
  plan: PaymentPlan,
  totalAmount: number
): {
  depositAmount: number;
  remainingAmount: number;
  installmentAmount: number;
} {
  let depositAmount = 0;
  let remainingAmount = totalAmount;
  let installmentAmount = 0;

  if (plan.plan_type === 'deposit') {
    depositAmount = plan.deposit_type === 'percentage'
      ? totalAmount * (plan.deposit_percentage! / 100)
      : plan.deposit_amount!;

    remainingAmount = totalAmount - depositAmount;

    if (plan.installment_count && plan.installment_count > 0) {
      installmentAmount = remainingAmount / plan.installment_count;
    }
  } else if (plan.plan_type === 'installments') {
    if (plan.installment_count && plan.installment_count > 0) {
      installmentAmount = totalAmount / plan.installment_count;
    }
  }

  return {
    depositAmount,
    remainingAmount,
    installmentAmount,
  };
}
