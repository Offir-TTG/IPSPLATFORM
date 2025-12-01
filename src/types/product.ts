/**
 * Product Types
 *
 * Products are the billing layer that sits above content (programs/courses).
 * All pricing, payment configuration, and enrollment requirements are defined here.
 */

// =====================================================
// Enums & Base Types
// =====================================================

export type ProductType =
  | 'program'      // Links to a program
  | 'course'       // Links to a standalone course
  | 'lecture'      // Individual lecture
  | 'workshop'     // Workshop session
  | 'webinar'      // Webinar session
  | 'session'      // Single session
  | 'session_pack' // Pack of multiple sessions
  | 'bundle'       // Bundle of multiple courses
  | 'custom';      // Custom product type

export type PaymentModel =
  | 'free'              // No payment required
  | 'one_time'          // Single payment
  | 'deposit_then_plan' // Deposit + installments
  | 'subscription';     // Recurring subscription

export type PaymentFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom';

export type DepositType =
  | 'percentage' // Percentage of total price
  | 'fixed'      // Fixed amount
  | 'none';      // No deposit

export type SubscriptionInterval =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'annually';

// =====================================================
// Payment Plan Configuration
// =====================================================

/**
 * Payment Plan Configuration (stored as JSONB in database)
 * Different fields are used based on payment_model:
 *
 * - one_time: {} (empty)
 * - deposit_then_plan: installments, frequency, deposit settings
 * - subscription: subscription_interval, trial_days
 * - free: {} (empty)
 */
export interface PaymentPlanConfig {
  // Installment configuration (for deposit_then_plan)
  installments?: number;
  frequency?: PaymentFrequency;
  custom_frequency_days?: number; // Used when frequency = 'custom'

  // Deposit configuration (for deposit_then_plan)
  deposit_type?: DepositType;
  deposit_amount?: number;        // Used when deposit_type = 'fixed'
  deposit_percentage?: number;    // Used when deposit_type = 'percentage'

  // Plan start date (for deposit_then_plan)
  plan_start_date?: string;       // Exact date when installment plan begins (deposit is immediate)

  // Subscription configuration (for subscription)
  subscription_interval?: SubscriptionInterval;
  trial_days?: number;
}

// =====================================================
// Main Product Interface
// =====================================================

export interface Product {
  // Core fields
  id: string;
  tenant_id: string;

  // Product type & content
  type: ProductType;
  title: string;
  description?: string;

  // Content references
  program_id?: string;         // If type = 'program'
  course_id?: string;          // If type = 'course'
  contains_courses?: string[]; // If type = 'bundle' - array of course IDs
  session_count?: number;      // If type = 'session_pack' - number of sessions

  // DocuSign integration
  requires_signature: boolean;
  signature_template_id?: string;

  // Payment configuration
  payment_model: PaymentModel;
  price?: number;           // NULL if payment_model = 'free'
  currency?: string;        // e.g., 'USD', 'ILS', 'EUR'
  payment_plan: PaymentPlanConfig;

  // Payment plan selection (for products using payment plan templates)
  default_payment_plan_id?: string;         // Default/recommended payment plan
  alternative_payment_plan_ids?: string[];  // Additional payment plan options
  allow_plan_selection?: boolean;           // Allow users to choose plan at checkout

  // Keap integration
  keap_tag?: string | null;

  // Email template configuration
  enrollment_invitation_template_key?: string;    // Template for enrollment invitations
  enrollment_confirmation_template_key?: string;  // Template for enrollment confirmations
  enrollment_reminder_template_key?: string;      // Template for enrollment reminders

  // Status & metadata
  is_active: boolean;
  metadata?: Record<string, any>;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined/computed data (populated when querying with joins)
  program?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
  };
  course?: {
    id: string;
    title: string;
    description?: string;
    image_url?: string;
  };
  bundle_courses?: Array<{
    id: string;
    title: string;
    description?: string;
    image_url?: string;
  }>;
}

// =====================================================
// Form Data Types (for creation/editing)
// =====================================================

export interface ProductFormData {
  type: ProductType;
  title: string;
  description?: string;

  // Content selection
  program_id?: string;
  course_id?: string;
  contains_courses?: string[];
  session_count?: number;

  // DocuSign
  requires_signature: boolean;
  signature_template_id?: string;

  // Payment
  payment_model: PaymentModel;
  price?: number;
  currency?: string;
  payment_plan: PaymentPlanConfig;

  // Payment plan selection
  default_payment_plan_id?: string;
  alternative_payment_plan_ids?: string[];
  allow_plan_selection?: boolean;

  // Keap integration
  keap_tag?: string;

  // Email template configuration
  enrollment_invitation_template_key?: string;
  enrollment_confirmation_template_key?: string;
  enrollment_reminder_template_key?: string;

  // Status
  is_active: boolean;
  metadata?: Record<string, any>;
}

// =====================================================
// Helper Types
// =====================================================

/**
 * Product summary for display in lists
 */
export interface ProductSummary {
  id: string;
  type: ProductType;
  title: string;
  payment_model: PaymentModel;
  price?: number;
  currency?: string;
  is_active: boolean;
  requires_signature: boolean;
  content_name?: string; // Name of linked program/course
}

/**
 * Calculated pricing breakdown
 */
export interface PricingBreakdown {
  total_price: number;
  currency: string;

  // For deposit_then_plan
  deposit_amount?: number;
  installment_amount?: number;
  installment_count?: number;
  frequency?: PaymentFrequency;

  // For subscription
  subscription_amount?: number;
  subscription_interval?: SubscriptionInterval;
  trial_days?: number;
}

// =====================================================
// Validation Types
// =====================================================

export interface ProductValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
}

// =====================================================
// Filter/Query Types
// =====================================================

export interface ProductFilters {
  type?: ProductType;
  payment_model?: PaymentModel;
  is_active?: boolean;
  requires_signature?: boolean;
  search?: string;
}

export interface ProductQueryResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}
