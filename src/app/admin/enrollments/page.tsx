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
  ArrowLeft,
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
  payment_plan_name: string;
  total_amount: number;
  paid_amount: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  status: 'active' | 'pending_payment' | 'cancelled' | 'completed';
  next_payment_date?: string;
  created_at: string;
}

interface EnrollmentFilters {
  status?: string;
  paymentStatus?: string;
  search?: string;
}

export default function EnrollmentsPage() {
  const { t } = useAdminLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EnrollmentFilters>({});
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);

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
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
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

      toast.success('Enrollment cancelled successfully');
      setCancelDialogOpen(false);
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error cancelling enrollment:', error);
      toast.error(error.message || 'Failed to cancel enrollment');
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
      toast.success('Manual payment recorded successfully');
      setManualPaymentDialogOpen(false);
      fetchEnrollments();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.message || 'Failed to record payment');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: 'default',
      pending_payment: 'secondary',
      cancelled: 'outline',
      completed: 'default',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
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
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
              <h1 className="text-3xl font-bold">Enrollments</h1>
              <p className="text-muted-foreground mt-1">
                Manage user enrollments and payments
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{enrollments.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enrollments.filter(e => e.status === 'active').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {enrollments.filter(e => e.status === 'pending_payment').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  enrollments.reduce((sum, e) => sum + e.paid_amount, 0),
                  enrollments[0]?.currency || 'USD'
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="User name, email, or product"
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Payment Status</Label>
                <Select
                  value={filters.paymentStatus || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, paymentStatus: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enrollments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">Payment Plan</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Payment Status</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Next Payment</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
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
                          <div className="text-sm text-muted-foreground capitalize">{enrollment.product_type}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">{enrollment.payment_plan_name}</Badge>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">
                            {formatCurrency(enrollment.paid_amount, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((enrollment.paid_amount / enrollment.total_amount) * 100)}% paid
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getPaymentStatusIcon(enrollment.payment_status)}
                          <Badge variant={enrollment.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {enrollment.payment_status}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(enrollment.status)}
                      </td>
                      <td className="p-4">
                        {enrollment.next_payment_date ? (
                          <div className="text-sm">{formatDate(enrollment.next_payment_date)}</div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link href={`/payments/${enrollment.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedEnrollment(enrollment);
                              setManualPaymentDialogOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          {enrollment.status !== 'cancelled' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedEnrollment(enrollment);
                                setCancelDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {enrollments.length === 0 && !loading && (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Enrollments Found</h3>
                <p className="text-muted-foreground">
                  No enrollments match your current filters
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
      </div>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Enrollment</DialogTitle>
          <DialogDescription>
            Cancel {enrollment.user_name}'s enrollment in {enrollment.product_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              This action will cancel all future scheduled payments for this enrollment.
            </AlertDescription>
          </Alert>

          <div>
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., User requested cancellation"
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
            <Label htmlFor="include_refund">Process refund</Label>
          </div>

          {includeRefund && (
            <div>
              <Label>Refund Amount</Label>
              <Input
                type="number"
                min="0"
                max={enrollment.paid_amount}
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {new Intl.NumberFormat('en-US', { style: 'currency', currency: enrollment.currency }).format(enrollment.paid_amount)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Cancel Enrollment
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Manual Payment</DialogTitle>
          <DialogDescription>
            Record an offline payment for {enrollment.user_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Transaction Reference</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., TXN-12345"
              required
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
            />
          </div>

          <Alert>
            <AlertDescription>
              This will mark the payment as completed without processing through Stripe.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
