import { createClient } from '@/lib/supabase/server';

interface AuditEventParams {
  userId: string;
  userEmail: string;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = await createClient();

    // Log to audit_events table
    // Note: event_timestamp has DEFAULT NOW(), so we don't need to pass it
    const { error } = await supabase
      .from('audit_events')
      .insert({
        user_id: params.userId,
        user_email: params.userEmail,
        event_type: 'UPDATE', // Default to UPDATE, can be parameterized later
        event_category: 'DATA', // Default to DATA, can be parameterized later
        resource_type: 'program', // This should be parameterized based on action
        action: params.action,
        description: JSON.stringify(params.details || {}),
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        status: 'success',
        risk_level: 'low'
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logger error:', error);
    // Don't throw - we don't want audit logging failures to break the app
  }
}