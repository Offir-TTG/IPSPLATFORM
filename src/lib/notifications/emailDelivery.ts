/**
 * Email Delivery Service for Notifications
 * Sends notifications via email using the notification.generic template
 */

import { createClient } from '@/lib/supabase/server';
import { sendTemplateEmail } from '@/lib/email/emailService';
import type { Notification } from '@/types/notifications';
import type { EmailLanguage } from '@/types/email';

interface EmailDeliveryOptions {
  notification: Notification;
  recipientEmail: string;
  recipientName?: string;
  language?: 'en' | 'he';
  tenantId: string;
  userId?: string;
}

/**
 * Send a notification via email using the notification.generic template
 */
export async function sendNotificationEmail(options: EmailDeliveryOptions): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  const { notification, recipientEmail, recipientName, language = 'en', tenantId, userId } = options;

  try {
    const supabase = await createClient();

    // Get organization name
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    const organizationName = tenant?.name || 'Learning Platform';

    console.log('[Email Delivery] Sending notification email:', {
      to: recipientEmail,
      language,
      priority: notification.priority,
      title: notification.title,
    });

    // Send email using the database template
    const emailResult = await sendTemplateEmail({
      tenantId,
      templateKey: 'notification.generic',
      to: recipientEmail,
      variables: {
        userName: recipientName || 'User',
        notificationTitle: notification.title,
        notificationMessage: notification.message,
        priority: notification.priority,
        category: notification.category,
        actionUrl: notification.action_url,
        actionLabel: notification.action_label,
        organizationName,
        userId,
      },
      language: language as EmailLanguage,
      priority: notification.priority === 'urgent' ? 'urgent' :
                notification.priority === 'high' ? 'high' : 'normal',
    });

    // Log delivery in notification_deliveries table if we have userId
    if (userId && notification.id) {
      const deliveryStatus = emailResult.success ? 'sent' : 'failed';
      const { error: deliveryError } = await supabase
        .from('notification_deliveries')
        .insert({
          notification_id: notification.id,
          user_id: userId,
          channel: 'email',
          status: deliveryStatus,
          sent_at: deliveryStatus === 'sent' ? new Date().toISOString() : null,
          error_message: emailResult.error,
          metadata: {
            email: recipientEmail,
            language,
            template: 'notification.generic',
          },
        });

      if (deliveryError) {
        console.error('[Email Delivery] Error logging delivery:', deliveryError);
      }
    }

    if (!emailResult.success) {
      console.error('[Email Delivery] Failed to send email:', emailResult.error);
      return {
        success: false,
        error: emailResult.error,
      };
    }

    console.log('[Email Delivery] Email sent successfully to:', recipientEmail);
    return {
      success: true,
      messageId: emailResult.message_id,
    };
  } catch (error) {
    console.error('[Email Delivery] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification email to all recipients based on scope
 * This function determines who should receive the email based on the notification scope
 */
export async function sendNotificationEmailToRecipients(
  notification: any,
  tenantId: string,
  emailLanguage: 'en' | 'he' = 'he'
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const supabase = await createClient();
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    let recipientUserIds: string[] = [];

    // Determine recipients based on scope
    if (notification.scope === 'individual') {
      // Single user
      if (notification.target_user_id) {
        recipientUserIds = [notification.target_user_id];
      }
    } else if (notification.scope === 'course') {
      // All users enrolled in course (via direct product or via program)
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          user_id,
          products!inner (
            course_id,
            program_id
          )
        `)
        .eq('status', 'active');

      if (!error && enrollments) {
        // Filter enrollments for this course
        const courseEnrollments = enrollments.filter(e => {
          const product = e.products as any;
          // Direct course enrollment
          if (product.course_id === notification.target_course_id) return true;
          // TODO: Check via program (need to join program_courses table)
          return false;
        });

        recipientUserIds = [...new Set(courseEnrollments.map(e => e.user_id))];
      }
    } else if (notification.scope === 'program') {
      // All users enrolled in program
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select('user_id, products!inner(program_id)')
        .eq('products.program_id', notification.target_program_id)
        .eq('status', 'active');

      if (!error && enrollments) {
        recipientUserIds = [...new Set(enrollments.map(e => e.user_id))];
      }
    } else if (notification.scope === 'tenant') {
      // All users in tenant
      const { data: users, error } = await supabase
        .from('users')
        .select('id')
        .eq('tenant_id', tenantId);

      if (!error && users) {
        recipientUserIds = users.map(u => u.id);
      }
    }

    console.log(`[Email Delivery] Sending to ${recipientUserIds.length} recipients for scope: ${notification.scope}`);

    // Send emails in batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < recipientUserIds.length; i += BATCH_SIZE) {
      const batch = recipientUserIds.slice(i, i + BATCH_SIZE);

      // Get user details for batch
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, preferred_language')
        .in('id', batch);

      if (usersError || !users) {
        console.error('[Email Delivery] Error fetching users:', usersError);
        results.failed += batch.length;
        continue;
      }

      // Send emails in parallel for this batch
      const batchResults = await Promise.all(
        users.map(user =>
          sendNotificationEmail({
            notification,
            recipientEmail: user.email,
            recipientName: user.first_name || 'User',
            language: emailLanguage, // Use admin-selected language
            tenantId,
            userId: user.id,
          })
        )
      );

      batchResults.forEach((result, idx) => {
        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
          if (result.error) {
            results.errors.push(`${users[idx].email}: ${result.error}`);
          }
        }
      });
    }

    console.log('[Email Delivery] Batch complete:', results);
    return results;
  } catch (error) {
    console.error('[Email Delivery] Error in sendNotificationEmailToRecipients:', error);
    return {
      sent: results.sent,
      failed: results.failed + 1,
      errors: [...results.errors, error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
