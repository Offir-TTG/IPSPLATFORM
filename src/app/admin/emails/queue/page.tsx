'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Mail, Search, RefreshCw, Loader2, Eye, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
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
  const pageSize = 20;

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
    const statusConfig = {
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
    const priorityConfig = {
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="max-w-7xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div>
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
                <div className="overflow-x-auto" dir={direction}>
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedEmail(email)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

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
                    <CardTitle>{selectedEmail.subject}</CardTitle>
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
                          <p className="text-sm text-muted-foreground mt-1">{selectedEmail.error_message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-2">{t('emails.queue.html_preview', 'Email Preview')}</h4>
                    <div className="border rounded-lg p-4 bg-background max-h-96 overflow-y-auto">
                      <iframe
                        srcDoc={selectedEmail.body_html}
                        className="w-full min-h-[300px]"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
