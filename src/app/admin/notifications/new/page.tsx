'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import {
  NotificationWizard,
  type WizardItem,
  type WizardUser,
} from '@/components/admin/notifications/NotificationWizard';

/** Send a new notification, step by step. */
export default function NewNotificationPage() {
  const { t, direction } = useAdminLanguage();
  const [users, setUsers] = useState<WizardUser[]>([]);
  const [courses, setCourses] = useState<WizardItem[]>([]);
  const [programs, setPrograms] = useState<WizardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // The same lists the old form loaded, from the same addresses.
  useEffect(() => {
    let alive = true;
    const load = async (url: string) => {
      try {
        const response = await fetch(url);
        return response.ok ? await response.json() : null;
      } catch (error) {
        console.error(`[Admin Notifications] Could not load ${url}:`, error);
        return null;
      }
    };
    void Promise.all([load('/api/admin/users'), load('/api/lms/courses'), load('/api/programs')]).then(
      ([usersData, coursesData, programsData]) => {
        if (!alive) return;
        setUsers(Array.isArray(usersData) ? usersData : (usersData?.users ?? usersData?.data ?? []));
        setCourses(coursesData?.data ?? []);
        setPrograms(programsData?.data ?? []);
        setLoading(false);
      },
    );
    return () => {
      alive = false;
    };
  }, []);

  const Back = direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <AdminLayout>
      <div className="max-w-6xl p-4 md:p-0" dir={direction}>
        <Link href="/admin/notifications" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <Back className="h-4 w-4" />
          <span suppressHydrationWarning>{t('admin.notifications.pageTitle', 'Notifications')}</span>
        </Link>
        <h1 className="mb-5 mt-1 text-2xl font-bold md:text-3xl" suppressHydrationWarning>
          {t('admin.notifications.wizard.newTitle', 'New notification')}
        </h1>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <NotificationWizard users={users} courses={courses} programs={programs} t={t} direction={direction} />
        )}
      </div>
    </AdminLayout>
  );
}
