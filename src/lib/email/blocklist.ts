/**
 * Email-address deliverability gate.
 *
 * Backed by the `bounce_type` column on `email_queue` (see migration
 * 20260528_email_bounce_tracking.sql). Once any past send to an
 * address has been classified `hard`, all future sends via `sendEmail`
 * short-circuit before SMTP handoff.
 *
 * Lookup goes through the `is_email_hard_bounced(p_email)` SQL
 * function so the planner uses the partial index on
 * `lower(to_email) where bounce_type = 'hard'` — a PostgREST `ilike`
 * filter would force a scan.
 *
 * Fail-open on DB error: a transient query failure should not silently
 * suppress every send. Matches the posture of
 * `isUserEligibleForCommunication`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export async function isEmailDeliverable(
  supabase: SupabaseClient,
  email: string,
): Promise<boolean> {
  if (!email) return false;
  const trimmed = email.trim();
  if (!trimmed) return false;

  const { data, error } = await supabase.rpc('is_email_hard_bounced', {
    p_email: trimmed,
  });

  if (error) {
    console.error(
      '[blocklist] isEmailDeliverable RPC failed; treating as deliverable:',
      error.message,
    );
    return true;
  }
  return data !== true;
}

/**
 * Mark a queue row's send result as a bounce of the given class.
 * Only `hard` participates in the deliverability gate today; `soft`
 * and `complaint` are recorded for visibility but do not block.
 */
export async function recordQueueBounce(
  supabase: SupabaseClient,
  emailQueueId: string,
  bounceType: 'hard' | 'soft' | 'complaint',
): Promise<void> {
  const { error } = await supabase
    .from('email_queue')
    .update({ bounce_type: bounceType })
    .eq('id', emailQueueId);
  if (error) {
    console.error(
      '[blocklist] recordQueueBounce failed for queue row',
      emailQueueId,
      error.message,
    );
  }
}
