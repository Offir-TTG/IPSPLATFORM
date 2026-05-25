'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Mail, Search, RefreshCw, Loader2, Eye, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, Ban } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import type { EmailQueueItem, EmailStatus, EmailPriority } from '@/types/email';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function EmailQueuePage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;

  const [emails, setEmails] = useState<EmailQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<EmailPriority | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<EmailQueueItem | null>(null);
  // Rendered preview fetched server-side via the templateEngine
  // (same Handlebars helpers as the send pipeline). Stored separately
  // from `selectedEmail` because `email_queue.body_html` is the raw
  // template with `{{placeholders}}` — useless for "what does the
  // recipient see".
  const [renderedPreview, setRenderedPreview] = useState<{ subject: string; bodyHtml: string; bodyText: string; variables?: Record<string, any>; error?: string | null } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [cancelling, setCancelling] = useState<EmailQueueItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Whenever the preview modal opens, hit the render endpoint so the
  // iframe shows the recipient-facing copy with variables filled in.
  useEffect(() => {
    if (!selectedEmail) {
      setRenderedPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    setRenderedPreview(null);
    fetch(`/api/admin/emails/queue/${selectedEmail.id}/preview`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (cancelled) return;
        setRenderedPreview({
          subject: data.subject || '',
          bodyHtml: data.bodyHtml || '',
          bodyText: data.bodyText || '',
          variables: data.variables || {},
          error: data.error,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // Fall back to whatever is on the row so the modal still
        // shows something even if rendering failed.
        setRenderedPreview(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedEmail]);
  // Multi-select: id set of pending rows the admin has ticked. Only
  // pending rows are selectable — other statuses can't be cancelled
  // so showing them as selectable would be misleading.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const pageSize = 20;

  // Drop selection whenever the underlying list changes (page change,
  // filter, refresh) — keeping stale ids around would let the bulk
  // call act on rows the admin can no longer see.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [emails]);

  const pendingIdsOnPage = emails.filter((e) => e.status === 'pending').map((e) => e.id);
  const allPendingSelected =
    pendingIdsOnPage.length > 0 && pendingIdsOnPage.every((id) => selectedIds.has(id));

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleAllPending = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of pendingIdsOnPage) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  };

  const handleBulkCancel = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetch('/api/admin/emails/queue/bulk-cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || t('emails.queue.bulkCancelFailed', 'Failed to cancel selected emails'));
        return;
      }
      toast.success(
        t('emails.queue.bulkCancelled', '{{count}} emails cancelled')
          .replace('{{count}}', String(data?.cancelled ?? 0)),
      );
      setSelectedIds(new Set());
      setBulkConfirmOpen(false);
      fetchEmails();
    } catch {
      toast.error(t('emails.queue.bulkCancelFailed', 'Failed to cancel selected emails'));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleCancelEmail = async () => {
    if (!cancelling) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/admin/emails/queue/${cancelling.id}/cancel`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error || t('emails.queue.cancelFailed', 'Failed to cancel email'));
        return;
      }
      toast.success(t('emails.queue.cancelled', 'Email cancelled'));
      setCancelling(null);
      fetchEmails();
    } catch {
      toast.error(t('emails.queue.cancelFailed', 'Failed to cancel email'));
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEmails();
  }, [page, statusFilter, priorityFilter, searchTerm]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pageSize.toString(),
      });

      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/admin/emails/queue?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
        setTotalCount(data.total || 0);
      } else {
        console.error('Failed to fetch email queue');
      }
    } catch (error) {
      console.error('Error fetching email queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EmailStatus) => {
    const statusConfig: Record<EmailStatus, { variant: any; icon: any; label: string; className?: string }> = {
      pending: { variant: 'secondary' as const, icon: Clock, label: t('emails.status.pending', 'Pending') },
      processing: { variant: 'default' as const, icon: Loader2, label: t('emails.status.processing', 'Processing') },
      sent: { variant: 'default' as const, icon: CheckCircle, label: t('emails.status.sent', 'Sent'), className: 'bg-green-500 hover:bg-green-600' },
      failed: { variant: 'destructive' as const, icon: XCircle, label: t('emails.status.failed', 'Failed') },
      cancelled: { variant: 'outline' as const, icon: XCircle, label: t('emails.status.cancelled', 'Cancelled') },
      expired: { variant: 'outline' as const, icon: AlertCircle, label: t('emails.status.expired', 'Expired') },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: EmailPriority) => {
    const priorityConfig: Record<EmailPriority, { variant: any; label: string; className?: string }> = {
      urgent: { variant: 'destructive' as const, label: t('emails.priority.urgent', 'Urgent') },
      high: { variant: 'default' as const, label: t('emails.priority.high', 'High'), className: 'bg-orange-500 hover:bg-orange-600' },
      normal: { variant: 'secondary' as const, label: t('emails.priority.normal', 'Normal') },
      low: { variant: 'outline' as const, label: t('emails.priority.low', 'Low') },
    };

    const config = priorityConfig[priority];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // Translate the handful of `error_message` strings WE write to
  // email_queue (cancellation reasons). External SMTP errors pass
  // through verbatim since we can't predict their content.
  const translateErrorMessage = (msg: string): string => {
    const map: Record<string, string> = {
      'Cancelled by admin': t('emails.queue.errorMessage.cancelledByAdmin', 'Cancelled by admin'),
      'Cancelled by admin (bulk)': t('emails.queue.errorMessage.cancelledByAdminBulk', 'Cancelled by admin (bulk)'),
      'Schedule paused': t('emails.queue.errorMessage.schedulePaused', 'Schedule paused'),
      'Schedule stopped': t('emails.queue.errorMessage.scheduleStopped', 'Schedule stopped'),
      'Schedule deleted': t('emails.queue.errorMessage.scheduleDeleted', 'Schedule deleted'),
    };
    return map[msg] ?? msg;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="max-w-7xl p-6 space-y-6" dir={direction}>
        {/* Header — back link inline with title block */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <Link href="/admin/emails">
            <Button variant="ghost" size="sm">
              <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
              <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
            </Button>
          </Link>
          <div className="min-w-0">
          <h1 suppressHydrationWarning style={{
            fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))'
          }}>
            {t('emails.queue.title', 'Email Queue')}
          </h1>
          <p suppressHydrationWarning style={{
            marginTop: '0.5rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            {t('emails.queue.description', 'View and manage pending and sent emails')}
          </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    placeholder={t('emails.queue.search', 'Search by email or subject...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={isRtl ? 'pr-9' : 'pl-9'}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EmailStatus | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('emails.filter.all_statuses', 'All Statuses')}</SelectItem>
                    <SelectItem value="pending">{t('emails.status.pending', 'Pending')}</SelectItem>
                    <SelectItem value="processing">{t('emails.status.processing', 'Processing')}</SelectItem>
                    <SelectItem value="sent">{t('emails.status.sent', 'Sent')}</SelectItem>
                    <SelectItem value="failed">{t('emails.status.failed', 'Failed')}</SelectItem>
                    <SelectItem value="cancelled">{t('emails.status.cancelled', 'Cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div>
                <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as EmailPriority | 'all')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('emails.filter.all_priorities', 'All Priorities')}</SelectItem>
                    <SelectItem value="urgent">{t('emails.priority.urgent', 'Urgent')}</SelectItem>
                    <SelectItem value="high">{t('emails.priority.high', 'High')}</SelectItem>
                    <SelectItem value="normal">{t('emails.priority.normal', 'Normal')}</SelectItem>
                    <SelectItem value="low">{t('emails.priority.low', 'Low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchEmails()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} ${loading ? 'animate-spin' : ''}`} />
                {t('common.refresh', 'Refresh')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Queue Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('emails.queue.emails', 'Emails')} ({totalCount})
            </CardTitle>
            <CardDescription suppressHydrationWarning>
              {`${t('emails.queue.showing_prefix', 'Showing')} ${emails.length} ${t('common.of', 'of')} ${totalCount} ${t('emails.queue.emails', 'emails').toLowerCase()}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {t('emails.queue.no_emails', 'No emails found')}
                </p>
              </div>
            ) : (
              <>
                {/* Bulk action bar — visible whenever any rows are
                    selected. The select-all checkbox only toggles
                    pending rows on the current page; non-pending rows
                    can't be cancelled so they're never selectable. */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center justify-between gap-3 mb-3 p-3 rounded-md border bg-muted/40">
                    <span className="text-sm font-medium">
                      {t('emails.queue.selectedCount', '{{count}} selected')
                        .replace('{{count}}', String(selectedIds.size))}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedIds(new Set())}
                      >
                        {t('common.clear', 'Clear')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBulkConfirmOpen(true)}
                      >
                        <Ban className="h-4 w-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {t('emails.queue.bulkCancel', 'Cancel selected')}
                      </Button>
                    </div>
                  </div>
                )}

                <ResponsiveTable>
                  <ResponsiveTable.Desktop>
                    <div className="overflow-x-auto" dir={direction}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-10">
                              {pendingIdsOnPage.length > 0 && (
                                <Checkbox
                                  checked={allPendingSelected}
                                  onCheckedChange={(v) => toggleAllPending(!!v)}
                                  aria-label={t('emails.queue.selectAllPending', 'Select all pending')}
                                />
                              )}
                            </TableHead>
                            <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('emails.queue.recipient', 'Recipient')}</TableHead>
                            <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('emails.queue.subject', 'Subject')}</TableHead>
                            <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('emails.queue.status', 'Status')}</TableHead>
                            <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('emails.queue.priority', 'Priority')}</TableHead>
                            <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('emails.queue.created', 'Created')}</TableHead>
                            <TableHead className={isRtl ? 'text-right' : 'text-left'}>{t('emails.queue.sent', 'Sent')}</TableHead>
                            <TableHead className={isRtl ? 'text-left' : 'text-right'}>{t('common.actions', 'Actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emails.map((email) => (
                            <TableRow key={email.id}>
                              <TableCell className="w-10">
                                {email.status === 'pending' && (
                                  <Checkbox
                                    checked={selectedIds.has(email.id)}
                                    onCheckedChange={(v) => toggleRow(email.id, !!v)}
                                    aria-label={t('emails.queue.selectRow', 'Select')}
                                  />
                                )}
                              </TableCell>
                              <TableCell className={isRtl ? 'text-right' : 'text-left'}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{email.to_name || email.to_email}</span>
                                  {email.to_name && (
                                    <span className="text-xs text-muted-foreground">{email.to_email}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className={`max-w-xs truncate ${isRtl ? 'text-right' : 'text-left'}`}>{email.subject}</TableCell>
                              <TableCell className={isRtl ? 'text-right' : 'text-left'}>{getStatusBadge(email.status)}</TableCell>
                              <TableCell className={isRtl ? 'text-right' : 'text-left'}>{getPriorityBadge(email.priority)}</TableCell>
                              <TableCell className={`text-sm text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                                {formatDistanceToNow(new Date(email.created_at), { addSuffix: true, locale: isRtl ? he : undefined })}
                              </TableCell>
                              <TableCell className={`text-sm text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                                {email.sent_at ? formatDistanceToNow(new Date(email.sent_at), { addSuffix: true, locale: isRtl ? he : undefined }) : '-'}
                              </TableCell>
                              <TableCell className={isRtl ? 'text-left' : 'text-right'}>
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedEmail(email)}
                                    title={t('emails.queue.preview', 'Preview')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {email.status === 'pending' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCancelling(email)}
                                      title={t('emails.queue.cancelEmail', 'Cancel send')}
                                    >
                                      <Ban className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ResponsiveTable.Desktop>

                  {/* Mobile: card per email queue item. Same handlers + badges. */}
                  <ResponsiveTable.Mobile className="space-y-2" dir={direction}>
                    {emails.map((email) => (
                      <div key={email.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          {email.status === 'pending' && (
                            <Checkbox
                              className="mt-1 shrink-0"
                              checked={selectedIds.has(email.id)}
                              onCheckedChange={(v) => toggleRow(email.id, !!v)}
                              aria-label={t('emails.queue.selectRow', 'Select')}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{email.to_name || email.to_email}</p>
                            {email.to_name && (
                              <p className="text-xs text-muted-foreground truncate">{email.to_email}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmail(email)}
                              title={t('emails.queue.preview', 'Preview')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {email.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCancelling(email)}
                                title={t('emails.queue.cancelEmail', 'Cancel send')}
                              >
                                <Ban className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm truncate">{email.subject}</p>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(email.status)}
                          {getPriorityBadge(email.priority)}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5 pt-1 border-t">
                          <div>
                            <span className="font-medium">{t('emails.queue.created', 'Created')}:</span>{' '}
                            {formatDistanceToNow(new Date(email.created_at), { addSuffix: true, locale: isRtl ? he : undefined })}
                          </div>
                          {email.sent_at && (
                            <div>
                              <span className="font-medium">{t('emails.queue.sent', 'Sent')}:</span>{' '}
                              {formatDistanceToNow(new Date(email.sent_at), { addSuffix: true, locale: isRtl ? he : undefined })}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </ResponsiveTable.Mobile>
                </ResponsiveTable>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      {t('common.page', 'Page')} {page} {t('common.of', 'of')} {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        {t('common.previous', 'Previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        {t('common.next', 'Next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Email Detail Modal/Panel */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEmail(null)}>
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle dir="auto">
                      {renderedPreview?.subject || selectedEmail.subject}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      <div className="space-y-1">
                        <div><strong>{t('emails.queue.to', 'To')}:</strong> {selectedEmail.to_email}</div>
                        {selectedEmail.to_name && <div><strong>{t('emails.queue.name', 'Name')}:</strong> {selectedEmail.to_name}</div>}
                        <div><strong>{t('emails.queue.created', 'Created')}:</strong> {new Date(selectedEmail.created_at).toLocaleString()}</div>
                        {selectedEmail.sent_at && <div><strong>{t('emails.queue.sent', 'Sent')}:</strong> {new Date(selectedEmail.sent_at).toLocaleString()}</div>}
                        {selectedEmail.failed_at && <div><strong>{t('emails.queue.failed', 'Failed')}:</strong> {new Date(selectedEmail.failed_at).toLocaleString()}</div>}
                      </div>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    {getStatusBadge(selectedEmail.status)}
                    {getPriorityBadge(selectedEmail.priority)}
                  </div>

                  {selectedEmail.error_message && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-destructive">{t('emails.queue.error', 'Error')}</p>
                          <p className="text-sm text-muted-foreground mt-1" dir="auto">{translateErrorMessage(selectedEmail.error_message)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">{t('emails.queue.language', 'Language')}:</span>{' '}
                      <span className="font-medium">
                        {selectedEmail.language_code
                          ? t(
                              `emails.schedules.language.${selectedEmail.language_code}`,
                              selectedEmail.language_code === 'he' ? 'Hebrew' : 'English',
                            )
                          : '—'}
                      </span>
                    </div>
                    {selectedEmail.trigger_type && (
                      <div>
                        <span className="text-muted-foreground">{t('emails.queue.trigger', 'Trigger')}:</span>{' '}
                        <span className="font-medium">
                          {t(`emails.queue.triggerType.${selectedEmail.trigger_type}`, selectedEmail.trigger_type)}
                        </span>
                      </div>
                    )}
                  </div>

                  {renderedPreview?.error && (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs">
                      <p className="font-medium text-destructive">
                        {t('emails.queue.previewError', 'Preview render failed')}
                      </p>
                      <p className="text-muted-foreground mt-1 font-mono break-all">{renderedPreview.error}</p>
                    </div>
                  )}

                  {renderedPreview?.variables && Object.keys(renderedPreview.variables).length > 0 && (
                    <details className="rounded-md border bg-muted/30 text-xs">
                      <summary className="cursor-pointer px-3 py-2 font-medium">
                        {t('emails.queue.variablesAvailable', 'Variables used to render')} ({Object.keys(renderedPreview.variables).length})
                      </summary>
                      <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 px-3 pb-3">
                        {Object.entries(renderedPreview.variables).map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt className="font-mono text-muted-foreground">{k}</dt>
                            <dd className="break-words" dir="auto">
                              {v === null || v === undefined || v === '' ? '—' : String(v)}
                            </dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </details>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">{t('emails.queue.html_preview', 'Email Preview')}</h4>
                    {previewLoading ? (
                      <div className="border rounded-lg p-8 bg-muted/20 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : renderedPreview?.bodyHtml && renderedPreview.bodyHtml.trim() !== '' ? (
                      // Rendered preview: subject + body with all
                      // {{placeholders}} filled in via the same
                      // Handlebars engine the send pipeline uses.
                      <div className="space-y-2">
                        {renderedPreview.subject && (
                          <div className="text-sm border rounded-md px-3 py-2 bg-muted/30" dir="auto">
                            <span className="text-muted-foreground">{t('emails.queue.subject', 'Subject')}:</span>{' '}
                            <span className="font-medium">{renderedPreview.subject}</span>
                          </div>
                        )}
                        <div className="border rounded-lg bg-background max-h-[480px] overflow-y-auto">
                          <iframe
                            srcDoc={renderedPreview.bodyHtml}
                            className="w-full min-h-[400px] border-0"
                            title="Email Preview"
                            sandbox="allow-same-origin"
                          />
                        </div>
                      </div>
                    ) : renderedPreview?.bodyText && renderedPreview.bodyText.trim() !== '' ? (
                      <pre className="border rounded-lg p-4 bg-muted/30 max-h-[480px] overflow-auto text-sm whitespace-pre-wrap" dir="auto">
                        {renderedPreview.bodyText}
                      </pre>
                    ) : selectedEmail.body_html && selectedEmail.body_html.trim() !== '' ? (
                      // Renderer returned nothing — fall back to the
                      // raw stored body (placeholders intact). Better
                      // than a blank screen if the render failed.
                      <div className="border rounded-lg bg-background max-h-[480px] overflow-y-auto">
                        <iframe
                          srcDoc={selectedEmail.body_html}
                          className="w-full min-h-[400px] border-0"
                          title="Email Preview"
                          sandbox="allow-same-origin"
                        />
                      </div>
                    ) : selectedEmail.body_text && selectedEmail.body_text.trim() !== '' ? (
                      <pre className="border rounded-lg p-4 bg-muted/30 max-h-[480px] overflow-auto text-sm whitespace-pre-wrap" dir="auto">
                        {selectedEmail.body_text}
                      </pre>
                    ) : (
                      // Body wasn't rendered at queue time — show the
                      // raw template_variables so the admin can see
                      // what would have been passed to the template.
                      <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {t(
                            'emails.queue.noBody',
                            'No rendered body was stored for this email. Variables below were captured at enqueue time.',
                          )}
                        </p>
                        {selectedEmail.template_variables &&
                        Object.keys(selectedEmail.template_variables as Record<string, any>).length > 0 ? (
                          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                            {Object.entries(selectedEmail.template_variables as Record<string, any>).map(([k, v]) => (
                              <React.Fragment key={k}>
                                <dt className="font-mono text-muted-foreground">{k}</dt>
                                <dd className="break-words" dir="auto">
                                  {v === null || v === undefined || v === '' ? '—' : String(v)}
                                </dd>
                              </React.Fragment>
                            ))}
                          </dl>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            {t('emails.queue.noVariables', 'No template variables captured.')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('emails.queue.bulkCancel', 'Cancel selected')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'emails.queue.bulkCancelConfirm',
                  'Cancel {{count}} pending emails? They will not be sent. This cannot be undone.',
                ).replace('{{count}}', String(selectedIds.size))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkCancel} disabled={bulkLoading} className="bg-destructive hover:bg-destructive/90">
                {bulkLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('emails.queue.bulkCancel', 'Cancel selected')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!cancelling} onOpenChange={(open) => !open && setCancelling(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('emails.queue.cancelEmail', 'Cancel send')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  'emails.queue.cancelConfirm',
                  'This email is still pending. Cancelling marks it as cancelled so it will not be sent. This cannot be undone.',
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancelEmail} disabled={cancelLoading} className="bg-destructive hover:bg-destructive/90">
                {cancelLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('emails.queue.cancelEmail', 'Cancel send')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
