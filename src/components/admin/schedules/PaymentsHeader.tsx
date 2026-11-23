'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, CheckCircle2, DollarSign, Wallet } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { PageTitle, kitButton } from '@/components/admin/notifications/kit';
import { RecordStandalonePaymentDialog } from './ScheduleDialogs';

/**
 * The top of the one Payments page: the title, the two tabs (Planned and
 * Done, each its own address so old links keep working), and "Record
 * off-schedule payment", shared by both tabs.
 */
export function PaymentsHeader({
  active,
  badge,
  onRecorded,
}: {
  active: 'planned' | 'done';
  badge?: string;
  /** After an off-schedule payment is recorded, so the tab can refresh. */
  onRecorded: () => void;
}) {
  const { t } = useAdminLanguage();
  const { toast } = useToast();
  const [standaloneOpen, setStandaloneOpen] = useState(false);

  const tabs = [
    { key: 'planned', href: '/admin/payments/schedules', icon: Calendar, label: t('admin.payments.combined.tabPlanned', 'Planned') },
    { key: 'done', href: '/admin/payments/transactions', icon: CheckCircle2, label: t('admin.payments.combined.tabDone', 'Done') },
  ] as const;

  return (
    <>
      <PageTitle
        icon={Wallet}
        title={t('admin.payments.combined.title', 'Payments')}
        badge={badge}
        description={t('admin.payments.combined.description', 'What is planned, what was paid, and what was refunded, across all enrollments.')}
        actions={
          <button type="button" onClick={() => setStandaloneOpen(true)} className={kitButton.primary}>
            <DollarSign className="h-4 w-4" aria-hidden />
            {t('admin.payments.schedules.recordStandalone', 'Record off-schedule payment')}
          </button>
        }
      />
      <nav aria-label={t('admin.payments.combined.title', 'Payments')} className="-mt-1 flex gap-1 border-b border-border">
        {tabs.map(({ key, href, icon: Icon, label }) => {
          const on = key === active;
          return (
            <Link
              key={key}
              href={href}
              aria-current={on ? 'page' : undefined}
              className={`-mb-px inline-flex min-h-[46px] items-center gap-2 border-b-[3px] px-4 font-semibold ${
                on ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      <RecordStandalonePaymentDialog
        open={standaloneOpen}
        onClose={() => setStandaloneOpen(false)}
        onRecorded={() => {
          setStandaloneOpen(false);
          onRecorded();
          toast({ title: t('common.success', 'Success'), description: t('admin.payments.schedules.recordStandaloneSuccess', 'Off-schedule payment recorded.') });
        }}
      />
    </>
  );
}
