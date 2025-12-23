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
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
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
  const { t, direction, language, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
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
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.transactions.loadError', 'Failed to load transactions'),
        variant: 'destructive',
      });
    } finally {
      setLoadingTransactions(false);
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

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.transactions.refund.success', 'Refund processed successfully'),
      });
      setRefundDialogOpen(false);
      fetchTransactions();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.transactions.refund.error', 'Failed to process refund'),
        variant: 'destructive',
      });
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

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.transactions.exportSuccess', 'Transactions exported successfully'),
      });
    } catch (error: any) {
      console.error('Error exporting transactions:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.transactions.exportError', 'Failed to export transactions'),
        variant: 'destructive',
      });
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

    const statusLabels: Record<string, string> = {
      completed: t('admin.payments.transactions.status.completed', 'Completed'),
      pending: t('admin.payments.transactions.status.pending', 'Pending'),
      failed: t('admin.payments.transactions.status.failed', 'Failed'),
      refunded: t('admin.payments.transactions.status.refunded', 'Refunded'),
      partially_refunded: t('admin.payments.transactions.status.partiallyRefunded', 'Partially Refunded'),
    };

    return <Badge variant={variants[status] || 'outline'} suppressHydrationWarning>{statusLabels[status] || status}</Badge>;
  };

  const translatePaymentMethod = (method: string) => {
    const normalizedMethod = method?.toLowerCase().replace(/[\s-]/g, '_') || 'unknown';
    const methodLabels: Record<string, string> = {
      card: t('admin.payments.paymentMethod.card', 'Card'),
      credit_card: t('admin.payments.paymentMethod.credit_card', 'Credit Card'),
      bank_transfer: t('admin.payments.paymentMethod.bank_transfer', 'Bank Transfer'),
      cash: t('admin.payments.paymentMethod.cash', 'Cash'),
      check: t('admin.payments.paymentMethod.check', 'Check'),
      cheque: t('admin.payments.paymentMethod.cheque', 'Cheque'),
      paypal: t('admin.payments.paymentMethod.paypal', 'PayPal'),
      stripe: t('admin.payments.paymentMethod.stripe', 'Stripe'),
      online: t('admin.payments.paymentMethod.online', 'Online'),
      manual: t('admin.payments.paymentMethod.manual', 'Manual'),
      unknown: t('admin.payments.paymentMethod.unknown', 'Unknown'),
    };

    return methodLabels[normalizedMethod] || t(`admin.payments.paymentMethod.${normalizedMethod}`, method);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
          <div className="flex items-center gap-4">
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
              }}>{t('admin.payments.transactions.title', 'Transactions')}</h1>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.transactions.description', 'View and manage all payment transactions')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportTransactions}>
              <Download className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span suppressHydrationWarning>{t('admin.payments.transactions.export', 'Export')}</span>
            </Button>
            <Button variant="outline" onClick={() => fetchTransactions()}>
              <RefreshCw className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span suppressHydrationWarning>{t('admin.payments.transactions.refresh', 'Refresh')}</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.transactions.totalTransactions', 'Total Transactions')}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>{transactions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.transactions.totalAmount', 'Total Amount')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {formatCurrency(
                  transactions.reduce((sum, t) => sum + t.amount, 0),
                  transactions[0]?.currency || 'USD'
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.transactions.completed', 'Completed')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
                {transactions.filter(t => t.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.transactions.refunded', 'Refunded')}</CardTitle>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" suppressHydrationWarning>
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
              <span suppressHydrationWarning>{t('admin.payments.transactions.filters', 'Filters')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div>
                <Label suppressHydrationWarning>{t('admin.payments.transactions.search', 'Search')}</Label>
                <Input
                  placeholder={t('admin.payments.transactions.searchPlaceholder', 'Search by user, email, or transaction ID...')}
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

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
                    <SelectItem value="all" suppressHydrationWarning>{t('admin.payments.transactions.allStatuses', 'All Statuses')}</SelectItem>
                    <SelectItem value="completed" suppressHydrationWarning>{t('admin.payments.transactions.status.completed', 'Completed')}</SelectItem>
                    <SelectItem value="pending" suppressHydrationWarning>{t('admin.payments.transactions.status.pending', 'Pending')}</SelectItem>
                    <SelectItem value="failed" suppressHydrationWarning>{t('admin.payments.transactions.status.failed', 'Failed')}</SelectItem>
                    <SelectItem value="refunded" suppressHydrationWarning>{t('admin.payments.transactions.status.refunded', 'Refunded')}</SelectItem>
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
                  <span suppressHydrationWarning>{t('admin.payments.transactions.clearFilters', 'Clear Filters')}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" dir={direction}>
                <thead className="border-b">
                  <tr className={isRtl ? 'text-right' : 'text-left'}>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.date', 'Date')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.user', 'User')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.product', 'Product')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.amount', 'Amount')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.method', 'Payment Method')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.status', 'Status')}</th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.actions', 'Actions')}</th>
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
                      <td className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                        <div className="font-medium" suppressHydrationWarning>
                          {formatCurrency(transaction.amount, transaction.currency)}
                          {transaction.refund_amount && (
                            <div className="text-xs text-muted-foreground" suppressHydrationWarning>
                              {t('admin.payments.transactions.refundedAmount', 'Refunded')}: {formatCurrency(transaction.refund_amount, transaction.currency)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" suppressHydrationWarning>
                          {translatePaymentMethod(transaction.payment_method)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                          {getStatusIcon(transaction.status)}
                          {getStatusBadge(transaction.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
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

            {transactions.length === 0 && !loadingTransactions && (
              <div className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>{t('admin.payments.transactions.noTransactionsFound', 'No Transactions Found')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning>
                  {t('admin.payments.transactions.noTransactionsMatch', 'No transactions match your current filters')}
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
          direction={direction}
          language={language}
        />

        {/* Details Dialog */}
        <TransactionDetailsDialog
          open={detailsDialogOpen}
          transaction={selectedTransaction}
          onClose={() => setDetailsDialogOpen(false)}
          direction={direction}
          language={language}
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
  direction,
  language,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  onRefund: (transactionId: string, amount: number, reason: string, isFull: boolean) => void;
  direction: 'ltr' | 'rtl';
  language: string;
}) {
  const { t } = useAdminLanguage();
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
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t('admin.payments.transactions.refund.title', 'Process Refund')}</DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {`${t('admin.payments.transactions.refund.description', 'Refund transaction for')} - ${transaction.user_name} / ${transaction.product_name}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label suppressHydrationWarning>{t('admin.payments.transactions.refund.type', 'Refund Type')}</Label>
            <Select
              value={refundType}
              onValueChange={(value: any) => setRefundType(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="full" suppressHydrationWarning>{t('admin.payments.transactions.refund.fullRefund', 'Full Refund')}</SelectItem>
                <SelectItem value="partial" suppressHydrationWarning>{t('admin.payments.transactions.refund.partialRefund', 'Partial Refund')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {refundType === 'partial' && (
            <div>
              <Label suppressHydrationWarning>{t('admin.payments.transactions.refund.amount', 'Refund Amount')}</Label>
              <Input
                type="number"
                min="0.01"
                max={transaction.amount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.transactions.refund.maximum', 'Maximum')}: {new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
              </p>
            </div>
          )}

          <div>
            <Label suppressHydrationWarning>{t('common.reason', 'Reason')}</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('admin.payments.transactions.refund.reasonPlaceholder', 'Enter reason for refund...')}
              required
            />
          </div>

          <Alert>
            <AlertDescription suppressHydrationWarning>
              {refundType === 'full'
                ? t('admin.payments.transactions.refund.fullAlert', 'This will refund the full amount to the customer')
                : t('admin.payments.transactions.refund.partialAlert', 'This will refund the specified amount to the customer')}
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
            </Button>
            <Button type="submit" variant="destructive">
              <span suppressHydrationWarning>{t('admin.payments.transactions.refund.processButton', 'Process Refund')}</span>
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
  direction,
  language,
}: {
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
  direction: 'ltr' | 'rtl';
  language: string;
}) {
  const { t } = useAdminLanguage();
  if (!transaction) return null;

  const translatePaymentMethod = (method: string) => {
    const normalizedMethod = method?.toLowerCase().replace(/[\s-]/g, '_') || 'unknown';
    const methodLabels: Record<string, string> = {
      card: t('admin.payments.paymentMethod.card', 'Card'),
      credit_card: t('admin.payments.paymentMethod.credit_card', 'Credit Card'),
      bank_transfer: t('admin.payments.paymentMethod.bank_transfer', 'Bank Transfer'),
      cash: t('admin.payments.paymentMethod.cash', 'Cash'),
      check: t('admin.payments.paymentMethod.check', 'Check'),
      cheque: t('admin.payments.paymentMethod.cheque', 'Cheque'),
      paypal: t('admin.payments.paymentMethod.paypal', 'PayPal'),
      stripe: t('admin.payments.paymentMethod.stripe', 'Stripe'),
      online: t('admin.payments.paymentMethod.online', 'Online'),
      manual: t('admin.payments.paymentMethod.manual', 'Manual'),
      unknown: t('admin.payments.paymentMethod.unknown', 'Unknown'),
    };

    return methodLabels[normalizedMethod] || t(`admin.payments.paymentMethod.${normalizedMethod}`, method);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" dir={direction}>
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>{t('admin.payments.transactions.details.title', 'Transaction Details')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.details.transactionId', 'Transaction ID')}</Label>
              <div className="font-mono text-sm">{transaction.transaction_id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('common.status', 'Status')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{transaction.status}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.table.user', 'User')}</Label>
              <div>{transaction.user_name}</div>
              <div className="text-sm text-muted-foreground">{transaction.user_email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.table.product', 'Product')}</Label>
              <div>{transaction.product_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.table.amount', 'Amount')}</Label>
              <div className="text-lg font-bold" suppressHydrationWarning>
                {new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: transaction.currency }).format(transaction.amount)}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.table.method', 'Payment Method')}</Label>
              <div suppressHydrationWarning>{translatePaymentMethod(transaction.payment_method)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.table.date', 'Date')}</Label>
              <div suppressHydrationWarning>{new Date(transaction.created_at).toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}</div>
            </div>
            {transaction.stripe_payment_intent_id && (
              <div>
                <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.details.stripePaymentIntent', 'Stripe Payment Intent')}</Label>
                <div className="font-mono text-sm">{transaction.stripe_payment_intent_id}</div>
              </div>
            )}
            {transaction.refund_amount && (
              <div>
                <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.refund.amount', 'Refund Amount')}</Label>
                <div className="text-lg font-bold text-red-500" suppressHydrationWarning>
                  {new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: transaction.currency }).format(transaction.refund_amount)}
                </div>
              </div>
            )}
            {transaction.failure_reason && (
              <div className="col-span-2">
                <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.details.failureReason', 'Failure Reason')}</Label>
                <div className="text-red-500">{transaction.failure_reason}</div>
              </div>
            )}
          </div>

          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.details.metadata', 'Metadata')}</Label>
              <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto">
                {JSON.stringify(transaction.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <span suppressHydrationWarning>{t('admin.payments.transactions.details.close', 'Close')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
