'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Plus } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
  brand: string;
  exp_month: number;
  exp_year: number;
  isDefault?: boolean;
}

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  selectedMethodId?: string | null;
  onSelectMethod: (methodId: string) => void;
  onAddNewCard: () => void;
  onConfirm: () => void;
  className?: string;
}

export default function PaymentMethodSelector({
  paymentMethods,
  selectedMethodId,
  onSelectMethod,
  onAddNewCard,
  onConfirm,
  className
}: PaymentMethodSelectorProps) {
  const { t } = useUserLanguage();

  // Format card brand for display
  const formatBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-3">
        <h3 className="text-sm font-medium">
          {t('payments.selector.title', 'Select a payment method')}
        </h3>

        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary',
              selectedMethodId === method.id && 'border-primary ring-2 ring-primary ring-offset-2'
            )}
            onClick={() => onSelectMethod(method.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    selectedMethodId === method.id
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {selectedMethodId === method.id && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>

                <CreditCard className="h-6 w-6 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {formatBrand(method.brand)} •••• {method.last4}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('payments.selector.expires', 'Expires')} {method.exp_month.toString().padStart(2, '0')}/{method.exp_year}
                  </p>
                </div>

                {method.isDefault && (
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:text-blue-300">
                      {t('payments.selector.default', 'Default')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={onAddNewCard}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t('payments.selector.addNewCard', 'Add New Card')}
      </Button>

      <Button
        onClick={onConfirm}
        className="w-full"
        disabled={!selectedMethodId}
      >
        <Check className="h-4 w-4 mr-2" />
        {t('payments.selector.useSelected', 'Use Selected Card')}
      </Button>
    </div>
  );
}
