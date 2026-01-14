/**
 * Email Trigger Execution Engine
 *
 * Processes email triggers in response to platform events.
 * Main functions:
 * - processTriggerEvent(): Main entry point for firing triggers
 * - determineRecipient(): Extracts recipient information from event data
 * - calculateScheduledTime(): Calculates when email should be sent
 * - testTrigger(): Test a trigger with sample data
 */

import { createClient } from '@/lib/supabase/server';

// =====================================================
// Types
// =====================================================

export interface TriggerEvent {
  eventType: string;
  tenantId: string;
  eventData: Record<string, any>;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EmailTrigger {
  id: string;
  trigger_name: string;
  trigger_event: string;
  template_id: string;
  template_name: string;
  template_key: string;
  conditions: Record<string, any> | null;
  delay_minutes: number | null;
  send_time: string | null;
  send_days_before: number | null;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  recipient_role: string | null;
  recipient_field: string | null;
}

export interface RecipientInfo {
  email: string;
  name?: string;
  userId?: string;
  languageCode?: string;
}

export interface TriggerResult {
  success: boolean;
  triggerId: string;
  emailQueueId?: string;
  error?: string;
  skipped?: boolean;
  skipReason?: string;
}

// =====================================================
// Main Trigger Processing Function
// =====================================================

/**
 * Process a trigger event and queue emails for matching triggers
 *
 * @param event - The trigger event containing event type, tenant, and data
 * @returns Array of results for each processed trigger
 */
export async function processTriggerEvent(
  event: TriggerEvent
): Promise<TriggerResult[]> {
  const { eventType, tenantId, eventData, metadata } = event;
  const results: TriggerResult[] = [];

  try {
    const supabase = await createClient();

    // Find all matching triggers for this event type
    const { data: triggers, error: triggersError } = await supabase
      .rpc('find_matching_triggers', {
        p_tenant_id: tenantId,
        p_trigger_event: eventType,
      });

    if (triggersError) {
      console.error('Error finding triggers:', triggersError);
      return [{
        success: false,
        triggerId: 'unknown',
        error: `Failed to find triggers: ${triggersError.message}`,
      }];
    }

    if (!triggers || triggers.length === 0) {
      console.log(`No triggers found for event: ${eventType}`);
      return [];
    }

    console.log(`Found ${triggers.length} trigger(s) for event: ${eventType}`);

    // Process each trigger
    for (const trigger of triggers as EmailTrigger[]) {
      try {
        const result = await processSingleTrigger(trigger, eventData, tenantId);
        results.push(result);
      } catch (error: any) {
        console.error(`Error processing trigger ${trigger.id}:`, error);
        results.push({
          success: false,
          triggerId: trigger.id,
          error: error.message || 'Unknown error',
        });
      }
    }

    return results;
  } catch (error: any) {
    console.error('Error in processTriggerEvent:', error);
    return [{
      success: false,
      triggerId: 'unknown',
      error: error.message || 'Unknown error processing trigger event',
    }];
  }
}

// =====================================================
// Single Trigger Processing
// =====================================================

/**
 * Process a single trigger: evaluate conditions, determine recipient, queue email
 */
async function processSingleTrigger(
  trigger: EmailTrigger,
  eventData: Record<string, any>,
  tenantId: string
): Promise<TriggerResult> {
  const supabase = await createClient();

  // Evaluate trigger conditions
  if (trigger.conditions) {
    const { data: conditionMet, error: conditionError } = await supabase
      .rpc('evaluate_trigger_conditions', {
        p_conditions: trigger.conditions,
        p_event_data: eventData,
      });

    if (conditionError) {
      console.error('Error evaluating conditions:', conditionError);
      return {
        success: false,
        triggerId: trigger.id,
        error: `Condition evaluation failed: ${conditionError.message}`,
      };
    }

    if (!conditionMet) {
      console.log(`Trigger ${trigger.id} conditions not met, skipping`);
      return {
        success: true,
        triggerId: trigger.id,
        skipped: true,
        skipReason: 'Conditions not met',
      };
    }
  }

  // Determine recipient
  const recipient = await determineRecipient(
    trigger,
    eventData,
    tenantId
  );

  if (!recipient) {
    console.warn(`Could not determine recipient for trigger ${trigger.id}`);
    return {
      success: false,
      triggerId: trigger.id,
      error: 'Could not determine recipient',
    };
  }

  // Calculate scheduled time
  const scheduledFor = calculateScheduledTime(trigger, eventData);

  // Extract template variables from event data
  const templateVariables = extractTemplateVariables(eventData, trigger);

  // Queue the email
  const { data: emailQueueId, error: queueError } = await supabase
    .rpc('queue_triggered_email', {
      p_tenant_id: tenantId,
      p_trigger_id: trigger.id,
      p_template_key: trigger.template_key,
      p_language_code: recipient.languageCode || 'en',
      p_recipient_email: recipient.email,
      p_recipient_name: recipient.name || '',
      p_recipient_user_id: recipient.userId || null,
      p_template_variables: templateVariables,
      p_priority: trigger.priority,
      p_scheduled_for: scheduledFor?.toISOString() || null,
    });

  if (queueError) {
    console.error('Error queueing email:', queueError);
    return {
      success: false,
      triggerId: trigger.id,
      error: `Failed to queue email: ${queueError.message}`,
    };
  }

  console.log(`Email queued successfully for trigger ${trigger.id}, queue ID: ${emailQueueId}`);

  return {
    success: true,
    triggerId: trigger.id,
    emailQueueId: emailQueueId as string,
  };
}

// =====================================================
// Recipient Determination
// =====================================================

/**
 * Determine email recipient from event data or user lookup
 */
async function determineRecipient(
  trigger: EmailTrigger,
  eventData: Record<string, any>,
  tenantId: string
): Promise<RecipientInfo | null> {
  const supabase = await createClient();

  // Strategy 1: Use recipient_field to extract from event data
  if (trigger.recipient_field) {
    const fieldParts = trigger.recipient_field.split('.');
    let value: any = eventData;

    // Navigate nested fields (e.g., "user.email")
    for (const part of fieldParts) {
      value = value?.[part];
      if (value === undefined) break;
    }

    if (value && typeof value === 'string' && value.includes('@')) {
      return {
        email: value,
        name: eventData.userName || eventData.user_name || eventData.name,
        userId: eventData.userId || eventData.user_id,
        languageCode: eventData.languageCode || eventData.language_code,
      };
    }
  }

  // Strategy 2: Use recipient_role to lookup user
  if (trigger.recipient_role && eventData.userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, preferred_language')
      .eq('id', eventData.userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (user) {
      return {
        email: user.email,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        userId: user.id,
        languageCode: user.preferred_language || 'en',
      };
    }
  }

  // Strategy 3: Direct email in event data
  if (eventData.email && typeof eventData.email === 'string') {
    return {
      email: eventData.email,
      name: eventData.name || eventData.userName,
      userId: eventData.userId,
      languageCode: eventData.languageCode || 'en',
    };
  }

  // Strategy 4: User email from event data
  if (eventData.userEmail) {
    return {
      email: eventData.userEmail,
      name: eventData.userName,
      userId: eventData.userId,
      languageCode: eventData.languageCode || 'en',
    };
  }

  return null;
}

// =====================================================
// Scheduled Time Calculation
// =====================================================

/**
 * Calculate when the email should be sent based on trigger timing settings
 */
function calculateScheduledTime(
  trigger: EmailTrigger,
  eventData: Record<string, any>
): Date | null {
  const now = new Date();

  // Case 1: Send at specific time of day
  if (trigger.send_time) {
    const [hours, minutes] = trigger.send_time.split(':').map(Number);
    const scheduledDate = new Date(now);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledDate < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return scheduledDate;
  }

  // Case 2: Send X days before an event (for reminders)
  if (trigger.send_days_before !== null && eventData.eventDate) {
    const eventDate = new Date(eventData.eventDate);
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - trigger.send_days_before);

    return reminderDate > now ? reminderDate : null;
  }

  // Case 3: Delay by X minutes
  if (trigger.delay_minutes && trigger.delay_minutes > 0) {
    const scheduledDate = new Date(now);
    scheduledDate.setMinutes(scheduledDate.getMinutes() + trigger.delay_minutes);
    return scheduledDate;
  }

  // Case 4: Send immediately
  return null;
}

// =====================================================
// Template Variables Extraction
// =====================================================

/**
 * Extract and format template variables from event data
 */
function extractTemplateVariables(
  eventData: Record<string, any>,
  trigger: EmailTrigger
): Record<string, any> {
  // Start with all event data
  const variables: Record<string, any> = { ...eventData };

  // Add common variables
  variables.triggerName = trigger.trigger_name;
  variables.currentDate = new Date().toISOString();
  variables.currentYear = new Date().getFullYear();

  // Format specific fields for email templates
  if (eventData.amount && typeof eventData.amount === 'number') {
    variables.formattedAmount = `$${eventData.amount.toFixed(2)}`;
  }

  if (eventData.eventDate) {
    try {
      const date = new Date(eventData.eventDate);
      variables.formattedEventDate = date.toLocaleDateString();
      variables.formattedEventTime = date.toLocaleTimeString();
    } catch (error) {
      console.warn('Error formatting event date:', error);
    }
  }

  return variables;
}

// =====================================================
// Test Trigger Function
// =====================================================

/**
 * Test a trigger with sample data without actually sending email
 */
export async function testTrigger(
  triggerId: string,
  sampleEventData: Record<string, any>,
  tenantId: string
): Promise<{
  success: boolean;
  conditionsMet?: boolean;
  recipient?: RecipientInfo | null;
  scheduledFor?: Date | null;
  templateVariables?: Record<string, any>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Fetch trigger
    const { data: trigger, error: triggerError } = await supabase
      .from('email_triggers')
      .select(`
        id,
        trigger_name,
        trigger_event,
        template_id,
        conditions,
        delay_minutes,
        send_time,
        send_days_before,
        priority,
        recipient_role,
        recipient_field,
        email_templates (
          template_name,
          template_key
        )
      `)
      .eq('id', triggerId)
      .eq('tenant_id', tenantId)
      .single();

    if (triggerError || !trigger) {
      return {
        success: false,
        error: 'Trigger not found',
      };
    }

    // Flatten template data
    const triggerData: EmailTrigger = {
      ...trigger,
      template_name: trigger.email_templates?.template_name || '',
      template_key: trigger.email_templates?.template_key || '',
    };

    // Evaluate conditions
    let conditionsMet = true;
    if (trigger.conditions) {
      const { data: conditionResult, error: conditionError } = await supabase
        .rpc('evaluate_trigger_conditions', {
          p_conditions: trigger.conditions,
          p_event_data: sampleEventData,
        });

      if (conditionError) {
        return {
          success: false,
          error: `Condition evaluation failed: ${conditionError.message}`,
        };
      }

      conditionsMet = conditionResult as boolean;
    }

    // Determine recipient
    const recipient = await determineRecipient(
      triggerData,
      sampleEventData,
      tenantId
    );

    // Calculate scheduled time
    const scheduledFor = calculateScheduledTime(triggerData, sampleEventData);

    // Extract template variables
    const templateVariables = extractTemplateVariables(sampleEventData, triggerData);

    return {
      success: true,
      conditionsMet,
      recipient,
      scheduledFor,
      templateVariables,
    };
  } catch (error: any) {
    console.error('Error testing trigger:', error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// =====================================================
// Batch Trigger Processing (for cron jobs)
// =====================================================

/**
 * Process multiple events in batch (useful for scheduled reminders)
 */
export async function processBatchTriggerEvents(
  events: TriggerEvent[]
): Promise<TriggerResult[]> {
  const allResults: TriggerResult[] = [];

  for (const event of events) {
    const results = await processTriggerEvent(event);
    allResults.push(...results);
  }

  return allResults;
}
