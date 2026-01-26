// Core entity types
export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  is_whatsapp?: boolean;
  crm_contact_id?: string;
  avatar_url?: string;
  contact_email?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  website?: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  duration_weeks?: number;
  max_students?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  program_id: string;
  instructor_id: string;
  title: string;
  description: string;
  access_tag?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  program?: Program;
  instructor?: User;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  content?: string;
  order: number;
  start_time: string;
  duration: number; // in minutes
  zoom_meeting_id?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
  recording_url?: string;
  materials: Material[];
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  // Relations
  course?: Course;
}

export interface Material {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'document' | 'link' | 'other';
  size?: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  program_id: string;
  course_id?: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  docusign_status?: 'sent' | 'completed' | 'declined';
  enrolled_at: string;
  completed_at?: string;
  // Relations
  user?: User;
  program?: Program;
  course?: Course;
}

export interface Payment {
  id: string;
  enrollment_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  installment_number?: number;
  paid_at?: string;
  created_at: string;
}

export interface DocusignEnvelope {
  id: string;
  enrollment_id: string;
  envelope_id: string;
  template_id: string;
  status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided';
  sent_at: string;
  completed_at?: string;
  created_at: string;
}

export interface ZoomMeeting {
  id: string;
  lesson_id: string;
  meeting_id: string;
  join_url: string;
  start_url: string;
  password?: string;
  status: 'scheduled' | 'started' | 'ended';
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

export interface Recording {
  id: string;
  lesson_id: string;
  zoom_recording_id: string;
  file_type: 'MP4' | 'M4A' | 'TIMELINE' | 'TRANSCRIPT' | 'CHAT';
  file_size: number;
  download_url?: string;
  storage_url?: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'email' | 'sms' | 'both';
  template: string;
  subject?: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface CourseGeneratorForm {
  programName: string;
  programDescription: string;
  courseTitle: string;
  courseDescription: string;
  instructorId: string;
  startDate: string;
  sessionCount: number;
  sessionDuration: number;
  sessionFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  sessionTime: string;
  crmTag: string;
  enableRecording: boolean;
  sendReminders: boolean;
}

export interface ZoomWebhookEvent {
  event: string;
  payload: {
    account_id: string;
    object: {
      id: string;
      uuid: string;
      host_id: string;
      topic: string;
      type: number;
      start_time: string;
      duration: number;
      timezone: string;
      recording_files?: Array<{
        id: string;
        recording_start: string;
        recording_end: string;
        file_type: string;
        file_size: number;
        download_url: string;
        status: string;
      }>;
    };
  };
}
