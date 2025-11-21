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
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  CreditCard,
  Filter,
  Download,
  RefreshCw,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  enrollment_id: string;
  product_name: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  stripe_payment_intent_id?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  refund_amount?: number;
  failure_reason?: string;
  created_at: string;
  metadata?: any;
}

interface TransactionFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  search?: string;
}

export default function TransactionsPage() {
  const { t } = useAdminLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/payments/transactions?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (transactionId: string, amount: number, reason: string, isFull: boolean) => {
    try {
      const response = await fetch(`/api/admin/payments/transactions/${transactionId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason, is_full_refund: isFull }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process refund');
      }

      toast.success('Refund processed successfully');
      setRefundDialogOpen(false);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(error.message || 'Failed to process refund');
    }
  };

  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/admin/payments/transactions/export?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export transactions');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Transactions exported successfully');
    } catch (error: any) {
      console.error('Error exporting transactions:', error);
      toast.error(error.message || 'Failed to export transactions');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      case 'partially_refunded':
        return <RotateCcw className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline',
      partially_refunded: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
              <h1 className="text-3xl font-bold">Payment Transactions</h1>
              <p className="text-muted-foreground mt-1">
                View and manage all payment transactions
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportTransactions}>
              <Download className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" onClick={() => fetchTransactions()}>
              <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + t.amount, 0),
                  transactions[0]?.currency || 'USD'
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refunded</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'refunded' || t.status === 'partially_refunded').length}
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
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="User name, email, or transaction ID"
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
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <Label>Date To</Label>
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
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Method</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="text-sm">{formatDate(transaction.created_at)}</div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{transaction.user_name}</div>
                          <div className="text-sm text-muted-foreground">{transaction.user_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{transaction.product_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {formatCurrency(transaction.amount, transaction.currency)}
                          {transaction.refund_amount && (
                            <div className="text-xs text-muted-foreground">
                              Refunded: {formatCurrency(transaction.refund_amount, transaction.currency)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {transaction.payment_method}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          {getStatusBadge(transaction.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transaction.status === 'completed' && !transaction.refund_amount && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setRefundDialogOpen(true);
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length === 0 && !loading && (
              <div className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground">
                  No payment transactions match your current filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refund Dialog */}
        <RefundDialog
          open={refundDialogOpen}
          transaction={selectedTransaction}
          onClose={() => setRefundDialogOpen(false)}
          onRefund={handleRefund}
        />

        {/* Details Dialog */}
        <TransactionDetailsDialog
          open={detailsDialogOpen}
          transaction={selectedTransaction}
          onClose={() => setDetailsDialogOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}

// Refund Dialog Component
function RefundDialog({
  open,
  transaction,
  onClose,
  onRefund,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onRefund: (transactionId: string, amount: number, reason: string, isFull: boolean) => void;
}) {
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (transaction) {
      setAmount(transaction.amount);
      setReason('');
      setRefundType('full');
    }
  }, [transaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transaction) {
      onRefund(transaction.id, refundType === 'full' ? transaction.amount : amount, reason, refundType === 'full');
    }
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Refund</DialogTitle>
          <DialogDescription>
            Refund payment for {transaction.user_name} - {transaction.product_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Refund Type</Label>
            <Select
              value={refundType}
              onValueChange={(value: any) => setRefundType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Refund</SelectItem>
                <SelectItem value="partial">Partial Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {refundType === 'partial' && (
            <div>
              <Label>Refund Amount</Label>
              <Input
                type="number"
                min="0.01"
                max={transaction.amount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum: {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
              </p>
            </div>
          )}

          <div>
            <Label>Reason</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., User requested refund"
              required
            />
          </div>

          <Alert>
            <AlertDescription>
              {refundType === 'full'
                ? 'This will refund the full payment amount to the user.'
                : 'This will refund only the specified amount to the user.'}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Process Refund
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Transaction Details Dialog Component
function TransactionDetailsDialog({
  open,
  transaction,
  onClose,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}) {
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Transaction ID</Label>
              <div className="font-mono text-sm">{transaction.transaction_id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{transaction.status}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">User</Label>
              <div>{transaction.user_name}</div>
              <div className="text-sm text-muted-foreground">{transaction.user_email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Product</Label>
              <div>{transaction.product_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <div className="text-lg font-bold">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Payment Method</Label>
              <div className="capitalize">{transaction.payment_method}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Date</Label>
              <div>{new Date(transaction.created_at).toLocaleString()}</div>
            </div>
            {transaction.stripe_payment_intent_id && (
              <div>
                <Label className="text-muted-foreground">Stripe Payment Intent</Label>
                <div className="font-mono text-sm">{transaction.stripe_payment_intent_id}</div>
              </div>
            )}
            {transaction.refund_amount && (
              <div>
                <Label className="text-muted-foreground">Refund Amount</Label>
                <div className="text-lg font-bold text-red-500">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(transaction.refund_amount)}
                </div>
              </div>
            )}
            {transaction.failure_reason && (
              <div className="col-span-2">
                <Label className="text-muted-foreground">Failure Reason</Label>
                <div className="text-red-500">{transaction.failure_reason}</div>
              </div>
            )}
          </div>

          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
              <Label className="text-muted-foreground">Metadata</Label>
              <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
