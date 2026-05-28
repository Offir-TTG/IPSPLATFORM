/**
 * Cron Job: Process Email Queue
 * Processes pending emails in the queue and sends them via SMTP
 * Renders templates with variables before sending
 *
 * Schedule: Every 2 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { recordQueueBounce } from '@/lib/email/blocklist';
import { isUserEligibleForCommunication } from '@/lib/users/communication-eligible';
import { runCron } from '@/lib/cron/withCronLogging';
import Handlebars from 'handlebars';
import { ensureHandlebarsHelpers } from '@/lib/email/handlebarsHelpers';

// Registers eq/or/and/gt/lt/formatCurrency/formatDate/formatTime
// helpers on the shared Handlebars singleton. Called explicitly
// (not a bare side-effect import) so webpack can't tree-shake it —
// that's exactly the bug that brought back "Missing helper: eq".
ensureHandlebarsHelpers();

// Reads request-scoped APIs (cookies / searchParams / dynamic params) —
// must run per-request, never pre-rendered.
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET || 'K8mX2vN9pL5wQ3yT7hJ6fR4aZ1cD0gH3';
const BATCH_SIZE = 10; // Process 10 emails per run

// All Handlebars helpers (formatDate, formatTime, eq, or, and, gt,
// lt, formatCurrency) are registered by the side-effect import of
// `handlebarsHelpers` above. Don't re-register here — that would
// silently override with helpers that differ in locale handling.

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[Email Queue Cron] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCron('process-email-queue', async ({ dryRun }) => {
    console.log('[Email Queue Cron] Starting email queue processing...', { dryRun });

    const supabase = createAdminClient();
    const now = new Date();

    // Find pending emails that are ready to send
    // Include emails with no scheduled_for OR scheduled_for <= now
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .or(`scheduled_for.is.null,scheduled_for.lte.${now.toISOString()}`)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw new Error(`Failed to fetch emails: ${fetchError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('[Email Queue Cron] No pending emails to process');
      return {
        success: true,
        message: 'No pending emails',
        processed: 0,
      };
    }

    console.log(`[Email Queue Cron] Found ${pendingEmails.length} pending emails to process`);

    if (dryRun) {
      return {
        success: true,
        dry_run: true,
        would_send: pendingEmails.length,
        message: `Dry-run enabled; would send ${pendingEmails.length} emails`,
      };
    }

    let successCount = 0;
    let failCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        console.log(`[Email Queue Cron] Processing email ${email.id} to ${email.to_email}`);

        // Last-mile communication-eligibility recheck. The email was
        // gated when it was queued, but the user may have been
        // deactivated or suspended in the meantime. Mark as failed so
        // it doesn't get picked up on the next cron tick.
        if (email.user_id) {
          const eligible = await isUserEligibleForCommunication(
            supabase,
            email.user_id,
          );
          if (!eligible) {
            console.log(
              `[Email Queue Cron] Skipping email ${email.id} — recipient ${email.user_id} is inactive/suspended`,
            );
            await supabase
              .from('email_queue')
              .update({ status: 'failed' })
              .eq('id', email.id);
            failCount++;
            continue;
          }
        }

        // Render template variables in subject, body_html, and body_text
        const variables = email.template_variables || {};

        // Add language to variables for formatters
        variables.language = email.language_code || 'en';

        const subjectTemplate = Handlebars.compile(email.subject);
        const htmlTemplate = Handlebars.compile(email.body_html);
        const textTemplate = Handlebars.compile(email.body_text);

        const renderedSubject = subjectTemplate(variables);
        const renderedHtml = htmlTemplate(variables);
        const renderedText = textTemplate(variables);

        console.log(`[Email Queue Cron] Rendered subject: ${renderedSubject.substring(0, 50)}...`);

        // Send email via SMTP
        const result = await sendEmail({
          to: email.to_email,
          subject: renderedSubject,
          html: renderedHtml,
          text: renderedText,
          tenantId: email.tenant_id,
        });

        if (result.success) {
          // Update status to sent (removed non-existent message_id field)
          const { error: updateError } = await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          if (updateError) {
            console.error(`[Email Queue Cron] CRITICAL: Failed to mark email ${email.id} as sent:`, updateError);
          } else {
            console.log(`[Email Queue Cron] Successfully sent email ${email.id} and marked as sent`);
          }
          successCount++;
        } else if (result.skipped === 'blocked') {
          // Pre-send blocklist gate fired — recipient is on the hard-
          // bounce list from a prior send. Mark cancelled (not failed)
          // so the row visually matches other admin-suppressed sends
          // and won't be retried.
          await supabase
            .from('email_queue')
            .update({
              status: 'cancelled',
              error_message: result.error || 'Recipient address previously hard-bounced',
            })
            .eq('id', email.id);
          console.warn(`[Email Queue Cron] Skipped email ${email.id}: recipient hard-bounced`);
          failCount++;
        } else {
          // SMTP rejected the send. If the rejection is hard or soft,
          // persist the classification on the row so isEmailDeliverable
          // short-circuits future sends to this address via the partial
          // index (see 20260528_email_bounce_tracking.sql).
          if (result.bounceClass === 'hard' || result.bounceClass === 'soft') {
            await recordQueueBounce(supabase, email.id, result.bounceClass);
          }
          const { error: updateError } = await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: result.smtpResponse || result.error || 'SMTP send failed',
              failed_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          if (updateError) {
            console.error(`[Email Queue Cron] Failed to mark email ${email.id} as failed:`, updateError);
          }

          console.error(
            `[Email Queue Cron] Failed to send email ${email.id} (${result.bounceClass ?? 'unknown'}):`,
            result.error,
          );
          failCount++;
        }

      } catch (emailError: any) {
        console.error(`[Email Queue Cron] Error processing email ${email.id}:`, emailError);

        // Update status to failed (removed non-existent error_message and failed_at fields)
        const { error: updateError } = await supabase
          .from('email_queue')
          .update({
            status: 'failed',
          })
          .eq('id', email.id);

        if (updateError) {
          console.error(`[Email Queue Cron] Failed to mark email ${email.id} as failed:`, updateError);
        }

        failCount++;
      }
    }

    const summary = {
      success: true,
      message: 'Email queue processing completed',
      found: pendingEmails.length,
      sent: successCount,
      failed: failCount,
    };

    console.log('[Email Queue Cron] Summary:', summary);

    return summary;
  });
}
