'use client';

/**
 * The frame of every Communications page: the admin layout, the page width
 * every admin list uses, and the title. The seven parts are reached from the
 * "Communications" item in the side menu.
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { PageTitle } from '@/components/admin/notifications/kit';

export const COMMS = {
  overview: '/admin/communications',
  messages: '/admin/communications/messages',
  newMessage: '/admin/communications/messages/new',
  reminders: '/admin/reminders',
  templates: '/admin/communications/templates',
  log: '/admin/communications/log',
  attention: '/admin/communications/attention',
  settings: '/admin/communications/settings',
} as const;

export function CommsPage({
  icon,
  title,
  description,
  badge,
  actions,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { direction } = useAdminLanguage();
  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 pb-28 md:p-6 md:pb-28" dir={direction}>
        <PageTitle icon={icon} title={title} badge={badge} description={description} actions={actions} />
        {children}
      </div>
    </AdminLayout>
  );
}
