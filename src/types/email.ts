/**
 * Email System Type Definitions
 * Complete types for email templates, queue, analytics, triggers, and schedules
 */

// ============================================================================
// Core Email Types
// ============================================================================

export type EmailLanguage = 'en' | 'he';

export type EmailCategory = 'enrollment' | 'payment' | 'lesson' | 'parent' | 'system';

export type EmailPriority = 'urgent' | 'high' | 'normal' | 'low';

export type EmailStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'expired';

export type TriggerType = 'automated' | 'manual' | 'scheduled' | 'api';

export type BounceType = 'hard' | 'soft' | 'complaint';

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'unknown';

// ============================================================================
// Email Templates
// ============================================================================

export interface EmailTemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
  type?: 'string' | 'number' | 'date' | 'currency' | 'url';
}

export interface EmailTemplateStyles {
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  footerText?: string;
  headerImageUrl?: string;
  buttonColor?: string;
  fontFamily?: string;
}

export interface MultiLanguageContent {
  en?: string;
  he?: string;
}

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  template_key: string;
  template_name: string;
  template_category: EmailCategory;
  description?: string;
  is_system: boolean;
  is_active: boolean;
  allow_customization: boolean;
  custom_subject?: MultiLanguageContent;
  custom_body?: MultiLanguageContent;
  custom_styles?: EmailTemplateStyles;
  variables?: EmailTemplateVariable[];
  preview_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailTemplateVersion {
  id: string;
  template_id: string;
  language_code: EmailLanguage;
  subject: string;
  body_html: string;
  body_text: string;
  version: number;
  is_current: boolean;
  change_notes?: string;
  created_by?: string;
  created_at: string;
}

export interface EmailTemplateWithVersions extends EmailTemplate {
  versions: EmailTemplateVersion[];
  current_version_en?: EmailTemplateVersion;
  current_version_he?: EmailTemplateVersion;
}

// ============================================================================
// Email Queue
// ============================================================================

export interface EmailQueueItem {
  id: string;
  tenant_id: string;
  to_email: string;
  to_name?: string;
  user_id?: string;
  template_id?: string;
  language_code: EmailLanguage;
  subject: string;
  body_html: string;
  body_text: string;
  template_variables?: Record<string, any>;
  priority: EmailPriority;
  scheduled_for?: string;
  status: EmailStatus;
  attempts: number;
  max_attempts?: number;
  tracking_enabled: boolean;
  tracking_id?: string;
  trigger_type?: TriggerType;
  trigger_event?: string;
  job_id?: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  smtp_message_id?: string;
  created_at: string;
}

export interface EmailQueueFilter {
  status?: EmailStatus[];
  priority?: EmailPriority[];
  template_id?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ============================================================================
// Email Analytics
// ============================================================================

export interface EmailAnalytics {
  id: string;
  email_queue_id: string;
  tracking_id: string;
  // Open tracking
  opened_at?: string;
  open_count: number;
  first_opened_at?: string;
  last_opened_at?: string;
  // Click tracking
  clicked_at?: string;
  click_count: number;
  clicked_links?: Array<{
    url: string;
    clicked_at: string;
    count: number;
  }>;
  // Bounce tracking
  bounced_at?: string;
  bounce_type?: BounceType;
  bounce_reason?: string;
  // Device info
  user_agent?: string;
  ip_address?: string;
  device_type?: DeviceType;
  created_at?: string;
  updated_at?: string;
}

export interface EmailAnalyticsSummary {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  total_pending: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  delivery_rate: number;
}

export interface TemplateAnalytics {
  template_id: string;
  template_name: string;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  avg_open_time_hours?: number;
}

// ============================================================================
// Email Triggers (Automated Sending)
// ============================================================================

export type TriggerEvent =
  | 'enrollment.created'
  | 'enrollment.updated'
  | 'enrollment.completed'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.refunded'
  | 'payment.upcoming'
  | 'lesson.reminder'
  | 'lesson.cancelled'
  | 'lesson.rescheduled'
  | 'user.registered'
  | 'user.password_reset'
  | 'course.completed'
  | 'certificate.issued';

export interface EmailTriggerConditions {
  enrollment_status?: string[];
  payment_status?: string[];
  user_role?: string[];
  course_id?: string;
  program_id?: string;
  min_amount?: number;
  max_amount?: number;
  custom?: Record<string, any>;
}

export interface EmailTrigger {
  id: string;
  tenant_id: string;
  trigger_name: string;
  trigger_event: TriggerEvent;
  template_id: string;
  conditions?: EmailTriggerConditions;
  delay_minutes: number;
  send_time?: string; // HH:mm format
  is_active: boolean;
  recipient_role?: string;
  priority: EmailPriority;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailTriggerWithTemplate extends EmailTrigger {
  template: EmailTemplate;
}

// ============================================================================
// Email Schedules (Campaigns)
// ============================================================================

export type ScheduleStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface RecipientFilter {
  user_ids?: string[];
  roles?: string[];
  enrollments?: {
    status?: string[];
    program_id?: string;
    course_id?: string;
  };
  custom_query?: Record<string, any>;
}

export interface EmailSchedule {
  id: string;
  tenant_id: string;
  schedule_name: string;
  description?: string;
  template_id: string;
  recipient_filter?: RecipientFilter;
  recipient_ids?: string[];
  scheduled_for: string;
  recurrence_rule?: string; // RRULE format
  status: ScheduleStatus;
  emails_queued: number;
  emails_sent: number;
  emails_failed: number;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmailScheduleWithTemplate extends EmailSchedule {
  template: EmailTemplate;
}

// ============================================================================
// Email Composition & Rendering
// ============================================================================

export interface RenderEmailOptions {
  template_key: string;
  language_code: EmailLanguage;
  variables: Record<string, any>;
  custom_styles?: EmailTemplateStyles;
  tenant_id: string;
}

export interface RenderedEmail {
  subject: string;
  body_html: string;
  body_text: string;
  template_id: string;
}

export interface ComposeEmailOptions {
  to: string | string[];
  template_key: string;
  language_code?: EmailLanguage;
  variables: Record<string, any>;
  tenant_id: string;
  user_id?: string;
  priority?: EmailPriority;
  scheduled_for?: string;
  trigger_type?: TriggerType;
  trigger_event?: string;
  tracking_enabled?: boolean;
  cc?: string | string[];
  bcc?: string | string[];
}

// ============================================================================
// BullMQ Job Types
// ============================================================================

export interface EmailJobData {
  email_queue_id: string;
  tenant_id: string;
  to_email: string;
  subject: string;
  body_html: string;
  body_text: string;
  tracking_id?: string;
  tracking_enabled: boolean;
  priority: EmailPriority;
}

export interface EmailJobResult {
  success: boolean;
  message_id?: string;
  error?: string;
  sent_at?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateTemplateRequest {
  template_key: string;
  template_name: string;
  template_category: EmailCategory;
  description?: string;
  variables?: EmailTemplateVariable[];
  versions: Array<{
    language_code: EmailLanguage;
    subject: string;
    body_html: string;
    body_text: string;
  }>;
}

export interface UpdateTemplateRequest {
  template_name?: string;
  description?: string;
  is_active?: boolean;
  custom_subject?: MultiLanguageContent;
  custom_body?: MultiLanguageContent;
  custom_styles?: EmailTemplateStyles;
}

export interface CreateTriggerRequest {
  trigger_name: string;
  trigger_event: TriggerEvent;
  template_id: string;
  conditions?: EmailTriggerConditions;
  delay_minutes?: number;
  send_time?: string;
  priority?: EmailPriority;
}

export interface CreateScheduleRequest {
  schedule_name: string;
  description?: string;
  template_id: string;
  recipient_filter?: RecipientFilter;
  recipient_ids?: string[];
  scheduled_for: string;
  recurrence_rule?: string;
}

export interface SendEmailRequest {
  to: string | string[];
  template_key: string;
  language_code?: EmailLanguage;
  variables: Record<string, any>;
  priority?: EmailPriority;
  scheduled_for?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailListResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}

// ============================================================================
// Tracking & Webhooks
// ============================================================================

export interface TrackOpenRequest {
  tracking_id: string;
  user_agent?: string;
  ip_address?: string;
}

export interface TrackClickRequest {
  tracking_id: string;
  url: string;
  user_agent?: string;
  ip_address?: string;
}

// ============================================================================
// System Templates (Pre-defined)
// ============================================================================

export const SYSTEM_TEMPLATE_KEYS = {
  ENROLLMENT_CONFIRMATION: 'enrollment.confirmation',
  PAYMENT_RECEIPT: 'payment.receipt',
  PAYMENT_UPCOMING: 'payment.upcoming',
  LESSON_REMINDER: 'lesson.reminder',
  LESSON_CANCELLED: 'lesson.cancelled',
  PARENT_PROGRESS_REPORT: 'parent.progress_report',
  USER_WELCOME: 'user.welcome',
  PASSWORD_RESET: 'user.password_reset',
  COURSE_COMPLETED: 'course.completed',
  CERTIFICATE_ISSUED: 'certificate.issued',
} as const;

export type SystemTemplateKey = typeof SYSTEM_TEMPLATE_KEYS[keyof typeof SYSTEM_TEMPLATE_KEYS];
