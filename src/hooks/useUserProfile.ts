import { useQuery } from '@tanstack/react-query';
import { User } from '@/types';

export interface NotificationPreferences {
  lesson_reminders: boolean;
  achievement_updates: boolean;
  assignment_due_dates: boolean;
  course_announcements: boolean;
}

export interface RegionalPreferences {
  language: string;
  timezone: string;
}

export interface UserPreferences {
  notifications: NotificationPreferences;
  regional: RegionalPreferences;
}

export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

export interface SecuritySettings {
  password_last_changed: string;
  two_factor_enabled: boolean;
  active_sessions: ActiveSession[];
}

export interface UserProfileData {
  user: User;
  preferences: UserPreferences;
  security: SecuritySettings;
}

async function fetchUserProfile(): Promise<UserProfileData> {
  const response = await fetch('/api/user/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch user profile');
  }

  return result.data;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
