/**
 * Keeps the send log in step with the email queue: when a waiting email
 * leaves, fails or bounces, its message_log row says so. Also the last check
 * before a waiting email leaves, in case the client changed their settings
 * meanwhile. Never throws.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isClientCategory } from './categories';

/**
 * False when the client has since turned this kind of email off, or moved
 * to the daily summary. The log row then says "bell only".
 */
export async function emailStillWanted(
  db: SupabaseClient,
  email: { message_log_id?: string | null; user_id?: string | null },
): Promise<boolean> {
  try {
    if (!email.message_log_id || !email.user_id) return true;
    const { data: log } = await db.from('message_log').select('category, source').eq('id', email.message_log_id).maybeSingle();
    if (!log || !isClientCategory(log.category) || log.source === 'team_alert' || log.source === 'system') return true;
    const { data: p } = await db
      .from('notification_preferences')
      .select('email_enabled, category_preferences, digest_mode')
      .eq('user_id', email.user_id)
      .maybeSingle();
    if (!p) return true;
    const off = p.email_enabled === false || p.category_preferences?.[log.category]?.email === false;
    if (off || p.digest_mode) {
      await db
        .from('message_log')
        .update({ outcome: 'bell_only', reason: off ? 'email_off' : 'digest', send_at: null })
        .eq('id', email.message_log_id);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[messaging] emailStillWanted failed', error);
    return true;
  }
}

/** Records what happened to the email on its log row. */
export async function markLogged(
  db: SupabaseClient,
  messageLogId: string | null | undefined,
  what: 'sent' | 'bounced' | 'send_error',
): Promise<void> {
  if (!messageLogId) return;
  try {
    if (what === 'sent') {
      const { data: log } = await db.from('message_log').select('outcome, notification_id').eq('id', messageLogId).maybeSingle();
      if (!log || (log.outcome !== 'waiting' && log.outcome !== 'email_failed')) return;
      await db
        .from('message_log')
        .update({ outcome: log.notification_id ? 'email_and_bell' : 'email_only', send_at: null })
        .eq('id', messageLogId);
      return;
    }
    await db.from('message_log').update({ outcome: 'email_failed', reason: what, send_at: null }).eq('id', messageLogId);
  } catch (error) {
    console.error('[messaging] markLogged failed', error);
  }
}
