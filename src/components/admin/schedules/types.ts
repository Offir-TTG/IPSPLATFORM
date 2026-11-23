/** One payment in a schedule, as GET /api/admin/payments/schedules returns it. */
export interface PaymentSchedule {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  enrollment_id: string;
  product_id: string;
  product_name: string;
  payment_number: number;
  payment_type: string;
  amount: number;
  currency: string;
  original_due_date: string;
  scheduled_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'paused' | 'failed' | 'cancelled' | 'adjusted' | 'processing';
  retry_count?: number;
  next_retry_date?: string;
  last_error?: string;
}

export const SCHEDULE_STATUSES = ['pending', 'overdue', 'failed', 'processing', 'adjusted', 'paused', 'paid', 'cancelled'] as const;
export const PAYMENT_TYPES = ['deposit', 'installment', 'subscription', 'full', 'manual'] as const;

/** Each status: its dot and word colour. */
export const SCHEDULE_TONE: Record<string, { dot: string; text: string }> = {
  pending: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300' },
  overdue: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300' },
  failed: { dot: 'bg-red-600', text: 'text-red-700 dark:text-red-300' },
  processing: { dot: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  adjusted: { dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  paused: { dot: 'bg-slate-400', text: 'text-muted-foreground' },
  paid: { dot: 'bg-green-600', text: 'text-green-700 dark:text-green-400' },
  cancelled: { dot: 'bg-slate-400', text: 'text-muted-foreground' },
};
