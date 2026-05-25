'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface UpcomingPayment {
  id: string;
  enrollment_id: string;
  product_title: string;
  amount: number;
  currency: string;
  scheduled_date: string;
  status: string;
  payment_type: string;
  is_overdue: boolean;
}

interface PaymentHistoryRow {
  id: string;
  enrollment_id: string;
  product_title: string;
  amount: number;
  currency: string;
  status: string;
  payment_type: string | null;
  paid_at: string | null;
  created_at: string;
  refunded_amount: number | null;
}

function money(n: number | null | undefined, ccy: string = 'USD') {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: ccy.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'paid' || s === 'succeeded') return 'default';
  if (s === 'failed' || s === 'cancelled') return 'destructive';
  if (s === 'refunded' || s === 'partially_refunded') return 'secondary';
  return 'outline';
}

export function UserPaymentsTab({ userId }: { userId: string }) {
  const { t } = useAdminLanguage();
  const [upcoming, setUpcoming] = useState<UpcomingPayment[]>([]);
  const [history, setHistory] = useState<PaymentHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/payments`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (!cancelled) {
          setUpcoming(d.upcoming ?? []);
          setHistory(d.history ?? []);
        }
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          {t('admin.users.activity.error', 'Failed to load. Try refreshing the page.')}
        </CardContent>
      </Card>
    );
  }

  if (upcoming.length === 0 && history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.payments.empty', 'No payments yet.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.users.activity.payments.upcoming', 'Upcoming payments')} ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.map((p) => (
              <div key={p.id} className={`flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg ${p.is_overdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">{p.product_title || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.users.activity.payments.due', 'Due')}: {new Date(p.scheduled_date).toLocaleDateString()}
                    {p.payment_type && ` · ${t(`admin.users.activity.values.paymentType.${p.payment_type}`, p.payment_type)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.is_overdue && (
                    <Badge variant="destructive">
                      {t('admin.users.activity.payments.overdueBadge', 'Overdue')}
                    </Badge>
                  )}
                  <Badge variant={statusVariant(p.status)}>
                    {t(`admin.users.activity.values.scheduleStatus.${p.status}`, p.status)}
                  </Badge>
                  <span className="font-medium">{money(p.amount, p.currency)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.users.activity.payments.history', 'Payment history')} ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map((p) => (
              <div key={p.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-3 border rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-words">{p.product_title || '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.paid_at
                      ? `${t('admin.users.activity.payments.paidAt', 'Paid')}: ${new Date(p.paid_at).toLocaleString()}`
                      : new Date(p.created_at).toLocaleString()}
                    {p.payment_type && ` · ${t(`admin.users.activity.values.paymentType.${p.payment_type}`, p.payment_type)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusVariant(p.status)}>
                    {t(`admin.users.activity.values.paymentRowStatus.${p.status}`, p.status)}
                  </Badge>
                  <span className="font-medium">{money(p.amount, p.currency)}</span>
                  {p.refunded_amount && Number(p.refunded_amount) > 0 && (
                    <span className="text-xs text-muted-foreground">(-{money(p.refunded_amount, p.currency)})</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
