'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
  TabCountBadge,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  CreditCard,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FileBarChart,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
} from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import { PaymentMethodsManager } from '@/components/user/PaymentMethodsManager';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Enrollment {
  id: string;
  product_name: string;
  product_type: string;
  total_amount: number;
  paid_amount: number;
  refunded_amount?: number;
  payment_status: string;
  enrolled_date: string;
  currency: string;
  payment_plan_name: string;
}

interface PaymentSchedule {
  id: string;
  payment_number: number;
  amount: number;
  currency: string;
  scheduled_date: string;
  original_due_date?: string;
  paid_date?: string;
  status: string;
  payment_type: string;
  product_name?: string;
  refunded_amount?: number;
  refunded_at?: string;
  refund_reason?: string;
  payment_status?: string;
  adjustment_history?: Array<{
    action: string;
    reason: string;
    admin_id: string;
    admin_name: string;
    new_date: string;
    old_date: string;
    timestamp: string;
  }>;
  adjusted_by?: string;
  adjustment_reason?: string;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  refund_amount?: number;
  currency: string;
  created: number;
  due_date: number | null;
  paid_at: number | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  description: string;
  metadata: Record<string, string>;
  locallyPaid?: boolean; // Flag to indicate payment was completed locally
}

export default function BillingPage() {
  const { t, language, direction } = useUserLanguage();
  const isRtl = language === 'he';

  // Enrollments state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Pagination state for payment schedules (per enrollment)
  const [paymentPages, setPaymentPages] = useState<Record<string, number>>({});
  const PAYMENTS_PER_PAGE = 10;

  // Sorting state for payment schedules (per enrollment)
  type SortField = 'payment_number' | 'payment_type' | 'scheduled_date' | 'amount' | 'refunded_amount' | 'paid_amount' | 'status';
  type SortDirection = 'asc' | 'desc';
  const [paymentSort, setPaymentSort] = useState<Record<string, { field: SortField; direction: SortDirection }>>({});

  // Billing sub-tab state
  const [billingSubTab, setBillingSubTab] = useState('enrollments');

  // PDF Export state
  const [exportingEnrollmentId, setExportingEnrollmentId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'schedule' | 'both'>('invoice');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'he'>((language as 'en' | 'he') || 'en');

  // Fetch enrollments on mount
  useEffect(() => {
    if (enrollments.length === 0) {
      fetchEnrollments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch invoices AFTER payment schedules are loaded
  useEffect(() => {
    if (paymentSchedules.length > 0 && invoices.length === 0) {
      console.log('[Billing] Payment schedules loaded, now fetching invoices');
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSchedules.length]);

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const response = await fetch('/api/enrollments');
      const data = await response.json();

      if (data.enrollments) {
        const formatted = data.enrollments.map((e: any) => {
          // Debug: Log the enrollment data
          console.log('[Billing] Enrollment data:', {
            id: e.id,
            payment_plan_id: e.payment_plan_id,
            payment_plans: e.payment_plans,
            product_title: e.products?.title,
            product_payment_model: e.products?.payment_model,
            product_payment_plan: e.products?.payment_plan
          });

          // Derive payment plan name:
          // 1. Use payment_plans template if enrollment has payment_plan_id
          // 2. Otherwise, derive from product's payment_model and payment_plan
          let paymentPlanName = t('user.profile.billing.fullPayment', 'Full Payment');

          if (e.payment_plan_id && e.payment_plans?.plan_name) {
            // Using payment plan template
            paymentPlanName = e.payment_plans.plan_name;
          } else if (e.products?.payment_model && e.products?.payment_plan) {
            // Derive from product's embedded payment configuration
            const model = e.products.payment_model;
            const plan = e.products.payment_plan;

            if (model === 'one_time') {
              paymentPlanName = t('user.profile.billing.oneTimePayment', 'One-Time Payment');
            } else if (model === 'deposit_then_plan') {
              const installments = plan.installments || 1;
              paymentPlanName = t('user.profile.billing.depositPlusInstallments', `Deposit + ${installments} Installments`);
            } else if (model === 'subscription') {
              const interval = plan.subscription_interval || 'monthly';
              paymentPlanName = t('user.profile.billing.subscription', 'Subscription') + ` (${interval})`;
            } else if (model === 'free') {
              paymentPlanName = t('user.profile.billing.free', 'Free');
            }
          }

          // Calculate total refunded from payment schedules
          const schedules = e.payment_schedules || [];
          const refundedAmount = schedules.reduce((sum: number, schedule: any) => {
            return sum + (parseFloat(schedule.refunded_amount?.toString() || '0'));
          }, 0);

          return {
            id: e.id,
            product_name: e.products.title || e.products.product_name,
            product_type: e.products.type || e.products.product_type,
            total_amount: e.total_amount,
            paid_amount: e.paid_amount,
            refunded_amount: refundedAmount,
            payment_status: e.payment_status,
            enrolled_date: e.enrolled_date || e.created_at,
            currency: e.products.currency || 'ILS',
            payment_plan_name: paymentPlanName,
          };
        });
        setEnrollments(formatted);

        // Fetch payment schedules for all enrollments
        const allSchedules: PaymentSchedule[] = [];
        const updatedEnrollments = [...formatted];

        for (let i = 0; i < formatted.length; i++) {
          const enrollment = formatted[i];
          try {
            const scheduleRes = await fetch(`/api/enrollments/${enrollment.id}/payment`);
            const scheduleData = await scheduleRes.json();

            // Debug: Log the schedule data
            console.log('[Billing] Schedule data for enrollment', enrollment.id, ':', {
              payment_plan: scheduleData.payment_plan
            });

            // Update enrollment with actual payment plan information
            if (scheduleData.payment_plan) {
              console.log('[Billing] Updating enrollment payment plan name to:', scheduleData.payment_plan.plan_name);
              updatedEnrollments[i] = {
                ...enrollment,
                payment_plan_name: scheduleData.payment_plan.plan_name || t('user.profile.billing.fullPayment', 'Full Payment'),
              };
            }

            if (scheduleData.schedules) {
              // DEBUG: Log each schedule to see if refunded_amount is present
              console.log('[Billing] Schedules received from API:', scheduleData.schedules.length);
              scheduleData.schedules.forEach((s: any) => {
                if (s.refunded_amount) {
                  console.log(`[Billing] Schedule #${s.payment_number} has refunded_amount:`, s.refunded_amount);
                }
              });

              const schedulesWithProduct = scheduleData.schedules.map((s: any) => ({
                ...s,
                product_name: enrollment.product_name,
              }));
              allSchedules.push(...schedulesWithProduct);
            }
          } catch (error) {
            console.error(`Error fetching schedules for enrollment ${enrollment.id}:`, error);
          }
        }

        setEnrollments(updatedEnrollments);

        // Sort schedules by date (most recent first for paid, earliest first for pending)
        const sortedSchedules = allSchedules.sort((a, b) => {
          if (a.status === 'paid' && b.status === 'paid') {
            return new Date(b.paid_date || b.scheduled_date).getTime() - new Date(a.paid_date || a.scheduled_date).getTime();
          }
          return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        });

        setPaymentSchedules(sortedSchedules);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error(t('user.profile.billing.errorLoading', 'Failed to load enrollment data'));
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await fetch('/api/user/invoices');
      const data = await response.json();

      if (data.success && data.invoices) {
        console.log('[Billing] fetchInvoices - Starting invoice enrichment');
        console.log('[Billing] Payment schedules available:', paymentSchedules.length);

        // Create a set of paid payment_schedule_ids from existing payment schedules
        // This prevents showing "Pay Now" for payments that were manually charged by admin
        const paidSchedules = new Set<string>();

        // Also create a map of stripe_invoice_id -> payment_schedule for direct matching
        const paidSchedulesByStripeInvoice = new Map<string, string>();

        // Use existing paymentSchedules state which is already fetched
        paymentSchedules.forEach((schedule: any) => {
          if (schedule.status === 'paid') {
            paidSchedules.add(schedule.id);

            // Map Stripe invoice ID to schedule ID for direct matching
            if (schedule.stripe_invoice_id) {
              paidSchedulesByStripeInvoice.set(schedule.stripe_invoice_id, schedule.id);
            }
          }
        });

        console.log('[Billing] Paid schedules count:', paidSchedules.size);
        console.log('[Billing] Paid schedules by Stripe invoice ID:', Array.from(paidSchedulesByStripeInvoice.keys()));

        // Enrich invoices with local payment status
        const enrichedInvoices = data.invoices.map((inv: Invoice) => {
          const matchedByInvoiceId = paidSchedulesByStripeInvoice.has(inv.id);

          // Check if invoice metadata has schedule_id (or payment_schedule_id for backwards compat) and if that schedule is paid
          const metadataScheduleId = inv.metadata?.schedule_id || inv.metadata?.payment_schedule_id;
          const matchedByMetadata = metadataScheduleId && paidSchedules.has(metadataScheduleId);

          // Mark as locally paid if EITHER:
          // 1. Invoice ID matches a paid schedule's stripe_invoice_id
          // 2. Invoice metadata payment_schedule_id matches a paid schedule (catches old failed invoices)
          const locallyPaid = matchedByInvoiceId || matchedByMetadata;

          console.log('[Billing] Invoice:', inv.id, {
            number: inv.number,
            status: inv.status,
            matchedByInvoiceId,
            matchedByMetadata,
            metadataScheduleId,
            locallyPaid,
            metadata: inv.metadata
          });

          return {
            ...inv,
            locallyPaid
          };
        });

        setInvoices(enrichedInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error(t('invoices.error_loading', 'Failed to load invoices'));
    } finally {
      setLoadingInvoices(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency || 'ILS',
    }).format(amount);
  };

  // Translate payment plan names
  const translatePaymentPlanName = (planName: string) => {
    // Map of English plan names to translation keys
    const planNameMap: Record<string, string> = {
      'Full Payment': 'user.profile.billing.fullPayment',
      'One-Time Payment': 'user.profile.billing.fullPayment',
      'Deposit + Installments': 'payment.plan.type.deposit',
      'Subscription': 'payment.plan.type.subscription',
      'Free': 'payment.plan.type.free',
    };

    const translationKey = planNameMap[planName];
    if (translationKey) {
      return t(translationKey, planName);
    }

    // If it's not a known English name, return as-is (might already be in Hebrew)
    return planName;
  };

  const getPaymentStatusBadge = (status: string) => {
    const badgeClass = isRtl ? 'flex flex-row-reverse gap-1' : 'flex gap-1';
    switch (status) {
      case 'paid':
        return (
          <Badge className={`bg-green-600 text-white ${badgeClass}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t('user.profile.billing.status.paid', 'Paid')}
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className={badgeClass}>
            <Clock className="h-3 w-3" />
            {t('user.profile.billing.status.partial', 'Partial')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={badgeClass}>
            <AlertCircle className="h-3 w-3" />
            {t('user.profile.billing.status.pending', 'Pending')}
          </Badge>
        );
    }
  };

  const getScheduleStatusBadge = (status: string) => {
    const badgeClass = isRtl ? 'flex flex-row-reverse gap-1' : 'flex gap-1';
    switch (status) {
      case 'paid':
        return (
          <Badge className={`bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 border ${badgeClass}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t('user.profile.billing.schedule.paid', 'Paid')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 border ${badgeClass}`}>
            <Clock className="h-3 w-3" />
            {t('user.profile.billing.schedule.pending', 'Pending')}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className={`bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 border ${badgeClass}`}>
            <AlertCircle className="h-3 w-3" />
            {t('user.profile.billing.schedule.overdue', 'Overdue')}
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className={`bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 border ${badgeClass}`}>
            <AlertCircle className="h-3 w-3" />
            {t('user.profile.billing.schedule.refunded', 'Refunded')}
          </Badge>
        );
      case 'partially_refunded':
        return (
          <Badge className={`bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 border ${badgeClass}`}>
            <AlertCircle className="h-3 w-3" />
            {t('user.profile.billing.schedule.partially_refunded', 'Partially Refunded')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    const badgeClass = isRtl ? 'flex flex-row-reverse gap-1' : 'flex gap-1';
    switch (status) {
      case 'paid':
        return (
          <Badge className={`bg-green-500 hover:bg-green-600 text-white ${badgeClass}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t('invoices.status.paid', 'Paid')}
          </Badge>
        );
      case 'refunded':
        return (
          <Badge className={`bg-purple-500 hover:bg-purple-600 text-white ${badgeClass}`}>
            <AlertCircle className="h-3 w-3" />
            {t('invoices.status.refunded', 'Refunded')}
          </Badge>
        );
      case 'partially_refunded':
        return (
          <Badge className={`bg-purple-400 hover:bg-purple-500 text-white ${badgeClass}`}>
            <AlertCircle className="h-3 w-3" />
            {t('invoices.status.partially_refunded', 'Partially Refunded')}
          </Badge>
        );
      case 'open':
        return (
          <Badge className={`bg-yellow-500 hover:bg-yellow-600 text-white ${badgeClass}`}>
            <Clock className="h-3 w-3" />
            {t('invoices.status.open', 'Open')}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className={badgeClass}>
            <AlertCircle className="h-3 w-3" />
            {t('invoices.status.overdue', 'Overdue')}
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className={badgeClass}>
            {t('invoices.status.draft', 'Draft')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={badgeClass}>
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Translate invoice descriptions client-side
  const translateInvoiceDescription = (description: string) => {
    if (!description) return t('invoices.defaultDescription', 'Invoice');

    let translated = description;

    // Replace "Invoice" as standalone word with translated version
    if (translated.trim() === 'Invoice') {
      return t('invoices.defaultDescription', 'Invoice');
    }

    // Replace "Payment #X" with translated version
    translated = translated.replace(/Payment #(\d+)/g, (match, number) => {
      return `${t('invoices.paymentNumber', 'Payment #')}${number}`;
    });

    // Replace "Payment for" with translated version
    translated = translated.replace(/Payment for /g, () => {
      return `${t('invoices.paymentFor', 'Payment for')} `;
    });

    // Replace any remaining "Invoice" words (not just standalone)
    translated = translated.replace(/\bInvoice\b/g, () => {
      return t('invoices.defaultDescription', 'Invoice');
    });

    return translated;
  };

  // Handler to open export dialog
  const handleOpenExportDialog = (enrollmentId: string) => {
    setSelectedEnrollmentId(enrollmentId);
    setSelectedDocType('invoice');
    const lang = (language === 'he' ? 'he' : 'en') as 'en' | 'he';
    setSelectedLanguage(lang);
    setShowExportDialog(true);
  };

  // Handler to export PDF with selected document type
  const handleExportPDF = async () => {
    if (!selectedEnrollmentId) return;

    setExportingEnrollmentId(selectedEnrollmentId);
    setShowExportDialog(false);

    try {
      const response = await fetch(`/api/user/enrollments/${selectedEnrollmentId}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentType: selectedDocType,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Set filename based on document type
      const prefix = selectedDocType === 'invoice' ? 'invoice' :
                     selectedDocType === 'schedule' ? 'payment-schedule' : 'combined';
      a.download = `${prefix}-${selectedEnrollmentId.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('user.profile.billing.pdfExported', 'PDF exported successfully'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('user.profile.billing.pdfExportError', 'Failed to export PDF'));
    } finally {
      setExportingEnrollmentId(null);
      setSelectedEnrollmentId(null);
    }
  };

  return (
    <div className="min-h-screen pb-12 p-4 md:p-0" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header — plain h1 + muted subtitle, matches the notifications
          page (no gradient hero card). */}
      <div className="mb-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1
              style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem',
              }}
              suppressHydrationWarning
            >
              {t('user.profile.tabs.billing', 'Billing')}
            </h1>
            <p
              style={{
                color: 'hsl(var(--text-muted))',
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-primary)',
              }}
              suppressHydrationWarning
            >
              {t('user.dashboard.payment.subtitle', 'Your enrollment payments at a glance')}
            </p>
          </div>
        </div>
      </div>

      {/* BILLING CONTENT */}
      <div className="space-y-6">
        {loadingEnrollments ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">{t('user.profile.billing.loading', 'Loading billing data...')}</p>
            </div>
          </Card>
        ) : enrollments.length === 0 && invoices.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
                <CreditCard className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('user.profile.billing.noEnrollments', 'No Enrollments Yet')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('user.profile.billing.noEnrollmentsDesc', "You haven't enrolled in any programs yet.")}
            </p>
            <Button variant="outline" asChild>
              <Link href="/courses">
                {t('user.profile.billing.browseCourses', 'Browse Courses')}
              </Link>
            </Button>
          </Card>
        ) : (
          <>
            {/* Summary Stats — matches the notifications page layout:
                small p-4 cards, label + big number on the start side,
                colored icon circle on the end side. */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.25rem',
                      }}
                      suppressHydrationWarning
                    >
                      {t('user.profile.billing.totalSpent', 'Total Spent')}
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--font-size-3xl)',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--success))',
                      }}
                    >
                      {formatCurrency(
                        enrollments.reduce(
                          (sum, e) => sum + (e.paid_amount - (e.refunded_amount || 0)),
                          0,
                        ),
                        enrollments[0]?.currency || 'ILS',
                      )}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--success) / 0.1)' }}
                  >
                    <CheckCircle2 className="h-6 w-6" style={{ color: 'hsl(var(--success))' }} />
                  </div>
                </div>
              </Card>

              <Card
                className="p-4 ltr:border-l-4 rtl:border-r-4"
                style={{ borderColor: 'hsl(var(--primary))' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.25rem',
                      }}
                      suppressHydrationWarning
                    >
                      {t('user.profile.billing.outstanding', 'Outstanding')}
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--font-size-3xl)',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      {formatCurrency(
                        enrollments.reduce((sum, e) => {
                          const netPaid = e.paid_amount - (e.refunded_amount || 0);
                          return sum + Math.max(0, e.total_amount - netPaid);
                        }, 0),
                        enrollments[0]?.currency || 'ILS',
                      )}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--primary) / 0.1)' }}
                  >
                    <Clock className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '0.25rem',
                      }}
                      suppressHydrationWarning
                    >
                      {t('user.profile.billing.activeEnrollments', 'Active Enrollments')}
                    </p>
                    <p
                      style={{
                        fontSize: 'var(--font-size-3xl)',
                        fontFamily: 'var(--font-family-heading)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'hsl(var(--text-heading))',
                      }}
                    >
                      {enrollments.length}
                    </p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--accent))' }}
                  >
                    <BookOpen
                      className="h-6 w-6"
                      style={{ color: 'hsl(var(--accent-foreground))' }}
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Billing Sub-Tabs — wrapped in a Card to match the
                notifications page pattern: tabs sit inside the card,
                the underline rail bleeds to the card edges, content
                renders in the card body. */}
            <Card>
              <Tabs value={billingSubTab} onValueChange={setBillingSubTab} className="w-full" dir={direction}>
                <div className="px-6 pt-6">
                  <div className="-mx-6 px-6 overflow-x-auto">
                    <UnderlineTabsList className="gap-6">
                      <UnderlineTabsTrigger value="enrollments">
                        <span>{t('user.profile.billing.enrollmentsTab', 'Enrollments')}</span>
                        <TabCountBadge n={enrollments.length} />
                      </UnderlineTabsTrigger>
                      <UnderlineTabsTrigger value="invoices">
                        <span>{t('invoices.stripeInvoices', 'Stripe Invoices')}</span>
                        <TabCountBadge n={invoices.length} />
                      </UnderlineTabsTrigger>
                      <UnderlineTabsTrigger value="payment-methods">
                        <span>{t('user.profile.billing.paymentMethodsTab', 'Payment Methods')}</span>
                      </UnderlineTabsTrigger>
                    </UnderlineTabsList>
                  </div>
                </div>

              {/* Enrollments Tab Content — no inner Card; the outer
                  Card provides the surface, p-6 padding gives breathing
                  room (matches notifications page). */}
              <TabsContent value="enrollments" className="p-6">
                  <h3 className="text-xl font-bold mb-6">
                    {t('user.profile.billing.myEnrollments', 'My Enrollments')}
                  </h3>

                  {enrollments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-semibold mb-2">
                        {t('user.profile.billing.noEnrollments', 'No Enrollments Yet')}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('user.profile.billing.noEnrollmentsDesc', "You haven't enrolled in any programs yet.")}
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/courses">
                          {t('user.profile.billing.browseCourses', 'Browse Courses')}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <Accordion type="multiple" className="space-y-4">
                {enrollments.map((enrollment) => {
                  const enrollmentPayments = paymentSchedules.filter(
                    schedule => schedule.product_name === enrollment.product_name
                  );

                  // Calculate total refunded amount for this enrollment
                  const totalRefunded = enrollmentPayments.reduce((sum, schedule) => {
                    return sum + (schedule.refunded_amount || 0);
                  }, 0);

                  // Sorting for this enrollment's payments (default: by payment_number ascending)
                  const sortConfig = paymentSort[enrollment.id] || { field: 'payment_number', direction: 'asc' };
                  const sortedPayments = [...enrollmentPayments].sort((a, b) => {
                    const { field, direction } = sortConfig;
                    let aValue: any;
                    let bValue: any;

                    // Handle calculated fields
                    if (field === 'refunded_amount') {
                      aValue = a.refunded_amount || 0;
                      bValue = b.refunded_amount || 0;
                    } else if (field === 'paid_amount') {
                      aValue = (a.amount || 0) - (a.refunded_amount || 0);
                      bValue = (b.amount || 0) - (b.refunded_amount || 0);
                    } else {
                      aValue = a[field];
                      bValue = b[field];
                    }

                    // Handle date sorting
                    if (field === 'scheduled_date') {
                      aValue = new Date(aValue).getTime();
                      bValue = new Date(bValue).getTime();
                    }

                    // Handle numeric sorting
                    if (field === 'payment_number' || field === 'amount' || field === 'refunded_amount' || field === 'paid_amount') {
                      aValue = Number(aValue);
                      bValue = Number(bValue);
                    }

                    // Handle string sorting
                    if (typeof aValue === 'string') {
                      aValue = aValue.toLowerCase();
                      bValue = bValue.toLowerCase();
                    }

                    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
                    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
                    return 0;
                  });

                  // Pagination for this enrollment's payments
                  const currentPage = paymentPages[enrollment.id] || 1;
                  const totalPaymentPages = Math.ceil(sortedPayments.length / PAYMENTS_PER_PAGE);
                  const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
                  const endIndex = startIndex + PAYMENTS_PER_PAGE;
                  const paginatedPayments = sortedPayments.slice(startIndex, endIndex);

                  const handlePageChange = (enrollmentId: string, newPage: number) => {
                    setPaymentPages(prev => ({
                      ...prev,
                      [enrollmentId]: newPage
                    }));
                  };

                  const handleSort = (enrollmentId: string, field: SortField) => {
                    setPaymentSort(prev => {
                      const current = prev[enrollmentId] || { field: 'payment_number', direction: 'asc' };
                      const newDirection = current.field === field && current.direction === 'asc' ? 'desc' : 'asc';
                      return {
                        ...prev,
                        [enrollmentId]: { field, direction: newDirection }
                      };
                    });
                    // Reset to first page when sorting changes
                    handlePageChange(enrollmentId, 1);
                  };

                  return (
                    <AccordionItem
                      key={enrollment.id}
                      value={enrollment.id}
                      className="border-none"
                    >
                      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                        <div className="p-6">
                          {/* Top: Header with Icon, Title, and Badge */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border-2 border-primary/10 group-hover:scale-105 transition-transform">
                                <BookOpen className="h-8 w-8 text-primary" />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                                  <h4 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
                                    {enrollment.product_name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {t(`product.type.${enrollment.product_type}`, enrollment.product_type)}
                                  </p>
                                </div>
                                {getPaymentStatusBadge(enrollment.payment_status)}
                              </div>
                            </div>
                          </div>

                          <Separator className="mb-4" />

                          {/* Middle: Info Grid */}
                          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {t('user.profile.billing.enrolled', 'Enrolled')}
                              </p>
                              <p className="text-sm font-medium">
                                {new Date(enrollment.enrolled_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">
                                {t('user.profile.billing.paymentPlan', 'Payment Plan')}
                              </p>
                              <p className="text-sm font-medium">
                                {translatePaymentPlanName(enrollment.payment_plan_name)}
                              </p>
                            </div>
                          </div>

                          {/* Payment Progress — guard against div-by-zero
                              (free enrollments have total_amount = 0,
                              which produced "Infinity%" before this
                              fix). Clamp to [0,100] so refunds > paid
                              or overpayments don't bleed past the bar. */}
                          {(() => {
                            const netPaid = enrollment.paid_amount - totalRefunded;
                            const progressPct = enrollment.total_amount > 0
                              ? Math.min(100, Math.max(0, (netPaid / enrollment.total_amount) * 100))
                              : 0;
                            return (
                          <div className="space-y-2 p-4 bg-muted/30 rounded-lg mb-4">
                            <div className={`flex items-center justify-between text-sm mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <span className="font-medium text-muted-foreground">
                                {t('user.profile.billing.paymentProgress', 'Payment Progress')}
                              </span>
                              <span className="font-bold">
                                {formatCurrency(netPaid, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                              </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                              <div
                                className={`bg-gradient-to-r from-primary to-primary/80 h-3 transition-all duration-500 flex items-center px-2 ${isRtl ? 'rounded-r-full justify-start' : 'rounded-l-full justify-end'}`}
                                style={{
                                  width: `${progressPct}%`,
                                  [isRtl ? 'marginLeft' : 'marginRight']: 'auto',
                                  [isRtl ? 'marginRight' : 'marginLeft']: '0'
                                }}
                              >
                                {netPaid > 0 && (
                                  <span className="text-[10px] font-bold text-white">
                                    {Math.round(progressPct)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Show refund information if any */}
                            {totalRefunded > 0 && (
                              <p className={`text-xs font-medium text-purple-600 dark:text-purple-400 pt-2 border-t border-border/50 ${isRtl ? 'text-right' : 'text-left'}`}>
                                {t('user.profile.billing.totalRefunded', 'Total Refunded')}: {formatCurrency(totalRefunded, enrollment.currency)}
                              </p>
                            )}

                            {enrollment.payment_status !== 'paid' && (
                              <p className={`text-xs font-medium text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                                {t('user.profile.billing.remaining', 'Remaining')}: {formatCurrency(enrollment.total_amount - (enrollment.paid_amount - totalRefunded), enrollment.currency)}
                              </p>
                            )}
                          </div>
                            );
                          })()}

                          {/* Payment History Toggle */}
                          {enrollmentPayments.length > 0 && (
                            <>
                              <Separator className="mb-3" />
                              <AccordionTrigger className="hover:no-underline py-2">
                                <div className="flex items-center gap-2 w-full">
                                  {isRtl ? (
                                    <>
                                      <Receipt className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium text-right">
                                        {t('user.profile.billing.paymentHistory', 'Payment History')}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        ({enrollmentPayments.filter(p => p.status === 'paid').length}/{enrollmentPayments.length})
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Receipt className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium flex-1 text-left">
                                        {t('user.profile.billing.paymentHistory', 'Payment History')}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        ({enrollmentPayments.filter(p => p.status === 'paid').length}/{enrollmentPayments.length})
                                      </span>
                                    </>
                                  )}
                                </div>
                              </AccordionTrigger>
                            </>
                          )}

                          {/* Export PDF Button */}
                          <Separator className="mt-3" />
                          <div className="flex gap-2 p-4 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenExportDialog(enrollment.id)}
                              disabled={exportingEnrollmentId === enrollment.id}
                            >
                              {exportingEnrollmentId === enrollment.id ? (
                                <>
                                  <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                  {t('user.profile.billing.exportingPdf', 'Exporting...')}
                                </>
                              ) : (
                                <>
                                  <FileText className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                                  {t('user.profile.billing.exportPdf', 'Export PDF')}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Payment History Content */}
                        {enrollmentPayments.length > 0 && (
                          <AccordionContent>
                            <div className="px-6 pb-6 pt-2 bg-muted/5" dir={isRtl ? 'rtl' : 'ltr'}>
                              {/* Table Header */}
                              <div className={`grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-medium text-muted-foreground border-b mb-2`}>
                                {/* # - Sortable */}
                                <div
                                  className={`col-span-1 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 ${isRtl ? 'text-right flex-row-reverse justify-end' : 'text-left'}`}
                                  onClick={() => handleSort(enrollment.id, 'payment_number')}
                                >
                                  <span>#</span>
                                  {sortConfig.field === 'payment_number' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>

                                {/* Type - Sortable */}
                                <div
                                  className={`col-span-2 hidden lg:flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors ${isRtl ? 'text-right flex-row-reverse justify-end' : 'text-left'}`}
                                  onClick={() => handleSort(enrollment.id, 'payment_type')}
                                >
                                  <span>{t('user.profile.billing.type', 'Type')}</span>
                                  {sortConfig.field === 'payment_type' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>

                                {/* Due Date - Sortable */}
                                <div
                                  className={`col-span-3 lg:col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 ${isRtl ? 'text-right flex-row-reverse justify-end' : 'text-left'}`}
                                  onClick={() => handleSort(enrollment.id, 'scheduled_date')}
                                >
                                  <span>{t('user.profile.billing.dueDate', 'Due Date')}</span>
                                  {sortConfig.field === 'scheduled_date' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>

                                {/* Original - Sortable */}
                                <div
                                  className={`col-span-2 hidden md:flex items-center gap-1 justify-end ${isRtl ? 'text-right flex-row-reverse' : 'text-right'} cursor-pointer hover:text-foreground transition-colors`}
                                  onClick={() => handleSort(enrollment.id, 'amount')}
                                >
                                  <span>{t('user.profile.billing.originalAmount', 'Original')}</span>
                                  {sortConfig.field === 'amount' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>

                                {/* Refunded - Sortable */}
                                <div
                                  className={`col-span-2 hidden lg:flex items-center gap-1 justify-end ${isRtl ? 'text-right flex-row-reverse' : 'text-right'} cursor-pointer hover:text-foreground transition-colors`}
                                  onClick={() => handleSort(enrollment.id, 'refunded_amount')}
                                >
                                  <span>{t('user.profile.billing.refundedAmount', 'Refunded')}</span>
                                  {sortConfig.field === 'refunded_amount' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>

                                {/* Paid - Sortable */}
                                <div
                                  className={`col-span-3 md:col-span-2 lg:col-span-1 flex items-center gap-1 justify-end ${isRtl ? 'text-right flex-row-reverse' : 'text-right'} cursor-pointer hover:text-foreground transition-colors`}
                                  onClick={() => handleSort(enrollment.id, 'paid_amount')}
                                >
                                  <span>{t('user.profile.billing.paidAmount', 'Paid')}</span>
                                  {sortConfig.field === 'paid_amount' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>

                                {/* Status - Sortable */}
                                <div
                                  className={`col-span-3 md:col-span-2 lg:col-span-2 flex items-center gap-1 justify-end ${isRtl ? 'text-right flex-row-reverse' : 'text-right'} cursor-pointer hover:text-foreground transition-colors`}
                                  onClick={() => handleSort(enrollment.id, 'status')}
                                >
                                  <span>{t('user.profile.billing.paymentStatus', 'Status')}</span>
                                  {sortConfig.field === 'status' ? (
                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                                  ) : (
                                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                                  )}
                                </div>
                              </div>

                              {/* Payment Rows */}
                              <div className="space-y-1">
                                {paginatedPayments.map((schedule) => {
                                  const originalAmount = schedule.amount;
                                  const refundedAmount = schedule.refunded_amount || 0;
                                  const paidAmount = originalAmount - refundedAmount;
                                  const hasDateAdjustment = schedule.original_due_date && schedule.original_due_date !== schedule.scheduled_date;

                                  return (
                                    <div key={schedule.id} className={`grid grid-cols-12 gap-3 px-4 py-2.5 rounded-md hover:bg-muted/30 transition-colors items-center ${isRtl ? 'text-right' : 'text-left'}`}>
                                      {/* Payment Number */}
                                      <div className="col-span-1">
                                        <span className="text-xs font-semibold text-foreground">
                                          {schedule.payment_number}
                                        </span>
                                      </div>

                                      {/* Payment Type */}
                                      <div className="col-span-2 hidden lg:block">
                                        <span className="text-xs text-muted-foreground">
                                          {t(`user.profile.billing.paymentType.${schedule.payment_type}`, schedule.payment_type)}
                                        </span>
                                      </div>

                                      {/* Due On with date adjustment icon */}
                                      <div className="col-span-3 lg:col-span-2">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs text-muted-foreground">
                                            {schedule.status === 'paid' && schedule.paid_date
                                              ? new Date(schedule.paid_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric'
                                                })
                                              : new Date(schedule.scheduled_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                  month: 'short',
                                                  day: 'numeric',
                                                  year: 'numeric'
                                                })
                                            }
                                          </span>
                                          {hasDateAdjustment && (
                                            <div className="relative inline-block">
                                              <Calendar className="h-3 w-3 text-amber-600 dark:text-amber-400 cursor-help peer" />
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden peer-hover:block z-[100] pointer-events-none">
                                                <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap border pointer-events-auto">
                                                  <div className="font-medium mb-1">{t('user.profile.billing.dateAdjusted', 'Date Adjusted')}</div>
                                                  <div className="text-muted-foreground">
                                                    {t('user.profile.billing.originalDate', 'Original')}: {new Date(schedule.original_due_date!).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      year: 'numeric'
                                                    })}
                                                  </div>
                                                  {schedule.adjustment_reason && (
                                                    <div className="text-muted-foreground mt-0.5">
                                                      {schedule.adjustment_reason}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Original Amount */}
                                      <div className={`col-span-2 hidden md:block ${isRtl ? 'text-right' : 'text-right'}`}>
                                        <span className="text-xs text-muted-foreground">
                                          {formatCurrency(originalAmount, schedule.currency)}
                                        </span>
                                      </div>

                                      {/* Refunded Amount */}
                                      <div className={`col-span-2 hidden lg:block ${isRtl ? 'text-right' : 'text-right'}`}>
                                        {refundedAmount > 0 ? (
                                          <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse justify-end' : 'justify-end'}`}>
                                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                                              {formatCurrency(refundedAmount, schedule.currency)}
                                            </span>
                                            <div className="relative inline-block">
                                              <Info className="h-3 w-3 text-purple-600 dark:text-purple-400 cursor-help peer" />
                                              <div className="absolute bottom-full right-0 mb-2 hidden peer-hover:block z-[100] pointer-events-none">
                                                <div className="bg-popover text-popover-foreground text-xs rounded-md shadow-lg p-2 whitespace-nowrap border pointer-events-auto">
                                                  <div className="font-medium mb-1">{t('user.profile.billing.refundDetails', 'Refund Details')}</div>
                                                  {schedule.refunded_at && (
                                                    <div className="text-muted-foreground">
                                                      {new Date(schedule.refunded_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                      })}
                                                    </div>
                                                  )}
                                                  {schedule.refund_reason && (
                                                    <div className="text-muted-foreground mt-0.5">
                                                      {schedule.refund_reason}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                      </div>

                                      {/* Paid (Net) Amount */}
                                      <div className={`col-span-3 md:col-span-2 lg:col-span-1 ${isRtl ? 'text-right' : 'text-right'}`}>
                                        <span className="text-xs font-semibold text-foreground">
                                          {formatCurrency(paidAmount, schedule.currency)}
                                        </span>
                                      </div>

                                      {/* Status Badge */}
                                      <div className={`col-span-3 md:col-span-2 lg:col-span-2 flex ${isRtl ? 'justify-end' : 'justify-end'}`}>
                                        {getScheduleStatusBadge(schedule.payment_status || schedule.status)}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Pagination Controls */}
                              {totalPaymentPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(enrollment.id, currentPage - 1)}
                                    disabled={currentPage === 1}
                                  >
                                    {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                  </Button>
                                  <span className="text-sm text-muted-foreground px-2">
                                    {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPaymentPages}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(enrollment.id, currentPage + 1)}
                                    disabled={currentPage === totalPaymentPages}
                                  >
                                    {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        )}
                      </Card>
                    </AccordionItem>
                  );
                })}
                    </Accordion>
                  )}
              </TabsContent>

              {/* Invoices Tab Content */}
              <TabsContent value="invoices" className="p-6" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">
                  {t('user.invoices.title', 'My Invoices')}
                </h3>
                {invoices.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {invoices.length} {t('invoices.filter.all', 'Invoices')}
                  </Badge>
                )}
              </div>

              {loadingInvoices ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">
                    {t('invoices.empty.title', 'No invoices yet')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('invoices.empty.subtitle', 'Your invoices will appear here')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((invoice) => (
                    <Card key={invoice.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
                      <div className="p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                        {/* Top Row: Invoice Number, Status, and Amount - Spread Across */}
                        <div className="flex items-start justify-between gap-6 mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold mb-1.5">{invoice.number}</h4>
                            {getInvoiceStatusBadge(invoice.status)}
                          </div>
                          <div className={isRtl ? 'text-left' : 'text-right'}>
                            <div className="text-xs text-muted-foreground mb-1">
                              {t('invoices.amount_due', 'Amount Due')}
                            </div>
                            <div className="text-2xl font-bold">
                              {formatCurrency(invoice.amount_due, invoice.currency)}
                            </div>
                            {(invoice.refund_amount ?? 0) > 0 && (
                              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mt-1">
                                {t('invoices.refunded_amount', 'Refunded')}: {formatCurrency(invoice.refund_amount ?? 0, invoice.currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description - Full Width */}
                        <p className="text-sm text-muted-foreground mb-4 pb-4 border-b">
                          {translateInvoiceDescription(invoice.description)}
                        </p>

                        {/* Date Information - Spread Across in 3 Columns */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1.5">
                              {t('invoices.invoice_date', 'Invoice Date')}
                            </div>
                            <div className="text-sm font-medium">{formatDate(invoice.created)}</div>
                          </div>
                          {invoice.paid_at && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                                {t('invoices.paid_on', 'Paid on')}
                              </div>
                              <div className="text-sm font-medium text-green-600">{formatDate(invoice.paid_at)}</div>
                            </div>
                          )}
                          {invoice.due_date && !invoice.paid_at && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                                {t('invoices.due_date', 'Due Date')}
                              </div>
                              <div className="text-sm font-medium text-orange-600">{formatDate(invoice.due_date)}</div>
                            </div>
                          )}
                        </div>

                        {/* Actions Row - Spread Across Bottom */}
                        <div className="flex gap-2 flex-wrap pt-4 border-t">
                          {invoice.hosted_invoice_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              {t('invoices.actions.view', 'View')}
                            </Button>
                          )}
                          {invoice.invoice_pdf && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              {t('invoices.actions.download', 'PDF')}
                            </Button>
                          )}
                          {(invoice.status === 'open' || invoice.status === 'overdue') &&
                            invoice.hosted_invoice_url && (
                              invoice.locallyPaid ? (
                                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  <span className="text-xs text-yellow-700 dark:text-yellow-300">
                                    {t('invoices.processing', 'Payment is being processed')}
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                                >
                                  {t('invoices.actions.pay_now', 'Pay Now')}
                                </Button>
                              )
                            )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              </TabsContent>

              {/* Payment Methods Tab Content */}
              <TabsContent value="payment-methods" className="p-6">
                <PaymentMethodsManager t={t} />
              </TabsContent>
              </Tabs>
            </Card>
          </>
        )}
      </div>

      {/* Export PDF Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-lg" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('user.profile.billing.exportPdfDialog.title', 'Export Payment Document')}
            </DialogTitle>
            <DialogDescription>
              {t('user.profile.billing.exportPdfDialog.description', 'Choose which document to export')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Document Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                {t('user.profile.billing.exportPdfDialog.documentType', 'Document Type')}
              </Label>
              <div className="grid gap-3">
                <div
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all",
                    selectedDocType === 'invoice'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedDocType('invoice')}
                >
                  <div className={cn(
                    "flex-shrink-0 rounded-lg p-2",
                    selectedDocType === 'invoice' ? "bg-primary/10" : "bg-muted"
                  )}>
                    <FileBarChart className={cn(
                      "h-5 w-5",
                      selectedDocType === 'invoice' ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="font-semibold text-sm mb-1">
                      {t('user.profile.billing.exportPdfDialog.invoice', 'Invoice')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('user.profile.billing.exportPdfDialog.invoiceDesc', 'Summary of charges and payment details')}
                    </p>
                  </div>
                  {selectedDocType === 'invoice' && (
                    <CheckCircle2 className={cn("absolute top-3 h-5 w-5 text-primary", isRtl ? "left-3" : "right-3")} />
                  )}
                </div>

                <div
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all",
                    selectedDocType === 'schedule'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedDocType('schedule')}
                >
                  <div className={cn(
                    "flex-shrink-0 rounded-lg p-2",
                    selectedDocType === 'schedule' ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Calendar className={cn(
                      "h-5 w-5",
                      selectedDocType === 'schedule' ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="font-semibold text-sm mb-1">
                      {t('user.profile.billing.exportPdfDialog.schedule', 'Payment Schedule')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('user.profile.billing.exportPdfDialog.scheduleDesc', 'Detailed payment plan and installments')}
                    </p>
                  </div>
                  {selectedDocType === 'schedule' && (
                    <CheckCircle2 className={cn("absolute top-3 h-5 w-5 text-primary", isRtl ? "left-3" : "right-3")} />
                  )}
                </div>

                <div
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all",
                    selectedDocType === 'both'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedDocType('both')}
                >
                  <div className={cn(
                    "flex-shrink-0 rounded-lg p-2",
                    selectedDocType === 'both' ? "bg-primary/10" : "bg-muted"
                  )}>
                    <FileText className={cn(
                      "h-5 w-5",
                      selectedDocType === 'both' ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="font-semibold text-sm mb-1">
                      {t('user.profile.billing.exportPdfDialog.both', 'Both Documents')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('user.profile.billing.exportPdfDialog.bothDesc', 'Invoice and payment schedule combined')}
                    </p>
                  </div>
                  {selectedDocType === 'both' && (
                    <CheckCircle2 className={cn("absolute top-3 h-5 w-5 text-primary", isRtl ? "left-3" : "right-3")} />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                {t('user.profile.billing.exportPdfDialog.language', 'Language')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                    selectedLanguage === 'en'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedLanguage('en')}
                >
                  <Globe className={cn(
                    "h-4 w-4",
                    selectedLanguage === 'en' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium text-sm",
                    selectedLanguage === 'en' ? "text-primary" : "text-foreground"
                  )}>
                    {t('user.profile.billing.exportPdfDialog.english', 'English')}
                  </span>
                  {selectedLanguage === 'en' && (
                    <CheckCircle2 className={cn("absolute top-2 h-4 w-4 text-primary", isRtl ? "left-2" : "right-2")} />
                  )}
                </div>
                <div
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all",
                    selectedLanguage === 'he'
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                  onClick={() => setSelectedLanguage('he')}
                >
                  <Globe className={cn(
                    "h-4 w-4",
                    selectedLanguage === 'he' ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "font-medium text-sm",
                    selectedLanguage === 'he' ? "text-primary" : "text-foreground"
                  )}>
                    {t('user.profile.billing.exportPdfDialog.hebrew', 'Hebrew')}
                  </span>
                  {selectedLanguage === 'he' && (
                    <CheckCircle2 className={cn("absolute top-2 h-4 w-4 text-primary", isRtl ? "left-2" : "right-2")} />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Export Button */}
            <Button
              onClick={handleExportPDF}
              disabled={exportingEnrollmentId !== null}
              className="w-full h-11 font-semibold"
              size="lg"
            >
              {exportingEnrollmentId ? (
                <>
                  <Loader2 className={`h-5 w-5 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span>{t('user.profile.billing.exportingPdf', 'Exporting...')}</span>
                </>
              ) : (
                <>
                  <Download className={`h-5 w-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span>{t('user.profile.billing.exportPdfDialog.export', 'Export PDF')}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
