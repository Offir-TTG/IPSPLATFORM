/**
 * Card Selection Dialog Component
 *
 * Allows admins to select which payment method to charge when clicking "Charge Now".
 * Fetches all saved payment methods for a schedule and displays them for selection.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { CreditCard, CheckCircle2, Loader2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  is_default: boolean;
}

interface CardSelectionDialogProps {
  open: boolean;
  scheduleId: string | null;
  scheduleName?: string;
  onClose: () => void;
  onCharged: () => void;
  direction: 'ltr' | 'rtl';
  mode?: 'change' | 'charge'; // 'change' = update default card, 'charge' = charge immediately
}

export function CardSelectionDialog({
  open,
  scheduleId,
  scheduleName,
  onClose,
  onCharged,
  direction,
  mode = 'charge',
}: CardSelectionDialogProps) {
  const { t } = useAdminLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [charging, setCharging] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && scheduleId) {
      fetchPaymentMethods();
    }
  }, [open, scheduleId]);

  const fetchPaymentMethods = async () => {
    if (!scheduleId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/payment-methods`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();

      if (data.payment_methods && data.payment_methods.length > 0) {
        setPaymentMethods(data.payment_methods);
        // Auto-select default payment method
        const defaultMethod = data.payment_methods.find((pm: PaymentMethod) => pm.is_default);
        setSelectedPaymentMethodId(defaultMethod?.id || data.payment_methods[0].id);
      } else {
        setError(data.message || 'No saved payment methods found');
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err);
      setError(err.message || 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!scheduleId || !selectedPaymentMethodId) return;

    setCharging(true);

    try {
      if (mode === 'change') {
        // Change default payment method without charging
        const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/set-default-card`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_method_id: selectedPaymentMethodId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update default payment method');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.payments.schedules.cardUpdatedSuccess', 'Default payment method updated successfully'),
        });
      } else {
        // Charge the selected card immediately
        const response = await fetch(`/api/admin/payments/schedules/${scheduleId}/charge-now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_method_id: selectedPaymentMethodId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to charge payment');
        }

        toast({
          title: t('common.success', 'Success'),
          description: t('admin.payments.schedules.chargeSuccess', 'Payment charged successfully'),
        });
      }

      onCharged();
      onClose();
    } catch (err: any) {
      console.error(`Error ${mode === 'change' ? 'updating card' : 'charging payment'}:`, err);
      toast({
        title: t('common.error', 'Error'),
        description: err.message || t('admin.payments.schedules.cardUpdateError', 'Failed to update payment method'),
        variant: 'destructive',
      });
    } finally {
      setCharging(false);
    }
  };

  const formatCardBrand = (brand: string) => {
    return brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction} className="max-w-md">
        <DialogHeader>
          <DialogTitle suppressHydrationWarning>
            {mode === 'change'
              ? t('admin.payments.schedules.changeDefaultCard', 'Change Default Payment Method')
              : t('admin.payments.schedules.selectCard', 'Select Payment Method')}
          </DialogTitle>
          <DialogDescription suppressHydrationWarning>
            {mode === 'change'
              ? (scheduleName
                  ? t('admin.payments.schedules.selectDefaultCardFor', 'Choose the default payment method for {name}').replace('{name}', scheduleName)
                  : t('admin.payments.schedules.selectDefaultCardDescription', 'Choose which card to set as default'))
              : (scheduleName
                  ? t('admin.payments.schedules.selectCardFor', 'Choose which card to charge for {name}').replace('{name}', scheduleName)
                  : t('admin.payments.schedules.selectCardDescription', 'Choose which saved card to charge'))}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {error && !loading && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && paymentMethods.length > 0 && (
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedPaymentMethodId(method.id)}
                  className={`
                    relative border rounded-lg p-4 cursor-pointer transition-all
                    ${selectedPaymentMethodId === method.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCardBrand(method.card.brand)} •••• {method.card.last4}
                          </span>
                          {method.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded" suppressHydrationWarning>
                              {t('admin.payments.schedules.defaultCard', 'Default')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                          {t('admin.payments.schedules.expires', 'Expires')} {method.card.exp_month}/{method.card.exp_year}
                        </p>
                      </div>
                    </div>
                    {selectedPaymentMethodId === method.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && paymentMethods.length === 0 && (
            <Alert>
              <AlertDescription suppressHydrationWarning>
                {t('admin.payments.schedules.noSavedCards', 'No saved payment methods found for this user')}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={charging}>
            <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
          </Button>
          <Button
            onClick={handleAction}
            disabled={!selectedPaymentMethodId || charging || loading}
          >
            {charging ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span suppressHydrationWarning>
                  {mode === 'change'
                    ? t('admin.payments.schedules.updating', 'Updating...')
                    : t('admin.payments.schedules.charging', 'Charging...')}
                </span>
              </>
            ) : (
              <span suppressHydrationWarning>
                {mode === 'change'
                  ? t('admin.payments.schedules.setAsDefault', 'Set as Default')
                  : t('admin.payments.schedules.chargeCard', 'Charge Card')}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
