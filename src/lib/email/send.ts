/**
 * Email sending utility
 * Uses nodemailer with SMTP for sending emails
 */

import nodemailer from 'nodemailer';
import type { Transporter, SentMessageInfo } from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Singleton transporter instance
let transporter: Transporter | null = null;

/**
 * Get or create nodemailer transporter with SMTP configuration
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  // SMTP configuration from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
    // Connection timeout
    connectionTimeout: 10000,
    // Greeting timeout
    greetingTimeout: 5000,
    // Socket timeout
    socketTimeout: 20000,
  };

  transporter = nodemailer.createTransport(smtpConfig);

  return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection verification failed:', error);
    return false;
  }
}

/**
 * Send an email using SMTP via nodemailer
 * Returns messageId on success for tracking
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    // If SMTP not configured and in development, log to console
    if (!process.env.SMTP_HOST && process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL WOULD BE SENT (Development Mode - SMTP Not Configured)');
      console.log('='.repeat(80));
      console.log(`To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('\nText Version:');
      console.log('-'.repeat(80));
      console.log(options.text);
      console.log('='.repeat(80) + '\n');

      return {
        success: true,
        messageId: `dev-${Date.now()}@localhost`,
      };
    }

    // Get configured transporter
    const transporter = getTransporter();

    // Prepare email options
    const mailOptions = {
      from: options.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@platform.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    // Send email
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Close the transporter connection
 * Call this when shutting down the application
 */
export async function closeEmailConnection(): Promise<void> {
  if (transporter) {
    transporter.close();
    transporter = null;
    console.log('SMTP connection closed');
  }
}

/**
 * Send verification email to new organization admin
 */
export async function sendVerificationEmail(options: {
  email: string;
  firstName: string;
  organizationName: string;
  verificationUrl: string;
  trialEndsAt: string;
}): Promise<EmailResult> {
  const { getVerificationEmailHtml, getVerificationEmailText } = await import('./templates');

  const html = getVerificationEmailHtml({
    firstName: options.firstName,
    organizationName: options.organizationName,
    verificationUrl: options.verificationUrl,
    trialEndsAt: options.trialEndsAt,
  });

  const text = getVerificationEmailText({
    firstName: options.firstName,
    organizationName: options.organizationName,
    verificationUrl: options.verificationUrl,
    trialEndsAt: options.trialEndsAt,
  });

  return sendEmail({
    to: options.email,
    subject: `Verify your email for ${options.organizationName}`,
    html,
    text,
  });
}
