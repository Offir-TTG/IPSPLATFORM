import { translate, formatCurrency, formatDate } from '@/lib/translations/serverTranslations';

export interface EnrollmentEmailData {
  userName: string;
  productName: string;
  productType: string;
  organizationName: string;
  enrollmentUrl: string;
  expiresAt: Date;
  language: string;
  totalAmount?: number;
  currency?: string;
  paymentPlanName?: string;
}

/**
 * Get HTML email template for enrollment invitation
 */
export function getEnrollmentInvitationHtml(
  data: EnrollmentEmailData,
  translations: Record<string, string>
): string {
  const t = (key: string, fallback: string, params?: Record<string, string>) =>
    translate(translations, key, fallback, params);

  const isRTL = data.language === 'he';
  const expiresIn = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      background: #ffffff;
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #333;
    }
    .info-box {
      background: linear-gradient(to ${isRTL ? 'left' : 'right'}, #f8f9ff 0%, #ffffff 100%);
      border-${isRTL ? 'right' : 'left'}: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
      border-radius: 6px;
    }
    .info-box h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #333;
    }
    .info-box .type {
      color: #667eea;
      font-size: 14px;
      font-weight: 500;
    }
    .payment-info {
      background: #f8f9fa;
      padding: 15px;
      margin: 20px 0;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    .payment-info .row {
      display: flex;
      justify-content: space-between;
      margin: 8px 0;
      font-size: 14px;
    }
    .payment-info .row .label {
      color: #666;
    }
    .payment-info .row .value {
      font-weight: 600;
      color: #333;
    }
    .button-container {
      text-align: center;
      margin: 35px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 40px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .fallback-link {
      font-size: 13px;
      color: #666;
      text-align: center;
      margin: 20px 0;
      word-break: break-all;
    }
    .fallback-link a {
      color: #667eea;
      text-decoration: underline;
    }
    .expiry-warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 15px;
      margin: 25px 0;
      text-align: center;
    }
    .expiry-warning strong {
      color: #856404;
      font-size: 15px;
    }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 13px;
      background-color: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }
    .footer .org-name {
      color: #333;
      font-weight: 600;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${t('email.enrollment.title', 'You\'re Invited to Enroll!')}</h1>
    </div>

    <div class="content">
      <div class="greeting">
        ${t('email.enrollment.greeting', 'Hello {name}', { name: data.userName })},
      </div>

      <p>${t('email.enrollment.invitation', 'You have been invited to enroll in:')}</p>

      <div class="info-box">
        <h2>${data.productName}</h2>
        <div class="type">${t(`productType.${data.productType}`, data.productType)}</div>
      </div>

      ${data.totalAmount && data.totalAmount > 0 ? `
        <div class="payment-info">
          <div class="row">
            <span class="label">${t('email.enrollment.totalAmount', 'Total Amount')}:</span>
            <span class="value">${formatCurrency(data.totalAmount, data.currency || 'USD', data.language)}</span>
          </div>
          ${data.paymentPlanName ? `
            <div class="row">
              <span class="label">${t('email.enrollment.paymentPlan', 'Payment Plan')}:</span>
              <span class="value">${data.paymentPlanName}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <p>${t('email.enrollment.message', 'Click the button below to view details and complete your enrollment:')}</p>

      <div class="button-container">
        <a href="${data.enrollmentUrl}" class="button">
          ${t('email.enrollment.cta', 'View Enrollment')}
        </a>
      </div>

      <div class="fallback-link">
        ${t('email.enrollment.fallback', 'Or copy this link:')}
        <br>
        <a href="${data.enrollmentUrl}">${data.enrollmentUrl}</a>
      </div>

      <div class="expiry-warning">
        <strong>⏰ ${t('email.enrollment.expiry', 'This invitation expires in {days} days', { days: String(expiresIn) })}</strong>
      </div>
    </div>

    <div class="footer">
      <div class="org-name">${data.organizationName}</div>
      <div>${t('email.enrollment.footer', 'If you have questions, please contact support.')}</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Get plain text email template for enrollment invitation
 * Used as fallback for email clients that don't support HTML
 */
export function getEnrollmentInvitationText(
  data: EnrollmentEmailData,
  translations: Record<string, string>
): string {
  const t = (key: string, fallback: string, params?: Record<string, string>) =>
    translate(translations, key, fallback, params);

  const expiresIn = Math.ceil((data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  let text = `
${t('email.enrollment.title', 'You\'re Invited to Enroll!')}

${t('email.enrollment.greeting', 'Hello {name}', { name: data.userName })},

${t('email.enrollment.invitation', 'You have been invited to enroll in:')}

${data.productName}
${t(`productType.${data.productType}`, data.productType)}
`;

  if (data.totalAmount && data.totalAmount > 0) {
    text += `\n${t('email.enrollment.totalAmount', 'Total Amount')}: ${formatCurrency(data.totalAmount, data.currency || 'USD', data.language)}`;
    if (data.paymentPlanName) {
      text += `\n${t('email.enrollment.paymentPlan', 'Payment Plan')}: ${data.paymentPlanName}`;
    }
    text += '\n';
  }

  text += `
${t('email.enrollment.message', 'Visit the link below to view details and complete your enrollment:')}

${data.enrollmentUrl}

⏰ ${t('email.enrollment.expiry', 'This invitation expires in {days} days', { days: String(expiresIn) })}

---
${data.organizationName}
${t('email.enrollment.footer', 'If you have questions, please contact support.')}
  `;

  return text.trim();
}
