'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdminLanguage } from '@/context/AppContext';
import { NewButton } from '@/components/admin/notifications/kit';
import { CommsPage, COMMS } from '@/components/admin/comms/CommsPage';
import { PAGE_ICON } from '@/components/admin/reminders/shared';
import { RemindersTab, type ListData } from '@/components/admin/reminders/RemindersTab';

/**
 * Communications · Automatic reminders: every message the system sends by
 * itself, from every area. Needs attention, the send log and the sending
 * settings are parts of Communications, for every kind of message.
 */
function RemindersPage() {
  const { t } = useAdminLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const oldTab = params.get('tab');
  const openId = params.get('open');

  const [data, setData] = useState<ListData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The tabs this page used to have now live in Communications.
  useEffect(() => {
    if (oldTab === 'attention') router.replace(COMMS.attention);
    else if (oldTab === 'log') router.replace(COMMS.log);
    else if (oldTab === 'settings') router.replace(COMMS.settings);
  }, [oldTab, router]);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/reminders', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setData(body);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CommsPage
      icon={PAGE_ICON}
      title={t('admin.reminders.title', 'Automatic reminders')}
      badge={data?.reminders.length}
      description={t(
        'admin.reminders.subtitle',
        'Every message that goes out by itself, from every area, in one place: meetings, coaching, payments, enrollment, assignments. Each one goes out by what the client chose in their update settings.',
      )}
      actions={<NewButton href="/admin/reminders/new">{t('admin.reminders.new', 'New reminder')}</NewButton>}
    >
      <RemindersTab data={data} error={error} reload={load} openId={openId} />
    </CommsPage>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RemindersPage />
    </Suspense>
  );
}
