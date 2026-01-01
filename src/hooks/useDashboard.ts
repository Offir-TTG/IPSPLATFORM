import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  // Legacy fields (keeping for backwards compatibility)
  total_courses: number;
  completed_lessons: number;
  in_progress_lessons: number;
  pending_assignments: number;
  total_attendance: number;
  attendance_present: number;
  attendance_rate: number;

  // New improved stats
  total_hours_spent: number; // Total study hours (all time)
  completion_rate: number; // Course completion percentage
  completed_courses: number; // Number of completed courses
  upcoming_sessions_count: number; // Sessions this week
  next_session_time: string | null; // Next session datetime
  next_session_title: string | null; // Next session title

  // Streak and engagement
  current_streak: number; // Current learning streak (days)
  longest_streak: number; // Longest learning streak (days)
  last_activity_date: string | null; // Last learning activity date

  // Total lessons across all enrollments
  total_lessons?: number;
}

export interface WeeklyActivityData {
  day: string;
  hours: number;
  lessons: number;
}

export interface Enrollment {
  id: string;
  program_id: string | null;
  course_id: string | null;
  program_name: string | null;
  course_name: string;
  course_description: string | null;
  course_image: string | null;
  enrolled_at: string;
  expires_at: string | null;
  overall_progress: number;
  completed_lessons: number;
  total_lessons: number;
  total_hours?: number; // Total duration of all lessons in hours
}

export interface UpcomingSession {
  id: string;
  title: string;
  course_id: string;
  course_name: string;
  start_time: string;
  end_time: string;
  instructor_name: string | null;
  zoom_meeting_id: string | null;
  daily_room_url: string | null;
  daily_room_name: string | null;
  meeting_platform: 'zoom' | 'daily' | null;
}

export interface PendingAssignment {
  id: string;
  title: string;
  course_name: string;
  due_date: string;
  max_score: number;
  status: 'pending' | 'submitted' | 'graded';
  is_overdue: boolean;
}

export interface AttendanceRecord {
  id: string;
  course_id: string;
  course_name: string;
  lesson_id: string | null;
  lesson_title: string | null;
  attendance_date: string; // DATE format (YYYY-MM-DD)
  status: 'present' | 'absent' | 'late' | 'excused';
  notes: string | null;
}

export interface RecentActivity {
  id: string;
  type: string;
  lesson_title: string;
  course_name: string;
  status: string;
  timestamp: string;
}

export interface DashboardData {
  enrollments: Enrollment[];
  upcoming_sessions: UpcomingSession[];
  pending_assignments: PendingAssignment[];
  recent_attendance: AttendanceRecord[];
  stats: DashboardStats;
  recent_activity: RecentActivity[];
  weekly_activity?: WeeklyActivityData[];
}

async function fetchDashboard(): Promise<DashboardData> {
  // Add timestamp to URL to prevent any caching
  const response = await fetch(`/api/user/dashboard?t=${Date.now()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch dashboard data');
  }

  return result.data;
}

// Cache version - increment this to force all clients to refetch dashboard data
const DASHBOARD_CACHE_VERSION = 5;

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', DASHBOARD_CACHE_VERSION],
    queryFn: fetchDashboard,
    staleTime: 0, // No stale time - always fresh
    gcTime: 0, // No garbage collection time - don't cache at all
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnMount: true, // Always refetch on mount
    retry: 1,
  });
}
