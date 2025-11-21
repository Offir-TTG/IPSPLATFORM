import { useQuery } from '@tanstack/react-query';

export interface DashboardStats {
  total_courses: number;
  completed_lessons: number;
  in_progress_lessons: number;
  pending_assignments: number;
  total_hours_spent: number;
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
}

export interface UpcomingSession {
  id: string;
  title: string;
  course_name: string;
  start_time: string;
  end_time: string;
  instructor_name: string | null;
  zoom_meeting_id: string;
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
  stats: DashboardStats;
  recent_activity: RecentActivity[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch('/api/user/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
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

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
