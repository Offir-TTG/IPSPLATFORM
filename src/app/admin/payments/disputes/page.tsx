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
import { Textarea } from '@/components/ui/textarea';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertTriangle,
  Filter,
  RefreshCw,
  Upload,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  ArrowLeft,
} from 'lucide-react';

interface Dispute {
  id: string;
  payment_id: string;
  transaction_id: string;
  stripe_dispute_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  product_name: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'needs_response' | 'under_review' | 'won' | 'lost' | 'closed';
  evidence_due_date?: string;
  created_at: string;
  updated_at: string;
  evidence_submitted: boolean;
}

interface DisputeFilters {
  status?: string;
  search?: string;
}

export default function DisputesPage() {
  const { t, direction, language, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loadingDisputes, setLoadingDisputes] = useState(true);
  const [filters, setFilters] = useState<DisputeFilters>({});
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoadingDisputes(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/payments/disputes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch disputes');
      const data = await response.json();
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.disputes.loadError', 'Failed to load disputes'),
        variant: 'destructive',
      });
    } finally {
      setLoadingDisputes(false);
    }
  };

  const handleSubmitEvidence = async (disputeId: string, evidence: any) => {
    try {
      const response = await fetch(`/api/admin/payments/disputes/${disputeId}/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evidence),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit evidence');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.disputes.evidenceSuccess', 'Evidence submitted successfully'),
      });
      setEvidenceDialogOpen(false);
      fetchDisputes();
    } catch (error: any) {
      console.error('Error submitting evidence:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.disputes.evidenceError', 'Failed to submit evidence'),
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'lost':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'needs_response':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'closed':
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      won: 'default',
      lost: 'destructive',
      needs_response: 'destructive',
      under_review: 'secondary',
      closed: 'outline',
    };

    const statusLabels: Record<string, string> = {
      needs_response: t('admin.payments.disputes.status.needsResponse', 'Needs Response'),
      under_review: t('admin.payments.disputes.status.underReview', 'Under Review'),
      won: t('admin.payments.disputes.status.won', 'Won'),
      lost: t('admin.payments.disputes.status.lost', 'Lost'),
      closed: t('admin.payments.disputes.status.closed', 'Closed'),
    };

    return <Badge variant={variants[status] || 'outline'}>{statusLabels[status] || status}</Badge>;
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

  const isOverdue = (dispute: Dispute) => {
    if (!dispute.evidence_due_date) return false;
    return new Date(dispute.evidence_due_date) < new Date();
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
              }}>{t('admin.payments.disputes.title', 'Payment Disputes')}</h1>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.disputes.description', 'Manage chargebacks and payment disputes')}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => fetchDisputes()}>
            <RefreshCw className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span suppressHydrationWarning>{t('admin.payments.disputes.refresh', 'Refresh')}</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.disputes.totalDisputes', 'Total Disputes')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disputes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.disputes.needsResponse', 'Needs Response')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes.filter(d => d.status === 'needs_response').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.disputes.won', 'Won')}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes.filter(d => d.status === 'won').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium" suppressHydrationWarning>{t('admin.payments.disputes.lost', 'Lost')}</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {disputes.filter(d => d.status === 'lost').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t('admin.payments.disputes.filters', 'Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>{t('admin.payments.disputes.search', 'Search')}</Label>
                <Input
                  placeholder={t('admin.payments.disputes.searchPlaceholder', 'User name, email, or dispute ID')}
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>

              <div>
                <Label>{t('admin.payments.disputes.table.status', 'Status')}</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('admin.payments.disputes.allStatuses', 'All Statuses')}</SelectItem>
                    <SelectItem value="needs_response">{t('admin.payments.disputes.status.needsResponse', 'Needs Response')}</SelectItem>
                    <SelectItem value="under_review">{t('admin.payments.disputes.status.underReview', 'Under Review')}</SelectItem>
                    <SelectItem value="won">{t('admin.payments.disputes.status.won', 'Won')}</SelectItem>
                    <SelectItem value="lost">{t('admin.payments.disputes.status.lost', 'Lost')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  {t('admin.payments.disputes.clearFilters', 'Clear Filters')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Urgent Disputes Alert */}
        {disputes.filter(d => d.status === 'needs_response' && isOverdue(d)).length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('admin.payments.disputes.urgent', 'Urgent')}:</strong> {t('admin.payments.disputes.urgentMessage', '{count} dispute(s) have passed their evidence deadline!').replace('{count}', disputes.filter(d => d.status === 'needs_response' && isOverdue(d)).length.toString())}
            </AlertDescription>
          </Alert>
        )}

        {/* Disputes Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.created', 'Created')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.user', 'User')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.product', 'Product')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.amount', 'Amount')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.reason', 'Reason')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.status', 'Status')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.evidenceDue', 'Evidence Due')}</th>
                    <th className="p-4 font-medium">{t('admin.payments.disputes.table.actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="text-sm">{formatDate(dispute.created_at)}</div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{dispute.user_name}</div>
                          <div className="text-sm text-muted-foreground">{dispute.user_email}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{dispute.product_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-red-500">
                          {formatCurrency(dispute.amount, dispute.currency)}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize">
                          {dispute.reason.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(dispute.status)}
                          {getStatusBadge(dispute.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        {dispute.evidence_due_date ? (
                          <div className={isOverdue(dispute) ? 'text-red-500 font-medium' : ''}>
                            {formatDate(dispute.evidence_due_date)}
                            {isOverdue(dispute) && <div className="text-xs">{t('admin.payments.disputes.overdue', 'OVERDUE')}</div>}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {dispute.status === 'needs_response' && !dispute.evidence_submitted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setEvidenceDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {disputes.length === 0 && !loadingDisputes && (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>{t('admin.payments.disputes.noDisputes', 'No Disputes')}</h3>
                <p className="text-muted-foreground" suppressHydrationWarning>
                  {t('admin.payments.disputes.noDisputesDescription', 'There are no payment disputes at this time')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <DisputeDetailsDialog
          open={detailsDialogOpen}
          dispute={selectedDispute}
          onClose={() => setDetailsDialogOpen(false)}
        />

        {/* Evidence Dialog */}
        <EvidenceDialog
          open={evidenceDialogOpen}
          dispute={selectedDispute}
          onClose={() => setEvidenceDialogOpen(false)}
          onSubmit={handleSubmitEvidence}
        />
      </div>
    </AdminLayout>
  );
}

// Dispute Details Dialog
function DisputeDetailsDialog({
  open,
  dispute,
  onClose,
}: {
  open: boolean;
  dispute: Dispute | null;
  onClose: () => void;
}) {
  const { t } = useAdminLanguage();

  if (!dispute) return null;

  const statusLabels: Record<string, string> = {
    needs_response: t('admin.payments.disputes.status.needsResponse', 'Needs Response'),
    under_review: t('admin.payments.disputes.status.underReview', 'Under Review'),
    won: t('admin.payments.disputes.status.won', 'Won'),
    lost: t('admin.payments.disputes.status.lost', 'Lost'),
    closed: t('admin.payments.disputes.status.closed', 'Closed'),
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('admin.payments.disputes.details.title', 'Dispute Details')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.disputeId', 'Dispute ID')}</Label>
              <div className="font-mono text-sm">{dispute.stripe_dispute_id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.table.status', 'Status')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{statusLabels[dispute.status] || dispute.status}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.user', 'User')}</Label>
              <div>{dispute.user_name}</div>
              <div className="text-sm text-muted-foreground">{dispute.user_email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.product', 'Product')}</Label>
              <div>{dispute.product_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.amount', 'Amount')}</Label>
              <div className="text-lg font-bold text-red-500">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: dispute.currency }).format(dispute.amount)}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.reason', 'Reason')}</Label>
              <div className="capitalize">{dispute.reason.replace('_', ' ')}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.created', 'Created')}</Label>
              <div>{new Date(dispute.created_at).toLocaleString()}</div>
            </div>
            {dispute.evidence_due_date && (
              <div>
                <Label className="text-muted-foreground">{t('admin.payments.disputes.details.evidenceDue', 'Evidence Due')}</Label>
                <div>{new Date(dispute.evidence_due_date).toLocaleString()}</div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.transactionId', 'Transaction ID')}</Label>
              <div className="font-mono text-sm">{dispute.transaction_id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">{t('admin.payments.disputes.details.evidenceSubmitted', 'Evidence Submitted')}</Label>
              <div>{dispute.evidence_submitted ? t('admin.payments.disputes.details.yes', 'Yes') : t('admin.payments.disputes.details.no', 'No')}</div>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {t('admin.payments.disputes.details.stripeAlert', 'View full dispute details and submit evidence in the Stripe Dashboard.')}
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('admin.payments.disputes.details.close', 'Close')}
          </Button>
          <Button onClick={() => window.open(`https://dashboard.stripe.com/disputes/${dispute.stripe_dispute_id}`, '_blank')}>
            {t('admin.payments.disputes.details.openInStripe', 'Open in Stripe')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Evidence Submission Dialog
function EvidenceDialog({
  open,
  dispute,
  onClose,
  onSubmit,
}: {
  open: boolean;
  dispute: Dispute | null;
  onClose: () => void;
  onSubmit: (disputeId: string, evidence: any) => void;
}) {
  const { t } = useAdminLanguage();
  const [evidence, setEvidence] = useState({
    customer_name: '',
    customer_email: '',
    customer_purchase_ip: '',
    receipt_url: '',
    shipping_tracking_number: '',
    product_description: '',
    customer_communication: '',
  });

  useEffect(() => {
    if (dispute) {
      setEvidence({
        customer_name: dispute.user_name,
        customer_email: dispute.user_email,
        customer_purchase_ip: '',
        receipt_url: '',
        shipping_tracking_number: '',
        product_description: dispute.product_name,
        customer_communication: '',
      });
    }
  }, [dispute]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dispute) {
      onSubmit(dispute.id, evidence);
    }
  };

  if (!dispute) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.payments.disputes.evidence.title', 'Submit Dispute Evidence')}</DialogTitle>
          <DialogDescription>
            {t('admin.payments.disputes.evidence.description', 'Provide evidence to contest the dispute for {user}').replace('{user}', dispute.user_name)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('admin.payments.disputes.evidence.deadlineAlert', 'Evidence must be submitted by {date}. Submit comprehensive evidence to increase chances of winning.').replace('{date}', dispute.evidence_due_date ? new Date(dispute.evidence_due_date).toLocaleDateString() : 'the deadline')}
            </AlertDescription>
          </Alert>

          <div>
            <Label>{t('admin.payments.disputes.evidence.customerName', 'Customer Name')}</Label>
            <Input
              value={evidence.customer_name}
              onChange={(e) => setEvidence({ ...evidence, customer_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>{t('admin.payments.disputes.evidence.customerEmail', 'Customer Email')}</Label>
            <Input
              type="email"
              value={evidence.customer_email}
              onChange={(e) => setEvidence({ ...evidence, customer_email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>{t('admin.payments.disputes.evidence.customerPurchaseIp', 'Customer Purchase IP')}</Label>
            <Input
              value={evidence.customer_purchase_ip}
              onChange={(e) => setEvidence({ ...evidence, customer_purchase_ip: e.target.value })}
              placeholder={t('admin.payments.disputes.evidence.customerPurchaseIpPlaceholder', 'e.g., 192.168.1.1')}
            />
          </div>

          <div>
            <Label>{t('admin.payments.disputes.evidence.receiptUrl', 'Receipt URL')}</Label>
            <Input
              type="url"
              value={evidence.receipt_url}
              onChange={(e) => setEvidence({ ...evidence, receipt_url: e.target.value })}
              placeholder={t('admin.payments.disputes.evidence.receiptUrlPlaceholder', 'https://...')}
            />
          </div>

          <div>
            <Label>{t('admin.payments.disputes.evidence.productDescription', 'Product Description')}</Label>
            <Textarea
              value={evidence.product_description}
              onChange={(e) => setEvidence({ ...evidence, product_description: e.target.value })}
              placeholder={t('admin.payments.disputes.evidence.productDescriptionPlaceholder', 'Detailed description of the product/service provided')}
              required
            />
          </div>

          <div>
            <Label>{t('admin.payments.disputes.evidence.customerCommunication', 'Customer Communication')}</Label>
            <Textarea
              value={evidence.customer_communication}
              onChange={(e) => setEvidence({ ...evidence, customer_communication: e.target.value })}
              placeholder={t('admin.payments.disputes.evidence.customerCommunicationPlaceholder', 'Any email exchanges, support tickets, or other communications with the customer')}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit">
              {t('admin.payments.disputes.evidence.submit', 'Submit Evidence')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
