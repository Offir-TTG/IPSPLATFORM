'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserLanguage } from '@/context/AppContext';
import {
  DollarSign,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface Enrollment {
  id: string;
  product_name: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  currency: string;
  refunded_amount?: number;
}

export function PaymentSummary() {
  const { t, language } = useUserLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = language === 'he';

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/enrollments');
      const data = await response.json();

      console.log('[PaymentSummary] API response:', data);

      if (data.enrollments) {
        const formatted = data.enrollments.map((e: any) => {
          console.log('[PaymentSummary] Processing enrollment:', e.id);
          console.log('[PaymentSummary] Payment schedules:', e.payment_schedules);

          // Calculate total refunded from payment schedules
          const schedules = e.payment_schedules || [];
          const refundedAmount = schedules.reduce((sum: number, schedule: any) => {
            const refund = parseFloat(schedule.refunded_amount?.toString() || '0');
            console.log('[PaymentSummary] Schedule refund:', refund);
            return sum + refund;
          }, 0);

          console.log('[PaymentSummary] Total refunded for enrollment:', refundedAmount);

          return {
            id: e.id,
            product_name: e.products?.title || e.products?.product_name || 'Unknown',
            total_amount: e.total_amount || 0,
            paid_amount: e.paid_amount || 0,
            payment_status: e.payment_status || 'pending',
            currency: e.products?.currency || 'ILS',
            refunded_amount: refundedAmount,
          };
        });

        console.log('[PaymentSummary] Formatted enrollments:', formatted);
        setEnrollments(formatted);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency || 'ILS',
    }).format(amount);
  };

  // Calculate totals
  const totalPaid = enrollments.reduce((sum, e) => sum + e.paid_amount, 0);
  const totalRefunded = enrollments.reduce((sum, e) => sum + (e.refunded_amount || 0), 0);
  const totalOwed = enrollments.reduce((sum, e) => sum + (e.total_amount - e.paid_amount), 0);
  const totalAmount = enrollments.reduce((sum, e) => sum + e.total_amount, 0);
  const netPaid = totalPaid - totalRefunded;
  const currency = enrollments[0]?.currency || 'ILS';

  console.log('[PaymentSummary] Totals:', {
    totalPaid,
    totalRefunded,
    totalOwed,
    totalAmount,
    netPaid,
    currency,
  });

  // Count enrollments with outstanding payments
  const outstandingCount = enrollments.filter(e => e.payment_status !== 'paid' && (e.total_amount - e.paid_amount) > 0).length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (enrollments.length === 0) {
    return null; // Don't show if no enrollments
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
            <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold" suppressHydrationWarning>
              {t('user.dashboard.payment.title', 'Payment Summary')}
            </h3>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>
              {t('user.dashboard.payment.subtitle', 'Your enrollment payments at a glance')}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Paid (Net Amount) */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/50 dark:border-green-800/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-xs font-medium text-green-700 dark:text-green-300" suppressHydrationWarning>
              {t('user.dashboard.payment.totalPaid', 'Total Paid')}
            </p>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(netPaid, currency)}
          </p>
          {totalRefunded > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1" suppressHydrationWarning>
              {formatCurrency(totalPaid, currency)} - {formatCurrency(totalRefunded, currency)}
            </p>
          )}
        </div>

        {/* Outstanding Amount */}
        <div className={`p-4 rounded-lg border ${
          totalOwed > 0
            ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 dark:border-amber-800/50'
            : 'bg-muted/30 border-border'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {totalOwed > 0 ? (
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <p className={`text-xs font-medium ${
              totalOwed > 0
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-green-700 dark:text-green-300'
            }`} suppressHydrationWarning>
              {t('user.dashboard.payment.outstanding', 'Outstanding')}
            </p>
          </div>
          <p className={`text-2xl font-bold ${
            totalOwed > 0
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-green-700 dark:text-green-300'
          }`}>
            {formatCurrency(totalOwed, currency)}
          </p>
          {totalOwed > 0 && outstandingCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1" suppressHydrationWarning>
              {outstandingCount} {t('user.dashboard.payment.enrollmentsWithBalance', 'enrollments with balance')}
            </p>
          )}
        </div>

        {/* Total Value */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300" suppressHydrationWarning>
              {t('user.dashboard.payment.totalValue', 'Total Value')}
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(totalAmount, currency)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1" suppressHydrationWarning>
            {enrollments.length} {t('user.dashboard.payment.activeEnrollments', 'active enrollments')}
          </p>
        </div>

        {/* Total Refunded */}
        {totalRefunded > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300" suppressHydrationWarning>
                {t('user.dashboard.payment.totalRefunded', 'Total Refunded')}
              </p>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(totalRefunded, currency)}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1" suppressHydrationWarning>
              {t('user.dashboard.payment.netPaid', 'Net paid')}: {formatCurrency(netPaid, currency)}
            </p>
          </div>
        )}
      </div>

      {/* Payment Progress Bar */}
      {totalAmount > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground" suppressHydrationWarning>
              {t('user.dashboard.payment.overallProgress', 'Overall Payment Progress')}
            </p>
            <p className="text-sm font-bold">
              {Math.round((netPaid / totalAmount) * 100)}%
            </p>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div
              className={`bg-gradient-to-r from-green-500 to-emerald-500 h-3 transition-all duration-500 ${isRtl ? 'rounded-r-full' : 'rounded-l-full'}`}
              style={{
                width: `${Math.min(100, (netPaid / totalAmount) * 100)}%`,
              }}
            />
          </div>
          {totalRefunded > 0 && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1" suppressHydrationWarning>
              {t('user.dashboard.payment.refundedNote', 'Includes')} {formatCurrency(totalRefunded, currency)} {t('user.dashboard.payment.refundedText', 'in refunds')}
            </p>
          )}
        </div>
      )}

      {/* Outstanding Enrollments List */}
      {outstandingCount > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-semibold text-foreground" suppressHydrationWarning>
              {t('user.dashboard.payment.pendingPayments', 'Pending Payments')}
            </p>
          </div>
          {enrollments
            .filter(e => e.payment_status !== 'paid' && (e.total_amount - e.paid_amount) > 0)
            .slice(0, 3) // Show max 3
            .map((enrollment) => {
              // Calculate net paid (after refunds)
              const netPaidForEnrollment = enrollment.paid_amount - (enrollment.refunded_amount || 0);
              const outstandingForEnrollment = enrollment.total_amount - netPaidForEnrollment;

              return (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {enrollment.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(netPaidForEnrollment, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-amber-600 border-amber-600/50 bg-amber-50 dark:bg-amber-950/20">
                      {formatCurrency(outstandingForEnrollment, enrollment.currency)}
                    </Badge>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* View All Link */}
      <div className="pt-4 border-t">
        <Link href="/profile?tab=billing">
          <Button variant="outline" className="w-full group">
            <span suppressHydrationWarning>
              {t('user.dashboard.payment.viewAllPayments', 'View All Payments & Invoices')}
            </span>
            <ArrowRight className={`h-4 w-4 group-hover:translate-x-1 transition-transform ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
