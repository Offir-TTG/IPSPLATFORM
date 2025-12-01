'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Calendar,
  Filter,
  MoreVertical,
  Play,
  Pause,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  User,
  Package,
  ArrowUpDown,
  Download,
  ArrowLeft,
} from 'lucide-react';

interface PaymentSchedule {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  enrollment_id: string;
  product_id: string;
  product_name: string;
  payment_number: number;
  payment_type: string;
  amount: number;
  currency: string;
  original_due_date: string;
  scheduled_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'paused' | 'failed' | 'cancelled';
  retry_count?: number;
  next_retry_date?: string;
  last_error?: string;
}

interface ScheduleFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  userId?: string;
  overdueOnly?: boolean;
}

export default function SchedulesPage() {
  const { t, direction, language, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [filters, setFilters] = useState<ScheduleFilters>({});
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState<'delay' | 'pause' | 'cancel' | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, [filters]);

  // Window resize listener for mobile responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoadingSchedules(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.productId) params.append('productId', filters.productId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.overdueOnly) params.append('overdueOnly', 'true');

      const response = await fetch(`/api/admin/payments/schedules?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.schedules.loadError', 'Failed to load payment schedules'),
        variant: 'destructive',
      });
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleAdjustDate = async (scheduleId: string, newDate: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_date: newDate, reason }),
      });

      if (!response.ok) throw new Error('Failed to adjust date');
      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.schedules.adjustSuccess', 'Payment date adjusted successfully'),
      });
      setAdjustDialogOpen(false);
      fetchSchedules();
    } catch (error: any) {
      console.error('Error adjusting date:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.schedules.adjustError', 'Failed to adjust payment date'),
        variant: 'destructive',
      });
    }
  };

  const handleRetryPayment = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to retry payment');
      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.schedules.retrySuccess', 'Payment retry initiated'),
      });
      fetchSchedules();
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.schedules.retryError', 'Failed to retry payment'),
        variant: 'destructive',
      });
    }
  };

  const handlePausePayment = async (scheduleId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to pause payment');
      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.schedules.pauseSuccess', 'Payment paused successfully'),
      });
      fetchSchedules();
    } catch (error: any) {
      console.error('Error pausing payment:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.schedules.pauseError', 'Failed to pause payment'),
        variant: 'destructive',
      });
    }
  };

  const handleResumePayment = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/resume`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resume payment');
      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.schedules.resumeSuccess', 'Payment resumed successfully'),
      });
      fetchSchedules();
    } catch (error: any) {
      console.error('Error resuming payment:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.schedules.resumeError', 'Failed to resume payment'),
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelay = async (days: number, reason: string) => {
    try {
      const scheduleIds = Array.from(selectedSchedules);
      const response = await fetch('/api/admin/payments/schedules/bulk-delay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_ids: scheduleIds, days, reason }),
      });

      if (!response.ok) throw new Error('Failed to delay payments');
      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.schedules.bulkDelaySuccess', '{count} payments delayed successfully').replace('{count}', scheduleIds.length.toString()),
      });
      setBulkActionDialog(null);
      setSelectedSchedules(new Set());
      fetchSchedules();
    } catch (error: any) {
      console.error('Error delaying payments:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.schedules.bulkDelayError', 'Failed to delay payments'),
        variant: 'destructive',
      });
    }
  };

  const toggleScheduleSelection = (scheduleId: string) => {
    const newSelection = new Set(selectedSchedules);
    if (newSelection.has(scheduleId)) {
      newSelection.delete(scheduleId);
    } else {
      newSelection.add(scheduleId);
    }
    setSelectedSchedules(newSelection);
  };

  const toggleAllSchedules = () => {
    if (selectedSchedules.size === schedules.length) {
      setSelectedSchedules(new Set());
    } else {
      setSelectedSchedules(new Set(schedules.map(s => s.id)));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      failed: 'destructive',
      paused: 'outline',
      cancelled: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        style: 'currency',
        currency: currency || 'USD',
      }
    ).format(amount);
  };

  // Show loading state while translations are loading
  if (translationsLoading) {
    return (
      <AdminLayout>
        <div className="max-w-6xl p-6 space-y-6" dir={direction}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
              </Button>
            </Link>
            <div>
              <h1 suppressHydrationWarning style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{t('admin.payments.schedules.title', 'Payment Schedules')}</h1>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.schedules.description', 'Manage all payment schedules across all enrollments')}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => fetchSchedules()}>
            <RefreshCw className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span suppressHydrationWarning>{t('common.refresh', 'Refresh')}</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span suppressHydrationWarning>{t('common.filters', 'Filters')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label suppressHydrationWarning>{t('common.status', 'Status')}</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction}>
                    <SelectItem value="all" suppressHydrationWarning>{t('common.allStatuses', 'All Statuses')}</SelectItem>
                    <SelectItem value="pending" suppressHydrationWarning>{t('common.pending', 'Pending')}</SelectItem>
                    <SelectItem value="paid" suppressHydrationWarning>{t('common.paid', 'Paid')}</SelectItem>
                    <SelectItem value="overdue" suppressHydrationWarning>{t('common.overdue', 'Overdue')}</SelectItem>
                    <SelectItem value="failed" suppressHydrationWarning>{t('common.failed', 'Failed')}</SelectItem>
                    <SelectItem value="paused" suppressHydrationWarning>{t('common.paused', 'Paused')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label suppressHydrationWarning>{t('common.dateFrom', 'Date From')}</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label suppressHydrationWarning>{t('common.dateTo', 'Date To')}</Label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  <span suppressHydrationWarning>{t('common.clearFilters', 'Clear Filters')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedSchedules.size > 0 && (
          <Alert>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span suppressHydrationWarning>{t('admin.payments.schedules.schedulesSelected', '{count} schedule(s) selected').replace('{count}', selectedSchedules.size.toString())}</span>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setBulkActionDialog('delay')}>
                  <span suppressHydrationWarning>{t('admin.payments.schedules.delayPayments', 'Delay Payments')}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBulkActionDialog('pause')}>
                  <span suppressHydrationWarning>{t('admin.payments.schedules.pausePayments', 'Pause Payments')}</span>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBulkActionDialog('cancel')}>
                  <span suppressHydrationWarning>{t('admin.payments.schedules.cancelPayments', 'Cancel Payments')}</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedSchedules(new Set())}>
                  <span suppressHydrationWarning>{t('common.clear', 'Clear')}</span>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Schedules Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4">
                      <Checkbox
                        checked={selectedSchedules.size === schedules.length && schedules.length > 0}
                        onCheckedChange={toggleAllSchedules}
                      />
                    </th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('common.user', 'User')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('common.product', 'Product')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.schedules.paymentNumber', 'Payment #')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('common.amount', 'Amount')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.schedules.scheduledDate', 'Scheduled Date')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('common.status', 'Status')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedSchedules.has(schedule.id)}
                          onCheckedChange={() => toggleScheduleSelection(schedule.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{schedule.user_name}</div>
                          <div className="text-sm text-muted-foreground">{schedule.user_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{schedule.product_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          #{schedule.payment_number}
                          <Badge variant="outline" className="capitalize">
                            {schedule.payment_type}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4 font-medium">
                        {formatCurrency(schedule.amount, schedule.currency)}
                      </td>
                      <td className="p-4">
                        <div>
                          <div>{formatDate(schedule.scheduled_date)}</div>
                          {schedule.scheduled_date !== schedule.original_due_date && (
                            <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                              {t('admin.payments.schedules.original', 'Original')}: {formatDate(schedule.original_due_date)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(schedule.status)}
                          {getStatusBadge(schedule.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <ScheduleActionsMenu
                          schedule={schedule}
                          onAdjust={() => {
                            setSelectedSchedule(schedule);
                            setAdjustDialogOpen(true);
                          }}
                          onRetry={() => handleRetryPayment(schedule.id)}
                          onPause={() => handlePausePayment(schedule.id, 'Admin action')}
                          onResume={() => handleResumePayment(schedule.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {schedules.length === 0 && !loadingSchedules && (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>{t('admin.payments.schedules.noSchedulesFound', 'No Schedules Found')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning>
                  {t('admin.payments.schedules.noSchedulesMatch', 'No payment schedules match your current filters')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjust Date Dialog */}
        <AdjustDateDialog
          open={adjustDialogOpen}
          schedule={selectedSchedule}
          onClose={() => setAdjustDialogOpen(false)}
          onAdjust={handleAdjustDate}
          direction={direction}
        />

        {/* Bulk Delay Dialog */}
        <BulkDelayDialog
          open={bulkActionDialog === 'delay'}
          count={selectedSchedules.size}
          onClose={() => setBulkActionDialog(null)}
          onDelay={handleBulkDelay}
          direction={direction}
        />
      </div>
    </AdminLayout>
  );
}

// Schedule Actions Menu Component
function ScheduleActionsMenu({
  schedule,
  onAdjust,
  onRetry,
  onPause,
  onResume,
}: {
  schedule: PaymentSchedule;
  onAdjust: () => void;
  onRetry: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const { t } = useAdminLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-10">
          <div className="py-1">
            {schedule.status === 'pending' && (
              <button
                className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onAdjust();
                  setOpen(false);
                }}
              >
                <Calendar className="h-4 w-4" />
                <span suppressHydrationWarning>{t('admin.payments.schedules.adjustDate', 'Adjust Date')}</span>
              </button>
            )}
            {schedule.status === 'failed' && (
              <button
                className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onRetry();
                  setOpen(false);
                }}
              >
                <RefreshCw className="h-4 w-4" />
                <span suppressHydrationWarning>{t('admin.payments.schedules.retryPayment', 'Retry Payment')}</span>
              </button>
            )}
            {schedule.status === 'pending' && (
              <button
                className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onPause();
                  setOpen(false);
                }}
              >
                <Pause className="h-4 w-4" />
                <span suppressHydrationWarning>{t('admin.payments.schedules.pausePayment', 'Pause Payment')}</span>
              </button>
            )}
            {schedule.status === 'paused' && (
              <button
                className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2"
                onClick={() => {
                  onResume();
                  setOpen(false);
                }}
              >
                <Play className="h-4 w-4" />
                <span suppressHydrationWarning>{t('admin.payments.schedules.resumePayment', 'Resume Payment')}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Adjust Date Dialog Component
function AdjustDateDialog({
  open,
  schedule,
  onClose,
  onAdjust,
  direction,
}: {
  open: boolean;
  schedule: PaymentSchedule | null;
  onClose: () => void;
  onAdjust: (scheduleId: string, newDate: string, reason: string) => void;
  direction: 'ltr' | 'rtl';
}) {
  const { t } = useAdminLanguage();
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (schedule) {
      setNewDate(schedule.scheduled_date.split('T')[0]);
      setReason('');
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (schedule) {
      onAdjust(schedule.id, newDate, reason);
    }
  };

  if (!schedule) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t('admin.payments.schedules.adjustPaymentDate', 'Adjust Payment Date')}</DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('admin.payments.schedules.changeScheduledDate', "Change the scheduled date for {name}'s payment #{number}")
              .replace('{name}', schedule.user_name)
              .replace('{number}', schedule.payment_number.toString())}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label suppressHydrationWarning>{t('admin.payments.schedules.newDate', 'New Date')}</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label suppressHydrationWarning>{t('common.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.payments.schedules.reasonPlaceholder', 'e.g., User requested extension')}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button type="submit">
              <span suppressHydrationWarning>{t('admin.payments.schedules.adjustDate', 'Adjust Date')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Bulk Delay Dialog Component
function BulkDelayDialog({
  open,
  count,
  onClose,
  onDelay,
  direction,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onDelay: (days: number, reason: string) => void;
  direction: 'ltr' | 'rtl';
}) {
  const { t } = useAdminLanguage();
  const [days, setDays] = useState(30);
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDelay(days, reason);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t('admin.payments.schedules.delayPayments', 'Delay Payments')}</DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('admin.payments.schedules.delaySelectedPayments', 'Delay {count} selected payment(s) by a specified number of days')
              .replace('{count}', count.toString())}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label suppressHydrationWarning>{t('admin.payments.schedules.daysToDelay', 'Days to Delay')}</Label>
            <Input
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label suppressHydrationWarning>{t('common.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.payments.schedules.delayReasonPlaceholder', 'e.g., Program start date delayed')}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button type="submit">
              <span suppressHydrationWarning>{t('admin.payments.schedules.delayPayments', 'Delay Payments')}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
