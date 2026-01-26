import { createClient } from '@supabase/supabase-js';

export type EventType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'ACCESS' | 'MODIFY' | 'EXECUTE' | 'SHARE' | 'CONSENT';
export type EventCategory = 'DATA' | 'AUTH' | 'ADMIN' | 'CONFIG' | 'SECURITY' | 'COMPLIANCE' | 'SYSTEM' | 'EDUCATION' | 'STUDENT_RECORD' | 'GRADE' | 'ATTENDANCE' | 'PARENTAL_ACCESS';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type EventStatus = 'success' | 'failure' | 'partial' | 'pending';

interface AuditEventParams {
  userId: string;
  userEmail: string;
  tenantId?: string; // Optional - will auto-resolve from userId if not provided
  action: string;
  eventType?: EventType;
  eventCategory?: EventCategory;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  description?: string;
  oldValues?: any;
  newValues?: any;
  details?: any; // Backward compatibility - maps to metadata
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  status?: EventStatus;
  riskLevel?: RiskLevel;
  complianceFlags?: string[];
  metadata?: any;
}

// Initialize service role client for audit logging (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseClient;
}

// Auto-resolve tenant_id from userId if not provided
async function resolveTenantId(userId: string): Promise<string | null> {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      console.error('Failed to resolve tenant_id for user:', userId, error);
      return null;
    }

    return (data as any).tenant_id;
  } catch (error) {
    console.error('Error resolving tenant_id:', error);
    return null;
  }
}

export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const supabase = getServiceClient();

    // Resolve tenant_id if not provided
    let tenantId = params.tenantId;
    if (!tenantId && params.userId) {
      const resolvedTenantId = await resolveTenantId(params.userId);
      tenantId = resolvedTenantId || undefined;
    }

    // Determine event type from action if not provided
    const eventType = params.eventType || inferEventType(params.action);

    // Determine resource type from action if not provided
    const resourceType = params.resourceType || inferResourceType(params.action);

    // Determine event category
    const eventCategory = params.eventCategory || inferEventCategory(params.action, resourceType);

    // Prepare audit event data
    const auditData: any = {
      tenant_id: tenantId,
      user_id: params.userId,
      user_email: params.userEmail,
      event_type: eventType,
      event_category: eventCategory,
      resource_type: resourceType,
      resource_id: params.resourceId,
      resource_name: params.resourceName,
      action: params.action,
      description: params.description || generateDescription(params.action, params.details),
      old_values: params.oldValues,
      new_values: params.newValues,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      session_id: params.sessionId,
      status: params.status || 'success',
      risk_level: params.riskLevel || 'low',
      compliance_flags: params.complianceFlags,
      metadata: params.metadata || params.details, // Use metadata or fall back to details
    };

    // Remove undefined fields
    Object.keys(auditData).forEach(key => {
      if (auditData[key] === undefined) {
        delete auditData[key];
      }
    });

    const { error } = await supabase
      .from('audit_events')
      .insert(auditData);

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (error) {
    console.error('Audit logger error:', error);
    // Don't throw - we don't want audit logging failures to break the app
  }
}

// Helper function to infer event type from action
function inferEventType(action: string): EventType {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('add')) return 'CREATE';
  if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('change')) return 'UPDATE';
  if (actionLower.includes('delete') || actionLower.includes('remove')) return 'DELETE';
  if (actionLower.includes('login') || actionLower.includes('signin')) return 'LOGIN';
  if (actionLower.includes('logout') || actionLower.includes('signout')) return 'LOGOUT';
  if (actionLower.includes('export')) return 'EXPORT';
  if (actionLower.includes('import')) return 'IMPORT';
  if (actionLower.includes('access') || actionLower.includes('view') || actionLower.includes('read')) return 'ACCESS';
  return 'MODIFY';
}

// Helper function to infer resource type from action
function inferResourceType(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('profile')) return 'users';
  if (actionLower.includes('avatar')) return 'user_avatars';
  if (actionLower.includes('course')) return 'courses';
  if (actionLower.includes('program')) return 'programs';
  if (actionLower.includes('enrollment')) return 'enrollments';
  if (actionLower.includes('payment')) return 'payments';
  if (actionLower.includes('grade')) return 'grades';
  if (actionLower.includes('translation')) return 'translations';
  return 'system';
}

// Helper function to infer event category
function inferEventCategory(action: string, resourceType: string): EventCategory {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('login') || actionLower.includes('logout') || actionLower.includes('auth')) return 'AUTH';
  if (actionLower.includes('security') || actionLower.includes('permission')) return 'SECURITY';
  if (actionLower.includes('admin') || actionLower.includes('config') || actionLower.includes('setting')) return 'CONFIG';
  if (resourceType === 'grades' || resourceType === 'students') return 'EDUCATION';
  return 'DATA';
}

// Helper function to generate description from details
function generateDescription(action: string, details: any): string {
  if (!details) return action;
  try {
    return `${action} - ${JSON.stringify(details)}`;
  } catch {
    return action;
  }
}
