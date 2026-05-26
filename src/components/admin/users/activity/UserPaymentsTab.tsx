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

// Currency formatting stays in `en-US` regardless of UI direction.
// Hebrew locale formatting of USD splits the "$" from the number
// with RTL marks ("50 ‏$0") which is unreadable; "$50" is clear in
// any direction.
function money(n: number | null | undefined, ccy: string = 'USD') {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (ccy || 'USD').toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (s === 'paid' || s === 'succeeded') return 'default';
  if (s === 'failed' || s === 'cancelled') return 'destructive';
  if (s === 'refunded' || s === 'partially_refunded') return 'secondary';
  return 'outline';
}

const PAGE_SIZE = 20;

export function UserPaymentsTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const dateLocale = isRtl ? 'he-IL' : undefined;

  // Independent page state for the two sections — paginating "upcoming"
  // shouldn't reset the user's position in "history" and vice versa.
  const [upPage, setUpPage] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const [upcoming, setUpcoming] = useState<{ rows: UpcomingPayment[]; total: number }>({ rows: [], total: 0 });
  const [history, setHistory] = useState<{ rows: PaymentHistoryRow[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({
      up_page: String(upPage),
      up_per_page: String(PAGE_SIZE),
      hist_page: String(histPage),
      hist_per_page: String(PAGE_SIZE),
    });
    fetch(`/api/admin/users/${userId}/payments?${qs}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setUpcoming({ rows: d.upcoming?.rows ?? [], total: d.upcoming?.total ?? 0 });
        setHistory({ rows: d.history?.rows ?? [], total: d.history?.total ?? 0 });
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, upPage, histPage]);

  if (loading && upcoming.rows.length === 0 && history.rows.length === 0) {
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
  if (upcoming.total === 0 && history.total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t('admin.users.activity.payments.empty', 'No payments yet.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir={direction}>
      {/* Upcoming payments */}
      {upcoming.total > 0 && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                <span>{t('admin.users.activity.payments.upcoming', 'Upcoming payments')}</span>
                <span className="text-sm text-muted-foreground font-normal tabular-nums">
                  {t('admin.users.activity.payments.upcomingCount', '{{count}} scheduled').replace('{{count}}', String(upcoming.total))}
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
                            {t('admin.users.activity.payments.col.product', 'Product')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.users.activity.payments.col.due', 'Due')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.users.activity.payments.col.type', 'Type')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.users.activity.payments.col.status', 'Status')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                            {t('admin.users.activity.payments.col.amount', 'Amount')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcoming.rows.map((p) => (
                          <TableRow key={p.id} className={p.is_overdue ? 'bg-destructive/5' : undefined}>
                            <TableCell className="max-w-xs">
                              <p className="font-medium truncate" dir="auto" title={p.product_title || '—'}>
                                {p.product_title || '—'}
                              </p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(p.scheduled_date).toLocaleDateString(dateLocale)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.payment_type
                                ? t(`admin.users.activity.values.paymentType.${p.payment_type}`, p.payment_type)
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 flex-wrap">
                                {p.is_overdue && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    {t('admin.users.activity.payments.overdueBadge', 'Overdue')}
                                  </Badge>
                                )}
                                <Badge variant={statusVariant(p.status)} className="text-[10px]">
                                  {t(`admin.users.activity.values.scheduleStatus.${p.status}`, p.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className={`tabular-nums whitespace-nowrap ${isRtl ? 'text-left' : 'text-right'}`} dir="ltr">
                              {money(p.amount, p.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ResponsiveTable.Desktop>

                <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                  {upcoming.rows.map((p) => (
                    <div key={p.id} className={`rounded-lg border p-3 space-y-2 ${p.is_overdue ? 'border-destructive/50 bg-destructive/5' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium truncate flex-1" dir="auto" title={p.product_title || '—'}>
                          {p.product_title || '—'}
                        </p>
                        <span className="tabular-nums font-medium whitespace-nowrap" dir="ltr">
                          {money(p.amount, p.currency)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.is_overdue && (
                          <Badge variant="destructive" className="text-[10px]">
                            {t('admin.users.activity.payments.overdueBadge', 'Overdue')}
                          </Badge>
                        )}
                        <Badge variant={statusVariant(p.status)} className="text-[10px]">
                          {t(`admin.users.activity.values.scheduleStatus.${p.status}`, p.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('admin.users.activity.payments.due', 'Due')}: {new Date(p.scheduled_date).toLocaleDateString(dateLocale)}
                        {p.payment_type && ` · ${t(`admin.users.activity.values.paymentType.${p.payment_type}`, p.payment_type)}`}
                      </p>
                    </div>
                  ))}
                </ResponsiveTable.Mobile>
              </ResponsiveTable>
            </CardContent>
          </Card>

          <TabPagination
            page={upPage}
            total={upcoming.total}
            pageSize={PAGE_SIZE}
            onChange={setUpPage}
            loading={loading}
          />
        </div>
      )}

      {/* Payment history */}
      {history.total > 0 && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
                <span>{t('admin.users.activity.payments.history', 'Payment history')}</span>
                <span className="text-sm text-muted-foreground font-normal tabular-nums">
                  {t('admin.users.activity.payments.historyCount', '{{count}} payments').replace('{{count}}', String(history.total))}
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
                            {t('admin.users.activity.payments.col.product', 'Product')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.users.activity.payments.col.paidAt', 'Paid at')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.users.activity.payments.col.type', 'Type')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                            {t('admin.users.activity.payments.col.status', 'Status')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                            {t('admin.users.activity.payments.col.amount', 'Amount')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                            {t('admin.users.activity.payments.col.refunded', 'Refunded')}
                          </TableHead>
                          <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                            {t('admin.users.activity.payments.col.net', 'Net')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.rows.map((p) => {
                          const refunded = Number(p.refunded_amount ?? 0);
                          const net = Number(p.amount) - refunded;
                          const hasRefund = Math.round(refunded) > 0;
                          return (
                          <TableRow key={p.id}>
                            <TableCell className="max-w-xs">
                              <p className="font-medium truncate" dir="auto" title={p.product_title || '—'}>
                                {p.product_title || '—'}
                              </p>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {p.paid_at
                                ? new Date(p.paid_at).toLocaleString(dateLocale)
                                : new Date(p.created_at).toLocaleString(dateLocale)}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {p.payment_type
                                ? t(`admin.users.activity.values.paymentType.${p.payment_type}`, p.payment_type)
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(p.status)} className="text-[10px]">
                                {t(`admin.users.activity.values.paymentRowStatus.${p.status}`, p.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className={`tabular-nums whitespace-nowrap ${isRtl ? 'text-left' : 'text-right'}`} dir="ltr">
                              {money(p.amount, p.currency)}
                            </TableCell>
                            <TableCell className={`tabular-nums whitespace-nowrap ${hasRefund ? 'text-destructive' : 'text-muted-foreground'} ${isRtl ? 'text-left' : 'text-right'}`} dir="ltr">
                              {hasRefund ? `-${money(refunded, p.currency)}` : '—'}
                            </TableCell>
                            <TableCell className={`tabular-nums whitespace-nowrap font-medium ${isRtl ? 'text-left' : 'text-right'}`} dir="ltr">
                              {money(net, p.currency)}
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </ResponsiveTable.Desktop>

                <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
                  {history.rows.map((p) => {
                    const refunded = Number(p.refunded_amount ?? 0);
                    const net = Number(p.amount) - refunded;
                    const hasRefund = Math.round(refunded) > 0;
                    return (
                    <div key={p.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium truncate flex-1" dir="auto" title={p.product_title || '—'}>
                          {p.product_title || '—'}
                        </p>
                        <span className="tabular-nums font-medium whitespace-nowrap" dir="ltr">
                          {money(p.amount, p.currency)}
                        </span>
                      </div>
                      {hasRefund && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {t('admin.users.activity.payments.refunded', 'Refunded')}
                          </span>
                          <span className="tabular-nums text-destructive whitespace-nowrap" dir="ltr">
                            -{money(refunded, p.currency)}
                          </span>
                        </div>
                      )}
                      {hasRefund && (
                        <div className="flex items-center justify-between text-xs border-t pt-2">
                          <span className="text-muted-foreground">
                            {t('admin.users.activity.payments.net', 'Net')}
                          </span>
                          <span className="tabular-nums font-medium whitespace-nowrap" dir="ltr">
                            {money(net, p.currency)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 flex-wrap">
                        <Badge variant={statusVariant(p.status)} className="text-[10px]">
                          {t(`admin.users.activity.values.paymentRowStatus.${p.status}`, p.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.paid_at
                          ? `${t('admin.users.activity.payments.paidAt', 'Paid')}: ${new Date(p.paid_at).toLocaleString(dateLocale)}`
                          : new Date(p.created_at).toLocaleString(dateLocale)}
                        {p.payment_type && ` · ${t(`admin.users.activity.values.paymentType.${p.payment_type}`, p.payment_type)}`}
                      </p>
                    </div>
                    );
                  })}
                </ResponsiveTable.Mobile>
              </ResponsiveTable>
            </CardContent>
          </Card>

          <TabPagination
            page={histPage}
            total={history.total}
            pageSize={PAGE_SIZE}
            onChange={setHistPage}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}
