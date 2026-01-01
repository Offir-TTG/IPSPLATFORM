/**
 * SMS/WhatsApp Delivery Service for Notifications
 * Sends urgent notifications via Twilio SMS and WhatsApp
 *
 * Required Environment Variables:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER (for SMS)
 * - TWILIO_WHATSAPP_NUMBER (for WhatsApp, e.g., whatsapp:+14155238886)
 */

import type { Notification } from '@/types/notifications';

interface SMSDeliveryOptions {
  notification: Notification;
  recipientPhone: string;
  recipientName?: string;
  useWhatsApp?: boolean;
}

/**
 * Send a notification via SMS
 * Only sends for urgent priority notifications
 */
export async function sendNotificationSMS(options: SMSDeliveryOptions): Promise<{
  success: boolean;
  error?: string;
  messageSid?: string;
}> {
  const { notification, recipientPhone, useWhatsApp = false } = options;

  // Only send SMS for urgent notifications to prevent spam
  if (notification.priority !== 'urgent') {
    return {
      success: false,
      error: 'SMS delivery is only available for urgent notifications',
    };
  }

  try {
    // Check if Twilio is configured
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = useWhatsApp
      ? process.env.TWILIO_WHATSAPP_NUMBER
      : process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[SMS Delivery] Twilio not configured');
      return {
        success: false,
        error: 'SMS delivery not configured',
      };
    }

    // Dynamically import Twilio (only when needed)
    const { default: twilio } = await import('twilio');
    const client = twilio(accountSid, authToken);

    // Format phone number for WhatsApp if needed
    const toNumber = useWhatsApp && !recipientPhone.startsWith('whatsapp:')
      ? `whatsapp:${recipientPhone}`
      : recipientPhone;

    // Build message body (keep it concise for SMS)
    const actionText = notification.action_url
      ? `\n\nView: ${notification.action_url}`
      : '';

    const messageBody = `🔴 URGENT: ${notification.title}\n\n${notification.message}${actionText}`;

    // Send via Twilio
    const message = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messageBody,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error('[SMS Delivery] Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a notification via WhatsApp
 * Only sends for urgent priority notifications
 */
export async function sendNotificationWhatsApp(options: SMSDeliveryOptions): Promise<{
  success: boolean;
  error?: string;
  messageSid?: string;
}> {
  return sendNotificationSMS({ ...options, useWhatsApp: true });
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation - should be E.164 format: +[country code][number]
  // Example: +12345678900
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/whatsapp:/, ''));
}

/**
 * Format phone number to E.164 format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^+\d]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  return cleaned;
}
