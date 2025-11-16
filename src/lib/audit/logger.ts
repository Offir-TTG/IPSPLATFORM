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

    // Get user's tenant_id
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', params.userId)
      .single();

    // Log to audit_events table
    const { error } = await supabase
      .from('audit_events')
      .insert({
        tenant_id: userData?.tenant_id,
        user_id: params.userId,
        user_email: params.userEmail,
        action: params.action,
        details: params.details || {},
        ip_address: params.ipAddress || 'unknown',
        user_agent: params.userAgent || 'unknown',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logger error:', error);
    // Don't throw - we don't want audit logging failures to break the app
  }
}