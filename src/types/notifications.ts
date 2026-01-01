/**
 * Notification System Types
 *
 * Multi-channel notification system supporting in-app, email, SMS, and push notifications.
 * Notifications are scoped to individuals, courses, programs, or tenant-wide.
 */

// =====================================================
// Enums
// =====================================================

export type NotificationScope = 'individual' | 'course' | 'program' | 'tenant';

export type NotificationCategory =
  | 'lesson'        // Lesson reminders, cancellations, recordings
  | 'assignment'    // Assignment due dates, grades
  | 'payment'       // Payment failures, reminders, confirmations
  | 'enrollment'    // Enrollment confirmations, completions
  | 'attendance'    // Attendance issues, summaries
  | 'achievement'   // Certificates, milestones
  | 'announcement'  // Course/program announcements
  | 'system';       // Platform maintenance, updates

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DeliveryChannel = 'in_app' | 'email' | 'sms' | 'push';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

// =====================================================
// Core Interfaces
// =====================================================

export interface Notification {
  id: string;
  tenant_id: string;

  // Scoping
  scope: NotificationScope;
  target_user_id?: string;      // For individual scope
  target_course_id?: string;    // For course scope
  target_program_id?: string;   // For program scope

  // Classification
  category: NotificationCategory;
  priority: NotificationPriority;

  // Content
  title: string;
  message: string;
  metadata?: Record<string, any>; // Flexible context data

  // Actions
  action_url?: string;
  action_label?: string; // e.g., "View Details", "Pay Now"

  // Lifecycle
  expires_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string; // Admin who created

  // Computed fields (from query)
  is_read?: boolean;
  read_at?: string;
  context_name?: string; // Course or program name
  context_type?: 'course' | 'program';
}

export interface NotificationRead {
  id: string;
  notification_id: string;
  user_id: string;
  read_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  tenant_id: string;

  // Master channel toggles
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  // in_app is always enabled

  // Per-category channel preferences
  category_preferences: CategoryPreferences;

  // Quiet hours
  quiet_hours_start?: string; // TIME format: "HH:MM:SS"
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;

  // Digest mode
  digest_mode: boolean;
  digest_frequency: 'daily' | 'weekly';
  digest_time: string; // TIME format: "HH:MM:SS"

  // Contact info
  phone_number?: string;
  push_subscription?: PushSubscription;

  created_at: string;
  updated_at: string;
}

export interface CategoryPreferences {
  lesson: ChannelToggles;
  assignment: ChannelToggles;
  payment: ChannelToggles;
  enrollment: ChannelToggles;
  attendance: ChannelToggles;
  achievement: ChannelToggles;
  announcement: ChannelToggles;
  system: ChannelToggles;
}

export interface ChannelToggles {
  email: boolean;
  sms: boolean;
  push: boolean;
  // in_app is always true, not configurable
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationDelivery {
  id: string;
  notification_id: string;
  user_id: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;

  // External service IDs
  email_queue_id?: string;
  sms_message_id?: string;
  push_message_id?: string;

  // Error tracking
  error_message?: string;
  retry_count: number;

  // Timestamps
  sent_at?: string;
  failed_at?: string;
  created_at: string;
}

// =====================================================
// API Request/Response Types
// =====================================================

export interface CreateNotificationRequest {
  scope: NotificationScope;

  // Support both single and multiple recipients
  target_user_id?: string;
  target_user_ids?: string[]; // For bulk sending to multiple users
  target_course_id?: string;
  target_course_ids?: string[]; // For bulk sending to multiple courses
  target_program_id?: string;
  target_program_ids?: string[]; // For bulk sending to multiple programs

  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;

  // Delivery channels (admin can override)
  channels?: DeliveryChannel[]; // If not provided, uses user preferences
  email_language?: 'en' | 'he'; // Language for email notifications
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
  expires_at?: string;
}

export interface GetNotificationsRequest {
  limit?: number;
  offset?: number;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  unread_only?: boolean;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  has_more: boolean;
}

export interface UpdatePreferencesRequest {
  email_enabled?: boolean;
  sms_enabled?: boolean;
  push_enabled?: boolean;
  category_preferences?: Partial<CategoryPreferences>;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  quiet_hours_timezone?: string;
  digest_mode?: boolean;
  digest_frequency?: 'daily' | 'weekly';
  digest_time?: string;
  phone_number?: string;
  push_subscription?: PushSubscription;
}

export interface BulkSendRequest {
  scope: NotificationScope;
  target_course_id?: string;
  target_program_id?: string;
  template_key?: string; // Predefined template
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  action_url?: string;
  action_label?: string;
}

// =====================================================
// Notification Triggers (Predefined Events)
// =====================================================

export enum NotificationTrigger {
  // Lesson triggers
  LESSON_REMINDER_30MIN = 'LESSON_REMINDER_30MIN',
  LESSON_REMINDER_24H = 'LESSON_REMINDER_24H',
  LESSON_CANCELLED = 'LESSON_CANCELLED',
  RECORDING_AVAILABLE = 'RECORDING_AVAILABLE',

  // Assignment triggers
  ASSIGNMENT_DUE_24H = 'ASSIGNMENT_DUE_24H',
  ASSIGNMENT_DUE_1H = 'ASSIGNMENT_DUE_1H',
  GRADE_RELEASED = 'GRADE_RELEASED',

  // Payment triggers
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_DUE_7D = 'PAYMENT_DUE_7D',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',

  // Enrollment triggers
  ENROLLMENT_CONFIRMED = 'ENROLLMENT_CONFIRMED',
  ENROLLMENT_COMPLETED = 'ENROLLMENT_COMPLETED',

  // Attendance triggers
  ATTENDANCE_MARKED_ABSENT = 'ATTENDANCE_MARKED_ABSENT',

  // Achievement triggers
  CERTIFICATE_ISSUED = 'CERTIFICATE_ISSUED',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',

  // Announcement triggers
  COURSE_ANNOUNCEMENT = 'COURSE_ANNOUNCEMENT',
  PROGRAM_UPDATE = 'PROGRAM_UPDATE',

  // System triggers
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
}

// =====================================================
// Notification Templates
// =====================================================

export interface NotificationTemplate {
  trigger: NotificationTrigger;
  category: NotificationCategory;
  priority: NotificationPriority;
  scope: NotificationScope;
  title: string | ((data: any) => string);
  message: string | ((data: any) => string);
  action_label?: string;
  action_url?: string | ((data: any) => string);
  expires_hours?: number; // Auto-delete after N hours
}

// Predefined notification templates
export const NOTIFICATION_TEMPLATES: Record<NotificationTrigger, NotificationTemplate> = {
  [NotificationTrigger.LESSON_REMINDER_30MIN]: {
    trigger: NotificationTrigger.LESSON_REMINDER_30MIN,
    category: 'lesson',
    priority: 'urgent',
    scope: 'course',
    title: 'Lesson Starting Soon',
    message: (data) => `${data.lesson_name} starts in 30 minutes. Join now!`,
    action_label: 'Join Lesson',
    action_url: (data) => `/lessons/${data.lesson_id}`,
    expires_hours: 2,
  },
  [NotificationTrigger.LESSON_REMINDER_24H]: {
    trigger: NotificationTrigger.LESSON_REMINDER_24H,
    category: 'lesson',
    priority: 'high',
    scope: 'course',
    title: 'Lesson Tomorrow',
    message: (data) => `${data.lesson_name} is scheduled for tomorrow at ${data.start_time}.`,
    action_label: 'View Details',
    action_url: (data) => `/lessons/${data.lesson_id}`,
    expires_hours: 48,
  },
  [NotificationTrigger.LESSON_CANCELLED]: {
    trigger: NotificationTrigger.LESSON_CANCELLED,
    category: 'lesson',
    priority: 'high',
    scope: 'course',
    title: 'Lesson Cancelled',
    message: (data) => `${data.lesson_name} scheduled for ${data.start_time} has been cancelled.`,
    action_url: (data) => `/courses/${data.course_id}`,
  },
  [NotificationTrigger.RECORDING_AVAILABLE]: {
    trigger: NotificationTrigger.RECORDING_AVAILABLE,
    category: 'lesson',
    priority: 'medium',
    scope: 'course',
    title: 'Recording Available',
    message: (data) => `The recording for ${data.lesson_name} is now available.`,
    action_label: 'Watch Recording',
    action_url: (data) => `/lessons/${data.lesson_id}`,
  },
  [NotificationTrigger.ASSIGNMENT_DUE_24H]: {
    trigger: NotificationTrigger.ASSIGNMENT_DUE_24H,
    category: 'assignment',
    priority: 'high',
    scope: 'course',
    title: 'Assignment Due Tomorrow',
    message: (data) => `${data.assignment_name} is due tomorrow at ${data.due_time}.`,
    action_label: 'View Assignment',
    action_url: (data) => `/courses/${data.course_id}/assignments/${data.assignment_id}`,
    expires_hours: 48,
  },
  [NotificationTrigger.ASSIGNMENT_DUE_1H]: {
    trigger: NotificationTrigger.ASSIGNMENT_DUE_1H,
    category: 'assignment',
    priority: 'urgent',
    scope: 'individual',
    title: 'Assignment Due Soon',
    message: (data) => `${data.assignment_name} is due in 1 hour!`,
    action_label: 'Submit Now',
    action_url: (data) => `/courses/${data.course_id}/assignments/${data.assignment_id}`,
    expires_hours: 2,
  },
  [NotificationTrigger.GRADE_RELEASED]: {
    trigger: NotificationTrigger.GRADE_RELEASED,
    category: 'assignment',
    priority: 'high',
    scope: 'individual',
    title: 'Grade Released',
    message: (data) => `Your grade for ${data.assignment_name} is now available.`,
    action_label: 'View Grade',
    action_url: (data) => `/courses/${data.course_id}/grades`,
  },
  [NotificationTrigger.PAYMENT_FAILED]: {
    trigger: NotificationTrigger.PAYMENT_FAILED,
    category: 'payment',
    priority: 'urgent',
    scope: 'individual',
    title: 'Payment Failed',
    message: (data) => `Your payment of ${data.amount} ${data.currency} failed. Please update your payment method.`,
    action_label: 'Update Payment',
    action_url: (data) => `/payments/${data.payment_id}`,
  },
  [NotificationTrigger.PAYMENT_DUE_7D]: {
    trigger: NotificationTrigger.PAYMENT_DUE_7D,
    category: 'payment',
    priority: 'high',
    scope: 'individual',
    title: 'Payment Due Soon',
    message: (data) => `Your payment of ${data.amount} ${data.currency} is due in 7 days.`,
    action_label: 'View Payment',
    action_url: (data) => `/payments/${data.payment_id}`,
  },
  [NotificationTrigger.PAYMENT_RECEIVED]: {
    trigger: NotificationTrigger.PAYMENT_RECEIVED,
    category: 'payment',
    priority: 'medium',
    scope: 'individual',
    title: 'Payment Received',
    message: (data) => `Your payment of ${data.amount} ${data.currency} was received successfully.`,
    action_label: 'View Receipt',
    action_url: (data) => `/payments/${data.payment_id}`,
  },
  [NotificationTrigger.ENROLLMENT_CONFIRMED]: {
    trigger: NotificationTrigger.ENROLLMENT_CONFIRMED,
    category: 'enrollment',
    priority: 'high',
    scope: 'individual',
    title: 'Enrollment Confirmed',
    message: (data) => `You are now enrolled in ${data.program_name || data.course_name}.`,
    action_label: 'View Course',
    action_url: (data) => data.program_id ? `/programs/${data.program_id}` : `/courses/${data.course_id}`,
  },
  [NotificationTrigger.ENROLLMENT_COMPLETED]: {
    trigger: NotificationTrigger.ENROLLMENT_COMPLETED,
    category: 'enrollment',
    priority: 'high',
    scope: 'individual',
    title: 'Congratulations!',
    message: (data) => `You have completed ${data.program_name || data.course_name}!`,
    action_label: 'View Certificate',
    action_url: (data) => `/certificates/${data.certificate_id}`,
  },
  [NotificationTrigger.ATTENDANCE_MARKED_ABSENT]: {
    trigger: NotificationTrigger.ATTENDANCE_MARKED_ABSENT,
    category: 'attendance',
    priority: 'high',
    scope: 'individual',
    title: 'Marked Absent',
    message: (data) => `You were marked absent for ${data.lesson_name}. If this is incorrect, please contact your instructor.`,
    action_url: (data) => `/courses/${data.course_id}/attendance`,
  },
  [NotificationTrigger.CERTIFICATE_ISSUED]: {
    trigger: NotificationTrigger.CERTIFICATE_ISSUED,
    category: 'achievement',
    priority: 'high',
    scope: 'individual',
    title: 'Certificate Ready',
    message: (data) => `Your certificate for ${data.program_name || data.course_name} is ready to download.`,
    action_label: 'Download Certificate',
    action_url: (data) => `/certificates/${data.certificate_id}`,
  },
  [NotificationTrigger.ACHIEVEMENT_UNLOCKED]: {
    trigger: NotificationTrigger.ACHIEVEMENT_UNLOCKED,
    category: 'achievement',
    priority: 'low',
    scope: 'individual',
    title: 'Achievement Unlocked!',
    message: (data) => `You unlocked: ${data.achievement_name}`,
    action_url: (data) => `/profile/achievements`,
  },
  [NotificationTrigger.COURSE_ANNOUNCEMENT]: {
    trigger: NotificationTrigger.COURSE_ANNOUNCEMENT,
    category: 'announcement',
    priority: 'medium',
    scope: 'course',
    title: (data) => data.announcement_title,
    message: (data) => data.announcement_message,
    action_url: (data) => `/courses/${data.course_id}/announcements`,
  },
  [NotificationTrigger.PROGRAM_UPDATE]: {
    trigger: NotificationTrigger.PROGRAM_UPDATE,
    category: 'announcement',
    priority: 'medium',
    scope: 'program',
    title: (data) => data.update_title,
    message: (data) => data.update_message,
    action_url: (data) => `/programs/${data.program_id}`,
  },
  [NotificationTrigger.SYSTEM_MAINTENANCE]: {
    trigger: NotificationTrigger.SYSTEM_MAINTENANCE,
    category: 'system',
    priority: 'high',
    scope: 'tenant',
    title: 'Scheduled Maintenance',
    message: (data) => `System maintenance scheduled for ${data.maintenance_time}. Expected duration: ${data.duration}.`,
  },
};

// =====================================================
// Helper Types
// =====================================================

export interface NotificationStats {
  total: number;
  unread: number;
  by_category: Record<NotificationCategory, number>;
  by_priority: Record<NotificationPriority, number>;
}
