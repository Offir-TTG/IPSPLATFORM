// ============================================================================
// LMS TypeScript Type Definitions
// ============================================================================
// Complete type definitions for the Learning Management System
// Matches database schema in src/lib/supabase/lms-schema.sql
// ============================================================================

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type TopicContentType =
  | 'video'
  | 'text'
  | 'pdf'
  | 'quiz'
  | 'assignment'
  | 'link'
  | 'embed'
  | 'download';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export type AssignmentType =
  | 'quiz'
  | 'essay'
  | 'project'
  | 'file_upload'
  | 'peer_review'
  | 'discussion';

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'grading'
  | 'graded'
  | 'returned'
  | 'resubmit';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AnnouncementPriority = 'low' | 'medium' | 'high' | 'urgent';

// ============================================================================
// MODULE
// ============================================================================

export interface Module {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  description: string | null;
  order: number;
  is_published: boolean;
  is_optional: boolean;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;

  // Relations (populated when needed)
  lessons?: Lesson[];
  course?: Course;
}

export interface ModuleCreateInput {
  course_id: string;
  title: string;
  description?: string;
  order: number;
  is_published?: boolean;
  is_optional?: boolean;
  duration_minutes?: number;
}

export interface ModuleUpdateInput {
  title?: string;
  description?: string;
  order?: number;
  is_published?: boolean;
  is_optional?: boolean;
  duration_minutes?: number;
}

export interface BulkModuleCreateInput {
  course_id: string;
  count: number;
  title_pattern: string; // e.g., "Module {n}"
  description_template?: string;
  starting_order: number;
  is_published?: boolean;
  is_optional?: boolean;
  duration_minutes?: number;
}

export interface BulkLessonCreateInput {
  course_id: string;
  module_id?: string;
  count: number;
  title_pattern: string; // e.g., "Lesson {n}"
  description_template?: string;
  content_template?: string;
  starting_order: number;
  start_time_base: string; // ISO datetime string
  time_increment_minutes?: number; // Minutes between lessons
  duration?: number; // Duration in minutes, default: 60
  is_published?: boolean;
  status?: string;
  materials?: any[];
  create_zoom_meetings?: boolean; // Auto-create Zoom meetings for each lesson
}

// ============================================================================
// LESSON TOPIC
// ============================================================================

export interface LessonTopic {
  id: string;
  tenant_id: string;
  lesson_id: string;
  title: string;
  content_type: TopicContentType;
  content: TopicContent;
  order: number;
  duration_minutes: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  lesson?: Lesson;
}

// Content structures for different topic types
export type TopicContent =
  | VideoContent
  | TextContent
  | PdfContent
  | QuizContent
  | AssignmentContent
  | LinkContent
  | EmbedContent
  | DownloadContent;

export interface VideoContent {
  url: string;
  provider: 'youtube' | 'vimeo' | 'custom';
  thumbnail?: string;
  duration_seconds?: number;
}

export interface TextContent {
  html: string;
  plaintext?: string;
}

export interface PdfContent {
  file_url: string;
  filename: string;
  size: number; // bytes
  page_count?: number;
}

export interface QuizContent {
  questions: QuizQuestion[];
  passing_score: number; // percentage
  time_limit?: number; // minutes
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  points: number;
  options?: string[]; // For multiple choice
  correct_answer?: string | string[]; // Answer key
  explanation?: string;
}

export interface AssignmentContent {
  instructions: string;
  due_date?: string;
  max_score: number;
  rubric?: AssignmentRubric;
  allow_late_submission?: boolean;
  late_penalty_percentage?: number;
}

export interface AssignmentRubric {
  criteria: RubricCriterion[];
  total_points: number;
}

export interface RubricCriterion {
  name: string;
  description: string;
  points: number;
  levels?: {
    name: string;
    description: string;
    points: number;
  }[];
}

export interface LinkContent {
  url: string;
  title: string;
  description?: string;
  open_in_new_tab?: boolean;
}

export interface EmbedContent {
  embed_code: string;
  provider?: string;
  width?: string;
  height?: string;
}

export interface DownloadContent {
  file_url: string;
  filename: string;
  file_type: string;
  size: number;
  description?: string;
}

export interface LessonTopicCreateInput {
  lesson_id: string;
  title: string;
  content_type: TopicContentType;
  content: TopicContent;
  order: number;
  duration_minutes?: number;
  is_required?: boolean;
}

export interface LessonTopicUpdateInput {
  title?: string;
  content_type?: TopicContentType;
  content?: TopicContent;
  order?: number;
  duration_minutes?: number;
  is_required?: boolean;
}

export interface BulkTopicCreateInput {
  lesson_id: string;
  topics: {
    title: string;
    content_type: TopicContentType;
    content: TopicContent;
    duration_minutes?: number;
    is_required?: boolean;
  }[];
  starting_order: number;
}

// ============================================================================
// USER PROGRESS
// ============================================================================

export interface UserProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  lesson_id: string | null;
  topic_id: string | null;
  enrollment_id: string;
  status: ProgressStatus;
  progress_percentage: number;
  time_spent_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  user?: User;
  lesson?: Lesson;
  topic?: LessonTopic;
  enrollment?: Enrollment;
}

export interface ProgressUpdateInput {
  status?: ProgressStatus;
  progress_percentage?: number;
  time_spent_seconds?: number;
  notes?: string;
}

export interface CourseProgress {
  course_id: string;
  user_id: string;
  overall_percentage: number;
  modules_completed: number;
  total_modules: number;
  lessons_completed: number;
  total_lessons: number;
  topics_completed: number;
  total_topics: number;
  time_spent_seconds: number;
  last_accessed_at: string | null;
}

export interface ModuleProgress {
  module_id: string;
  user_id: string;
  percentage: number;
  lessons_completed: number;
  total_lessons: number;
  topics_completed: number;
  total_topics: number;
}

// ============================================================================
// ASSIGNMENT
// ============================================================================

export interface Assignment {
  id: string;
  tenant_id: string;
  lesson_id: string | null;
  topic_id: string | null;
  title: string;
  description: string | null;
  type: AssignmentType;
  questions: QuizQuestion[] | null;
  max_score: number;
  passing_score: number;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  due_date: string | null;
  available_from: string | null;
  available_until: string | null;
  is_required: boolean;
  instructions: string | null;
  rubric: AssignmentRubric | null;
  attachments: AssignmentAttachment[] | null;
  auto_grade: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  lesson?: Lesson;
  topic?: LessonTopic;
  submissions?: AssignmentSubmission[];
}

export interface AssignmentAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface AssignmentCreateInput {
  lesson_id?: string;
  topic_id?: string;
  title: string;
  description?: string;
  type: AssignmentType;
  questions?: QuizQuestion[];
  max_score?: number;
  passing_score?: number;
  time_limit_minutes?: number;
  attempts_allowed?: number;
  due_date?: string;
  available_from?: string;
  available_until?: string;
  is_required?: boolean;
  instructions?: string;
  rubric?: AssignmentRubric;
  attachments?: AssignmentAttachment[];
  auto_grade?: boolean;
}

export interface AssignmentUpdateInput {
  title?: string;
  description?: string;
  questions?: QuizQuestion[];
  max_score?: number;
  passing_score?: number;
  time_limit_minutes?: number;
  attempts_allowed?: number;
  due_date?: string;
  available_from?: string;
  available_until?: string;
  is_required?: boolean;
  instructions?: string;
  rubric?: AssignmentRubric;
  attachments?: AssignmentAttachment[];
  auto_grade?: boolean;
}

// ============================================================================
// ASSIGNMENT SUBMISSION
// ============================================================================

export interface AssignmentSubmission {
  id: string;
  tenant_id: string;
  assignment_id: string;
  user_id: string;
  attempt_number: number;
  answers: SubmissionAnswer[] | null;
  files: SubmissionFile[] | null;
  submitted_at: string;
  score: number | null;
  feedback: string | null;
  graded_at: string | null;
  graded_by: string | null;
  status: SubmissionStatus;
  late: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  assignment?: Assignment;
  user?: User;
  grader?: User;
}

export interface SubmissionAnswer {
  question_id: string;
  answer: string | string[];
  is_correct?: boolean; // For auto-graded
  points_earned?: number;
}

export interface SubmissionFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

export interface SubmissionCreateInput {
  assignment_id: string;
  attempt_number: number;
  answers?: SubmissionAnswer[];
  files?: SubmissionFile[];
  status?: SubmissionStatus;
}

export interface SubmissionGradeInput {
  score: number;
  feedback?: string;
  status?: SubmissionStatus;
}

// ============================================================================
// CERTIFICATE
// ============================================================================

export interface Certificate {
  id: string;
  tenant_id: string;
  user_id: string;
  course_id: string | null;
  program_id: string | null;
  certificate_number: string;
  title: string;
  description: string | null;
  issued_at: string;
  expires_at: string | null;
  template_id: string | null;
  pdf_url: string | null;
  metadata: CertificateMetadata;
  created_at: string;

  // Relations
  user?: User;
  course?: Course;
  program?: Program;
}

export interface CertificateMetadata {
  grade?: string;
  credits?: number;
  instructor_name?: string;
  completion_date?: string;
  custom_fields?: Record<string, any>;
}

export interface CertificateCreateInput {
  user_id: string;
  course_id?: string;
  program_id?: string;
  title: string;
  description?: string;
  template_id?: string;
  expires_at?: string;
  metadata?: CertificateMetadata;
}

// ============================================================================
// LESSON ATTENDANCE
// ============================================================================

export interface LessonAttendance {
  id: string;
  tenant_id: string;
  lesson_id: string;
  user_id: string;
  status: AttendanceStatus;
  joined_at: string | null;
  left_at: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  lesson?: Lesson;
  user?: User;
}

export interface AttendanceCreateInput {
  lesson_id: string;
  user_id: string;
  status: AttendanceStatus;
  joined_at?: string;
  left_at?: string;
  duration_minutes?: number;
  notes?: string;
}

export interface AttendanceUpdateInput {
  status?: AttendanceStatus;
  joined_at?: string;
  left_at?: string;
  duration_minutes?: number;
  notes?: string;
}

// ============================================================================
// DISCUSSION
// ============================================================================

export interface Discussion {
  id: string;
  tenant_id: string;
  course_id: string | null;
  lesson_id: string | null;
  parent_id: string | null;
  author_id: string;
  content: string;
  is_pinned: boolean;
  is_resolved: boolean;
  is_instructor_post: boolean;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;

  // Relations
  author?: User;
  course?: Course;
  lesson?: Lesson;
  parent?: Discussion;
  replies?: Discussion[];
  likes?: DiscussionLike[];
}

export interface DiscussionCreateInput {
  course_id?: string;
  lesson_id?: string;
  parent_id?: string;
  content: string;
}

export interface DiscussionUpdateInput {
  content?: string;
  is_pinned?: boolean;
  is_resolved?: boolean;
}

// ============================================================================
// DISCUSSION LIKE
// ============================================================================

export interface DiscussionLike {
  id: string;
  discussion_id: string;
  user_id: string;
  created_at: string;

  // Relations
  discussion?: Discussion;
  user?: User;
}

// ============================================================================
// ANNOUNCEMENT
// ============================================================================

export interface Announcement {
  id: string;
  tenant_id: string;
  course_id: string | null;
  program_id: string | null;
  author_id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  notify_students: boolean;
  created_at: string;
  updated_at: string;

  // Relations
  author?: User;
  course?: Course;
  program?: Program;
}

export interface AnnouncementCreateInput {
  course_id?: string;
  program_id?: string;
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  is_published?: boolean;
  published_at?: string;
  expires_at?: string;
  notify_students?: boolean;
}

export interface AnnouncementUpdateInput {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  is_published?: boolean;
  published_at?: string;
  expires_at?: string;
  notify_students?: boolean;
}

// ============================================================================
// EXTENDED TYPES FOR EXISTING ENTITIES
// ============================================================================

// Extended Course type with LMS fields
// NOTE: Course is now pure content - all payment logic moved to Product
export interface Course {
  id: string;
  program_id: string;
  instructor_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  access_tag: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  image_url: string | null;
  course_type: 'course' | 'lecture' | 'workshop' | 'webinar' | 'session' | 'session_pack' | 'bundle' | 'custom';
  is_standalone: boolean;
  is_published: boolean; // Whether course is published and visible to users
  created_at: string;
  updated_at: string;

  // Product reference (if course is registered as a billable product)
  product_id?: string | null;

  // Relations
  program?: Program;
  instructor?: User;
  modules?: Module[];
  lessons?: Lesson[];
  enrollments?: Enrollment[];
  discussions?: Discussion[];
  announcements?: Announcement[];
  product?: import('./product').Product; // Product contains all payment configuration
}

// Extended Lesson type with LMS fields
export interface Lesson {
  id: string;
  // Note: course_id does not exist in database - lessons are related to courses through modules
  // The relationship is: lessons.module_id → modules.course_id
  module_id: string | null; // Lessons belong to modules, not directly to courses
  tenant_id: string;
  title: string;
  description: string | null;
  content: string | null;
  order: number;
  start_time: string;
  duration: number;
  timezone?: string; // IANA timezone identifier (e.g., 'Asia/Jerusalem', 'America/New_York')

  // Zoom Basic Info
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  recording_url: string | null;

  // Zoom Security Settings
  zoom_passcode?: string | null;
  zoom_waiting_room?: boolean;
  zoom_join_before_host?: boolean;
  zoom_mute_upon_entry?: boolean;
  zoom_require_authentication?: boolean;

  // Zoom Video/Audio Settings
  zoom_host_video?: boolean;
  zoom_participant_video?: boolean;
  zoom_audio?: 'both' | 'telephony' | 'voip';

  // Zoom Recording Settings
  zoom_auto_recording?: 'none' | 'local' | 'cloud';
  zoom_record_speaker_view?: boolean;
  zoom_recording_disclaimer?: boolean;

  materials: LessonMaterial[];
  content_blocks: ContentBlock[]; // NEW: Added by lms-schema.sql
  is_published: boolean; // NEW: Added by lms-schema.sql
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;

  // Relations
  course?: Course;
  module?: Module;
  topics?: LessonTopic[];
  progress?: UserProgress[];
  attendance?: LessonAttendance[];
  discussions?: Discussion[];
}

export interface LessonMaterial {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'video' | 'document' | 'link' | 'other';
  size?: number;
}

export interface ContentBlock {
  id: string;
  type: string;
  content: any;
  order: number;
}

// Lesson input types
export interface LessonCreateInput {
  course_id: string;
  module_id?: string | null;
  title: string;
  description?: string | null;
  content?: string | null;
  order: number;
  start_time: string;
  duration: number;
  timezone?: string;

  // Zoom Security Settings
  zoom_passcode?: string | null;
  zoom_waiting_room?: boolean;
  zoom_join_before_host?: boolean;
  zoom_mute_upon_entry?: boolean;
  zoom_require_authentication?: boolean;

  // Zoom Video/Audio Settings
  zoom_host_video?: boolean;
  zoom_participant_video?: boolean;
  zoom_audio?: 'both' | 'telephony' | 'voip';

  // Zoom Recording Settings
  zoom_auto_recording?: 'none' | 'local' | 'cloud';
  zoom_record_speaker_view?: boolean;
  zoom_recording_disclaimer?: boolean;

  materials?: LessonMaterial[];
  is_published?: boolean;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export interface LessonUpdateInput {
  title?: string;
  description?: string | null;
  content?: string | null;
  order?: number;
  start_time?: string;
  duration?: number;
  timezone?: string;

  // Zoom Basic Info
  zoom_meeting_id?: string | null;
  zoom_join_url?: string | null;
  zoom_start_url?: string | null;
  recording_url?: string | null;

  // Zoom Security Settings
  zoom_passcode?: string | null;
  zoom_waiting_room?: boolean;
  zoom_join_before_host?: boolean;
  zoom_mute_upon_entry?: boolean;
  zoom_require_authentication?: boolean;

  // Zoom Video/Audio Settings
  zoom_host_video?: boolean;
  zoom_participant_video?: boolean;
  zoom_audio?: 'both' | 'telephony' | 'voip';

  // Zoom Recording Settings
  zoom_auto_recording?: 'none' | 'local' | 'cloud';
  zoom_record_speaker_view?: boolean;
  zoom_recording_disclaimer?: boolean;

  materials?: LessonMaterial[];
  is_published?: boolean;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

// Extended Program type
// NOTE: Program is now pure content - all payment/signature logic moved to Product
export interface Program {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Product reference (program gets registered as a product to become billable)
  product_id?: string | null;

  // Relations
  courses?: Course[];
  enrollments?: Enrollment[];
  announcements?: Announcement[];
  product?: import('./product').Product; // Product contains all payment/signature configuration
}

// Extended Enrollment type
export interface Enrollment {
  id: string;
  user_id: string;
  program_id: string;
  course_id: string | null;
  tenant_id: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  docusign_status: 'sent' | 'completed' | 'declined' | null;
  enrolled_at: string;
  completed_at: string | null;

  // Relations
  user?: User;
  program?: Program;
  course?: Course;
  progress?: UserProgress[];
}

// User type reference
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'instructor' | 'student';
  first_name: string;
  last_name: string;
  phone: string | null;
  tenant_id: string;
  crm_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface BulkOperationResult {
  success: boolean;
  created_count: number;
  failed_count: number;
  created_ids: string[];
  errors?: string[];
  zoom_created_count?: number;
  zoom_failed_count?: number;
}

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface CourseFilter {
  program_id?: string;
  instructor_id?: string;
  is_active?: boolean;
  search?: string;
  start_date_from?: string;
  start_date_to?: string;
}

export interface ModuleFilter {
  course_id?: string;
  is_published?: boolean;
  is_optional?: boolean;
}

export interface LessonFilter {
  course_id?: string;
  module_id?: string;
  status?: Lesson['status'];
  is_published?: boolean;
  start_time_from?: string;
  start_time_to?: string;
}

export interface AssignmentFilter {
  lesson_id?: string;
  type?: AssignmentType;
  is_required?: boolean;
  due_date_from?: string;
  due_date_to?: string;
}

export interface ProgressFilter {
  user_id?: string;
  course_id?: string;
  status?: ProgressStatus;
}

// ============================================================================
// DRAG AND DROP TYPES
// ============================================================================

export interface DraggableItem {
  id: string;
  order: number;
  type: 'module' | 'lesson' | 'topic';
}

export interface ReorderRequest {
  item_id: string;
  old_order: number;
  new_order: number;
  parent_id?: string; // For cross-container drag
}

export interface BulkReorderRequest {
  items: {
    id: string;
    order: number;
  }[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type WithRelations<T, R extends keyof T> = T & {
  [K in R]: NonNullable<T[K]>;
};

// Helper type for including relations
export type CourseWithModules = WithRelations<Course, 'modules'>;
export type ModuleWithLessons = WithRelations<Module, 'lessons'>;
export type LessonWithTopics = WithRelations<Lesson, 'topics'>;

// ============================================================================
// EXPORT AGGREGATED TYPES
// ============================================================================

export type LMSEntity =
  | Module
  | LessonTopic
  | UserProgress
  | Assignment
  | AssignmentSubmission
  | Certificate
  | LessonAttendance
  | Discussion
  | Announcement;

export type LMSCreateInput =
  | ModuleCreateInput
  | LessonTopicCreateInput
  | AssignmentCreateInput
  | SubmissionCreateInput
  | CertificateCreateInput
  | AttendanceCreateInput
  | DiscussionCreateInput
  | AnnouncementCreateInput;

export type LMSUpdateInput =
  | ModuleUpdateInput
  | LessonTopicUpdateInput
  | AssignmentUpdateInput
  | AttendanceUpdateInput
  | DiscussionUpdateInput
  | AnnouncementUpdateInput;

// ============================================================================
// COURSE MATERIALS
// ============================================================================

export type MaterialCategory = 'syllabus' | 'reading' | 'assignment' | 'reference' | 'other';

export interface CourseMaterial {
  id: string;
  tenant_id: string;
  course_id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_type: string; // MIME type
  file_size: number; // bytes
  display_order: number;
  is_published: boolean;
  category: MaterialCategory | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  course?: Course;
  uploader?: User;
}

export interface CourseMaterialCreateInput {
  course_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  display_order?: number;
  is_published?: boolean;
  category?: MaterialCategory;
}

export interface CourseMaterialUpdateInput {
  title?: string;
  description?: string;
  display_order?: number;
  is_published?: boolean;
  category?: MaterialCategory;
}
