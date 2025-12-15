'use client';

export const dynamic = 'force-dynamic';

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
import React, { useState, useEffect, useRef } from 'react';
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
  status: 'pending' | 'paid' | 'overdue' | 'paused' | 'failed' | 'cancelled' | 'adjusted';
  retry_count?: number;
  next_retry_date?: string;
  last_error?: string;
}

interface ScheduleFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  userSearch?: string;
  minAmount?: string;
  maxAmount?: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const totalPages = Math.ceil(totalSchedules / itemsPerPage);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    fetchSchedules();
  }, [filters, currentPage, itemsPerPage]);

  // Fetch products for the dropdown filter
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products', {
          credentials: 'include',
          cache: 'no-store',
        });

        console.log('Products API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch products:', response.status, errorData);
          return;
        }

        const responseData = await response.json();
        console.log('Products API response:', responseData);

        // The API returns products in the 'data' field, not 'products'
        if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
          const mappedProducts = responseData.data.map((p: any) => ({ id: p.id, title: p.title }));
          console.log('Successfully loaded', mappedProducts.length, 'products');
          setProducts(mappedProducts);
        } else {
          console.error('Products API check failed:', responseData);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchProducts();
  }, []);

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
      if (filters.userSearch) params.append('userSearch', filters.userSearch);
      if (filters.minAmount) params.append('minAmount', filters.minAmount);
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);
      if (filters.overdueOnly) params.append('overdueOnly', 'true');
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());
      // Add cache-busting timestamp
      params.append('_t', Date.now().toString());

      const response = await fetch(`/api/admin/payments/schedules?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();


      setSchedules(data.schedules || []);
      setTotalSchedules(data.total || data.schedules?.length || 0);
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

      await response.json();

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.schedules.adjustSuccess', 'Payment date adjusted successfully'),
      });
      setAdjustDialogOpen(false);

      // Refresh schedules to show updated date
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
      case 'adjusted':
        return <Calendar className="h-4 w-4 text-blue-500" />;
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
      adjusted: 'secondary',
      overdue: 'destructive',
      failed: 'destructive',
      paused: 'outline',
      cancelled: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'} suppressHydrationWarning>
        {t(`common.${status}`, status)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    // Use UTC to avoid timezone conversion issues
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC', // Important: prevents timezone conversion
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
            <div className="space-y-4" dir={direction}>
              {/* Row 1: User, Product, Status */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* User Search Filter */}
                <div>
                  <Label suppressHydrationWarning>{t('admin.payments.schedules.searchUser', 'Search User')}</Label>
                  <Input
                    type="text"
                    placeholder={t('admin.payments.schedules.searchUserPlaceholder', 'Name or email...')}
                    value={filters.userSearch || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, userSearch: e.target.value });
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Product Filter */}
                <div>
                  <Label suppressHydrationWarning>
                    {t('admin.payments.schedules.product', 'Product')}
                    {products.length > 0 && <span className="text-xs text-muted-foreground" style={{ marginLeft: isRtl ? '0' : '0.5rem', marginRight: isRtl ? '0.5rem' : '0' }}>({products.length})</span>}
                  </Label>
                  <Select
                    value={filters.productId || 'all'}
                    onValueChange={(value) => {
                      setFilters({ ...filters, productId: value === 'all' ? undefined : value });
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.allProducts', 'All Products')} />
                    </SelectTrigger>
                    <SelectContent dir={direction}>
                      <SelectItem value="all" suppressHydrationWarning>{t('common.allProducts', 'All Products')}</SelectItem>
                      {products.length === 0 ? (
                        <SelectItem value="loading" disabled>
                          {t('common.loading', 'Loading...')}
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <Label suppressHydrationWarning>{t('common.status', 'Status')}</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => {
                      setFilters({ ...filters, status: value === 'all' ? undefined : value });
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir={direction}>
                      <SelectItem value="all" suppressHydrationWarning>{t('common.allStatuses', 'All Statuses')}</SelectItem>
                      <SelectItem value="pending" suppressHydrationWarning>{t('common.pending', 'Pending')}</SelectItem>
                      <SelectItem value="adjusted" suppressHydrationWarning>{t('common.adjusted', 'Adjusted')}</SelectItem>
                      <SelectItem value="paid" suppressHydrationWarning>{t('common.paid', 'Paid')}</SelectItem>
                      <SelectItem value="overdue" suppressHydrationWarning>{t('common.overdue', 'Overdue')}</SelectItem>
                      <SelectItem value="failed" suppressHydrationWarning>{t('common.failed', 'Failed')}</SelectItem>
                      <SelectItem value="paused" suppressHydrationWarning>{t('common.paused', 'Paused')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 2: Min Amount */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label suppressHydrationWarning>{t('admin.payments.schedules.minAmount', 'Min Amount')}</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={filters.minAmount || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, minAmount: e.target.value });
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Date From Filter */}
                <div>
                  <Label suppressHydrationWarning>{t('common.dateFrom', 'Date From')}</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, dateFrom: e.target.value });
                      setCurrentPage(1);
                    }}
                  />
                </div>

                {/* Date To Filter */}
                <div>
                  <Label suppressHydrationWarning>{t('common.dateTo', 'Date To')}</Label>
                  <Input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, dateTo: e.target.value });
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Max Amount and Clear Button */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label suppressHydrationWarning>{t('admin.payments.schedules.maxAmount', 'Max Amount')}</Label>
                  <Input
                    type="number"
                    placeholder="999999"
                    min="0"
                    step="0.01"
                    value={filters.maxAmount || ''}
                    onChange={(e) => {
                      setFilters({ ...filters, maxAmount: e.target.value });
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters({});
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  >
                    <X className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    <span suppressHydrationWarning>{t('common.clearFilters', 'Clear Filters')}</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedSchedules.size > 0 && (() => {
          // Check if any selected schedules are paid or cancelled
          const hasNonEditableSchedules = Array.from(selectedSchedules).some(id => {
            const schedule = schedules.find(s => s.id === id);
            return schedule?.status === 'paid' || schedule?.status === 'cancelled';
          });

          return (
            <Alert>
              <AlertDescription className="flex items-center justify-between flex-wrap gap-2" dir={direction}>
                <span suppressHydrationWarning>{t('admin.payments.schedules.schedulesSelected', '{count} schedule(s) selected').replace('{count}', selectedSchedules.size.toString())}</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog('delay')}
                    disabled={hasNonEditableSchedules}
                  >
                    <span suppressHydrationWarning>{t('admin.payments.schedules.delayPayments', 'Delay Payments')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog('pause')}
                    disabled={hasNonEditableSchedules}
                  >
                    <span suppressHydrationWarning>{t('admin.payments.schedules.pausePayments', 'Pause Payments')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog('cancel')}
                    disabled={hasNonEditableSchedules}
                  >
                    <span suppressHydrationWarning>{t('admin.payments.schedules.cancelPayments', 'Cancel Payments')}</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedSchedules(new Set())}>
                    <span suppressHydrationWarning>{t('common.clear', 'Clear')}</span>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          );
        })()}

        {/* Schedules Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto overflow-y-visible" dir={direction}>
              <table className="w-full">
                <thead style={{
                  borderBottom: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--muted) / 0.3)'
                }}>
                  <tr className={isRtl ? 'text-right' : 'text-left'}>
                    <th className="p-4">
                      <Checkbox
                        checked={selectedSchedules.size === schedules.length && schedules.length > 0}
                        onCheckedChange={toggleAllSchedules}
                      />
                    </th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('common.user', 'User')}</th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('common.product', 'Product')}</th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('admin.payments.schedules.paymentNumber', 'Payment #')}</th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('common.amount', 'Amount')}</th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('admin.payments.schedules.scheduledDate', 'Scheduled Date')}</th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('common.status', 'Status')}</th>
                    <th className="p-4" style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-heading))'
                    }} suppressHydrationWarning>{t('common.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="border-b transition-colors hover:bg-muted/50"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      <td className="p-4">
                        <Checkbox
                          checked={selectedSchedules.has(schedule.id)}
                          onCheckedChange={() => toggleScheduleSelection(schedule.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div>
                          <div style={{
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'hsl(var(--text-primary))'
                          }}>{schedule.user_name}</div>
                          <div style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'hsl(var(--text-muted))'
                          }}>{schedule.user_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div style={{
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'hsl(var(--text-primary))'
                        }}>{schedule.product_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span style={{ color: 'hsl(var(--text-primary))' }}>#{schedule.payment_number}</span>
                          <Badge variant="outline" suppressHydrationWarning>
                            {t(`admin.payments.schedules.paymentType.${schedule.payment_type}`, schedule.payment_type)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <span style={{
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'hsl(var(--text-primary))'
                        }}>
                          {formatCurrency(schedule.amount, schedule.currency)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <div style={{ color: 'hsl(var(--text-primary))' }}>
                            {formatDate(schedule.scheduled_date)}
                          </div>
                          {/* Show original date if it differs from scheduled date (comparing UTC date strings) */}
                          {schedule.scheduled_date !== schedule.original_due_date && (
                            <div style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'hsl(var(--text-muted))'
                            }} suppressHydrationWarning>
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

        {/* Pagination */}
        {schedules.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4" dir={direction}>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.schedules.page', 'Page')} {currentPage} {t('admin.payments.schedules.of', 'of')} {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="page-size" className="text-sm text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
                  {t('admin.payments.schedules.itemsPerPage', 'Items per page')}:
                </Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Reset to first page when changing page size
                  }}
                >
                  <SelectTrigger id="page-size" className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction}>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1 || loadingSchedules}
              >
                <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                <span suppressHydrationWarning>{t('common.previous', 'Previous')}</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages || loadingSchedules}
              >
                <span suppressHydrationWarning>{t('common.next', 'Next')}</span>
                <ArrowLeft className={`h-4 w-4 ltr:ml-2 rtl:mr-2 ${isRtl ? '' : 'rotate-180'}`} />
              </Button>
            </div>
          </div>
        )}

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
  const { t, direction } = useAdminLanguage();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isRtl = direction === 'rtl';

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192; // 192px = w-48
      const menuHeight = 200; // Approximate menu height
      const viewportHeight = window.innerHeight;

      // Check if menu would go off bottom of screen
      const spaceBelow = viewportHeight - rect.bottom;
      const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;

      setMenuPosition({
        top: openUpward ? rect.top - menuHeight - 8 : rect.bottom + 8,
        left: rect.right - menuWidth,
        right: rect.right,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        onClick={handleToggle}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {open && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown menu - fixed position relative to viewport */}
          <div
            className="fixed w-48 bg-white dark:bg-gray-800 border rounded-md shadow-lg z-50"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
            }}
          >
            <div className="py-1">
            {schedule.status === 'pending' && (
              <>
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
              </>
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
            {(schedule.status === 'paid' || schedule.status === 'cancelled') && (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center" suppressHydrationWarning>
                {t('admin.payments.schedules.noActionsAvailable', 'Paid payment cannot be changed')}
              </div>
            )}
          </div>
        </div>
        </>
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
