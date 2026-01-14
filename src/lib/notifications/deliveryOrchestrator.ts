/**
 * Notification Delivery Orchestrator
 * Coordinates multi-channel delivery based on user preferences
 */

import { createClient } from '@/lib/supabase/server';
import { sendNotificationEmail } from './emailDelivery';
import { sendNotificationSMS } from './smsDelivery';
import { sendPushNotification } from './pushDelivery';
import type { Notification, NotificationCategory, DeliveryChannel } from '@/types/notifications';

interface DeliveryResult {
  channel: DeliveryChannel;
  success: boolean;
  error?: string;
  messageId?: string;
}

interface UserDeliveryInfo {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tenant_id: string;
  language?: 'en' | 'he';
}

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  category_preferences: Record<
    NotificationCategory,
    {
      in_app: boolean;
      email: boolean;
      sms: boolean;
      push: boolean;
    }
  >;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
  phone_number: string | null;
  push_subscription: any;
}

/**
 * Deliver a notification to a specific user across appropriate channels
 */
export async function deliverNotification(
  notification: Notification,
  userId: string,
  adminOverrideChannels?: DeliveryChannel[]
): Promise<{
  success: boolean;
  results: DeliveryResult[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Get user information
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, tenant_id, language_code')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return {
        success: false,
        results: [],
        error: 'User not found',
      };
    }

    const userInfo: UserDeliveryInfo = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant_id: user.tenant_id,
      language: user.language_code || 'en',
    };

    // Get user notification preferences
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', user.tenant_id)
      .maybeSingle();

    if (prefsError) {
      console.error('[Delivery Orchestrator] Error fetching preferences:', prefsError);
    }

    // Use defaults if no preferences exist
    const userPrefs: NotificationPreferences = preferences || getDefaultPreferences();

    // Determine which channels to use
    const channels = determineChannels(notification, userPrefs, adminOverrideChannels);

    // Check quiet hours for external channels
    const isQuietHours = checkQuietHours(userPrefs);
    const results: DeliveryResult[] = [];

    // In-app is always delivered (already in database)
    results.push({ channel: 'in_app', success: true });

    // Deliver through external channels (if not in quiet hours)
    if (!isQuietHours || notification.priority === 'urgent') {
      // Email delivery
      if (channels.includes('email') && user.email) {
        const emailResult = await sendNotificationEmail({
          notification,
          recipientEmail: user.email,
          recipientName: getUserFullName(user),
          language: userInfo.language,
          tenantId: user.tenant_id,
        });

        results.push({
          channel: 'email',
          success: emailResult.success,
          error: emailResult.error,
          messageId: emailResult.messageId,
        });
      }

      // SMS delivery (only for urgent)
      if (channels.includes('sms') && notification.priority === 'urgent' && userPrefs.phone_number) {
        const smsResult = await sendNotificationSMS({
          notification,
          recipientPhone: userPrefs.phone_number,
          recipientName: getUserFullName(user),
        });

        results.push({
          channel: 'sms',
          success: smsResult.success,
          error: smsResult.error,
          messageId: smsResult.messageSid,
        });
      }

      // Push delivery
      if (channels.includes('push') && userPrefs.push_subscription) {
        const pushResult = await sendPushNotification({
          notification,
          subscription: userPrefs.push_subscription,
        });

        results.push({
          channel: 'push',
          success: pushResult.success,
          error: pushResult.error,
        });

        // If subscription expired, update preferences
        if (pushResult.error === 'Subscription expired') {
          await supabase
            .from('notification_preferences')
            .update({ push_subscription: null })
            .eq('user_id', userId);
        }
      }
    } else {
      console.log('[Delivery Orchestrator] Skipping external channels due to quiet hours');
    }

    // Log delivery results
    await logDeliveryResults(notification.id, userId, results);

    const allSuccessful = results.every((r) => r.success);

    return {
      success: allSuccessful,
      results,
    };
  } catch (error) {
    console.error('[Delivery Orchestrator] Error delivering notification:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Determine which channels to use based on preferences and admin overrides
 */
function determineChannels(
  notification: Notification,
  preferences: NotificationPreferences,
  adminOverrideChannels?: DeliveryChannel[]
): DeliveryChannel[] {
  // If admin specified channels, use those (but still respect user's master toggles)
  if (adminOverrideChannels && adminOverrideChannels.length > 0) {
    return adminOverrideChannels.filter((channel) => {
      if (channel === 'in_app') return true; // Always allow in-app
      if (channel === 'email') return preferences.email_enabled;
      if (channel === 'sms') return preferences.sms_enabled;
      if (channel === 'push') return preferences.push_enabled;
      return false;
    });
  }

  // Use user's category preferences
  const categoryPrefs = preferences.category_preferences?.[notification.category as NotificationCategory];
  const channels: DeliveryChannel[] = ['in_app']; // Always include in-app

  if (!categoryPrefs) {
    // No category preferences, use defaults
    if (preferences.email_enabled) channels.push('email');
    if (preferences.push_enabled) channels.push('push');
    if (preferences.sms_enabled && notification.priority === 'urgent') channels.push('sms');
    return channels;
  }

  // Apply category and master preferences
  if (categoryPrefs.email && preferences.email_enabled) channels.push('email');
  if (categoryPrefs.sms && preferences.sms_enabled && notification.priority === 'urgent') channels.push('sms');
  if (categoryPrefs.push && preferences.push_enabled) channels.push('push');

  return channels;
}

/**
 * Check if current time is within quiet hours
 */
function checkQuietHours(preferences: NotificationPreferences): boolean {
  if (!preferences.quiet_hours_start || !preferences.quiet_hours_end) {
    return false; // No quiet hours configured
  }

  try {
    const now = new Date();
    const timezone = preferences.quiet_hours_timezone || 'UTC';

    // Parse quiet hours (format: "HH:MM")
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);

    // Create date objects for comparison
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const quietStart = startHour * 60 + startMin;
    const quietEnd = endHour * 60 + endMin;

    // Handle cases where quiet hours span midnight
    if (quietStart < quietEnd) {
      return currentTime >= quietStart && currentTime < quietEnd;
    } else {
      return currentTime >= quietStart || currentTime < quietEnd;
    }
  } catch (error) {
    console.error('[Delivery Orchestrator] Error checking quiet hours:', error);
    return false;
  }
}

/**
 * Log delivery results to database
 */
async function logDeliveryResults(
  notificationId: string,
  userId: string,
  results: DeliveryResult[]
): Promise<void> {
  try {
    const supabase = await createClient();

    const deliveryLogs = results.map((result) => ({
      notification_id: notificationId,
      user_id: userId,
      channel: result.channel,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      sent_at: new Date().toISOString(),
    }));

    await supabase.from('notification_deliveries').insert(deliveryLogs);
  } catch (error) {
    console.error('[Delivery Orchestrator] Error logging delivery results:', error);
  }
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences(): NotificationPreferences {
  return {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    category_preferences: {
      lesson: { in_app: true, email: true, sms: false, push: true },
      assignment: { in_app: true, email: true, sms: false, push: true },
      payment: { in_app: true, email: true, sms: true, push: true },
      enrollment: { in_app: true, email: true, sms: false, push: true },
      attendance: { in_app: true, email: false, sms: false, push: false },
      achievement: { in_app: true, email: true, sms: false, push: true },
      announcement: { in_app: true, email: true, sms: false, push: true },
      system: { in_app: true, email: false, sms: false, push: false },
    },
    quiet_hours_start: null,
    quiet_hours_end: null,
    quiet_hours_timezone: 'UTC',
    phone_number: null,
    push_subscription: null,
  };
}

/**
 * Get user's full name
 */
function getUserFullName(user: any): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  return user.first_name || user.email || 'User';
}
