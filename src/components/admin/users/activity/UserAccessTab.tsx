'use client';

import { UserAccessManagement } from '@/components/admin/users/UserAccessManagement';

interface UserAccessTabProps {
  userId: string;
}

export function UserAccessTab({ userId }: UserAccessTabProps) {
  return <UserAccessManagement userId={userId} embedded />;
}
