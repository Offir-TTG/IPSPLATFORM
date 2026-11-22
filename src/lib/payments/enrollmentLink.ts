import type { SupabaseClient } from '@supabase/supabase-js';
import { hasPaymentStarted, type ScheduleRow } from './dueSchedules';

/**
 * Sending a new enrollment link restarts the wizard (new key, payment
 * progress reset). That's only safe before anything is final: returns why it
 * isn't allowed, or null when it is.
 */
export async function reasonNotToRestart(
  supabase: SupabaseClient,
  enrollmentId: string,
  status: string | null | undefined,
): Promise<string | null> {
  if (status === 'active' || status === 'completed') {
    return 'This client has already finished enrolling, so the enrollment link cannot be sent again.';
  }
  if (status === 'cancelled') {
    return 'This enrollment is cancelled. Create a new enrollment instead.';
  }
  const { data: schedules, error } = await supabase
    .from('payment_schedules')
    .select('id, status')
    .eq('enrollment_id', enrollmentId);
  if (error) return 'Could not check the payments. Please try again.';
  if (hasPaymentStarted((schedules ?? []) as ScheduleRow[])) {
    return 'The client has already paid part of this enrollment, so the link cannot be reset. Ask them to use the link they have, or contact support.';
  }
  return null;
}
