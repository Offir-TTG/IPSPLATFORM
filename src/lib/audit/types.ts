// ============================================================================
// AUDIT TRAIL TYPE DEFINITIONS
// ============================================================================

export type EventType =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'ACCESS'
  | 'MODIFY'
  | 'EXECUTE'
  | 'SHARE'
  | 'CONSENT';

export type EventCategory =
  | 'DATA'
  | 'AUTH'
  | 'ADMIN'
  | 'CONFIG'
  | 'SECURITY'
  | 'COMPLIANCE'
  | 'SYSTEM'
  | 'EDUCATION'
  | 'STUDENT_RECORD'
  | 'GRADE'
  | 'ATTENDANCE'
  | 'PARENTAL_ACCESS';

export type EventStatus = 'success' | 'failure' | 'partial' | 'pending';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ComplianceFramework =
  | 'FERPA'
  | 'COPPA'
  | 'PPRA'
  | 'GDPR'
  | 'SOX'
  | 'ISO27001'
  | 'SOC2'
  | 'PCI-DSS';

export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'withdrawn' | 'expired';

export type ConsentType =
  | 'data_collection'
  | 'online_activities'
  | 'photo_video'
  | 'third_party_sharing'
  | 'email_communication'
  | 'research_participation'
  | 'directory_information';

export interface AuditEvent {
  id: string;
  event_timestamp: string;

  // User identification
  user_id?: string;
  user_email?: string;
  user_role?: string;

  // Session tracking
  session_id?: string;
  ip_address?: string;
  user_agent?: string;

  // Event details
  event_type: EventType;
  event_category: EventCategory;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;

  // Education-specific
  student_id?: string;
  parent_id?: string;
  is_student_record?: boolean;
  is_minor_data?: boolean;
  parental_consent_id?: string;

  // Action details
  action: string;
  description?: string;

  // Data changes
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  changed_fields?: string[];

  // Context
  parent_event_id?: string;
  correlation_id?: string;

  // Status
  status: EventStatus;
  error_message?: string;

  // Security
  risk_level: RiskLevel;
  compliance_flags?: ComplianceFramework[];

  // Tamper detection
  previous_hash?: string;
  event_hash?: string;

  // Retention
  retention_until?: string;
  is_archived?: boolean;

  // Metadata
  metadata?: Record<string, any>;
}

export interface CreateAuditEventParams {
  user_id?: string;
  event_type: EventType;
  event_category: EventCategory;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  action: string;
  description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  status?: EventStatus;
  risk_level?: RiskLevel;
  student_id?: string;
  parent_id?: string;
  is_student_record?: boolean;
  is_minor_data?: boolean;
  parental_consent_id?: string;
  compliance_flags?: ComplianceFramework[];
  metadata?: Record<string, any>;
}

export interface ParentalConsent {
  id: string;
  student_id: string;
  student_name?: string;
  student_age?: number;
  student_email?: string;

  parent_id?: string;
  parent_name: string;
  parent_email: string;
  parent_phone?: string;
  relationship: string;

  consent_type: ConsentType;
  consent_purpose: string;
  consent_status: ConsentStatus;

  granted_at?: string;
  denied_at?: string;
  withdrawn_at?: string;
  expires_at?: string;

  verification_method?: string;
  ip_address?: string;
  user_agent?: string;
  signature_data?: string;
  verified_at?: string;

  coppa_applicable?: boolean;
  ferpa_applicable?: boolean;
  gdpr_applicable?: boolean;
  consent_document_url?: string;
  consent_version?: string;

  requested_by?: string;
  requested_at: string;
  last_updated_at: string;
  updated_by?: string;

  notification_sent?: boolean;
  notification_sent_at?: string;
  reminder_count?: number;
  last_reminder_at?: string;

  notes?: string;
  metadata?: Record<string, any>;

  is_compliant?: boolean;
  compliance_issues?: string[];
}

export interface AuditSession {
  id: string;
  session_id: string;
  user_id?: string;
  user_email?: string;
  started_at: string;
  ended_at?: string;
  last_activity_at: string;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  events_count?: number;
  high_risk_events_count?: number;
  is_active?: boolean;
  termination_reason?: string;
  metadata?: Record<string, any>;
}

export interface AuditAlert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  event_id?: string;
  user_id?: string;
  user_email?: string;
  title: string;
  description?: string;
  detected_at: string;
  detection_rule?: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive' | 'acknowledged';
  assigned_to?: string;
  resolved_at?: string;
  resolution_notes?: string;
  notifications_sent?: string[];
  notification_sent_at?: string;
  metadata?: Record<string, any>;
}

export interface AuditReport {
  id: string;
  report_name: string;
  report_type: string;
  date_from?: string;
  date_to?: string;
  user_ids?: string[];
  resource_types?: string[];
  event_types?: EventType[];
  filters?: Record<string, any>;
  total_events?: number;
  high_risk_events?: number;
  failed_events?: number;
  unique_users?: number;
  file_url?: string;
  file_format?: string;
  file_size_bytes?: number;
  generated_at: string;
  generated_by?: string;
  generation_time_ms?: number;
  accessed_count?: number;
  last_accessed_at?: string;
  expires_at?: string;
  is_archived?: boolean;
  metadata?: Record<string, any>;
}

export interface StudentRecordAccess {
  id: string;
  event_timestamp: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  student_id?: string;
  student_email?: string;
  student_name?: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  description?: string;
  ip_address?: string;
  is_student_record?: boolean;
  compliance_flags?: ComplianceFramework[];
  session_id?: string;
}

export interface GradeChange {
  id: string;
  event_timestamp: string;
  user_id?: string;
  user_email?: string;
  user_role?: string;
  student_id?: string;
  grade_id?: string;
  event_type: EventType;
  action: string;
  old_grade?: string;
  new_grade?: string;
  old_score?: string;
  new_score?: string;
  changed_fields?: string[];
  description?: string;
  ip_address?: string;
  session_id?: string;
}

export interface AuditFilters {
  date_from?: string;
  date_to?: string;
  user_ids?: string[];
  student_ids?: string[];
  event_types?: EventType[];
  event_categories?: EventCategory[];
  resource_types?: string[];
  risk_levels?: RiskLevel[];
  compliance_flags?: ComplianceFramework[];
  status?: EventStatus[];
  is_student_record?: boolean;
  is_minor_data?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}
