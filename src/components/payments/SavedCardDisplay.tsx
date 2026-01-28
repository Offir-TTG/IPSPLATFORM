'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Edit } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';

interface PaymentMethod {
  type: 'card';
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
}

interface SavedCardDisplayProps {
  paymentMethod: PaymentMethod;
  onUseCard?: () => void;
  onUpdateCard?: () => void;
  className?: string;
}

export default function SavedCardDisplay({
  paymentMethod,
  onUseCard,
  onUpdateCard,
  className
}: SavedCardDisplayProps) {
  const { t } = useUserLanguage();

  // Format card brand for display
  const formatBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('payments.savedCard.title', 'Payment Method')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="flex-shrink-0">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-lg">
              {formatBrand(paymentMethod.brand)} •••• {paymentMethod.last4}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('payments.savedCard.expires', 'Expires')} {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="h-5 w-5" />
              <span className="text-sm font-medium">
                {t('payments.savedCard.saved', 'Saved')}
              </span>
            </div>
          </div>
        </div>

        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>
            {t('payments.savedCard.autoChargeNotice', 'Your saved card will be charged automatically on payment due dates.')}
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        {(onUseCard || onUpdateCard) && (
          <div className="flex gap-3 pt-2">
            {onUseCard && (
              <Button onClick={onUseCard} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                {t('payments.savedCard.useCard', 'Use This Card')}
              </Button>
            )}
            {onUpdateCard && (
              <Button onClick={onUpdateCard} variant="outline" className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                {t('payments.savedCard.updateCard', 'Update Payment Method')}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
