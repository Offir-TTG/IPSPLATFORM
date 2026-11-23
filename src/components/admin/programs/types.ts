export interface Program {
  id: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  duration_weeks: number | null;
  max_students: number | null;
  created_at?: string;
  updated_at?: string;
  course_count?: number;
  student_count?: number;
  /** Enrollments still running (active or pending); they stop a delete. */
  active_count?: number;
  price?: number;
  currency?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  image_url?: string | null;
  course_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ProgramCourse {
  id: string;
  order: number;
  is_required: boolean;
  created_at: string;
  course: Course;
}

export interface Student {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: string;
  enrolled_at: string;
}

/** Plain text from a rich-text description, for search and one-line previews. */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
