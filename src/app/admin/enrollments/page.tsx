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
import { CreateEnrollmentDialog } from '@/components/admin/CreateEnrollmentDialog';
import { EditEnrollmentDialog } from '@/components/admin/EditEnrollmentDialog';
import { PaymentPlanDetailsDialog } from '@/components/admin/PaymentPlanDetailsDialog';
import { SendEnrollmentLinkDialog } from '@/components/admin/SendEnrollmentLinkDialog';
import React, { useState, useEffect } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Users,
  Filter,
  Eye,
  X,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Plus,
  UserPlus,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface Enrollment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  product_id: string;
  product_name: string;
  product_type: string;
  payment_plan_id: string;
  payment_plan_key: string;
  payment_plan_data?: any;
  payment_model?: string;
  payment_plan?: any;
  total_amount: number;
  paid_amount: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  status: 'draft' | 'pending' | 'active' | 'suspended' | 'cancelled' | 'completed';
  next_payment_date?: string;
  created_at: string;
}

interface EnrollmentFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
}

export default function EnrollmentsPage() {
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EnrollmentFilters>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);
  const [createEnrollmentDialogOpen, setCreateEnrollmentDialogOpen] = useState(false);
  const [paymentPlanDialogOpen, setPaymentPlanDialogOpen] = useState(false);
  const [sendLinkDialogOpen, setSendLinkDialogOpen] = useState(false);
  const [sendLinkEnrollment, setSendLinkEnrollment] = useState<Enrollment | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [sendingLink, setSendingLink] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [filters]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/enrollments?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch enrollments');
      const data = await response.json();
      setEnrollments(data.enrollments || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error(t('admin.enrollments.loadError', 'Failed to load enrollments'));
    } finally {
      setLoading(false);
    }
  };

  const formatPaymentPlanName = (enrollment: Enrollment): string => {
    const key = enrollment.payment_plan_key;
    const data = enrollment.payment_plan_data || {};

    if (key === 'custom' && data.name) {
      return data.name;
    } else if (key === 'admin.enrollments.paymentPlan.oneTime') {
      return t('admin.enrollments.paymentPlan.oneTime', 'One-Time Payment');
    } else if (key === 'admin.enrollments.paymentPlan.deposit') {
      const count = data.count || 'N';
      const frequency = data.frequency || 'monthly';
      const frequencyKey = `admin.enrollments.paymentPlan.frequency.${frequency}`;
      const frequencyText = t(frequencyKey, frequency);

      // Format deposit info
      let depositInfo = '';
      if (data.deposit_type === 'percentage' && data.deposit_percentage) {
        depositInfo = `${data.deposit_percentage}% ${t('admin.enrollments.paymentPlan.depositLabel', 'deposit')}`;
      } else if (data.deposit_type === 'fixed' && data.deposit_amount) {
        depositInfo = `${enrollment.currency || 'USD'} ${data.deposit_amount} ${t('admin.enrollments.paymentPlan.depositLabel', 'deposit')}`;
      } else {
        depositInfo = t('admin.enrollments.paymentPlan.depositLabel', 'Deposit');
      }

      // Use the translated template with placeholder replacement
      const template = t('admin.enrollments.paymentPlan.deposit', 'Deposit + {count} Installments');
      return depositInfo + ' + ' + String(count) + ' ' + frequencyText;
    } else if (key === 'admin.enrollments.paymentPlan.installments') {
      const count = data.count || 'N';
      const frequency = data.frequency || 'monthly';
      const frequencyKey = `admin.enrollments.paymentPlan.frequency.${frequency}`;
      const frequencyText = t(frequencyKey, frequency);

      // Use the translated template with placeholder replacement
      const template = t('admin.enrollments.paymentPlan.installments', '{count} Installments');
      return template.replace('{count}', String(count)) + ' - ' + frequencyText;
    } else if (key === 'admin.enrollments.paymentPlan.subscription') {
      const interval = data.interval || 'monthly';
      const intervalKey = `admin.enrollments.paymentPlan.interval.${interval}`;
      const intervalText = t(intervalKey, interval);
      return `${intervalText} ${t('admin.enrollments.paymentPlan.subscriptionLabel', 'Subscription')}`;
    } else if (key === 'admin.enrollments.paymentPlan.free') {
      return t('admin.enrollments.paymentPlan.free', 'Free');
    }
    return t('admin.enrollments.paymentPlan.notAvailable', 'N/A');
  };

  const formatProductType = (type: string): string => {
    if (!type || type === 'N/A') return type;
    const typeKey = `admin.enrollments.productType.${type.toLowerCase()}`;
    return t(typeKey, type);
  };

  const handleSendEnrollmentLink = async () => {
    if (!sendLinkEnrollment) return;

    setSendingLink(true);
    try {
      const response = await fetch(`/api/admin/enrollments/${sendLinkEnrollment.id}/send-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: selectedLanguage })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send link');
      }

      toast.success(t('admin.enrollments.sendLink.success', 'Enrollment link sent successfully'));
      setSendLinkDialogOpen(false);
      setSendLinkEnrollment(null);
      fetchEnrollments(); // Refresh to show pending status
    } catch (error: any) {
      console.error('Error sending link:', error);
      toast.error(error.message || t('admin.enrollments.sendLink.error', 'Failed to send enrollment link'));
    } finally {
      setSendingLink(false);
    }
  };

  const handleResetEnrollment = async (resetSignature: boolean, resetPayment: boolean) => {
    if (!selectedEnrollment) return;

    setResetting(true);
    try {
      const params = new URLSearchParams();
      if (resetSignature) params.append('reset_signature', 'true');
      if (resetPayment) params.append('reset_payment', 'true');
      params.append('reset_profile', 'true'); // Always reset profile for complete restart

      const response = await fetch(`/api/admin/enrollments/${selectedEnrollment.id}/reset?${params.toString()}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset enrollment');
      }

      const data = await response.json();
      toast.success(t('admin.enrollments.reset.success', 'Enrollment reset successfully'));

      // Show wizard URL to admin
      toast.info(
        t('admin.enrollments.reset.wizardInfo', 'User can now restart at: ') + data.wizard_url,
        { duration: 5000 }
      );

      setResetDialogOpen(false);
      setSelectedEnrollment(null);
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error resetting enrollment:', error);
      toast.error(error.message || t('admin.enrollments.reset.error', 'Failed to reset enrollment'));
    } finally {
      setResetting(false);
    }
  };

  const handleCancelEnrollment = async (enrollmentId: string, reason: string, refundAmount?: number) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, refund_amount: refundAmount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel enrollment');
      }

      toast.success(t('admin.enrollments.cancel.success', 'Enrollment cancelled successfully'));
      setCancelDialogOpen(false);
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error cancelling enrollment:', error);
      toast.error(error.message || t('admin.enrollments.cancel.error', 'Failed to cancel enrollment'));
    }
  };

  const handleRecordManualPayment = async (
    enrollmentId: string,
    scheduleId: string,
    paymentMethod: string,
    reference: string,
    notes: string
  ) => {
    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: paymentMethod,
          transaction_reference: reference,
          notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to record payment');
      toast.success(t('admin.enrollments.manualPayment.success', 'Manual payment recorded successfully'));
      setManualPaymentDialogOpen(false);
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.message || t('admin.enrollments.manualPayment.error', 'Failed to record payment'));
    }
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">N/A</Badge>;

    const variants: Record<string, any> = {
      draft: 'outline',
      pending: 'secondary',
      active: 'default',
      suspended: 'secondary',
      cancelled: 'outline',
      completed: 'default',
    };
    const statusKey = `admin.enrollments.status.${status}`;
    const statusText = t(statusKey, status.replace(/_/g, ' '));
    return <Badge variant={variants[status] || 'outline'}>{statusText}</Badge>;
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount || 0);
  };

  const formatPercentage = (paid: number, total: number) => {
    if (!total || total === 0) return '0';
    return Math.round((paid / total) * 100).toString();
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'he' ? 'he-IL' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              <span suppressHydrationWarning>{t('admin.enrollments.title', 'Enrollments')}</span>
            </h1>
            <p suppressHydrationWarning style={{
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'var(--font-size-sm)',
              marginTop: '0.25rem'
            }}>
              {t('admin.enrollments.description', 'Manage user enrollments and payments')}
            </p>
          </div>
          <Button
            onClick={() => setCreateEnrollmentDialogOpen(true)}
            style={{
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span suppressHydrationWarning>{t('admin.enrollments.createEnrollment', 'Create Enrollment')}</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {/* Total Enrollments Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium" suppressHydrationWarning>
                {t('admin.enrollments.stats.total', 'Total')}
              </CardTitle>
              <Users className="h-3.5 w-3.5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {enrollments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.enrollments.stats.totalDesc', 'All enrollments')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium" suppressHydrationWarning>
                {t('admin.enrollments.stats.draft', 'Draft')}
              </CardTitle>
              <Edit className="h-3.5 w-3.5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'draft').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.enrollments.stats.draftDesc', 'Not sent yet')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium" suppressHydrationWarning>
                {t('admin.enrollments.stats.pending', 'Pending')}
              </CardTitle>
              <Clock className="h-3.5 w-3.5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.enrollments.stats.pendingDesc', 'Awaiting completion')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium" suppressHydrationWarning>
                {t('admin.enrollments.stats.active', 'Active')}
              </CardTitle>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.enrollments.stats.activeDesc', 'Currently enrolled')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium" suppressHydrationWarning>
                {t('admin.enrollments.stats.completed', 'Completed')}
              </CardTitle>
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'completed').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.enrollments.stats.completedDesc', 'Finished')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium" suppressHydrationWarning>
                {t('admin.enrollments.stats.cancelled', 'Cancelled')}
              </CardTitle>
              <X className="h-3.5 w-3.5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {enrollments.filter(e => e.status === 'cancelled').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.enrollments.stats.cancelledDesc', 'Cancelled')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: '1rem',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {/* Search */}
              <div style={{
                flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : 'auto',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <Input
                  placeholder={t('admin.enrollments.searchPlaceholder', 'User name, email, or product')}
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  style={{ flex: 1 }}
                />
              </div>

              {/* Status Filter */}
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                dir={direction}
              >
                <SelectTrigger style={{ width: isMobile ? '100%' : '180px' }} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectValue placeholder={t('admin.enrollments.status', 'Status')} />
                </SelectTrigger>
                <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectItem value="all" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.allStatuses', 'All Statuses')}</span></SelectItem>
                  <SelectItem value="draft" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.status.draft', 'Draft')}</span></SelectItem>
                  <SelectItem value="pending" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.status.pending', 'Pending')}</span></SelectItem>
                  <SelectItem value="active" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.status.active', 'Active')}</span></SelectItem>
                  <SelectItem value="suspended" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.status.suspended', 'Suspended')}</span></SelectItem>
                  <SelectItem value="cancelled" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.status.cancelled', 'Cancelled')}</span></SelectItem>
                  <SelectItem value="completed" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.status.completed', 'Completed')}</span></SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Status Filter */}
              <Select
                value={filters.paymentStatus || 'all'}
                onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === 'all' ? undefined : value })}
                dir={direction}
              >
                <SelectTrigger style={{ width: isMobile ? '100%' : '180px' }} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectValue placeholder={t('admin.enrollments.paymentStatus', 'Payment Status')} />
                </SelectTrigger>
                <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectItem value="all" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.allPaymentStatuses', 'All Payment Statuses')}</span></SelectItem>
                  <SelectItem value="paid" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.paymentStatus.paid', 'Paid')}</span></SelectItem>
                  <SelectItem value="partial" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.paymentStatus.partial', 'Partial')}</span></SelectItem>
                  <SelectItem value="pending" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.paymentStatus.pending', 'Pending')}</span></SelectItem>
                  <SelectItem value="overdue" className={isRtl ? 'text-right' : 'text-left'}><span suppressHydrationWarning>{t('admin.enrollments.paymentStatus.overdue', 'Overdue')}</span></SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              <Button
                variant="outline"
                onClick={() => setFilters({})}
                style={{
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                <X className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('admin.enrollments.clearFilters', 'Clear Filters')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardContent className="p-0">
            {/* Mobile Card View */}
            <div className="block md:hidden">
              {enrollments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground" suppressHydrationWarning>
                  {t('admin.enrollments.noEnrollments', 'No enrollments found')}
                </div>
              ) : (
                enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="border-b p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{enrollment.user_name}</div>
                        <div className="text-sm text-muted-foreground">{enrollment.user_email}</div>
                      </div>
                      {getStatusBadge(enrollment.status)}
                    </div>

                    <div>
                      <div className="text-sm font-medium">{enrollment.product_name}</div>
                      <div className="text-xs text-muted-foreground">{formatProductType(enrollment.product_type)}</div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {getPaymentStatusIcon(enrollment.payment_status)}
                      <span className="font-medium">
                        {formatCurrency(enrollment.paid_amount, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                      </span>
                      <span className="text-muted-foreground">
                        ({formatPercentage(enrollment.paid_amount, enrollment.total_amount)}%)
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2 flex-wrap">
                      {enrollment.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSendLinkEnrollment(enrollment);
                            setSelectedLanguage(language || 'en');
                            setSendLinkDialogOpen(true);
                          }}
                          title={t('admin.enrollments.sendLink', 'Send enrollment link')}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </Button>
                      )}
                      {(enrollment.status === 'pending' || enrollment.status === 'active') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setResetDialogOpen(true);
                          }}
                          title={t('admin.enrollments.reset', 'Reset enrollment wizard')}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      {enrollment.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setOverrideDialogOpen(true);
                          }}
                          title={t('admin.enrollments.edit', 'Edit enrollment')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {enrollment.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setCancelDialogOpen(true);
                          }}
                          title={t('admin.enrollments.delete', 'Delete enrollment')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className={isRtl ? 'text-right' : 'text-left'}>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.user', 'User')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.product', 'Product')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.paymentPlan', 'Payment Plan')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.amount', 'Amount')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.paymentStatus', 'Payment Status')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.status', 'Status')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.enrollments.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground" suppressHydrationWarning>
                        {t('admin.enrollments.noEnrollments', 'No enrollments found')}
                      </td>
                    </tr>
                  ) : (
                    enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{enrollment.user_name}</div>
                            <div className="text-sm text-muted-foreground">{enrollment.user_email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{enrollment.product_name}</div>
                            <div className="text-sm text-muted-foreground">{formatProductType(enrollment.product_type)}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setPaymentPlanDialogOpen(true);
                            }}
                          >
                            {formatPaymentPlanName(enrollment)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">
                              {formatCurrency(enrollment.paid_amount, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatPercentage(enrollment.paid_amount, enrollment.total_amount)}{t('admin.enrollments.paidPercentage', '% paid')}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getPaymentStatusIcon(enrollment.payment_status)}
                            <Badge variant={enrollment.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {t(`admin.enrollments.paymentStatus.${enrollment.payment_status}`, enrollment.payment_status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(enrollment.status)}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {enrollment.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSendLinkEnrollment(enrollment);
                                  setSelectedLanguage(language || 'en');
                                  setSendLinkDialogOpen(true);
                                }}
                                title={t('admin.enrollments.sendLink', 'Send enrollment link')}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </Button>
                            )}
                            {(enrollment.status === 'pending' || enrollment.status === 'active') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setResetDialogOpen(true);
                                }}
                                title={t('admin.enrollments.reset', 'Reset enrollment wizard')}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {enrollment.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setOverrideDialogOpen(true);
                                }}
                                title={t('admin.enrollments.edit', 'Edit enrollment')}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {enrollment.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedEnrollment(enrollment);
                                  setCancelDialogOpen(true);
                                }}
                                title={t('admin.enrollments.delete', 'Delete enrollment')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {enrollments.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">{t('admin.enrollments.noEnrollments', 'No Enrollments Found')}</h3>
                <p className="text-muted-foreground">
                  {t('admin.enrollments.noEnrollmentsDescription', 'No enrollments match your current filters')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cancel Enrollment Dialog */}
        <CancelEnrollmentDialog
          open={cancelDialogOpen}
          enrollment={selectedEnrollment}
          onClose={() => setCancelDialogOpen(false)}
          onCancel={handleCancelEnrollment}
        />

        {/* Manual Payment Dialog */}
        <ManualPaymentDialog
          open={manualPaymentDialogOpen}
          enrollment={selectedEnrollment}
          onClose={() => setManualPaymentDialogOpen(false)}
          onRecord={handleRecordManualPayment}
        />

        {/* Create Enrollment Dialog */}
        <CreateEnrollmentDialog
          open={createEnrollmentDialogOpen}
          onClose={() => setCreateEnrollmentDialogOpen(false)}
          onSuccess={() => {
            setCreateEnrollmentDialogOpen(false);
            fetchEnrollments();
          }}
        />

        {/* Edit Enrollment Dialog */}
        <EditEnrollmentDialog
          open={overrideDialogOpen}
          enrollment={selectedEnrollment}
          onClose={() => setOverrideDialogOpen(false)}
          onSuccess={() => {
            setOverrideDialogOpen(false);
            fetchEnrollments();
          }}
        />

        {/* Payment Plan Details Dialog */}
        <PaymentPlanDetailsDialog
          open={paymentPlanDialogOpen}
          enrollment={selectedEnrollment}
          onClose={() => setPaymentPlanDialogOpen(false)}
        />

        {/* Send Enrollment Link Dialog */}
        <SendEnrollmentLinkDialog
          open={sendLinkDialogOpen}
          enrollment={sendLinkEnrollment}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onClose={() => {
            setSendLinkDialogOpen(false);
            setSendLinkEnrollment(null);
          }}
          onSend={handleSendEnrollmentLink}
          sending={sendingLink}
        />

        {/* Reset Enrollment Dialog */}
        <ResetEnrollmentDialog
          open={resetDialogOpen}
          enrollment={selectedEnrollment}
          onClose={() => {
            setResetDialogOpen(false);
            setSelectedEnrollment(null);
          }}
          onReset={handleResetEnrollment}
          resetting={resetting}
        />
      </div>
      )}
    </AdminLayout>
  );
}

// Cancel Enrollment Dialog
function CancelEnrollmentDialog({
  open,
  enrollment,
  onClose,
  onCancel,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
  onCancel: (enrollmentId: string, reason: string, refundAmount?: number) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [includeRefund, setIncludeRefund] = useState(false);

  useEffect(() => {
    if (enrollment) {
      setReason('');
      setRefundAmount(enrollment.paid_amount);
      setIncludeRefund(false);
    }
  }, [enrollment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollment) {
      onCancel(enrollment.id, reason, includeRefund ? refundAmount : undefined);
    }
  };

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle>{t('admin.enrollments.cancel.title', 'Cancel Enrollment')}</DialogTitle>
          <DialogDescription>
            {t('admin.enrollments.cancel.description', 'Cancel {user}\'s enrollment in {product}')
              .replace('{user}', enrollment.user_name)
              .replace('{product}', enrollment.product_name)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {t('admin.enrollments.cancel.alert', 'This action will cancel all future scheduled payments for this enrollment.')}
            </AlertDescription>
          </Alert>

          <div>
            <Label>{t('admin.enrollments.cancel.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.enrollments.cancel.reasonPlaceholder', 'e.g., User requested cancellation')}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="include_refund"
              checked={includeRefund}
              onChange={(e) => setIncludeRefund(e.target.checked)}
            />
            <Label htmlFor="include_refund">{t('admin.enrollments.cancel.processRefund', 'Process refund')}</Label>
          </div>

          {includeRefund && (
            <div>
              <Label>{t('admin.enrollments.cancel.refundAmount', 'Refund Amount')}</Label>
              <Input
                type="number"
                min="0"
                max={enrollment.paid_amount}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.enrollments.cancel.maximum', 'Maximum')}: {new Intl.NumberFormat('en-US', { style: 'currency', currency: enrollment.currency }).format(enrollment.paid_amount)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" variant="destructive">
              {t('admin.enrollments.cancel.cancelButton', 'Cancel Enrollment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Manual Payment Dialog
function ManualPaymentDialog({
  open,
  enrollment,
  onClose,
  onRecord,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
  onRecord: (enrollmentId: string, scheduleId: string, paymentMethod: string, reference: string, notes: string) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleId, setScheduleId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enrollment) {
      onRecord(enrollment.id, scheduleId, paymentMethod, reference, notes);
    }
  };

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle>{t('admin.enrollments.manualPayment.title', 'Record Manual Payment')}</DialogTitle>
          <DialogDescription>
            {t('admin.enrollments.manualPayment.description', 'Record an offline payment for {user}')
              .replace('{user}', enrollment.user_name)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t('admin.enrollments.manualPayment.paymentMethod', 'Payment Method')}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} dir={direction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="bank_transfer">{t('admin.enrollments.manualPayment.bankTransfer', 'Bank Transfer')}</SelectItem>
                <SelectItem value="cash">{t('admin.enrollments.manualPayment.cash', 'Cash')}</SelectItem>
                <SelectItem value="check">{t('admin.enrollments.manualPayment.check', 'Check')}</SelectItem>
                <SelectItem value="other">{t('admin.enrollments.manualPayment.other', 'Other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>{t('admin.enrollments.manualPayment.reference', 'Transaction Reference')}</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('admin.enrollments.manualPayment.referencePlaceholder', 'e.g., TXN-12345')}
              required
            />
          </div>

          <div>
            <Label>{t('admin.enrollments.manualPayment.notes', 'Notes')}</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('admin.enrollments.manualPayment.notesPlaceholder', 'Additional notes')}
            />
          </div>

          <Alert>
            <AlertDescription>
              {t('admin.enrollments.manualPayment.alert', 'This will mark the payment as completed without processing through Stripe.')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit">
              {t('admin.enrollments.manualPayment.recordButton', 'Record Payment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Reset Enrollment Dialog
function ResetEnrollmentDialog({
  open,
  enrollment,
  onClose,
  onReset,
  resetting,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
  onReset: (resetSignature: boolean, resetPayment: boolean) => void;
  resetting: boolean;
}) {
  const { t, direction } = useAdminLanguage();
  const [resetSignature, setResetSignature] = useState(true);
  const [resetPayment, setResetPayment] = useState(true);

  useEffect(() => {
    if (enrollment) {
      setResetSignature(true);
      setResetPayment(true);
    }
  }, [enrollment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReset(resetSignature, resetPayment);
  };

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {t('admin.enrollments.reset.title', 'Reset Enrollment Wizard')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {t('admin.enrollments.reset.description', 'Reset the enrollment wizard for {user} to allow them to go through the steps again')
              .replace('{user}', enrollment.user_name)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertDescription suppressHydrationWarning>
              {t('admin.enrollments.reset.info', 'This will reset the enrollment status to "pending" and allow the user to restart the enrollment wizard.')}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset_signature"
                checked={resetSignature}
                onChange={(e) => setResetSignature(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="reset_signature" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.enrollments.reset.resetSignature', 'Reset DocuSign signature status')}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="reset_payment"
                checked={resetPayment}
                onChange={(e) => setResetPayment(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="reset_payment" className="cursor-pointer" suppressHydrationWarning>
                {t('admin.enrollments.reset.resetPayment', 'Reset payment status (paid amount to 0)')}
              </Label>
            </div>

            <div className="flex items-center gap-2 opacity-50">
              <input
                type="checkbox"
                id="reset_profile"
                checked={true}
                disabled
                className="rounded"
              />
              <Label htmlFor="reset_profile" suppressHydrationWarning>
                {t('admin.enrollments.reset.resetProfile', 'Reset profile onboarding flags')} ({t('admin.enrollments.reset.always', 'always enabled')})
              </Label>
            </div>
          </div>

          <Alert variant="destructive">
            <AlertDescription suppressHydrationWarning>
              {resetPayment && t('admin.enrollments.reset.warning', 'Warning: Resetting payment will set paid_amount to 0. This cannot be undone!')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={resetting}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={resetting} suppressHydrationWarning>
              {resetting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('admin.enrollments.reset.resetting', 'Resetting...')}
                </>
              ) : (
                t('admin.enrollments.reset.button', 'Reset Enrollment')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
