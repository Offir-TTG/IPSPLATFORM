'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, DollarSign, CreditCard, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

interface PaymentDetails {
  enrollment: {
    id: string;
    total_amount: number;
    paid_amount: number;
    payment_status: string;
    next_payment_date?: string;
  };
  product: {
    product_name: string;
    product_type: string;
    price: number;
    currency: string;
  };
  payment_plan: {
    id: string;
    plan_name: string;
    plan_type: string;
  };
  schedules: Array<{
    id: string;
    payment_number: number;
    payment_type: string;
    amount: number;
    currency: string;
    scheduled_date: string;
    paid_date?: string;
    status: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    payment_method: string;
    status: string;
    created_at: string;
  }>;
}

export default function PaymentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/enrollments/${params.id}/payment`);
      const data = await res.json();
      setDetails(data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: 'default',
      pending: 'secondary',
      failed: 'destructive',
      overdue: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Payment Details Not Found</h3>
            <Button asChild className="mt-4">
              <Link href="/payments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/payments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payments
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">{details.product.product_name}</h1>
        <p className="text-muted-foreground capitalize">
          {details.product.product_type} • {details.payment_plan.plan_name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Total Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(details.enrollment.total_amount, details.product.currency)}
            </div>
            <p className="text-xs text-muted-foreground">Full course price</p>
          </CardContent>
        </Card>

        {/* Paid Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(details.enrollment.paid_amount, details.product.currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((details.enrollment.paid_amount / details.enrollment.total_amount) * 100)}% complete
            </p>
          </CardContent>
        </Card>

        {/* Remaining Amount Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                details.enrollment.total_amount - details.enrollment.paid_amount,
                details.product.currency
              )}
            </div>
            <p className="text-xs text-muted-foreground">Still to pay</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>Your scheduled payments for this enrollment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {details.schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(schedule.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Payment #{schedule.payment_number}</p>
                      <Badge variant="outline" className="capitalize">
                        {schedule.payment_type}
                      </Badge>
                      {getStatusBadge(schedule.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.paid_date ? (
                        <>Paid on {formatDate(schedule.paid_date)}</>
                      ) : (
                        <>Due {formatDate(schedule.scheduled_date)}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {formatCurrency(schedule.amount, schedule.currency)}
                  </p>
                  {schedule.status === 'pending' && (
                    <Button asChild size="sm" className="mt-2">
                      <Link href={`/payments/${params.id}/pay?schedule=${schedule.id}`}>
                        Pay Now
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {details.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>All payments made for this enrollment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {details.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium capitalize">{payment.payment_method}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
