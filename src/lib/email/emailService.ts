/**
 * Email Service
 * High-level service for sending emails using templates
 */

import { createClient } from '@/lib/supabase/server';
import { sendEmail } from './send';
import { renderEmailTemplate } from './templateEngine';
import type {
  EmailTemplate,
  EmailTemplateVersion,
  ComposeEmailOptions,
  EmailJobResult,
  EmailLanguage,
} from '@/types/email';

export interface SendTemplateEmailOptions {
  tenantId: string;
  templateKey: string;
  to: string | string[];
  variables: Record<string, any>;
  language?: EmailLanguage;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  scheduledFor?: Date;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Get email template with current version from database
 */
export async function getEmailTemplate(
  templateKey: string,
  tenantId: string,
  language: EmailLanguage = 'en'
): Promise<{
  template: EmailTemplate | null;
  version: EmailTemplateVersion | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return {
        template: null,
        version: null,
        error: `Template not found: ${templateKey}`,
      };
    }

    // Fetch current version for specified language
    const { data: version, error: versionError } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('template_id', template.id)
      .eq('language_code', language)
      .eq('is_current', true)
      .single();

    if (versionError || !version) {
      return {
        template,
        version: null,
        error: `Template version not found for language: ${language}`,
      };
    }

    return { template, version };
  } catch (error) {
    console.error('Error fetching email template:', error);
    return {
      template: null,
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Queue email for sending
 */
export async function queueEmail(options: {
  tenantId: string;
  toEmail: string;
  toName?: string;
  userId?: string;
  templateId?: string;
  language: EmailLanguage;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  templateVariables?: Record<string, any>;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  scheduledFor?: Date;
  triggerType?: 'automated' | 'manual' | 'scheduled' | 'api';
  triggerEvent?: string;
  cc?: string[];
  bcc?: string[];
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        tenant_id: options.tenantId,
        to_email: options.toEmail,
        to_name: options.toName,
        user_id: options.userId,
        template_id: options.templateId,
        language_code: options.language,
        subject: options.subject,
        body_html: options.bodyHtml,
        body_text: options.bodyText,
        template_variables: options.templateVariables,
        priority: options.priority || 'normal',
        scheduled_for: options.scheduledFor?.toISOString(),
        trigger_type: options.triggerType || 'manual',
        trigger_event: options.triggerEvent,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Error queueing email:', error);
      return { error: 'Failed to queue email' };
    }

    return { id: data.id };
  } catch (error) {
    console.error('Error queueing email:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send email using template
 * This is the main function to use for sending templated emails
 */
export async function sendTemplateEmail(
  options: SendTemplateEmailOptions
): Promise<EmailJobResult> {
  try {
    const {
      tenantId,
      templateKey,
      to,
      variables,
      language = 'en',
      priority = 'normal',
      scheduledFor,
      cc,
      bcc,
    } = options;

    // Get template from database
    const { template, version, error: fetchError } = await getEmailTemplate(
      templateKey,
      tenantId,
      language
    );

    if (fetchError || !template || !version) {
      console.error('Template fetch error:', fetchError);
      return {
        success: false,
        error: fetchError || 'Template not found',
      };
    }

    // Add default variables
    const allVariables = {
      ...variables,
      year: new Date().getFullYear(),
      language,
      isRTL: language === 'he',
      primaryColor: template.custom_styles?.primaryColor || '#667eea',
      secondaryColor: template.custom_styles?.secondaryColor || '#764ba2',
      logoUrl: template.custom_styles?.logoUrl,
      organizationName: variables.organizationName || 'Platform',
    };

    // Render template with variables
    const { html, text, error: renderError, missingVariables } = renderEmailTemplate(
      version.body_html,
      version.body_text,
      allVariables,
      template.variables as any
    );

    if (renderError) {
      console.error('Template render error:', renderError);
      return {
        success: false,
        error: `Template rendering failed: ${renderError}. Missing: ${missingVariables?.join(', ')}`,
      };
    }

    // Render subject with variables
    const subjectTemplate = Handlebars.compile(version.subject);
    const subject = subjectTemplate(allVariables);

    // Queue email in database
    const queueResult = await queueEmail({
      tenantId,
      toEmail: Array.isArray(to) ? to[0] : to,
      toName: variables.userName || variables.userEmail,
      userId: variables.userId,
      templateId: template.id,
      language,
      subject,
      bodyHtml: html,
      bodyText: text,
      templateVariables: variables,
      priority,
      scheduledFor,
      triggerType: 'api',
      cc: Array.isArray(cc) ? cc : cc ? [cc] : undefined,
      bcc: Array.isArray(bcc) ? bcc : bcc ? [bcc] : undefined,
    });

    if ('error' in queueResult) {
      return {
        success: false,
        error: queueResult.error,
      };
    }

    // If not scheduled, send immediately
    if (!scheduledFor) {
      const sendResult = await sendEmail({
        to,
        subject,
        html,
        text,
        cc,
        bcc,
      });

      // Update queue status
      if (sendResult.success) {
        const supabase = await createClient();
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            smtp_message_id: sendResult.messageId,
          })
          .eq('id', queueResult.id);
      } else {
        const supabase = await createClient();
        await supabase
          .from('email_queue')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            error_message: sendResult.error,
            attempts: 1,
          })
          .eq('id', queueResult.id);
      }

      return sendResult;
    }

    // Scheduled email - marked as pending
    return {
      success: true,
      messageId: queueResult.id,
    };
  } catch (error) {
    console.error('Error sending template email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send simple email without template (direct send)
 */
export async function sendSimpleEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  cc?: string | string[];
  bcc?: string | string[];
}): Promise<EmailJobResult> {
  return sendEmail(options);
}

// Import Handlebars for subject rendering
import Handlebars from 'handlebars';
