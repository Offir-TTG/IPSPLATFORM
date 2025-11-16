/**
 * Email templates for the platform
 */

interface EmailVerificationData {
  organizationName: string;
  firstName: string;
  verificationUrl: string;
  trialEndsAt: string;
}

export function getVerificationEmailHtml(data: EmailVerificationData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 16px 0;
      color: #555;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
      text-align: center;
    }
    .button:hover {
      opacity: 0.9;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box strong {
      color: #333;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to the Platform! 🎉</h1>
    </div>

    <div class="content">
      <p>Hi ${data.firstName},</p>

      <p>Thank you for creating an account with <strong>${data.organizationName}</strong>!</p>

      <p>To get started with your <strong>14-day free trial</strong>, please verify your email address by clicking the button below:</p>

      <div style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
      </div>

      <div class="info-box">
        <strong>What happens next?</strong><br>
        ✓ Click the verification button above<br>
        ✓ Your 14-day free trial starts immediately<br>
        ✓ Log in with your email and password<br>
        ✓ Start exploring all features<br>
      </div>

      <p><strong>Trial Details:</strong></p>
      <ul>
        <li>Duration: 14 days</li>
        <li>Trial ends: ${new Date(data.trialEndsAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</li>
        <li>No credit card required</li>
        <li>Access to all features</li>
      </ul>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${data.verificationUrl}" style="color: #667eea; word-break: break-all;">${data.verificationUrl}</a>
      </p>

      <p style="color: #888; font-size: 14px; margin-top: 20px;">
        <strong>Note:</strong> This verification link will expire in 24 hours.
      </p>
    </div>

    <div class="footer">
      <p>If you didn't create this account, you can safely ignore this email.</p>
      <p>Need help? Contact us at <a href="mailto:support@yourplatform.com">support@yourplatform.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export function getVerificationEmailText(data: EmailVerificationData): string {
  return `
Welcome to the Platform!

Hi ${data.firstName},

Thank you for creating an account with ${data.organizationName}!

To get started with your 14-day free trial, please verify your email address by clicking the link below:

${data.verificationUrl}

What happens next?
- Click the verification link above
- Your 14-day free trial starts immediately
- Log in with your email and password
- Start exploring all features

Trial Details:
- Duration: 14 days
- Trial ends: ${new Date(data.trialEndsAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
- No credit card required
- Access to all features

Note: This verification link will expire in 24 hours.

If you didn't create this account, you can safely ignore this email.

Need help? Contact us at support@yourplatform.com
  `.trim();
}
