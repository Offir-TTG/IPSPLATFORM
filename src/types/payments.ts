// Payment System Types

export interface Product {
  id: string;
  tenant_id: string;
  product_type: 'program' | 'course' | 'lecture' | 'workshop' | 'custom';
  product_id: string;
  product_name: string;
  price: number;
  currency: string;
  auto_assign_payment_plan: boolean;
  default_payment_plan_id?: string;
  forced_payment_plan_id?: string;
  metadata: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentPlan {
  id: string;
  tenant_id: string;
  plan_name: string;
  plan_description?: string;
  plan_type: 'one_time' | 'deposit' | 'installments' | 'subscription';

  // Deposit fields
  deposit_type?: 'percentage' | 'fixed';
  deposit_amount?: number;
  deposit_percentage?: number;

  // Installment fields
  installment_count?: number;
  installment_frequency?: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  custom_frequency_days?: number;

  // Subscription fields
  subscription_frequency?: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  subscription_trial_days?: number;

  // Auto-detection
  auto_detect_enabled: boolean;
  auto_detect_rules: AutoDetectRule[];
  priority: number;

  // Status
  is_active: boolean;
  is_default: boolean;

  created_at: string;
  updated_at: string;
}

export interface AutoDetectRule {
  condition: 'price_range' | 'product_type' | 'metadata' | 'user_segment' | 'custom';
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'between' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value?: any;
  values?: any[];
  min?: number;
  max?: number;
  field?: string;
}

export interface PaymentSchedule {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  payment_plan_id: string;

  // Schedule details
  payment_number: number;
  payment_type: 'deposit' | 'installment' | 'subscription' | 'full';

  // Amounts
  amount: number;
  currency: string;

  // Dates
  original_due_date: string;
  scheduled_date: string;
  paid_date?: string;

  // Status
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'paused' | 'adjusted' | 'cancelled' | 'refunded';

  // Refund fields (enriched from payments table)
  refunded_amount?: number;
  refunded_at?: string;
  refund_reason?: string;
  payment_status?: string;

  // Payment processing
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  payment_id?: string;

  // Admin controls
  paused_at?: string;
  paused_by?: string;
  paused_reason?: string;
  resumed_at?: string;
  resumed_by?: string;

  // Adjustment history
  adjustment_history: AdjustmentRecord[];
  adjusted_by?: string;
  adjustment_reason?: string;

  // Retry info
  retry_count: number;
  next_retry_date?: string;
  last_error?: string;

  // Notifications
  reminder_sent_at?: string;
  overdue_notice_sent_at?: string;

  created_at: string;
  updated_at: string;
}

export interface AdjustmentRecord {
  timestamp: string;
  admin_id: string;
  admin_name: string;
  action: 'adjust_date' | 'pause' | 'resume' | 'adjust_amount';
  old_date?: string;
  new_date?: string;
  old_amount?: number;
  new_amount?: number;
  reason: string;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  payment_plan_id: string;
  product_id: string;
  user_id: string;

  // Status
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due';

  // Billing
  amount: number;
  currency: string;
  billing_frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';

  // Dates
  start_date: string;
  trial_end_date?: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  ended_at?: string;

  // Stripe
  stripe_subscription_id?: string;
  stripe_customer_id?: string;

  // Admin controls
  paused_at?: string;
  paused_by?: string;
  pause_reason?: string;

  // Cancellation
  cancel_at_period_end: boolean;
  cancelled_by?: string;
  cancellation_reason?: string;

  created_at: string;
  updated_at: string;
}

// API Request/Response Types

export interface RegisterProductRequest {
  product_type: 'program' | 'course' | 'lecture' | 'workshop' | 'custom';
  product_id: string;
  product_name: string;
  price: number;
  currency?: string;
  auto_assign_payment_plan?: boolean;
  default_payment_plan_id?: string;
  forced_payment_plan_id?: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface ProcessEnrollmentRequest {
  user_id: string;
  product_id: string;
  enrollment_data: Record<string, any>;
  payment_plan_id?: string; // Optional override
  payment_start_date?: string; // ISO date for installments
  stripe_payment_method_id?: string; // For immediate payment
}

export interface ProcessEnrollmentResponse {
  enrollment: {
    id: string;
    user_id: string;
    product_id: string;
    payment_plan_id: string;
    total_amount: number;
    paid_amount: number;
    payment_status: string;
    deposit_paid: boolean;
    next_payment_date?: string;
    created_at: string;
  };
  payment_plan: PaymentPlan;
  payment_schedules: PaymentSchedule[];
  immediate_payment?: {
    amount: number;
    stripe_client_secret: string;
    payment_type: 'full' | 'deposit';
  };
}

export interface AdjustScheduleRequest {
  schedule_id: string;
  new_date: string;
  reason: string;
  admin_id: string;
}

export interface PauseEnrollmentRequest {
  enrollment_id: string;
  reason: string;
  admin_id: string;
}

export interface ResumeEnrollmentRequest {
  enrollment_id: string;
  new_start_date?: string;
  admin_id: string;
}

// Enhanced Enrollment with Payment Fields
export interface EnrollmentWithPayment {
  id: string;
  user_id: string;
  tenant_id: string;
  course_id?: string;
  program_id?: string;

  // Payment fields
  product_id?: string;
  payment_plan_id?: string;
  total_amount?: number;
  paid_amount: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  deposit_paid: boolean;
  deposit_amount?: number;
  remaining_amount?: number;
  next_payment_date?: string;
  payment_start_date?: string;
  payment_metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}

// Enhanced Payment with Schedule Fields
export interface PaymentWithSchedule {
  id: string;
  tenant_id: string;
  enrollment_id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';

  // Payment system fields
  product_id?: string;
  payment_plan_id?: string;
  payment_schedule_id?: string;
  subscription_id?: string;
  payment_type?: 'deposit' | 'installment' | 'subscription' | 'full' | 'one_time';
  stripe_invoice_id?: string;
  stripe_customer_id?: string;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}
