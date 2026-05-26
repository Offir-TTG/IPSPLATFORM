'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { TabPagination } from './TabPagination';

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

// Always `en-US` — Hebrew currency formatting splits "$" from the
// digits with RTL marks ("50 ‏$0") which is unreadable.
function money(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'active') return 'default';
  if (s === 'completed') return 'secondary';
  if (s === 'cancelled' || s === 'suspended' || s === 'overdue') return 'destructive';
  return 'outline';
}

const PAGE_SIZE = 20;

export function UserEnrollmentsTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    fetch(`/api/admin/users/${userId}/enrollments?${qs}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setEnrollments(d.enrollments ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  if (loading && enrollments.length === 0) {
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

  const renderStatus = (e: Enrollment) => (
    <div className="flex items-center gap-1 flex-wrap">
      <Badge variant={statusVariant(e.status)} className="text-[10px]">
        {t(`admin.users.activity.values.enrollmentStatus.${e.status}`, e.status)}
      </Badge>
      <Badge variant={statusVariant(e.payment_status)} className="text-[10px]">
        {t(`admin.users.activity.values.paymentStatus.${e.payment_status}`, e.payment_status)}
      </Badge>
    </div>
  );

  const renderAmount = (e: Enrollment) => (
    <span className="tabular-nums whitespace-nowrap text-sm">
      {money(e.paid_amount)} / {money(e.total_amount)}
    </span>
  );

  return (
    <div className="space-y-4" dir={direction}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.enrollments.title', 'Enrollments')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.enrollments.count', '{{count}} enrollments').replace('{{count}}', String(total))}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <ResponsiveTable>
            <ResponsiveTable.Desktop>
              <div className="overflow-x-auto" dir={direction}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.enrollments.col.product', 'Product')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.enrollments.col.enrolled', 'Enrolled')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.enrollments.col.status', 'Status')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                        {t('admin.users.activity.enrollments.col.amount', 'Amount')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="max-w-xs">
                          <p className="font-medium truncate" dir="auto" title={e.product?.title ?? '—'}>
                            {e.product?.title ?? '—'}
                          </p>
                          {e.product?.type && (
                            <p className="text-xs text-muted-foreground">
                              {t(`admin.users.activity.values.productType.${e.product.type}`, e.product.type)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(e.created_at).toLocaleDateString(dateLocale)}
                        </TableCell>
                        <TableCell>{renderStatus(e)}</TableCell>
                        <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                          {renderAmount(e)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable.Desktop>

            <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
              {enrollments.map((e) => (
                <div key={e.id} className="rounded-lg border p-3 space-y-2">
                  <p className="font-medium truncate" dir="auto" title={e.product?.title ?? '—'}>
                    {e.product?.title ?? '—'}
                  </p>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {renderStatus(e)}
                    {renderAmount(e)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('admin.users.activity.enrollments.enrolledAt', 'Enrolled')}:{' '}
                    {new Date(e.created_at).toLocaleDateString(dateLocale)}
                    {e.product?.type && ` · ${t(`admin.users.activity.values.productType.${e.product.type}`, e.product.type)}`}
                  </p>
                </div>
              ))}
            </ResponsiveTable.Mobile>
          </ResponsiveTable>
        </CardContent>
      </Card>

      <TabPagination
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
        loading={loading}
      />
    </div>
  );
}
