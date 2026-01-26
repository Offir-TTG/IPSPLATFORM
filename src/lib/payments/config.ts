/**
 * Payment System Configuration
 *
 * Central configuration for the automatic recurring payment system.
 * Controls grace periods, retry logic, invoice generation, and notifications.
 */

export const PAYMENT_CONFIG = {
  // Grace period for course access
  // Users have this many days after payment is due before access is blocked
  gracePeriodDays: 7,

  // Retry settings for failed payments
  maxRetries: 3,
  retryIntervals: [1, 3, 7], // days: 1st retry after 1 day, 2nd after 3 days, 3rd after 7 days

  // Invoice generation window
  // Create invoices this many days ahead of due date
  invoiceCreationWindow: 30, // days ahead to create invoices

  // Payment reminder notifications
  // Send reminders before payment is due
  reminderDaysBeforeDue: [7, 3, 1], // Send reminders 7, 3, and 1 day before due

  // Overdue payment notices
  // Send overdue notices after payment is due
  overdueDaysForNotice: [1, 7, 14], // Send overdue notices at 1, 7, and 14 days overdue
};

/**
 * Get the next retry date for a failed payment based on retry count
 *
 * @param retryCount - Current retry count (0-based)
 * @returns Date of next retry, or null if max retries exceeded
 */
export function getNextRetryDate(retryCount: number): Date | null {
  if (retryCount >= PAYMENT_CONFIG.maxRetries) {
    return null; // Max retries exceeded
  }

  const daysToAdd = PAYMENT_CONFIG.retryIntervals[retryCount] || PAYMENT_CONFIG.retryIntervals[PAYMENT_CONFIG.retryIntervals.length - 1];
  const nextRetry = new Date();
  nextRetry.setDate(nextRetry.getDate() + daysToAdd);

  return nextRetry;
}

/**
 * Check if a payment is past the grace period
 *
 * @param dueDate - Original due date of payment
 * @returns true if past grace period, false otherwise
 */
export function isPastGracePeriod(dueDate: Date): boolean {
  const now = new Date();
  const gracePeriodEnd = new Date(dueDate.getTime() + PAYMENT_CONFIG.gracePeriodDays * 24 * 60 * 60 * 1000);
  return now > gracePeriodEnd;
}
