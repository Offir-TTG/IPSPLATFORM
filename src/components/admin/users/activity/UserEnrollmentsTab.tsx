'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface Enrollment {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number | null;
  paid_amount: number | null;
  enrollment_type: string | null;
  created_at: string;
  product: { id: string; title: string; type: string } | null;
}

function money(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(Number(n));
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'active') return 'default';
  if (s === 'completed') return 'secondary';
  if (s === 'cancelled' || s === 'suspended' || s === 'overdue') return 'destructive';
  return 'outline';
}

export function UserEnrollmentsTab({ userId }: { userId: string }) {
  const { t } = useAdminLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/users/${userId}/enrollments`)
      .then(r => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => { if (!cancelled) setEnrollments(d.enrollments ?? []); })
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

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.enrollments.empty', 'No enrollments yet.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {enrollments.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground break-words">
                  {e.product?.title ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.users.activity.enrollments.enrolledAt', 'Enrolled')}: {new Date(e.created_at).toLocaleDateString()}
                  {e.product?.type && ` · ${t(`admin.users.activity.values.productType.${e.product.type}`, e.product.type)}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(e.status)}>
                  {t(`admin.users.activity.values.enrollmentStatus.${e.status}`, e.status)}
                </Badge>
                <Badge variant={statusVariant(e.payment_status)}>
                  {t(`admin.users.activity.values.paymentStatus.${e.payment_status}`, e.payment_status)}
                </Badge>
                <div className="text-sm text-right">
                  <p className="font-medium">{money(e.paid_amount)} / {money(e.total_amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.users.activity.enrollments.paidAmount', 'Paid')} / {t('admin.users.activity.enrollments.totalAmount', 'Total')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
