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
import { toast } from 'sonner';
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
  const { t } = useAdminLanguage();
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ScheduleFilters>({});
  const [selectedSchedules, setSelectedSchedules] = useState<Set<string>>(new Set());
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PaymentSchedule | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState<'delay' | 'pause' | 'cancel' | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, [filters]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to load payment schedules');
    } finally {
      setLoading(false);
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
      toast.success('Payment date adjusted successfully');
      setAdjustDialogOpen(false);
      fetchSchedules();
    } catch (error: any) {
      console.error('Error adjusting date:', error);
      toast.error(error.message || 'Failed to adjust payment date');
    }
  };

  const handleRetryPayment = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/retry`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to retry payment');
      toast.success('Payment retry initiated');
      fetchSchedules();
    } catch (error: any) {
      console.error('Error retrying payment:', error);
      toast.error(error.message || 'Failed to retry payment');
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
      toast.success('Payment paused successfully');
      fetchSchedules();
    } catch (error: any) {
      console.error('Error pausing payment:', error);
      toast.error(error.message || 'Failed to pause payment');
    }
  };

  const handleResumePayment = async (scheduleId: string) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/resume`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to resume payment');
      toast.success('Payment resumed successfully');
      fetchSchedules();
    } catch (error: any) {
      console.error('Error resuming payment:', error);
      toast.error(error.message || 'Failed to resume payment');
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
      toast.success(`${scheduleIds.length} payments delayed successfully`);
      setBulkActionDialog(null);
      setSelectedSchedules(new Set());
      fetchSchedules();
    } catch (error: any) {
      console.error('Error delaying payments:', error);
      toast.error(error.message || 'Failed to delay payments');
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('common.back', 'Back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{t('admin.payments.schedules.title', 'Payment Schedules')}</h1>
              <p className="text-muted-foreground mt-1">
                {t('admin.payments.schedules.description', 'Manage all payment schedules across all enrollments')}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => fetchSchedules()}>
            <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('common.refresh', 'Refresh')}
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('common.filters', 'Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>{t('common.status', 'Status')}</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.allStatuses', 'All Statuses')}</SelectItem>
                    <SelectItem value="pending">{t('common.pending', 'Pending')}</SelectItem>
                    <SelectItem value="paid">{t('common.paid', 'Paid')}</SelectItem>
                    <SelectItem value="overdue">{t('common.overdue', 'Overdue')}</SelectItem>
                    <SelectItem value="failed">{t('common.failed', 'Failed')}</SelectItem>
                    <SelectItem value="paused">{t('common.paused', 'Paused')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('common.dateFrom', 'Date From')}</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label>{t('common.dateTo', 'Date To')}</Label>
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
                  {t('common.clearFilters', 'Clear Filters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedSchedules.size > 0 && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>{t('admin.payments.schedules.schedulesSelected', '{count} schedule(s) selected').replace('{count}', selectedSchedules.size.toString())}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setBulkActionDialog('delay')}>
                  {t('admin.payments.schedules.delayPayments', 'Delay Payments')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBulkActionDialog('pause')}>
                  {t('admin.payments.schedules.pausePayments', 'Pause Payments')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setBulkActionDialog('cancel')}>
                  {t('admin.payments.schedules.cancelPayments', 'Cancel Payments')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedSchedules(new Set())}>
                  {t('common.clear', 'Clear')}
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
                    <th className="p-4 font-medium">{t('common.user', 'User')}</th>
                    <th className="p-4 font-medium">{t('common.product', 'Product')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.schedules.paymentNumber', 'Payment #')}</th>
                    <th className="p-4 font-medium">{t('common.amount', 'Amount')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.schedules.scheduledDate', 'Scheduled Date')}</th>
                    <th className="p-4 font-medium">{t('common.status', 'Status')}</th>
                    <th className="p-4 font-medium">{t('common.actions', 'Actions')}</th>
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
                            <div className="text-xs text-muted-foreground">
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

            {schedules.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.payments.schedules.noSchedulesFound', 'No Schedules Found')}</h3>
                <p className="text-muted-foreground">
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
        />

        {/* Bulk Delay Dialog */}
        <BulkDelayDialog
          open={bulkActionDialog === 'delay'}
          count={selectedSchedules.size}
          onClose={() => setBulkActionDialog(null)}
          onDelay={handleBulkDelay}
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
                {t('admin.payments.schedules.adjustDate', 'Adjust Date')}
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
                {t('admin.payments.schedules.retryPayment', 'Retry Payment')}
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
                {t('admin.payments.schedules.pausePayment', 'Pause Payment')}
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
                {t('admin.payments.schedules.resumePayment', 'Resume Payment')}
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
}: {
  open: boolean;
  schedule: PaymentSchedule | null;
  onClose: () => void;
  onAdjust: (scheduleId: string, newDate: string, reason: string) => void;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.payments.schedules.adjustPaymentDate', 'Adjust Payment Date')}</DialogTitle>
          <DialogDescription>
            {t('admin.payments.schedules.changeScheduledDate', "Change the scheduled date for {name}'s payment #{number}")
              .replace('{name}', schedule.user_name)
              .replace('{number}', schedule.payment_number.toString())}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('admin.payments.schedules.newDate', 'New Date')}</Label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>{t('common.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.payments.schedules.reasonPlaceholder', 'e.g., User requested extension')}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit">{t('admin.payments.schedules.adjustDate', 'Adjust Date')}</Button>
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
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onDelay: (days: number, reason: string) => void;
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin.payments.schedules.delayPayments', 'Delay Payments')}</DialogTitle>
          <DialogDescription>
            {t('admin.payments.schedules.delaySelectedPayments', 'Delay {count} selected payment(s) by a specified number of days')
              .replace('{count}', count.toString())}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('admin.payments.schedules.daysToDelay', 'Days to Delay')}</Label>
            <Input
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label>{t('common.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.payments.schedules.delayReasonPlaceholder', 'e.g., Program start date delayed')}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit">{t('admin.payments.schedules.delayPayments', 'Delay Payments')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
