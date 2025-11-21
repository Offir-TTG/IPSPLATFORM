'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Calendar, DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Enrollment {
  id: string;
  product_name: string;
  product_type: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  next_payment_date?: string;
  payment_plan_name: string;
  currency: string;
}

interface PaymentSchedule {
  id: string;
  payment_number: number;
  amount: number;
  currency: string;
  scheduled_date: string;
  paid_date?: string;
  status: string;
  payment_type: string;
}

export default function PaymentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch enrollments
      const enrollmentsRes = await fetch('/api/enrollments');
      const enrollmentsData = await enrollmentsRes.json();

      if (enrollmentsData.enrollments) {
        const formattedEnrollments = enrollmentsData.enrollments.map((e: any) => ({
          id: e.id,
          product_name: e.products.product_name,
          product_type: e.products.product_type,
          total_amount: e.total_amount,
          paid_amount: e.paid_amount,
          payment_status: e.payment_status,
          next_payment_date: e.next_payment_date,
          payment_plan_name: e.payment_plans?.plan_name || 'N/A',
          currency: e.products.currency,
        }));
        setEnrollments(formattedEnrollments);

        // Get upcoming payments for all enrollments
        const allSchedules: PaymentSchedule[] = [];
        for (const enrollment of formattedEnrollments) {
          try {
            const scheduleRes = await fetch(`/api/enrollments/${enrollment.id}/payment`);
            const scheduleData = await scheduleRes.json();
            if (scheduleData.schedules) {
              const upcoming = scheduleData.schedules
                .filter((s: any) => s.status === 'pending')
                .map((s: any) => ({
                  ...s,
                  enrollment_id: enrollment.id,
                  product_name: enrollment.product_name,
                }));
              allSchedules.push(...upcoming);
            }
          } catch (error) {
            console.error('Error fetching schedules:', error);
          }
        }
        setUpcomingPayments(allSchedules.sort((a, b) =>
          new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
        ));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; icon: any }> = {
      paid: { variant: 'default', label: 'Paid', icon: CheckCircle2 },
      partial: { variant: 'secondary', label: 'Partial', icon: Clock },
      pending: { variant: 'outline', label: 'Pending', icon: AlertCircle },
      overdue: { variant: 'destructive', label: 'Overdue', icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Payments</h1>
        <p className="text-muted-foreground">Manage your enrollments and payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                enrollments.reduce((sum, e) => sum + (e.total_amount - e.paid_amount), 0),
                enrollments[0]?.currency || 'USD'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {enrollments.length} enrollment{enrollments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingPayments.length}</div>
            <p className="text-xs text-muted-foreground">
              {upcomingPayments.length > 0 && `Next: ${formatDate(upcomingPayments[0].scheduled_date)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrollments.filter(e => e.payment_status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Fully paid enrollments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="enrollments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="enrollments">My Enrollments</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments" className="space-y-4">
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Enrollments Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You haven't enrolled in any courses or programs yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{enrollment.product_name}</CardTitle>
                      <CardDescription className="capitalize">
                        {enrollment.product_type} • {enrollment.payment_plan_name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(enrollment.payment_status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Payment Progress */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Payment Progress</span>
                        <span className="font-medium">
                          {formatCurrency(enrollment.paid_amount, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${(enrollment.paid_amount / enrollment.total_amount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Next Payment */}
                    {enrollment.next_payment_date && enrollment.payment_status !== 'paid' && (
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Next Payment Due</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatDate(enrollment.next_payment_date)}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/payments/${enrollment.id}`}>
                          View Details
                        </Link>
                      </Button>
                      {enrollment.payment_status !== 'paid' && (
                        <Button asChild size="sm">
                          <Link href={`/payments/${enrollment.id}/pay`}>
                            Make Payment
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingPayments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Payments</h3>
                <p className="text-muted-foreground text-center">
                  You're all caught up! No payments are currently scheduled.
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingPayments.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{(schedule as any).product_name}</h4>
                        <Badge variant="outline" className="capitalize">
                          {schedule.payment_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Payment #{schedule.payment_number} • Due {formatDate(schedule.scheduled_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">
                        {formatCurrency(schedule.amount, schedule.currency)}
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <Link href={`/payments/${(schedule as any).enrollment_id}/pay`}>
                          Pay Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
