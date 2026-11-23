/** One enrollment, as GET /api/admin/enrollments returns it. */
export interface Enrollment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  product_id: string;
  product_name: string;
  product_type: string;
  payment_plan_id: string;
  payment_plan_key: string;
  payment_plan_data?: any;
  payment_model?: string;
  payment_plan?: any;
  total_amount: number;
  paid_amount: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  status: 'draft' | 'pending' | 'active' | 'suspended' | 'cancelled' | 'completed';
  enrollment_type?: 'admin_assigned' | 'self_enrolled';
  next_payment_date?: string;
  payment_start_date?: string;
  enrolled_at?: string;
  created_at: string;
  expires_at?: string | null;
  invitation_sent_at?: string | null;
}

/** One payment in an enrollment's schedule (GET /api/enrollments/[id]/payment). */
export interface ScheduleItem {
  id: string;
  amount: number;
  scheduled_date: string;
  status: string;
  paid_date?: string | null;
  payment_number?: number | null;
  refunded_amount?: number | null;
}

export const ENROLLMENT_STATUSES = ['draft', 'pending', 'active', 'suspended', 'completed', 'cancelled'] as const;
export const PAYMENT_STATUSES = ['paid', 'partial', 'pending', 'overdue'] as const;

/** The status dot colour and the word's colour. */
export const STATUS_TONE: Record<string, { dot: string; text: string }> = {
  draft: { dot: 'bg-slate-400', text: 'text-muted-foreground' },
  pending: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300' },
  active: { dot: 'bg-green-600', text: 'text-green-700 dark:text-green-400' },
  suspended: { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  completed: { dot: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-300' },
  cancelled: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
};

export const PAYMENT_TONE: Record<string, { bar: string; text: string }> = {
  paid: { bar: 'bg-green-600', text: 'text-green-700 dark:text-green-400' },
  partial: { bar: 'bg-primary', text: 'text-primary' },
  pending: { bar: 'bg-primary', text: 'text-muted-foreground' },
  overdue: { bar: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
};
