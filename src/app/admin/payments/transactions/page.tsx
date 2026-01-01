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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  payment_number?: number;
}

interface TransactionFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  search?: string;
  productId?: string;
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
  const [sortField, setSortField] = useState<keyof Transaction | null>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  // Fetch products for the dropdown filter
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch products:', response.status, errorData);
          return;
        }

        const responseData = await response.json();

        // The API returns products in the 'data' field, not 'products'
        if (responseData.success && responseData.data && Array.isArray(responseData.data)) {
          const mappedProducts = responseData.data.map((p: any) => ({ id: p.id, title: p.title }));
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
      if (filters.productId) params.append('productId', filters.productId);

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
        return <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />;
      case 'failed':
        return <XCircle className="h-4 w-4" style={{ color: 'hsl(var(--destructive))' }} />;
      case 'refunded':
        return <RotateCcw className="h-4 w-4 text-muted-foreground" />;
      case 'partially_refunded':
        return <RotateCcw className="h-4 w-4" style={{ color: 'hsl(var(--warning))' }} />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
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

  const translatePaymentType = (paymentType: string) => {
    const normalizedType = paymentType?.toLowerCase() || 'unknown';
    const typeLabels: Record<string, string> = {
      deposit: t('admin.payments.paymentType.deposit', 'Deposit'),
      installment: t('admin.payments.paymentType.installment', 'Installment'),
      subscription: t('admin.payments.paymentType.subscription', 'Subscription'),
      full: t('admin.payments.paymentType.full', 'Full Payment'),
      unknown: t('admin.payments.paymentType.unknown', 'Unknown'),
    };

    return typeLabels[normalizedType] || t(`admin.payments.paymentType.${normalizedType}`, paymentType);
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

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Transaction) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const sortedTransactions = React.useMemo(() => {
    // First, add payment_number from metadata to each transaction
    const transactionsWithPaymentNumber = transactions.map(t => ({
      ...t,
      payment_number: t.metadata?.payment_number || null
    }));

    if (!sortField) return transactionsWithPaymentNumber;

    return [...transactionsWithPaymentNumber].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to comparable values
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortField, sortDirection]);

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
              <CheckCircle2 className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
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
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label suppressHydrationWarning>{t('admin.payments.transactions.search', 'Search')}</Label>
                <Input
                  placeholder={t('admin.payments.transactions.searchPlaceholder', 'Search by user, email, or transaction ID...')}
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div>
                <Label suppressHydrationWarning>
                  {t('common.product', 'Product')}
                  {products.length > 0 && <span className="text-xs text-muted-foreground" style={{ marginLeft: isRtl ? '0' : '0.5rem', marginRight: isRtl ? '0.5rem' : '0' }}>({products.length})</span>}
                </Label>
                <Select
                  value={filters.productId || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, productId: value === 'all' ? undefined : value })}
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
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.date', 'Date')}</span>
                        {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('user_name')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.user', 'User')}</span>
                        {getSortIcon('user_name')}
                      </button>
                    </th>
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('product_name')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.product', 'Product')}</span>
                        {getSortIcon('product_name')}
                      </button>
                    </th>
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('payment_number')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.installmentNumber', 'Installment #')}</span>
                        {getSortIcon('payment_number')}
                      </button>
                    </th>
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.amount', 'Amount')}</span>
                        {getSortIcon('amount')}
                      </button>
                    </th>
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('payment_method')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.paymentType', 'Payment Type')}</span>
                        {getSortIcon('payment_method')}
                      </button>
                    </th>
                    <th className="p-4 font-medium">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <span suppressHydrationWarning>{t('admin.payments.transactions.table.status', 'Status')}</span>
                        {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="p-4 font-medium" suppressHydrationWarning>{t('admin.payments.transactions.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((transaction) => (
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
                        <div className="text-sm">
                          {transaction.metadata?.payment_number || '-'}
                        </div>
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
                          {translatePaymentType(transaction.payment_method)}
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

            {sortedTransactions.length === 0 && !loadingTransactions && (
              <div className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>{t('admin.payments.transactions.noTransactionsFound', 'No Transactions Found')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning>
                  {t('admin.payments.transactions.noTransactionsMatch', 'No transactions match your current filters')}
                </p>
              </div>
            )}
          </CardContent>

          {/* Pagination Controls */}
          {sortedTransactions.length > 0 && (
            <div className={`border-t p-4 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="flex items-center gap-2">
                <Label suppressHydrationWarning>{t('admin.payments.transactions.pagination.rowsPerPage', 'Rows per page:')}</Label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction}>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {t('admin.payments.transactions.pagination.showing', `Showing ${startIndex + 1}-${Math.min(endIndex, sortedTransactions.length)} of ${sortedTransactions.length}`)}
                </span>
              </div>

              <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <span suppressHydrationWarning>{t('admin.payments.transactions.pagination.first', 'First')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span suppressHydrationWarning>{t('admin.payments.transactions.pagination.previous', 'Previous')}</span>
                </Button>
                <span className="text-sm px-4" suppressHydrationWarning>
                  {t('admin.payments.transactions.pagination.page', `Page ${currentPage} of ${totalPages}`)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span suppressHydrationWarning>{t('admin.payments.transactions.pagination.next', 'Next')}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <span suppressHydrationWarning>{t('admin.payments.transactions.pagination.last', 'Last')}</span>
                </Button>
              </div>
            </div>
          )}
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

  const translatePaymentType = (paymentType: string) => {
    const normalizedType = paymentType?.toLowerCase() || 'unknown';
    const typeLabels: Record<string, string> = {
      deposit: t('admin.payments.paymentType.deposit', 'Deposit'),
      installment: t('admin.payments.paymentType.installment', 'Installment'),
      subscription: t('admin.payments.paymentType.subscription', 'Subscription'),
      full: t('admin.payments.paymentType.full', 'Full Payment'),
      unknown: t('admin.payments.paymentType.unknown', 'Unknown'),
    };

    return typeLabels[normalizedType] || t(`admin.payments.paymentType.${normalizedType}`, paymentType);
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
                {(() => {
                  const statusLabels: Record<string, string> = {
                    completed: t('admin.payments.transactions.status.completed', 'Completed'),
                    pending: t('admin.payments.transactions.status.pending', 'Pending'),
                    failed: t('admin.payments.transactions.status.failed', 'Failed'),
                    refunded: t('admin.payments.transactions.status.refunded', 'Refunded'),
                    partially_refunded: t('admin.payments.transactions.status.partiallyRefunded', 'Partially Refunded'),
                  };
                  return <Badge suppressHydrationWarning>{statusLabels[transaction.status] || transaction.status}</Badge>;
                })()}
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
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.table.paymentType', 'Payment Type')}</Label>
              <div suppressHydrationWarning>{translatePaymentType(transaction.payment_method)}</div>
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
                <div className="text-lg font-bold" style={{ color: 'hsl(var(--destructive))' }} suppressHydrationWarning>
                  {new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: transaction.currency }).format(transaction.refund_amount)}
                </div>
              </div>
            )}
            {transaction.failure_reason && (
              <div className="col-span-2">
                <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.details.failureReason', 'Failure Reason')}</Label>
                <div style={{ color: 'hsl(var(--destructive))' }}>{transaction.failure_reason}</div>
              </div>
            )}
          </div>

          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <div>
              <Label className="text-muted-foreground" suppressHydrationWarning>{t('admin.payments.transactions.details.metadata', 'Metadata')}</Label>
              <div className="mt-2 p-4 bg-muted rounded-md space-y-2">
                {Object.entries(transaction.metadata).map(([key, value]) => {
                  // Translate common metadata field names
                  const fieldTranslations: Record<string, string> = {
                    'payment_number': t('admin.payments.transactions.details.metadata.paymentNumber', 'Payment Number'),
                    'payment_type': t('admin.payments.transactions.details.metadata.paymentType', 'Payment Type'),
                    'paid_date': t('admin.payments.transactions.details.metadata.paidDate', 'Paid Date'),
                    'scheduled_date': t('admin.payments.transactions.details.metadata.scheduledDate', 'Scheduled Date'),
                    'enrollment_id': t('admin.payments.transactions.details.metadata.enrollmentId', 'Enrollment ID'),
                    'schedule_id': t('admin.payments.transactions.details.metadata.scheduleId', 'Schedule ID'),
                  };

                  const translatedKey = fieldTranslations[key] || key.replace(/_/g, ' ');

                  // Translate the value if it's a payment_type
                  let displayValue: string;
                  if (typeof value === 'object' && value !== null) {
                    displayValue = JSON.stringify(value, null, 2);
                  } else if (value === null) {
                    displayValue = t('common.null', 'N/A');
                  } else if (key === 'payment_type') {
                    displayValue = translatePaymentType(String(value));
                  } else {
                    displayValue = String(value);
                  }

                  return (
                    <div key={key} className="grid grid-cols-3 gap-2 text-sm">
                      <div className="font-medium text-muted-foreground capitalize">
                        {translatedKey}:
                      </div>
                      <div className="col-span-2 font-mono text-xs break-all">
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
              </div>
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
