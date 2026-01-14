/**
 * Email sending utility
 * Uses nodemailer with SMTP for sending emails
 * Fetches SMTP configuration from database integrations
 */

import nodemailer from 'nodemailer';
import type { Transporter, SentMessageInfo } from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

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
  tenantId?: string; // Optional tenant ID to fetch tenant-specific SMTP config
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from?: string;
  fromName?: string;
}

// Cache for SMTP configurations by tenant
const smtpConfigCache = new Map<string, { config: SMTPConfig; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch SMTP configuration from database for a specific tenant
 */
async function fetchSMTPConfig(tenantId?: string): Promise<SMTPConfig | null> {
  try {
    // Check cache first
    const cacheKey = tenantId || 'default';
    const cached = smtpConfigCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.config;
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Query integrations table for SMTP config
    // First try tenant-specific config, then fall back to global config (tenant_id IS NULL)
    let { data, error } = await supabase
      .from('integrations')
      .select('credentials, is_enabled')
      .eq('integration_key', 'smtp')
      .eq('is_enabled', true)
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // If no tenant-specific config, try global config
    if (!data && tenantId) {
      const globalResult = await supabase
        .from('integrations')
        .select('credentials, is_enabled')
        .eq('integration_key', 'smtp')
        .eq('is_enabled', true)
        .is('tenant_id', null)
        .maybeSingle();

      data = globalResult.data;
      error = globalResult.error;
    }

    if (error || !data) {
      console.log('No SMTP config found in database, falling back to environment variables');
      return null;
    }

    // Extract SMTP configuration
    const config: SMTPConfig = {
      host: data.credentials.smtp_host,
      port: parseInt(data.credentials.smtp_port || '587', 10),
      secure: data.credentials.smtp_secure === 'ssl',
      auth: {
        user: data.credentials.smtp_username,
        pass: data.credentials.smtp_password,
      },
      from: data.credentials.from_email,
      fromName: data.credentials.from_name,
    };

    // Cache the config
    smtpConfigCache.set(cacheKey, { config, timestamp: Date.now() });

    return config;
  } catch (error) {
    console.error('Error fetching SMTP config from database:', error);
    return null;
  }
}

/**
 * Get SMTP configuration from database or fallback to environment variables
 */
async function getSMTPConfig(tenantId?: string): Promise<SMTPConfig> {
  // Try to get config from database
  const dbConfig = await fetchSMTPConfig(tenantId);
  if (dbConfig) {
    return dbConfig;
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
    from: process.env.SMTP_FROM,
  };
}

/**
 * Get or create nodemailer transporter with SMTP configuration
 */
async function getTransporter(tenantId?: string): Promise<Transporter> {
  // Get SMTP config (from database or env)
  const smtpConfig = await getSMTPConfig(tenantId);

  // Create transporter with config
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.auth,
    // Connection timeout
    connectionTimeout: 10000,
    // Greeting timeout
    greetingTimeout: 5000,
    // Socket timeout
    socketTimeout: 20000,
  });

  return transporter;
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(tenantId?: string): Promise<boolean> {
  try {
    const transporter = await getTransporter(tenantId);
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
    // Get SMTP config to check if it's configured
    const smtpConfig = await getSMTPConfig(options.tenantId);

    // If SMTP not configured and in development, log to console
    if (!smtpConfig.host && process.env.NODE_ENV === 'development') {
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
    const transporter = await getTransporter(options.tenantId);

    // Determine from address and name
    let fromAddress = options.from || smtpConfig.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@platform.com';

    // Add "from name" if available
    if (smtpConfig.fromName && !options.from) {
      fromAddress = `${smtpConfig.fromName} <${smtpConfig.from}>`;
    }

    // Prepare email options
    const mailOptions = {
      from: fromAddress,
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
 * Clear SMTP configuration cache
 * Useful when SMTP settings are updated
 */
export function clearSMTPCache(tenantId?: string): void {
  if (tenantId) {
    smtpConfigCache.delete(tenantId);
  } else {
    smtpConfigCache.clear();
  }
  console.log('SMTP configuration cache cleared');
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
