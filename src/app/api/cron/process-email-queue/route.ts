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
import Handlebars from 'handlebars';

const CRON_SECRET = process.env.CRON_SECRET || 'K8mX2vN9pL5wQ3yT7hJ6fR4aZ1cD0gH3';
const BATCH_SIZE = 10; // Process 10 emails per run

// Register Handlebars helpers for email templates
Handlebars.registerHelper('formatDate', function(date: string | Date, language: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
});

Handlebars.registerHelper('formatTime', function(date: string | Date, language: string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = language === 'he' ? 'he-IL' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
});

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('[Email Queue Cron] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Email Queue Cron] Starting email queue processing...');

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
      console.error('[Email Queue Cron] Error fetching emails:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('[Email Queue Cron] No pending emails to process');
      return NextResponse.json({
        success: true,
        message: 'No pending emails',
        processed: 0
      });
    }

    console.log(`[Email Queue Cron] Found ${pendingEmails.length} pending emails to process`);

    let successCount = 0;
    let failCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        console.log(`[Email Queue Cron] Processing email ${email.id} to ${email.to_email}`);

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
          // Update status to sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              message_id: result.messageId,
            })
            .eq('id', email.id);

          console.log(`[Email Queue Cron] Successfully sent email ${email.id}`);
          successCount++;
        } else {
          // Update status to failed with error
          await supabase
            .from('email_queue')
            .update({
              status: 'failed',
              error_message: result.error || 'Unknown error',
              failed_at: new Date().toISOString(),
            })
            .eq('id', email.id);

          console.error(`[Email Queue Cron] Failed to send email ${email.id}:`, result.error);
          failCount++;
        }

      } catch (emailError: any) {
        console.error(`[Email Queue Cron] Error processing email ${email.id}:`, emailError);

        // Update status to failed
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            error_message: emailError.message || 'Processing error',
            failed_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        failCount++;
      }
    }

    const summary = {
      success: true,
      message: 'Email queue processing completed',
      found: pendingEmails.length,
      sent: successCount,
      failed: failCount,
      completedAt: new Date().toISOString(),
    };

    console.log('[Email Queue Cron] Summary:', summary);

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('[Email Queue Cron] Fatal error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        success: false
      },
      { status: 500 }
    );
  }
}
