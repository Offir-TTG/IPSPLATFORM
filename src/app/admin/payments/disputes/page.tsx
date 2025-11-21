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
import { Textarea } from '@/components/ui/textarea';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
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
  const { t } = useAdminLanguage();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DisputeFilters>({});
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, [filters]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/payments/disputes?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch disputes');
      const data = await response.json();
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
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

      toast.success('Evidence submitted successfully');
      setEvidenceDialogOpen(false);
      fetchDisputes();
    } catch (error: any) {
      console.error('Error submitting evidence:', error);
      toast.error(error.message || 'Failed to submit evidence');
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

  const isOverdue = (dispute: Dispute) => {
    if (!dispute.evidence_due_date) return false;
    return new Date(dispute.evidence_due_date) < new Date();
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
              <h1 className="text-3xl font-bold">Payment Disputes</h1>
              <p className="text-muted-foreground mt-1">
                Manage chargebacks and payment disputes
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => fetchDisputes()}>
            <RefreshCw className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Disputes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{disputes.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Needs Response</CardTitle>
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
              <CardTitle className="text-sm font-medium">Won</CardTitle>
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
              <CardTitle className="text-sm font-medium">Lost</CardTitle>
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
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Search</Label>
                <Input
                  placeholder="User name, email, or dispute ID"
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
                    <SelectItem value="needs_response">Needs Response</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
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

        {/* Urgent Disputes Alert */}
        {disputes.filter(d => d.status === 'needs_response' && isOverdue(d)).length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Urgent:</strong> {disputes.filter(d => d.status === 'needs_response' && isOverdue(d)).length} dispute(s) have passed their evidence deadline!
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
                    <th className="p-4 font-medium">Created</th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">Amount</th>
                    <th className="p-4 font-medium">Reason</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Evidence Due</th>
                    <th className="p-4 font-medium">Actions</th>
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
                            {isOverdue(dispute) && <div className="text-xs">OVERDUE</div>}
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

            {disputes.length === 0 && !loading && (
              <div className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">No Disputes</h3>
                <p className="text-muted-foreground">
                  There are no payment disputes at this time
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
  if (!dispute) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dispute Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Dispute ID</Label>
              <div className="font-mono text-sm">{dispute.stripe_dispute_id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <Badge>{dispute.status}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">User</Label>
              <div>{dispute.user_name}</div>
              <div className="text-sm text-muted-foreground">{dispute.user_email}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Product</Label>
              <div>{dispute.product_name}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Amount</Label>
              <div className="text-lg font-bold text-red-500">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: dispute.currency }).format(dispute.amount)}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Reason</Label>
              <div className="capitalize">{dispute.reason.replace('_', ' ')}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <div>{new Date(dispute.created_at).toLocaleString()}</div>
            </div>
            {dispute.evidence_due_date && (
              <div>
                <Label className="text-muted-foreground">Evidence Due</Label>
                <div>{new Date(dispute.evidence_due_date).toLocaleString()}</div>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Transaction ID</Label>
              <div className="font-mono text-sm">{dispute.transaction_id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Evidence Submitted</Label>
              <div>{dispute.evidence_submitted ? 'Yes' : 'No'}</div>
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              View full dispute details and submit evidence in the Stripe Dashboard.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.open(`https://dashboard.stripe.com/disputes/${dispute.stripe_dispute_id}`, '_blank')}>
            Open in Stripe
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
          <DialogTitle>Submit Dispute Evidence</DialogTitle>
          <DialogDescription>
            Provide evidence to contest the dispute for {dispute.user_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Evidence must be submitted by {dispute.evidence_due_date ? new Date(dispute.evidence_due_date).toLocaleDateString() : 'the deadline'}.
              Submit comprehensive evidence to increase chances of winning.
            </AlertDescription>
          </Alert>

          <div>
            <Label>Customer Name</Label>
            <Input
              value={evidence.customer_name}
              onChange={(e) => setEvidence({ ...evidence, customer_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Customer Email</Label>
            <Input
              type="email"
              value={evidence.customer_email}
              onChange={(e) => setEvidence({ ...evidence, customer_email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Customer Purchase IP</Label>
            <Input
              value={evidence.customer_purchase_ip}
              onChange={(e) => setEvidence({ ...evidence, customer_purchase_ip: e.target.value })}
              placeholder="e.g., 192.168.1.1"
            />
          </div>

          <div>
            <Label>Receipt URL</Label>
            <Input
              type="url"
              value={evidence.receipt_url}
              onChange={(e) => setEvidence({ ...evidence, receipt_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label>Product Description</Label>
            <Textarea
              value={evidence.product_description}
              onChange={(e) => setEvidence({ ...evidence, product_description: e.target.value })}
              placeholder="Detailed description of the product/service provided"
              required
            />
          </div>

          <div>
            <Label>Customer Communication</Label>
            <Textarea
              value={evidence.customer_communication}
              onChange={(e) => setEvidence({ ...evidence, customer_communication: e.target.value })}
              placeholder="Any email exchanges, support tickets, or other communications with the customer"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Evidence
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
