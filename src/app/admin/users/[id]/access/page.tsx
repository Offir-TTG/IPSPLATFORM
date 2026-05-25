'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserAccessManagement } from '@/components/admin/users/UserAccessManagement';

export default function UserAccessManagementPage() {
  const params = useParams();
  const userId = params.id as string;

  return (
    <AdminLayout>
      <UserAccessManagement userId={userId} />
    </AdminLayout>
  );
}
