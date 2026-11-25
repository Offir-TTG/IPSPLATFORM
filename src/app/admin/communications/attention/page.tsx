'use client';

export const dynamic = 'force-dynamic';

/**
 * Communications · Needs attention: clients stuck in the middle (a payment
 * that failed, an enrollment or contract not finished, an email that
 * doesn't arrive).
 */

import { AlertTriangle } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { CommsPage } from '@/components/admin/comms/CommsPage';
import { AttentionTab } from '@/components/admin/reminders/AttentionTab';

export default function CommsAttentionPage() {
  const { t } = useAdminLanguage();
  return (
    <CommsPage icon={AlertTriangle} title={t('admin.reminders.tab.attention', 'Needs attention')}>
      <AttentionTab onChanged={() => {}} />
    </CommsPage>
  );
}
