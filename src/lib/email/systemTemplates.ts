/**
 * System Email Templates
 * Pre-defined email templates for common platform events
 */

import type { EmailTemplateVariable } from '@/types/email';

export interface SystemTemplate {
  key: string;
  name: string;
  category: 'enrollment' | 'payment' | 'lesson' | 'parent' | 'system';
  description: string;
  variables: EmailTemplateVariable[];
  versions: {
    en: {
      subject: string;
      bodyHtml: string;
      bodyText: string;
    };
    he: {
      subject: string;
      bodyHtml: string;
      bodyText: string;
    };
  };
}

export const SYSTEM_TEMPLATES: SystemTemplate[] = [
  // ============================================================================
  // ENROLLMENT TEMPLATES
  // ============================================================================
  {
    key: 'enrollment.confirmation',
    name: 'Enrollment Confirmation',
    category: 'enrollment',
    description: 'Sent when a user successfully enrolls in a course or program',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'productName', description: 'Course or program name', example: 'Web Development 101', required: true, type: 'string' },
      { name: 'productType', description: 'Type of product', example: 'course', required: true, type: 'string' },
      { name: 'enrollmentDate', description: 'Enrollment date', example: '2025-12-01', required: true, type: 'date' },
      { name: 'totalAmount', description: 'Total enrollment cost', example: '299.00', required: false, type: 'currency' },
      { name: 'currency', description: 'Currency code', example: 'USD', required: false, type: 'string' },
      { name: 'startDate', description: 'Course start date', example: '2025-12-15', required: false, type: 'date' },
      { name: 'dashboardUrl', description: 'Link to user dashboard', example: 'https://...', required: true, type: 'url' },
    ],
    versions: {
      en: {
        subject: 'Welcome to {{productName}}!',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Congratulations, {{userName}}!</h2>

  <p>You have successfully enrolled in <strong>{{productName}}</strong>.</p>

  {{#if totalAmount}}
  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Enrollment Summary:</strong></p>
    <p style="margin: 5px 0;">Total Amount: {{formatCurrency totalAmount currency}}</p>
    <p style="margin: 5px 0;">Enrollment Date: {{formatDate enrollmentDate language}}</p>
    {{#if startDate}}
    <p style="margin: 5px 0;">Start Date: {{formatDate startDate language}}</p>
    {{/if}}
  </div>
  {{/if}}

  <p>You can access your course materials and track your progress from your dashboard.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Go to Dashboard
    </a>
  </div>

  <p>We're excited to have you join us!</p>
</div>
        `,
        bodyText: `
Congratulations, {{userName}}!

You have successfully enrolled in {{productName}}.

{{#if totalAmount}}
Enrollment Summary:
- Total Amount: {{formatCurrency totalAmount currency}}
- Enrollment Date: {{formatDate enrollmentDate language}}
{{#if startDate}}
- Start Date: {{formatDate startDate language}}
{{/if}}
{{/if}}

Access your dashboard: {{dashboardUrl}}

We're excited to have you join us!
        `,
      },
      he: {
        subject: 'ברוכים הבאים ל-{{productName}}!',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>ברכותינו, {{userName}}!</h2>

  <p>נרשמת בהצלחה ל-<strong>{{productName}}</strong>.</p>

  {{#if totalAmount}}
  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
    <p style="margin: 0;"><strong>סיכום הרשמה:</strong></p>
    <p style="margin: 5px 0;">סכום כולל: {{formatCurrency totalAmount currency}}</p>
    <p style="margin: 5px 0;">תאריך הרשמה: {{formatDate enrollmentDate language}}</p>
    {{#if startDate}}
    <p style="margin: 5px 0;">תאריך התחלה: {{formatDate startDate language}}</p>
    {{/if}}
  </div>
  {{/if}}

  <p>תוכל לגשת לחומרי הקורס ולעקוב אחר ההתקדמות שלך מלוח הבקרה.</p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      מעבר ללוח בקרה
    </a>
  </div>

  <p>אנחנו שמחים שהצטרפת אלינו!</p>
</div>
        `,
        bodyText: `
ברכותינו, {{userName}}!

נרשמת בהצלחה ל-{{productName}}.

{{#if totalAmount}}
סיכום הרשמה:
- סכום כולל: {{formatCurrency totalAmount currency}}
- תאריך הרשמה: {{formatDate enrollmentDate language}}
{{#if startDate}}
- תאריך התחלה: {{formatDate startDate language}}
{{/if}}
{{/if}}

גישה ללוח הבקרה: {{dashboardUrl}}

אנחנו שמחים שהצטרפת אלינו!
        `,
      },
    },
  },

  {
    key: 'enrollment.invitation',
    name: 'Enrollment Invitation',
    category: 'enrollment',
    description: 'Sent when admin invites a user to enroll via enrollment link',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'productName', description: 'Course or program name', example: 'Web Development 101', required: true, type: 'string' },
      { name: 'productType', description: 'Type of product', example: 'course', required: true, type: 'string' },
      { name: 'organizationName', description: 'Organization name', example: 'IPS Platform', required: true, type: 'string' },
      { name: 'enrollmentUrl', description: 'Enrollment link URL', example: 'https://...', required: true, type: 'url' },
      { name: 'expiresIn', description: 'Days until expiration', example: '7', required: true, type: 'number' },
      { name: 'totalAmount', description: 'Total enrollment cost', example: '299.00', required: false, type: 'currency' },
      { name: 'currency', description: 'Currency code', example: 'USD', required: false, type: 'string' },
      { name: 'paymentPlanName', description: 'Payment plan name', example: 'Monthly Installments', required: false, type: 'string' },
    ],
    versions: {
      en: {
        subject: 'You\'re Invited to Enroll in {{productName}}!',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Hello {{userName}}!</h2>

  <p>You have been invited to enroll in <strong>{{productName}}</strong>.</p>

  <div style="background: linear-gradient(to right, #f8f9ff 0%, #ffffff 100%); border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 8px 0; font-size: 20px;">{{productName}}</h3>
    <div style="color: #667eea; font-size: 14px; font-weight: 500;">{{productType}}</div>
  </div>

  {{#if totalAmount}}
  <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #e0e0e0;">
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="color: #666;">Total Amount:</span>
      <span style="font-weight: 600;">{{formatCurrency totalAmount currency}}</span>
    </div>
    {{#if paymentPlanName}}
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="color: #666;">Payment Plan:</span>
      <span style="font-weight: 600;">{{paymentPlanName}}</span>
    </div>
    {{/if}}
  </div>
  {{/if}}

  <p>Click the button below to view details and complete your enrollment:</p>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{enrollmentUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      View Enrollment
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">Or copy this link: <a href="{{enrollmentUrl}}">{{enrollmentUrl}}</a></p>

  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
    <strong style="color: #856404;">⏰ This invitation expires in {{expiresIn}} days</strong>
  </div>

  <p style="text-align: center; color: #666; font-size: 13px;">{{organizationName}}</p>
</div>
        `,
        bodyText: `
Hello {{userName}}!

You have been invited to enroll in: {{productName}}
Type: {{productType}}

{{#if totalAmount}}
Total Amount: {{formatCurrency totalAmount currency}}
{{#if paymentPlanName}}
Payment Plan: {{paymentPlanName}}
{{/if}}
{{/if}}

Visit the link below to view details and complete your enrollment:
{{enrollmentUrl}}

⏰ This invitation expires in {{expiresIn}} days

---
{{organizationName}}
If you have questions, please contact support.
        `,
      },
      he: {
        subject: 'הוזמנת להירשם ל-{{productName}}!',
        bodyHtml: `
<div style="padding: 20px; direction: rtl;">
  <h2>שלום {{userName}}!</h2>

  <p>הוזמנת להירשם ל-<strong>{{productName}}</strong>.</p>

  <div style="background: linear-gradient(to left, #f8f9ff 0%, #ffffff 100%); border-right: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 8px 0; font-size: 20px;">{{productName}}</h3>
    <div style="color: #667eea; font-size: 14px; font-weight: 500;">{{productType}}</div>
  </div>

  {{#if totalAmount}}
  <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #e0e0e0;">
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="color: #666;">סכום כולל:</span>
      <span style="font-weight: 600;">{{formatCurrency totalAmount currency}}</span>
    </div>
    {{#if paymentPlanName}}
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="color: #666;">תוכנית תשלום:</span>
      <span style="font-weight: 600;">{{paymentPlanName}}</span>
    </div>
    {{/if}}
  </div>
  {{/if}}

  <p>לחץ על הכפתור למטה כדי לצפות בפרטים ולהשלים את ההרשמה:</p>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{enrollmentUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      צפה בהרשמה
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">או העתק קישור זה: <a href="{{enrollmentUrl}}">{{enrollmentUrl}}</a></p>

  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
    <strong style="color: #856404;">⏰ ההזמנה תפוג בעוד {{expiresIn}} ימים</strong>
  </div>

  <p style="text-align: center; color: #666; font-size: 13px;">{{organizationName}}</p>
</div>
        `,
        bodyText: `
שלום {{userName}}!

הוזמנת להירשם ל: {{productName}}
סוג: {{productType}}

{{#if totalAmount}}
סכום כולל: {{formatCurrency totalAmount currency}}
{{#if paymentPlanName}}
תוכנית תשלום: {{paymentPlanName}}
{{/if}}
{{/if}}

בקר בקישור למטה כדי לצפות בפרטים ולהשלים את ההרשמה:
{{enrollmentUrl}}

⏰ ההזמנה תפוג בעוד {{expiresIn}} ימים

---
{{organizationName}}
אם יש לך שאלות, אנא פנה לתמיכה.
        `,
      },
    },
  },

  {
    key: 'enrollment.reminder',
    name: 'Enrollment Reminder',
    category: 'enrollment',
    description: 'Sent to remind users about pending enrollment or incomplete registration',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'productName', description: 'Course or program name', example: 'Web Development 101', required: true, type: 'string' },
      { name: 'productType', description: 'Type of product', example: 'course', required: true, type: 'string' },
      { name: 'daysRemaining', description: 'Days until enrollment deadline', example: '3', required: false, type: 'number' },
      { name: 'enrollmentUrl', description: 'Link to complete enrollment', example: 'https://...', required: true, type: 'url' },
      { name: 'totalAmount', description: 'Total enrollment cost', example: '299.00', required: false, type: 'currency' },
      { name: 'currency', description: 'Currency code', example: 'USD', required: false, type: 'string' },
      { name: 'startDate', description: 'Course start date', example: '2025-12-15', required: false, type: 'date' },
    ],
    versions: {
      en: {
        subject: 'Complete Your Enrollment for {{productName}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Don't Miss Out, {{userName}}!</h2>

  <p>We noticed you haven't completed your enrollment for <strong>{{productName}}</strong>.</p>

  {{#if daysRemaining}}
  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
    <strong style="color: #856404;">⏰ Only {{daysRemaining}} days left to enroll!</strong>
  </div>
  {{/if}}

  <div style="background: linear-gradient(to right, #f8f9ff 0%, #ffffff 100%); border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 8px 0; font-size: 20px;">{{productName}}</h3>
    <div style="color: #667eea; font-size: 14px; font-weight: 500;">{{productType}}</div>
    {{#if startDate}}
    <p style="margin: 10px 0 0 0; color: #666;">Starts: {{formatDate startDate language}}</p>
    {{/if}}
  </div>

  {{#if totalAmount}}
  <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #e0e0e0;">
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="color: #666;">Investment:</span>
      <span style="font-weight: 600;">{{formatCurrency totalAmount currency}}</span>
    </div>
  </div>
  {{/if}}

  <p>Complete your enrollment now to secure your spot!</p>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{enrollmentUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Complete Enrollment
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">Or copy this link: <a href="{{enrollmentUrl}}">{{enrollmentUrl}}</a></p>

  <p style="text-align: center; color: #666;">Questions? Contact our support team.</p>
</div>
        `,
        bodyText: `
Don't Miss Out, {{userName}}!

We noticed you haven't completed your enrollment for: {{productName}}
Type: {{productType}}

{{#if daysRemaining}}
⏰ Only {{daysRemaining}} days left to enroll!
{{/if}}

{{#if startDate}}
Starts: {{formatDate startDate language}}
{{/if}}

{{#if totalAmount}}
Investment: {{formatCurrency totalAmount currency}}
{{/if}}

Complete your enrollment now to secure your spot!
{{enrollmentUrl}}

Questions? Contact our support team.
        `,
      },
      he: {
        subject: 'השלם את ההרשמה שלך ל-{{productName}}',
        bodyHtml: `
<div style="padding: 20px; direction: rtl;">
  <h2>אל תפספס, {{userName}}!</h2>

  <p>שמנו לב שטרם השלמת את ההרשמה ל-<strong>{{productName}}</strong>.</p>

  {{#if daysRemaining}}
  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
    <strong style="color: #856404;">⏰ נותרו רק {{daysRemaining}} ימים להרשמה!</strong>
  </div>
  {{/if}}

  <div style="background: linear-gradient(to left, #f8f9ff 0%, #ffffff 100%); border-right: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 8px 0; font-size: 20px;">{{productName}}</h3>
    <div style="color: #667eea; font-size: 14px; font-weight: 500;">{{productType}}</div>
    {{#if startDate}}
    <p style="margin: 10px 0 0 0; color: #666;">מתחיל: {{formatDate startDate language}}</p>
    {{/if}}
  </div>

  {{#if totalAmount}}
  <div style="background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 6px; border: 1px solid #e0e0e0;">
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="color: #666;">השקעה:</span>
      <span style="font-weight: 600;">{{formatCurrency totalAmount currency}}</span>
    </div>
  </div>
  {{/if}}

  <p>השלם את ההרשמה שלך עכשיו כדי להבטיח את מקומך!</p>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{enrollmentUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      השלם הרשמה
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">או העתק קישור זה: <a href="{{enrollmentUrl}}">{{enrollmentUrl}}</a></p>

  <p style="text-align: center; color: #666;">שאלות? צור קשר עם צוות התמיכה שלנו.</p>
</div>
        `,
        bodyText: `
אל תפספס, {{userName}}!

שמנו לב שטרם השלמת את ההרשמה ל: {{productName}}
סוג: {{productType}}

{{#if daysRemaining}}
⏰ נותרו רק {{daysRemaining}} ימים להרשמה!
{{/if}}

{{#if startDate}}
מתחיל: {{formatDate startDate language}}
{{/if}}

{{#if totalAmount}}
השקעה: {{formatCurrency totalAmount currency}}
{{/if}}

השלם את ההרשמה שלך עכשיו כדי להבטיח את מקומך!
{{enrollmentUrl}}

שאלות? צור קשר עם צוות התמיכה שלנו.
        `,
      },
    },
  },

  // ============================================================================
  // PAYMENT TEMPLATES
  // ============================================================================
  {
    key: 'payment.receipt',
    name: 'Payment Receipt',
    category: 'payment',
    description: 'Sent when a payment is successfully processed',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'amount', description: 'Payment amount', example: '99.00', required: true, type: 'currency' },
      { name: 'currency', description: 'Currency code', example: 'USD', required: true, type: 'string' },
      { name: 'paymentDate', description: 'Payment date', example: '2025-12-01', required: true, type: 'date' },
      { name: 'productName', description: 'Product name', example: 'Course', required: true, type: 'string' },
      { name: 'transactionId', description: 'Transaction ID', example: 'TXN-12345', required: true, type: 'string' },
      { name: 'paymentMethod', description: 'Payment method', example: 'Credit Card', required: false, type: 'string' },
      { name: 'receiptUrl', description: 'Receipt PDF URL', example: 'https://...', required: false, type: 'url' },
    ],
    versions: {
      en: {
        subject: 'Payment Receipt - {{formatCurrency amount currency}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Payment Received</h2>

  <p>Hi {{userName}},</p>

  <p>Thank you for your payment. Here are the details:</p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666;">Amount Paid:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">{{formatCurrency amount currency}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Payment Date:</td>
        <td style="padding: 8px 0; text-align: right;">{{formatDate paymentDate language}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Product:</td>
        <td style="padding: 8px 0; text-align: right;">{{productName}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">Transaction ID:</td>
        <td style="padding: 8px 0; text-align: right; font-family: monospace;">{{transactionId}}</td>
      </tr>
      {{#if paymentMethod}}
      <tr>
        <td style="padding: 8px 0; color: #666;">Payment Method:</td>
        <td style="padding: 8px 0; text-align: right;">{{paymentMethod}}</td>
      </tr>
      {{/if}}
    </table>
  </div>

  {{#if receiptUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{receiptUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Download Receipt
    </a>
  </div>
  {{/if}}

  <p>Keep this email for your records.</p>
</div>
        `,
        bodyText: `
Payment Received

Hi {{userName}},

Thank you for your payment. Here are the details:

Amount Paid: {{formatCurrency amount currency}}
Payment Date: {{formatDate paymentDate language}}
Product: {{productName}}
Transaction ID: {{transactionId}}
{{#if paymentMethod}}
Payment Method: {{paymentMethod}}
{{/if}}

{{#if receiptUrl}}
Download Receipt: {{receiptUrl}}
{{/if}}

Keep this email for your records.
        `,
      },
      he: {
        subject: 'קבלה על תשלום - {{formatCurrency amount currency}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>התשלום התקבל</h2>

  <p>שלום {{userName}},</p>

  <p>תודה על התשלום. להלן הפרטים:</p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #666;">סכום ששולם:</td>
        <td style="padding: 8px 0; text-align: left; font-weight: 600;">{{formatCurrency amount currency}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">תאריך תשלום:</td>
        <td style="padding: 8px 0; text-align: left;">{{formatDate paymentDate language}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">מוצר:</td>
        <td style="padding: 8px 0; text-align: left;">{{productName}}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #666;">מזהה עסקה:</td>
        <td style="padding: 8px 0; text-align: left; font-family: monospace;">{{transactionId}}</td>
      </tr>
      {{#if paymentMethod}}
      <tr>
        <td style="padding: 8px 0; color: #666;">אמצעי תשלום:</td>
        <td style="padding: 8px 0; text-align: left;">{{paymentMethod}}</td>
      </tr>
      {{/if}}
    </table>
  </div>

  {{#if receiptUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{receiptUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      הורדת קבלה
    </a>
  </div>
  {{/if}}

  <p>שמור אימייל זה לרישומים שלך.</p>
</div>
        `,
        bodyText: `
התשלום התקבל

שלום {{userName}},

תודה על התשלום. להלן הפרטים:

סכום ששולם: {{formatCurrency amount currency}}
תאריך תשלום: {{formatDate paymentDate language}}
מוצר: {{productName}}
מזהה עסקה: {{transactionId}}
{{#if paymentMethod}}
אמצעי תשלום: {{paymentMethod}}
{{/if}}

{{#if receiptUrl}}
הורדת קבלה: {{receiptUrl}}
{{/if}}

שמור אימייל זה לרישומים שלך.
        `,
      },
    },
  },

  // ============================================================================
  // LESSON TEMPLATES
  // ============================================================================
  {
    key: 'lesson.reminder',
    name: 'Lesson Reminder',
    category: 'lesson',
    description: 'Sent before a scheduled lesson',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'lessonTitle', description: 'Lesson title', example: 'Introduction to React', required: true, type: 'string' },
      { name: 'lessonDate', description: 'Lesson date', example: '2025-12-15', required: true, type: 'date' },
      { name: 'lessonTime', description: 'Lesson time', example: '14:00', required: true, type: 'string' },
      { name: 'duration', description: 'Lesson duration in minutes', example: '90', required: false, type: 'number' },
      { name: 'location', description: 'Lesson location or meeting link', example: 'Room 101 or Zoom link', required: false, type: 'string' },
      { name: 'instructorName', description: 'Instructor name', example: 'Dr. Smith', required: false, type: 'string' },
      { name: 'lessonUrl', description: 'Link to lesson details', example: 'https://...', required: false, type: 'url' },
    ],
    versions: {
      en: {
        subject: 'Reminder: {{lessonTitle}} - {{formatDate lessonDate language}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Upcoming Lesson Reminder</h2>

  <p>Hi {{userName}},</p>

  <p>This is a friendly reminder about your upcoming lesson:</p>

  <div style="background: linear-gradient(to right, #f8f9ff 0%, #ffffff 100%); border-left: 4px solid {{primaryColor}}; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 15px 0;">{{lessonTitle}}</h3>
    <p style="margin: 5px 0;"><strong>📅 Date:</strong> {{formatDate lessonDate language}}</p>
    <p style="margin: 5px 0;"><strong>🕐 Time:</strong> {{lessonTime}}</p>
    {{#if duration}}
    <p style="margin: 5px 0;"><strong>⏱️ Duration:</strong> {{duration}} minutes</p>
    {{/if}}
    {{#if instructorName}}
    <p style="margin: 5px 0;"><strong>👨‍🏫 Instructor:</strong> {{instructorName}}</p>
    {{/if}}
    {{#if location}}
    <p style="margin: 5px 0;"><strong>📍 Location:</strong> {{location}}</p>
    {{/if}}
  </div>

  {{#if lessonUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{lessonUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Lesson Details
    </a>
  </div>
  {{/if}}

  <p>We look forward to seeing you!</p>
</div>
        `,
        bodyText: `
Upcoming Lesson Reminder

Hi {{userName}},

This is a friendly reminder about your upcoming lesson:

{{lessonTitle}}

📅 Date: {{formatDate lessonDate language}}
🕐 Time: {{lessonTime}}
{{#if duration}}
⏱️ Duration: {{duration}} minutes
{{/if}}
{{#if instructorName}}
👨‍🏫 Instructor: {{instructorName}}
{{/if}}
{{#if location}}
📍 Location: {{location}}
{{/if}}

{{#if lessonUrl}}
View Lesson Details: {{lessonUrl}}
{{/if}}

We look forward to seeing you!
        `,
      },
      he: {
        subject: 'תזכורת: {{lessonTitle}} - {{formatDate lessonDate language}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>תזכורת לשיעור הקרוב</h2>

  <p>שלום {{userName}},</p>

  <p>זוהי תזכורת ידידותית לשיעור הקרוב שלך:</p>

  <div style="background: linear-gradient(to left, #f8f9ff 0%, #ffffff 100%); border-right: 4px solid {{primaryColor}}; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 15px 0;">{{lessonTitle}}</h3>
    <p style="margin: 5px 0;"><strong>📅 תאריך:</strong> {{formatDate lessonDate language}}</p>
    <p style="margin: 5px 0;"><strong>🕐 שעה:</strong> {{lessonTime}}</p>
    {{#if duration}}
    <p style="margin: 5px 0;"><strong>⏱️ משך:</strong> {{duration}} דקות</p>
    {{/if}}
    {{#if instructorName}}
    <p style="margin: 5px 0;"><strong>👨‍🏫 מדריך:</strong> {{instructorName}}</p>
    {{/if}}
    {{#if location}}
    <p style="margin: 5px 0;"><strong>📍 מיקום:</strong> {{location}}</p>
    {{/if}}
  </div>

  {{#if lessonUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{lessonUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      צפייה בפרטי השיעור
    </a>
  </div>
  {{/if}}

  <p>אנחנו מצפים לראותך!</p>
</div>
        `,
        bodyText: `
תזכורת לשיעור הקרוב

שלום {{userName}},

זוהי תזכורת ידידותית לשיעור הקרוב שלך:

{{lessonTitle}}

📅 תאריך: {{formatDate lessonDate language}}
🕐 שעה: {{lessonTime}}
{{#if duration}}
⏱️ משך: {{duration}} דקות
{{/if}}
{{#if instructorName}}
👨‍🏫 מדריך: {{instructorName}}
{{/if}}
{{#if location}}
📍 מיקום: {{location}}
{{/if}}

{{#if lessonUrl}}
צפייה בפרטי השיעור: {{lessonUrl}}
{{/if}}

אנחנו מצפים לראותך!
        `,
      },
    },
  },

  // ============================================================================
  // PARENT COMMUNICATION
  // ============================================================================
  {
    key: 'parent.progress_report',
    name: 'Progress Report (Parent)',
    category: 'parent',
    description: 'Sent to parents with student progress updates',
    variables: [
      { name: 'parentName', description: 'Parent name', example: 'Mrs. Johnson', required: true, type: 'string' },
      { name: 'studentName', description: 'Student name', example: 'Emma', required: true, type: 'string' },
      { name: 'productName', description: 'Course/program name', example: 'Math 101', required: true, type: 'string' },
      { name: 'progressPercentage', description: 'Completion percentage', example: '75', required: true, type: 'number' },
      { name: 'completedLessons', description: 'Number of completed lessons', example: '12', required: false, type: 'number' },
      { name: 'totalLessons', description: 'Total lessons', example: '16', required: false, type: 'number' },
      { name: 'recentAchievements', description: 'Recent achievements', example: 'Completed Module 3', required: false, type: 'string' },
      { name: 'dashboardUrl', description: 'Parent dashboard URL', example: 'https://...', required: false, type: 'url' },
    ],
    versions: {
      en: {
        subject: 'Progress Update: {{studentName}} - {{productName}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Student Progress Report</h2>

  <p>Dear {{parentName}},</p>

  <p>We wanted to share {{studentName}}'s progress in <strong>{{productName}}</strong>.</p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
    <h3 style="margin: 0 0 15px 0;">Overall Progress</h3>
    <div style="background: #e0e0e0; border-radius: 10px; height: 20px; margin: 10px 0;">
      <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); width: {{progressPercentage}}%; height: 100%; border-radius: 10px;"></div>
    </div>
    <p style="text-align: center; font-size: 18px; font-weight: 600; color: {{primaryColor}}; margin: 10px 0;">
      {{progressPercentage}}% Complete
    </p>

    {{#if completedLessons}}
    <p style="margin: 10px 0;">
      Lessons Completed: <strong>{{completedLessons}} of {{totalLessons}}</strong>
    </p>
    {{/if}}

    {{#if recentAchievements}}
    <p style="margin: 10px 0;">
      Recent Achievement: <strong>{{recentAchievements}}</strong>
    </p>
    {{/if}}
  </div>

  {{#if dashboardUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Full Report
    </a>
  </div>
  {{/if}}

  <p>Thank you for your continued support of {{studentName}}'s education.</p>
</div>
        `,
        bodyText: `
Student Progress Report

Dear {{parentName}},

We wanted to share {{studentName}}'s progress in {{productName}}.

Overall Progress: {{progressPercentage}}% Complete

{{#if completedLessons}}
Lessons Completed: {{completedLessons}} of {{totalLessons}}
{{/if}}

{{#if recentAchievements}}
Recent Achievement: {{recentAchievements}}
{{/if}}

{{#if dashboardUrl}}
View Full Report: {{dashboardUrl}}
{{/if}}

Thank you for your continued support of {{studentName}}'s education.
        `,
      },
      he: {
        subject: 'עדכון התקדמות: {{studentName}} - {{productName}}',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>דו"ח התקדמות תלמיד</h2>

  <p>שלום {{parentName}},</p>

  <p>רצינו לשתף אותך בהתקדמות של {{studentName}} ב-<strong>{{productName}}</strong>.</p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
    <h3 style="margin: 0 0 15px 0;">התקדמות כללית</h3>
    <div style="background: #e0e0e0; border-radius: 10px; height: 20px; margin: 10px 0;">
      <div style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); width: {{progressPercentage}}%; height: 100%; border-radius: 10px;"></div>
    </div>
    <p style="text-align: center; font-size: 18px; font-weight: 600; color: {{primaryColor}}; margin: 10px 0;">
      {{progressPercentage}}% הושלם
    </p>

    {{#if completedLessons}}
    <p style="margin: 10px 0;">
      שיעורים שהושלמו: <strong>{{completedLessons}} מתוך {{totalLessons}}</strong>
    </p>
    {{/if}}

    {{#if recentAchievements}}
    <p style="margin: 10px 0;">
      הישג אחרון: <strong>{{recentAchievements}}</strong>
    </p>
    {{/if}}
  </div>

  {{#if dashboardUrl}}
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{dashboardUrl}}" class="button" style="background: linear-gradient(135deg, {{primaryColor}} 0%, {{secondaryColor}} 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">
      צפייה בדו"ח מלא
    </a>
  </div>
  {{/if}}

  <p>תודה על התמיכה המתמשכת שלך בחינוך של {{studentName}}.</p>
</div>
        `,
        bodyText: `
דו"ח התקדמות תלמיד

שלום {{parentName}},

רצינו לשתף אותך בהתקדמות של {{studentName}} ב-{{productName}}.

התקדמות כללית: {{progressPercentage}}% הושלם

{{#if completedLessons}}
שיעורים שהושלמו: {{completedLessons}} מתוך {{totalLessons}}
{{/if}}

{{#if recentAchievements}}
הישג אחרון: {{recentAchievements}}
{{/if}}

{{#if dashboardUrl}}
צפייה בדו"ח מלא: {{dashboardUrl}}
{{/if}}

תודה על התמיכה המתמשכת שלך בחינוך של {{studentName}}.
        `,
      },
    },
  },

  // ============================================================================
  // SYSTEM / AUTHENTICATION TEMPLATES
  // ============================================================================
  {
    key: 'system.user_invitation',
    name: 'User Invitation',
    category: 'system',
    description: 'Sent when admin invites a new user to the platform',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'userEmail', description: 'User email address', example: 'john@example.com', required: true, type: 'string' },
      { name: 'temporaryPassword', description: 'Temporary password', example: 'Temp1234!', required: true, type: 'string' },
      { name: 'role', description: 'User role', example: 'student', required: true, type: 'string' },
      { name: 'organizationName', description: 'Organization name', example: 'IPS Platform', required: true, type: 'string' },
      { name: 'loginUrl', description: 'Login page URL', example: 'https://...', required: true, type: 'url' },
      { name: 'adminName', description: 'Admin who sent invitation', example: 'John Smith', required: false, type: 'string' },
    ],
    versions: {
      en: {
        subject: 'Welcome to {{organizationName}}!',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Welcome to {{organizationName}}!</h2>

  <p>Hi {{userName}},</p>

  <p>You have been invited to join <strong>{{organizationName}}</strong> as a <strong>{{role}}</strong>.</p>

  <div style="background: linear-gradient(to right, #f8f9ff 0%, #ffffff 100%); border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 15px 0; font-size: 18px;">Your Login Credentials</h3>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0;">
      <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> {{userEmail}}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{temporaryPassword}}</code></p>
    </div>
    <p style="margin: 10px 0 0 0; font-size: 13px; color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px;">
      <strong>⚠️ Important:</strong> Please change your password after your first login for security.
    </p>
  </div>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Login to Your Account
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">Or copy this link: <a href="{{loginUrl}}">{{loginUrl}}</a></p>

  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
    <p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>Getting Started:</strong></p>
    <ol style="margin: 10px 0; padding-left: 20px; font-size: 13px; color: #666;">
      <li>Click the button above to access the login page</li>
      <li>Enter your email and temporary password</li>
      <li>You'll be prompted to create a new secure password</li>
      <li>Explore your dashboard and available courses</li>
    </ol>
  </div>

  {{#if adminName}}
  <p style="font-size: 13px; color: #666;">You were invited by: {{adminName}}</p>
  {{/if}}

  <p>We're excited to have you join us!</p>

  <p style="text-align: center; color: #666; font-size: 13px; margin-top: 30px;">
    {{organizationName}}<br/>
    If you have questions, please contact support.
  </p>
</div>
        `,
        bodyText: `
Welcome to {{organizationName}}!

Hi {{userName}},

You have been invited to join {{organizationName}} as a {{role}}.

Your Login Credentials:
------------------------
Email: {{userEmail}}
Temporary Password: {{temporaryPassword}}

⚠️ IMPORTANT: Please change your password after your first login for security.

Login to your account: {{loginUrl}}

Getting Started:
1. Click the link above to access the login page
2. Enter your email and temporary password
3. You'll be prompted to create a new secure password
4. Explore your dashboard and available courses

{{#if adminName}}
You were invited by: {{adminName}}
{{/if}}

We're excited to have you join us!

---
{{organizationName}}
If you have questions, please contact support.
        `,
      },
      he: {
        subject: 'ברוכים הבאים ל-{{organizationName}}!',
        bodyHtml: `
<div style="padding: 20px; direction: rtl;">
  <h2>ברוכים הבאים ל-{{organizationName}}!</h2>

  <p>שלום {{userName}},</p>

  <p>הוזמנת להצטרף ל-<strong>{{organizationName}}</strong> בתפקיד <strong>{{role}}</strong>.</p>

  <div style="background: linear-gradient(to left, #f8f9ff 0%, #ffffff 100%); border-right: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <h3 style="margin: 0 0 15px 0; font-size: 18px;">פרטי ההתחברות שלך</h3>
    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0;">
      <p style="margin: 5px 0; font-size: 14px;"><strong>אימייל:</strong> {{userEmail}}</p>
      <p style="margin: 5px 0; font-size: 14px;"><strong>סיסמה זמנית:</strong> <code style="background: white; padding: 4px 8px; border-radius: 4px; font-family: monospace;">{{temporaryPassword}}</code></p>
    </div>
    <p style="margin: 10px 0 0 0; font-size: 13px; color: #856404; background: #fff3cd; padding: 10px; border-radius: 4px;">
      <strong>⚠️ חשוב:</strong> אנא שנה את הסיסמה שלך לאחר ההתחברות הראשונה למען האבטחה.
    </p>
  </div>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      התחבר לחשבון שלך
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">או העתק קישור זה: <a href="{{loginUrl}}">{{loginUrl}}</a></p>

  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
    <p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>תחילת העבודה:</strong></p>
    <ol style="margin: 10px 0; padding-right: 20px; font-size: 13px; color: #666;">
      <li>לחץ על הכפתור למעלה כדי לגשת לדף ההתחברות</li>
      <li>הזן את האימייל והסיסמה הזמנית שלך</li>
      <li>תתבקש ליצור סיסמה חדשה ומאובטחת</li>
      <li>חקור את לוח הבקרה והקורסים הזמינים</li>
    </ol>
  </div>

  {{#if adminName}}
  <p style="font-size: 13px; color: #666;">הוזמנת על ידי: {{adminName}}</p>
  {{/if}}

  <p>אנחנו שמחים שהצטרפת אלינו!</p>

  <p style="text-align: center; color: #666; font-size: 13px; margin-top: 30px;">
    {{organizationName}}<br/>
    אם יש לך שאלות, אנא פנה לתמיכה.
  </p>
</div>
        `,
        bodyText: `
ברוכים הבאים ל-{{organizationName}}!

שלום {{userName}},

הוזמנת להצטרף ל-{{organizationName}} בתפקיד {{role}}.

פרטי ההתחברות שלך:
--------------------
אימייל: {{userEmail}}
סיסמה זמנית: {{temporaryPassword}}

⚠️ חשוב: אנא שנה את הסיסמה שלך לאחר ההתחברות הראשונה למען האבטחה.

התחבר לחשבון שלך: {{loginUrl}}

תחילת העבודה:
1. לחץ על הקישור למעלה כדי לגשת לדף ההתחברות
2. הזן את האימייל והסיסמה הזמנית שלך
3. תתבקש ליצור סיסמה חדשה ומאובטחת
4. חקור את לוח הבקרה והקורסים הזמינים

{{#if adminName}}
הוזמנת על ידי: {{adminName}}
{{/if}}

אנחנו שמחים שהצטרפת אלינו!

---
{{organizationName}}
אם יש לך שאלות, אנא פנה לתמיכה.
        `,
      },
    },
  },

  {
    key: 'system.password_reset',
    name: 'Password Reset',
    category: 'system',
    description: 'Sent when admin triggers password reset for a user',
    variables: [
      { name: 'userName', description: 'User first name', example: 'John', required: true, type: 'string' },
      { name: 'resetUrl', description: 'Password reset URL with token', example: 'https://...', required: true, type: 'url' },
      { name: 'expiresIn', description: 'Hours until link expires', example: '24', required: true, type: 'number' },
      { name: 'organizationName', description: 'Organization name', example: 'IPS Platform', required: true, type: 'string' },
      { name: 'adminName', description: 'Admin who initiated reset', example: 'Support Team', required: false, type: 'string' },
    ],
    versions: {
      en: {
        subject: 'Reset Your Password',
        bodyHtml: `
<div style="padding: 20px;">
  <h2>Password Reset Request</h2>

  <p>Hi {{userName}},</p>

  <p>We received a request to reset your password for your {{organizationName}} account.</p>

  <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <p style="margin: 0; color: #666;">Click the button below to create a new password:</p>
  </div>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Reset Password
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">Or copy this link: <a href="{{resetUrl}}">{{resetUrl}}</a></p>

  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
    <strong style="color: #856404;">⏰ This link will expire in {{expiresIn}} hours</strong>
  </div>

  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
    <p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>Security Note:</strong></p>
    <ul style="margin: 10px 0; padding-left: 20px; font-size: 13px; color: #666;">
      <li>If you didn't request this password reset, please ignore this email</li>
      <li>Your password won't change until you create a new one</li>
      <li>Never share this link with anyone</li>
    </ul>
  </div>

  {{#if adminName}}
  <p style="font-size: 13px; color: #666;">This reset was initiated by: {{adminName}}</p>
  {{/if}}

  <p style="text-align: center; color: #666; font-size: 13px; margin-top: 30px;">
    {{organizationName}}<br/>
    If you have questions, please contact support.
  </p>
</div>
        `,
        bodyText: `
Password Reset Request

Hi {{userName}},

We received a request to reset your password for your {{organizationName}} account.

Click the link below to create a new password:
{{resetUrl}}

⏰ This link will expire in {{expiresIn}} hours

Security Note:
- If you didn't request this password reset, please ignore this email
- Your password won't change until you create a new one
- Never share this link with anyone

{{#if adminName}}
This reset was initiated by: {{adminName}}
{{/if}}

---
{{organizationName}}
If you have questions, please contact support.
        `,
      },
      he: {
        subject: 'איפוס סיסמה',
        bodyHtml: `
<div style="padding: 20px; direction: rtl;">
  <h2>בקשת איפוס סיסמה</h2>

  <p>שלום {{userName}},</p>

  <p>קיבלנו בקשה לאיפוס הסיסמה שלך עבור חשבון {{organizationName}}.</p>

  <div style="background: #f8f9fa; border-right: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 6px;">
    <p style="margin: 0; color: #666;">לחץ על הכפתור למטה כדי ליצור סיסמה חדשה:</p>
  </div>

  <div style="text-align: center; margin: 35px 0;">
    <a href="{{resetUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
      איפוס סיסמה
    </a>
  </div>

  <p style="font-size: 13px; color: #666; text-align: center;">או העתק קישור זה: <a href="{{resetUrl}}">{{resetUrl}}</a></p>

  <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 25px 0; text-align: center;">
    <strong style="color: #856404;">⏰ קישור זה יפוג בעוד {{expiresIn}} שעות</strong>
  </div>

  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 25px 0;">
    <p style="margin: 5px 0; font-size: 13px; color: #666;"><strong>הערת אבטחה:</strong></p>
    <ul style="margin: 10px 0; padding-right: 20px; font-size: 13px; color: #666;">
      <li>אם לא ביקשת איפוס סיסמה זה, אנא התעלם מאימייל זה</li>
      <li>הסיסמה שלך לא תשתנה עד שתיצור אחת חדשה</li>
      <li>לעולם אל תשתף קישור זה עם אף אחד</li>
    </ul>
  </div>

  {{#if adminName}}
  <p style="font-size: 13px; color: #666;">איפוס זה יזם על ידי: {{adminName}}</p>
  {{/if}}

  <p style="text-align: center; color: #666; font-size: 13px; margin-top: 30px;">
    {{organizationName}}<br/>
    אם יש לך שאלות, אנא פנה לתמיכה.
  </p>
</div>
        `,
        bodyText: `
בקשת איפוס סיסמה

שלום {{userName}},

קיבלנו בקשה לאיפוס הסיסמה שלך עבור חשבון {{organizationName}}.

לחץ על הקישור למטה כדי ליצור סיסמה חדשה:
{{resetUrl}}

⏰ קישור זה יפוג בעוד {{expiresIn}} שעות

הערת אבטחה:
- אם לא ביקשת איפוס סיסמה זה, אנא התעלם מאימייל זה
- הסיסמה שלך לא תשתנה עד שתיצור אחת חדשה
- לעולם אל תשתף קישור זה עם אף אחד

{{#if adminName}}
איפוס זה יזם על ידי: {{adminName}}
{{/if}}

---
{{organizationName}}
אם יש לך שאלות, אנא פנה לתמיכה.
        `,
      },
    },
  },
];
