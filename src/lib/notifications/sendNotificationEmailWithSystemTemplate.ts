/**
 * Send notification email using system template (notification.generic)
 * This bypasses the database template system and uses the built-in system template
 */

import Handlebars from 'handlebars';
import { SYSTEM_TEMPLATES } from '@/lib/email/systemTemplates';
import { sendEmail } from '@/lib/email/send';
import type { EmailLanguage } from '@/types/email';

interface SendOptions {
  to: string;
  userName: string;
  notificationTitle: string;
  notificationMessage: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: string;
  actionUrl?: string;
  actionLabel?: string;
  organizationName: string;
  language: EmailLanguage;
  tenantId: string;
}

export async function sendNotificationEmailWithSystemTemplate(
  options: SendOptions
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Find the notification.generic template
    const template = SYSTEM_TEMPLATES.find(t => t.key === 'notification.generic');
    if (!template) {
      return {
        success: false,
        error: 'System template notification.generic not found',
      };
    }

    // Get the version for the specified language
    const version = template.versions[options.language];
    if (!version) {
      return {
        success: false,
        error: `Template version not found for language: ${options.language}`,
      };
    }

    // Prepare template variables
    const variables = {
      userName: options.userName,
      notificationTitle: options.notificationTitle,
      notificationMessage: options.notificationMessage,
      priority: options.priority,
      category: options.category,
      actionUrl: options.actionUrl,
      actionLabel: options.actionLabel,
      organizationName: options.organizationName,
      year: new Date().getFullYear(),
      language: options.language,
      isRTL: options.language === 'he',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
    };

    // Register Handlebars helpers
    Handlebars.registerHelper('eq', function(a: any, b: any) {
      return a === b;
    });

    // Compile templates
    const subjectTemplate = Handlebars.compile(version.subject);
    const htmlTemplate = Handlebars.compile(version.bodyHtml);
    const textTemplate = Handlebars.compile(version.bodyText);

    // Render templates
    const subject = subjectTemplate(variables);
    const html = htmlTemplate(variables);
    const text = textTemplate(variables);

    // Wrap HTML in base template
    const fullHtml = `
<!DOCTYPE html>
<html lang="${options.language}" dir="${options.language === 'he' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    ${html}
  </div>
  <div style="text-align: center; font-size: 12px; color: #666; margin-top: 20px; padding: 20px;">
    <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} ${options.organizationName}</p>
  </div>
</body>
</html>
    `.trim();

    console.log('[Notification Email] Sending email:', {
      to: options.to,
      subject,
      language: options.language,
      priority: options.priority,
    });

    // Send email
    const result = await sendEmail({
      from: process.env.SMTP_FROM || 'notifications@example.com',
      to: options.to,
      subject,
      html: fullHtml,
      text,
      tenantId: options.tenantId,
      priority: options.priority === 'urgent' ? 'urgent' :
                options.priority === 'high' ? 'high' : 'normal',
    });

    if (!result.messageId) {
      return {
        success: false,
        error: result.error || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('[Notification Email] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
