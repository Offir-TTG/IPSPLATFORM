// ============================================================================
// AUDIT TRAIL SERVICE
// Centralized service for logging and retrieving audit events
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import type {
  AuditEvent,
  CreateAuditEventParams,
  AuditFilters,
  ParentalConsent,
  StudentRecordAccess,
  GradeChange,
  AuditAlert,
} from './types';

// Initialize Supabase client
// Note: Uses SERVICE_ROLE_KEY to bypass RLS for system-level audit logging
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
}

// ============================================================================
// CORE AUDIT LOGGING
// ============================================================================

/**
 * Log an audit event using the database function
 * This is the main function to call from application code
 */
export async function logAuditEvent(params: CreateAuditEventParams): Promise<string | null> {
  try {
    const client = getSupabaseClient();

    // Call the database function
    const { data, error } = await client.rpc('log_audit_event', {
      p_user_id: params.user_id || null,
      p_event_type: params.event_type,
      p_event_category: params.event_category,
      p_resource_type: params.resource_type,
      p_resource_id: params.resource_id || null,
      p_resource_name: params.resource_name || null,
      p_action: params.action,
      p_description: params.description || null,
      p_old_values: params.old_values || null,
      p_new_values: params.new_values || null,
      p_session_id: params.session_id || null,
      p_ip_address: params.ip_address || null,
      p_user_agent: params.user_agent || null,
      p_status: params.status || 'success',
      p_risk_level: params.risk_level || 'low',
      p_metadata: params.metadata || null,
    } as any);

    if (error) {
      console.error('Error logging audit event:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('Exception logging audit event:', error);
    return null;
  }
}

/**
 * Helper function to get current user's IP address and user agent
 */
export function getClientInfo(req?: Request): { ip?: string; userAgent?: string } {
  if (typeof window !== 'undefined') {
    // Client-side
    return {
      userAgent: navigator.userAgent,
    };
  }

  if (req) {
    // Server-side with request object
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || undefined;

    return {
      ip,
      userAgent: req.headers.get('user-agent') || undefined,
    };
  }

  return {};
}

/**
 * Generate a session ID for tracking user sessions
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

// ============================================================================
// CONVENIENCE LOGGING FUNCTIONS
// ============================================================================

/**
 * Log user authentication event
 */
export async function logAuthEvent(
  userId: string | undefined,
  action: 'login' | 'logout' | 'failed_login' | 'password_reset',
  metadata?: Record<string, any>
) {
  const clientInfo = getClientInfo();

  return logAuditEvent({
    user_id: userId,
    event_type: action === 'login' ? 'LOGIN' : action === 'logout' ? 'LOGOUT' : 'ACCESS',
    event_category: 'AUTH',
    resource_type: 'auth_session',
    action: action.replace('_', ' '),
    status: action === 'failed_login' ? 'failure' : 'success',
    risk_level: action === 'failed_login' ? 'medium' : 'low',
    ...clientInfo,
    metadata,
  });
}

/**
 * Log student record access (FERPA compliance)
 */
export async function logStudentRecordAccess(
  userId: string,
  studentId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  metadata?: Record<string, any>
) {
  const clientInfo = getClientInfo();

  return logAuditEvent({
    user_id: userId,
    event_type: 'ACCESS',
    event_category: 'STUDENT_RECORD',
    resource_type: resourceType,
    resource_id: resourceId,
    action,
    student_id: studentId,
    is_student_record: true,
    compliance_flags: ['FERPA'],
    risk_level: 'medium',
    ...clientInfo,
    metadata,
  });
}

/**
 * Log grade change (high-risk event)
 */
export async function logGradeChange(
  userId: string,
  studentId: string,
  gradeId: string,
  oldGrade: any,
  newGrade: any,
  metadata?: Record<string, any>
) {
  const clientInfo = getClientInfo();

  return logAuditEvent({
    user_id: userId,
    event_type: 'UPDATE',
    event_category: 'GRADE',
    resource_type: 'grades',
    resource_id: gradeId,
    action: 'Updated student grade',
    old_values: oldGrade,
    new_values: newGrade,
    student_id: studentId,
    is_student_record: true,
    compliance_flags: ['FERPA'],
    risk_level: 'high',
    ...clientInfo,
    metadata,
  });
}

/**
 * Log parental consent action (COPPA compliance)
 */
export async function logConsentAction(
  userId: string,
  studentId: string,
  consentId: string,
  action: string,
  consentType: string,
  metadata?: Record<string, any>
) {
  const clientInfo = getClientInfo();

  return logAuditEvent({
    user_id: userId,
    event_type: 'CONSENT',
    event_category: 'COMPLIANCE',
    resource_type: 'parental_consent',
    resource_id: consentId,
    action,
    student_id: studentId,
    parental_consent_id: consentId,
    compliance_flags: ['COPPA', 'FERPA'],
    risk_level: 'medium',
    ...clientInfo,
    metadata: { consent_type: consentType, ...metadata },
  });
}

/**
 * Log data export (high-risk event)
 */
export async function logDataExport(
  userId: string,
  resourceType: string,
  exportFormat: string,
  recordCount: number,
  metadata?: Record<string, any>
) {
  const clientInfo = getClientInfo();

  return logAuditEvent({
    user_id: userId,
    event_type: 'EXPORT',
    event_category: 'DATA',
    resource_type: resourceType,
    action: `Exported ${recordCount} ${resourceType} records as ${exportFormat}`,
    risk_level: recordCount > 100 ? 'high' : 'medium',
    ...clientInfo,
    metadata: {
      export_format: exportFormat,
      record_count: recordCount,
      ...metadata,
    },
  });
}

/**
 * Log configuration change (admin action)
 */
export async function logConfigChange(
  userId: string,
  resourceType: string,
  resourceId: string,
  oldValues: any,
  newValues: any,
  metadata?: Record<string, any>
) {
  const clientInfo = getClientInfo();

  // Filter out automatic database fields that shouldn't be shown in audit logs
  const automaticFields = ['updated_at', 'created_at', 'id'];
  const filteredOldValues = oldValues ? Object.fromEntries(
    Object.entries(oldValues).filter(([key]) => !automaticFields.includes(key))
  ) : undefined;
  const filteredNewValues = newValues ? Object.fromEntries(
    Object.entries(newValues).filter(([key]) => !automaticFields.includes(key))
  ) : undefined;

  return logAuditEvent({
    user_id: userId,
    event_type: 'UPDATE',
    event_category: 'CONFIG',
    resource_type: resourceType,
    resource_id: resourceId,
    action: `Updated ${resourceType} configuration`,
    old_values: filteredOldValues,
    new_values: filteredNewValues,
    risk_level: 'high',
    ...clientInfo,
    metadata,
  });
}

// ============================================================================
// AUDIT RETRIEVAL
// ============================================================================

/**
 * Get audit events with filters
 */
export async function getAuditEvents(
  filters: AuditFilters = {}
): Promise<{ data: AuditEvent[]; error: any; count: number }> {
  try {
    const client = getSupabaseClient();

    let query = client.from('audit_events').select('*', { count: 'exact' });

    // Apply filters
    if (filters.date_from) {
      query = query.gte('event_timestamp', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('event_timestamp', filters.date_to);
    }
    if (filters.user_ids && filters.user_ids.length > 0) {
      query = query.in('user_id', filters.user_ids);
    }
    if (filters.student_ids && filters.student_ids.length > 0) {
      query = query.in('student_id', filters.student_ids);
    }
    if (filters.event_types && filters.event_types.length > 0) {
      query = query.in('event_type', filters.event_types);
    }
    if (filters.event_categories && filters.event_categories.length > 0) {
      query = query.in('event_category', filters.event_categories);
    }
    if (filters.resource_types && filters.resource_types.length > 0) {
      query = query.in('resource_type', filters.resource_types);
    }
    if (filters.risk_levels && filters.risk_levels.length > 0) {
      query = query.in('risk_level', filters.risk_levels);
    }
    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status);
    }
    if (filters.is_student_record !== undefined) {
      query = query.eq('is_student_record', filters.is_student_record);
    }
    if (filters.is_minor_data !== undefined) {
      query = query.eq('is_minor_data', filters.is_minor_data);
    }
    if (filters.search) {
      query = query.textSearch('search_vector', filters.search);
    }

    // Order by timestamp descending
    query = query.order('event_timestamp', { ascending: false });

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error, count } = await query;

    return {
      data: (data as AuditEvent[]) || [],
      error,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error getting audit events:', error);
    return { data: [], error, count: 0 };
  }
}

/**
 * Get student record access logs (FERPA view)
 */
export async function getStudentRecordAccess(
  studentId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ data: StudentRecordAccess[]; error: any }> {
  try {
    const client = getSupabaseClient();

    let query = client.from('audit_student_record_access').select('*');

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (dateFrom) {
      query = query.gte('event_timestamp', dateFrom);
    }
    if (dateTo) {
      query = query.lte('event_timestamp', dateTo);
    }

    query = query.order('event_timestamp', { ascending: false }).limit(100);

    const { data, error } = await query;

    return {
      data: (data as StudentRecordAccess[]) || [],
      error,
    };
  } catch (error) {
    console.error('Error getting student record access:', error);
    return { data: [], error };
  }
}

/**
 * Get grade changes audit
 */
export async function getGradeChanges(
  studentId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<{ data: GradeChange[]; error: any }> {
  try {
    const client = getSupabaseClient();

    let query = client.from('audit_grade_changes').select('*');

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (dateFrom) {
      query = query.gte('event_timestamp', dateFrom);
    }
    if (dateTo) {
      query = query.lte('event_timestamp', dateTo);
    }

    query = query.order('event_timestamp', { ascending: false }).limit(100);

    const { data, error } = await query;

    return {
      data: (data as GradeChange[]) || [],
      error,
    };
  } catch (error) {
    console.error('Error getting grade changes:', error);
    return { data: [], error };
  }
}

/**
 * Get high-risk events
 */
export async function getHighRiskEvents(
  limit: number = 50
): Promise<{ data: AuditEvent[]; error: any }> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('audit_high_risk_events')
      .select('*')
      .order('event_timestamp', { ascending: false })
      .limit(limit);

    return {
      data: (data as AuditEvent[]) || [],
      error,
    };
  } catch (error) {
    console.error('Error getting high-risk events:', error);
    return { data: [], error };
  }
}

/**
 * Get active alerts
 */
export async function getActiveAlerts(): Promise<{ data: AuditAlert[]; error: any }> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('audit_alerts')
      .select('*')
      .in('status', ['open', 'investigating'])
      .order('detected_at', { ascending: false });

    return {
      data: (data as AuditAlert[]) || [],
      error,
    };
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return { data: [], error };
  }
}

// ============================================================================
// PARENTAL CONSENT MANAGEMENT
// ============================================================================

/**
 * Get parental consent for a student
 */
export async function getParentalConsent(
  studentId: string
): Promise<{ data: ParentalConsent[]; error: any }> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('parental_consent_audit')
      .select('*')
      .eq('student_id', studentId)
      .order('requested_at', { ascending: false });

    return {
      data: (data as ParentalConsent[]) || [],
      error,
    };
  } catch (error) {
    console.error('Error getting parental consent:', error);
    return { data: [], error };
  }
}

/**
 * Check if student has valid consent for a specific type
 */
export async function hasValidConsent(
  studentId: string,
  consentType: string
): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('parental_consent_audit')
      .select('id, consent_status, expires_at')
      .eq('student_id', studentId)
      .eq('consent_type', consentType)
      .eq('consent_status', 'granted')
      .single();

    if (error || !data) {
      return false;
    }

    // Check if expired
    const consentData = data as any;
    if (consentData.expires_at) {
      const expiryDate = new Date(consentData.expires_at);
      if (expiryDate < new Date()) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking consent:', error);
    return false;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Verify audit chain integrity
 */
export async function verifyAuditChain(
  dateFrom?: string,
  dateTo?: string
): Promise<{ isValid: boolean; totalEvents: number; invalidEvents: number }> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client.rpc('verify_audit_chain', {
      p_date_from: dateFrom || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      p_date_to: dateTo || new Date().toISOString(),
    } as any);

    if (error) {
      console.error('Error verifying audit chain:', error);
      return { isValid: false, totalEvents: 0, invalidEvents: 0 };
    }

    const result = data as any;
    return {
      isValid: result[0].is_valid,
      totalEvents: result[0].total_events,
      invalidEvents: result[0].invalid_events,
    };
  } catch (error) {
    console.error('Exception verifying audit chain:', error);
    return { isValid: false, totalEvents: 0, invalidEvents: 0 };
  }
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(
  framework: string,
  dateFrom?: string,
  dateTo?: string
): Promise<string | null> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client.rpc('generate_compliance_report', {
      p_framework: framework,
      p_date_from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      p_date_to: dateTo || new Date().toISOString(),
    } as any);

    if (error) {
      console.error('Error generating compliance report:', error);
      return null;
    }

    return data as string;
  } catch (error) {
    console.error('Exception generating compliance report:', error);
    return null;
  }
}

export const auditService = {
  logAuditEvent,
  logAuthEvent,
  logStudentRecordAccess,
  logGradeChange,
  logConsentAction,
  logDataExport,
  logConfigChange,
  getAuditEvents,
  getStudentRecordAccess,
  getGradeChanges,
  getHighRiskEvents,
  getActiveAlerts,
  getParentalConsent,
  hasValidConsent,
  verifyAuditChain,
  generateComplianceReport,
  getClientInfo,
  generateSessionId,
};

export default auditService;
