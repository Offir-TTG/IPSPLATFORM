'use client';

import { AlertCircle, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  overdueAmount: number;
  overdueDays: number;
  enrollmentId: string;
}

export function CourseAccessBlocked({ overdueAmount, overdueDays, enrollmentId }: Props) {
  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Course Access Restricted</CardTitle>
        </div>
        <CardDescription>
          Your payment is {overdueDays} days overdue. Please complete payment to continue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span>Outstanding Amount:</span>
            <span className="font-semibold">${overdueAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground mt-1">
            <span>Days Overdue:</span>
            <span>{overdueDays} days</span>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/payments/${enrollmentId}`}>
            <CreditCard className="mr-2 h-4 w-4" />
            Make Payment
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Access will be restored immediately after payment is confirmed.
        </p>
      </CardContent>
    </Card>
  );
}
