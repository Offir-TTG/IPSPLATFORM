/**
 * Email sending utility
 * Uses nodemailer for development and can be swapped for production email service
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Send an email using configured email service
 * Currently logs to console for development
 * In production, integrate with Resend, SendGrid, AWS SES, etc.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // For development: Log email to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL WOULD BE SENT (Development Mode)');
      console.log('='.repeat(80));
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log('\nText Version:');
      console.log('-'.repeat(80));
      console.log(options.text);
      console.log('='.repeat(80) + '\n');

      // In development, we consider this successful
      return true;
    }

    // For production: Integrate with real email service
    // Example with Resend:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@yourplatform.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      console.error('Email sending error:', error);
      return false;
    }

    return true;
    */

    // Example with SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      from: process.env.EMAIL_FROM || 'noreply@yourplatform.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    return true;
    */

    // Placeholder: Return false for production until email service is configured
    console.error('Email service not configured for production. Please set up Resend, SendGrid, or AWS SES.');
    return false;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
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
}): Promise<boolean> {
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
