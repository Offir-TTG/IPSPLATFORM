import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via SMTP using nodemailer
 * Supports Gmail, Outlook, and other SMTP providers
 *
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP port (default: 587 for TLS)
 * - SMTP_SECURE: Use SSL/TLS (true/false)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASSWORD: SMTP password (use app-specific password for Gmail)
 * - SMTP_FROM: From address (optional, defaults to SMTP_USER)
 */
export async function sendEmailViaSMTP({
  to,
  subject,
  html,
  text
}: SendEmailParams): Promise<void> {
  // Validate required environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.');
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    }
  };

  const transporter = nodemailer.createTransport(config);

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Strip HTML tags from string to create plain text version
 * Simple implementation for email fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verify SMTP connection and credentials
 * Useful for testing email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('SMTP configuration missing');
    return false;
  }

  const config: EmailConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    }
  };

  const transporter = nodemailer.createTransport(config);

  try {
    await transporter.verify();
    console.log('SMTP configuration is valid');
    return true;
  } catch (error) {
    console.error('SMTP configuration error:', error);
    return false;
  }
}
