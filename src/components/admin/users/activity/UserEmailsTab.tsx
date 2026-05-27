'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Loader2, Eye, CheckCircle, XCircle, Clock, AlertCircle, Ban, Mail } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { TabPagination } from './TabPagination';

interface EmailRow {
  id: string;
  subject: string;
  to_email: string;
  to_name: string | null;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'expired';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  trigger_type: string | null;
  trigger_event: string | null;
  language_code: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_VARIANT: Record<EmailRow['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  sent: 'secondary',
  pending: 'default',
  processing: 'default',
  failed: 'destructive',
  cancelled: 'outline',
  expired: 'outline',
};

const STATUS_ICON: Record<EmailRow['status'], typeof CheckCircle> = {
  sent: CheckCircle,
  pending: Clock,
  processing: Loader2,
  failed: XCircle,
  cancelled: Ban,
  expired: AlertCircle,
};

const PAGE_SIZE = 20;

export function UserEmailsTab({ userId }: { userId: string }) {
  const { t, direction } = useAdminLanguage();

  // Translate the known-string error_messages WE write to email_queue
  // (cancellation reasons, schedule actions). Same mapping as the
  // global /admin/emails/queue page so RTL admins see Hebrew here too.
  // External SMTP errors pass through verbatim — we can't predict them.
  const translateErrorMessage = (msg: string | null): string => {
    if (!msg) return '';
    const map: Record<string, string> = {
      'Cancelled by admin': t('emails.queue.errorMessage.cancelledByAdmin', 'Cancelled by admin'),
      'Cancelled by admin (bulk)': t('emails.queue.errorMessage.cancelledByAdminBulk', 'Cancelled by admin (bulk)'),
      'Schedule paused': t('emails.queue.errorMessage.schedulePaused', 'Schedule paused'),
      'Schedule stopped': t('emails.queue.errorMessage.scheduleStopped', 'Schedule stopped'),
      'Schedule deleted': t('emails.queue.errorMessage.scheduleDeleted', 'Schedule deleted'),
    };
    return map[msg] ?? msg;
  };
  const isRtl = direction === 'rtl';
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<EmailRow | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{ subject: string; bodyHtml: string; bodyText: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), per_page: String(PAGE_SIZE) });
    fetch(`/api/admin/users/${userId}/emails?${params}`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('failed'); return r.json(); })
      .then((d) => {
        if (cancelled) return;
        setEmails(d.emails ?? []);
        setTotal(d.total ?? 0);
      })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, page]);

  useEffect(() => {
    if (!selected) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setPreview(null);
    fetch(`/api/admin/emails/queue/${selected.id}/preview`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return;
        setPreview({
          subject: data.subject || selected.subject,
          bodyHtml: data.bodyHtml || '',
          bodyText: data.bodyText || '',
        });
      })
      .catch(() => { if (!cancelled) setPreview(null); })
      .finally(() => { if (!cancelled) setPreviewLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  if (loading && emails.length === 0) {
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
  if (emails.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
          {t('admin.users.activity.emails.empty', 'No emails sent to this user yet.')}
        </CardContent>
      </Card>
    );
  }

  const renderStatusCell = (e: EmailRow) => {
    const StatusIcon = STATUS_ICON[e.status];
    return (
      <Badge variant={STATUS_VARIANT[e.status]} className="gap-1 text-[10px] py-0 px-1.5">
        <StatusIcon className="h-3 w-3" />
        {t(`emails.status.${e.status}`, e.status)}
      </Badge>
    );
  };

  return (
    <div className="space-y-4" dir={direction}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between gap-3 flex-wrap">
            <span>{t('admin.users.activity.emails.title', 'Emails')}</span>
            <span className="text-sm text-muted-foreground font-normal tabular-nums">
              {t('admin.users.activity.emails.count', '{{count}} emails').replace('{{count}}', String(total))}
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
                        {t('admin.users.activity.emails.col.status', 'Status')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.emails.col.subject', 'Subject')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.emails.col.trigger', 'Trigger')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-right' : 'text-left'}>
                        {t('admin.users.activity.emails.col.when', 'When')}
                      </TableHead>
                      <TableHead className={isRtl ? 'text-left' : 'text-right'}>
                        {t('common.actions', 'Actions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{renderStatusCell(e)}</TableCell>
                        <TableCell className="max-w-md">
                          <p className="font-medium truncate" dir="auto" title={e.subject || '—'}>
                            {e.subject || '—'}
                          </p>
                          {e.error_message && (
                            <p
                              className="text-xs text-destructive mt-1 truncate"
                              dir="auto"
                              title={translateErrorMessage(e.error_message)}
                            >
                              {translateErrorMessage(e.error_message)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground" dir="ltr">
                          {e.trigger_event || e.trigger_type || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <span title={new Date(e.created_at).toLocaleString()}>
                            {formatDistanceToNow(new Date(e.created_at), {
                              addSuffix: true,
                              locale: isRtl ? heLocale : undefined,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                          <Button variant="ghost" size="sm" onClick={() => setSelected(e)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ResponsiveTable.Desktop>

            <ResponsiveTable.Mobile className="space-y-2 p-3" dir={direction}>
              {emails.map((e) => (
                <div key={e.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" dir="auto" title={e.subject || '—'}>
                        {e.subject || '—'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {renderStatusCell(e)}
                        {e.trigger_event && (
                          <span className="text-[10px] font-mono text-muted-foreground" dir="ltr">
                            {e.trigger_event}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(e.created_at), {
                          addSuffix: true,
                          locale: isRtl ? heLocale : undefined,
                        })}
                      </p>
                      {e.error_message && (
                        <p className="text-xs text-destructive mt-1 break-words" dir="auto">
                          {translateErrorMessage(e.error_message)}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(e)} className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
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

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <Card
            className="max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1" dir="ltr">{selected.to_email}</p>
                  <h3 className="font-semibold text-lg break-words" dir="auto">
                    {preview?.subject || selected.subject}
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="shrink-0">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              {previewLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : preview?.bodyHtml ? (
                <div className="border rounded-lg bg-background max-h-[480px] overflow-y-auto">
                  <iframe
                    srcDoc={preview.bodyHtml}
                    className="w-full min-h-[400px] border-0"
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : preview?.bodyText ? (
                <pre className="border rounded-lg p-4 bg-muted/30 max-h-[480px] overflow-auto text-sm whitespace-pre-wrap" dir="auto">
                  {preview.bodyText}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t('admin.users.activity.emails.noPreview', 'No preview available for this email.')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
