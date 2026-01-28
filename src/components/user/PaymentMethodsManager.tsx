'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodsManagerProps {
  t: (key: string, fallback?: string) => string;
}

// Helper function to translate Stripe error messages
const translateStripeError = (errorMessage: string, t: any): string => {
  // Map common Stripe error messages to translation keys
  const errorMap: Record<string, string> = {
    'Your card number is incomplete.': 'stripe.errors.incompleteNumber',
    'Your card\'s expiration date is incomplete.': 'stripe.errors.incompleteExpiry',
    'Your card\'s security code is incomplete.': 'stripe.errors.incompleteCvc',
    'Your postal code is incomplete.': 'stripe.errors.incompleteZip',
    'Your card number is invalid.': 'stripe.errors.invalidNumber',
    'Your card\'s expiration date is invalid.': 'stripe.errors.invalidExpiry',
    'Your card\'s security code is invalid.': 'stripe.errors.invalidCvc',
    'Your card has expired.': 'stripe.errors.expiredCard',
    'Your card\'s security code is incorrect.': 'stripe.errors.incorrectCvc',
    'Your card was declined.': 'stripe.errors.cardDeclined',
    'An error occurred while processing your card.': 'stripe.errors.processingError',
    'Your card does not support this type of purchase.': 'stripe.errors.cardNotSupported',
    'Your card has insufficient funds.': 'stripe.errors.insufficientFunds',
  };

  // Check if we have a translation for this error
  const translationKey = errorMap[errorMessage];
  if (translationKey) {
    return t(translationKey, errorMessage);
  }

  // If no specific translation found, return generic error
  return t('stripe.errors.tryAgain', errorMessage);
};

function AddCardForm({ onSuccess, onCancel, t }: { onSuccess: () => void; onCancel: () => void; t: any }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create setup intent
      const response = await fetch('/api/user/payment-methods', {
        method: 'POST',
      });

      const { clientSecret, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      // Confirm card setup
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: confirmError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (confirmError) {
        const translatedError = translateStripeError(confirmError.message || '', t);
        throw new Error(translatedError);
      }

      toast.success(t('user.profile.paymentMethods.addSuccess', 'Card added successfully'));
      onSuccess();
    } catch (error: any) {
      console.error('Error adding card:', error);
      toast.error(error.message || t('user.profile.paymentMethods.addError', 'Failed to add card'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('user.profile.paymentMethods.addCard', 'Add Card')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel', 'Cancel')}
        </Button>
      </div>
    </form>
  );
}

export function PaymentMethodsManager({ t }: PaymentMethodsManagerProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<PaymentMethod | null>(null);

  // Load Stripe publishable key from settings
  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        setStripeLoading(true);
        console.log('[PaymentMethods] Loading Stripe configuration...');
        const response = await fetch('/api/user/payment-methods/stripe-config');
        const data = await response.json();

        console.log('[PaymentMethods] Stripe config response:', { ok: response.ok, hasKey: !!data.publishableKey, error: data.error });

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load Stripe configuration');
        }

        if (!data.publishableKey) {
          throw new Error('Stripe publishable key not found');
        }

        console.log('[PaymentMethods] Loading Stripe with publishable key...');
        setStripePromise(loadStripe(data.publishableKey));
        console.log('[PaymentMethods] Stripe loaded successfully');
      } catch (error: any) {
        console.error('[PaymentMethods] Error loading Stripe configuration:', error);
        setStripeError(error.message || 'Failed to load payment configuration');
      } finally {
        setStripeLoading(false);
      }
    };

    loadStripeKey();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      console.log('[PaymentMethods] Loading payment methods...');
      const response = await fetch('/api/user/payment-methods');
      const data = await response.json();

      console.log('[PaymentMethods] Payment methods response:', {
        ok: response.ok,
        count: data.paymentMethods?.length,
        error: data.error,
        message: data.message
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load payment methods');
      }

      setPaymentMethods(data.paymentMethods || []);
      console.log('[PaymentMethods] Loaded', data.paymentMethods?.length || 0, 'payment methods');
    } catch (error: any) {
      console.error('[PaymentMethods] Error loading payment methods:', error);
      toast.error(error.message || t('user.profile.paymentMethods.loadError', 'Failed to load payment methods'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setActionLoading(paymentMethodId);

      const response = await fetch('/api/user/payment-methods/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_method_id: paymentMethodId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default payment method');
      }

      toast.success(t('user.profile.paymentMethods.setDefaultSuccess', 'Default card updated'));
      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Error setting default:', error);
      toast.error(error.message || t('user.profile.paymentMethods.setDefaultError', 'Failed to set default card'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveClick = (paymentMethod: PaymentMethod) => {
    // Prevent deleting the last card
    if (paymentMethods.length === 1) {
      toast.error(t('user.profile.paymentMethods.cannotRemoveLast', 'Cannot remove your only payment method. Please add another card first.'));
      return;
    }

    setCardToDelete(paymentMethod);
    setShowDeleteDialog(true);
  };

  const handleRemove = async () => {
    if (!cardToDelete) return;

    try {
      setActionLoading(cardToDelete.id);

      const response = await fetch(`/api/user/payment-methods?payment_method_id=${cardToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove payment method');
      }

      toast.success(t('user.profile.paymentMethods.removeSuccess', 'Card removed successfully'));
      setShowDeleteDialog(false);
      setCardToDelete(null);
      await loadPaymentMethods();
    } catch (error: any) {
      console.error('Error removing card:', error);
      toast.error(error.message || t('user.profile.paymentMethods.removeError', 'Failed to remove card'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSuccess = async () => {
    setShowAddCard(false);
    await loadPaymentMethods();
  };

  const getBrandIcon = (brand: string) => {
    // You can customize this to show different icons for different card brands
    return <CreditCard className="h-5 w-5" />;
  };

  if (loading || stripeLoading) {
    return (
      <Card className="p-12">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">
            {t('user.profile.paymentMethods.loading', 'Loading payment methods...')}
          </p>
        </div>
      </Card>
    );
  }

  if (stripeError || !stripePromise) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-semibold mb-2">
            {t('user.profile.paymentMethods.configError', 'Payment Methods Not Available')}
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            {stripeError || t('user.profile.paymentMethods.configErrorDesc', 'Payment processing is not configured. Please contact support.')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {t('user.profile.paymentMethods.title', 'Payment Methods')}
          </h3>
          {!showAddCard && (
            <Button onClick={() => setShowAddCard(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t('user.profile.paymentMethods.addNew', 'Add New Card')}
            </Button>
          )}
        </div>

        {showAddCard && stripePromise && (
          <Card className="p-4 mb-6 bg-muted/50">
            <h4 className="font-semibold mb-4">
              {t('user.profile.paymentMethods.addNewCard', 'Add New Card')}
            </h4>
            <Elements stripe={stripePromise}>
              <AddCardForm
                onSuccess={handleAddSuccess}
                onCancel={() => setShowAddCard(false)}
                t={t}
              />
            </Elements>
          </Card>
        )}

        {paymentMethods.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">
              {t('user.profile.paymentMethods.noCards', 'No Payment Methods')}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              {t('user.profile.paymentMethods.noCardsDesc', 'Add a payment method to make purchases easier.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((pm) => (
              <Card
                key={pm.id}
                className={`p-4 ${pm.isDefault ? 'border-primary border-2' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getBrandIcon(pm.brand)}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">
                          {pm.brand} •••• {pm.last4}
                        </p>
                        {pm.isDefault && (
                          <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium">
                            {t('user.profile.paymentMethods.default', 'Default')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('user.profile.paymentMethods.expires', 'Expires')} {pm.expMonth}/{pm.expYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!pm.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(pm.id)}
                        disabled={actionLoading === pm.id}
                      >
                        {actionLoading === pm.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {t('user.profile.paymentMethods.setDefault', 'Set as Default')}
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClick(pm)}
                      disabled={actionLoading === pm.id}
                    >
                      {actionLoading === pm.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open && !actionLoading) {
          setShowDeleteDialog(false);
          setCardToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('user.profile.paymentMethods.deleteTitle', 'Remove Payment Method')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {cardToDelete && t(
                'user.profile.paymentMethods.deleteDescription',
                'Are you sure you want to remove {brand} ending in {last4}? This action cannot be undone.'
              )
                .replace('{brand}', cardToDelete.brand.charAt(0).toUpperCase() + cardToDelete.brand.slice(1))
                .replace('{last4}', cardToDelete.last4)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setCardToDelete(null);
              }}
              disabled={!!actionLoading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={!!actionLoading}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('user.profile.paymentMethods.remove', 'Remove')}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
