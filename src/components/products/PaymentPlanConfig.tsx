'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  PaymentModel,
  PaymentPlanConfig as PaymentPlanConfigType,
  PaymentFrequency,
  DepositType,
  SubscriptionInterval,
} from '@/types/product';
import { DollarSign, Calendar, Percent, Clock } from 'lucide-react';

interface PaymentPlanConfigProps {
  value: PaymentPlanConfigType;
  onChange: (config: PaymentPlanConfigType) => void;
  paymentModel: PaymentModel;
  productPrice: number;
  currency: string;
  t: (key: string, fallback: string) => string;
}

export function PaymentPlanConfig({
  value,
  onChange,
  paymentModel,
  productPrice,
  currency,
  t,
}: PaymentPlanConfigProps) {
  const [config, setConfig] = useState<PaymentPlanConfigType>(value || {});

  // Update config when value prop changes
  useEffect(() => {
    setConfig(value || {});
  }, [value]);

  // Helper to update config and notify parent
  const updateConfig = (updates: Partial<PaymentPlanConfigType>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onChange(newConfig);
  };

  // Calculate deposit amount based on type
  const calculateDeposit = (): number => {
    if (!config.deposit_type || config.deposit_type === 'none') return 0;

    if (config.deposit_type === 'fixed') {
      return config.deposit_amount || 0;
    }

    if (config.deposit_type === 'percentage') {
      return (productPrice * (config.deposit_percentage || 0)) / 100;
    }

    return 0;
  };

  // Calculate installment amount
  const calculateInstallmentAmount = (): number => {
    const depositAmount = calculateDeposit();
    const remainingAmount = productPrice - depositAmount;
    const installments = config.installments || 1;

    return remainingAmount / installments;
  };

  // Render based on payment model
  const renderConfig = () => {
    switch (paymentModel) {
      case 'one_time':
        return (
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              {t('products.payment_plan.one_time_desc', 'Customer pays the full amount upfront in a single payment.')}
            </AlertDescription>
          </Alert>
        );

      case 'free':
        return (
          <Alert>
            <DollarSign className="h-4 w-4" />
            <AlertDescription>
              {t('products.payment_plan.free_desc', 'No payment required. This product is free for all users.')}
            </AlertDescription>
          </Alert>
        );

      case 'deposit_then_plan':
        return renderDepositPlanConfig();

      case 'subscription':
        return renderSubscriptionConfig();

      default:
        return null;
    }
  };

  const renderDepositPlanConfig = () => {
    return (
      <div className="space-y-6">
        {/* Deposit Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {config.deposit_type === 'percentage' && <Percent className="h-4 w-4" />}
              {config.deposit_type === 'fixed' && <DollarSign className="h-4 w-4" />}
              {config.deposit_type === 'fixed'
                ? t('products.payment_plan.initial_deposit', 'Initial Deposit')
                : config.deposit_type === 'percentage'
                ? t('products.payment_plan.deposit_percentage_title', 'Deposit Percentage')
                : t('products.payment_plan.deposit', 'Deposit Configuration')}
            </CardTitle>
            <CardDescription>
              {config.deposit_type === 'fixed'
                ? t('products.payment_plan.initial_deposit_desc', 'Amount customer pays upfront before installments begin')
                : config.deposit_type === 'percentage'
                ? t('products.payment_plan.deposit_percentage_desc', 'Percentage of total price paid upfront before installments begin')
                : t('products.payment_plan.deposit_desc', 'Configure how customers will pay the initial deposit')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grid layout: Deposit Type | Amount/Percentage | Start Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Deposit Type */}
              <div>
                <Label>{t('products.payment_plan.deposit_type', 'Deposit Type')}</Label>
                <Select
                  value={config.deposit_type || 'none'}
                  onValueChange={(value) => updateConfig({ deposit_type: value as DepositType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('products.payment_plan.no_deposit', 'No Deposit')}</SelectItem>
                    <SelectItem value="percentage">{t('products.payment_plan.percentage', 'Percentage')}</SelectItem>
                    <SelectItem value="fixed">{t('products.payment_plan.fixed_amount', 'Fixed Amount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Deposit Amount/Percentage */}
              <div>
                {config.deposit_type === 'percentage' && (
                  <>
                    <Label>{t('products.payment_plan.deposit_percentage', 'Deposit Percentage (%)')}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={config.deposit_percentage || 0}
                      onChange={(e) => updateConfig({ deposit_percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="20"
                    />
                  </>
                )}

                {config.deposit_type === 'fixed' && (
                  <>
                    <Label>{t('products.payment_plan.deposit_amount', `Deposit Amount (${currency})`)}</Label>
                    <Input
                      type="number"
                      min="0"
                      max={productPrice}
                      step="0.01"
                      value={config.deposit_amount || 0}
                      onChange={(e) => updateConfig({ deposit_amount: parseFloat(e.target.value) || 0 })}
                      placeholder="500"
                    />
                  </>
                )}

                {config.deposit_type === 'none' && (
                  <>
                    <Label className="text-muted-foreground">{t('products.payment_plan.deposit_amount', 'Deposit Amount')}</Label>
                    <Input disabled placeholder={t('products.payment_plan.no_deposit_selected', 'No deposit')} />
                  </>
                )}
              </div>

            </div>

            {/* Helper text for deposit calculation */}
            {config.deposit_type === 'percentage' && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  {t('products.payment_plan.deposit_calc', `Deposit: ${currency} ${calculateDeposit().toFixed(2)}`)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Installments Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('products.payment_plan.installments', 'Installment Plan')}
            </CardTitle>
            <CardDescription>
              {t('products.payment_plan.installments_desc', 'Configure recurring payment schedule')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('products.payment_plan.number_installments', 'Number of Installments')}</Label>
              <Input
                type="number"
                min="1"
                max="36"
                step="1"
                value={config.installments || 1}
                onChange={(e) => updateConfig({ installments: parseInt(e.target.value) || 1 })}
                placeholder="12"
              />
            </div>

            <div>
              <Label>{t('products.payment_plan.frequency', 'Payment Frequency')}</Label>
              <Select
                value={config.frequency || 'monthly'}
                onValueChange={(value) => updateConfig({ frequency: value as PaymentFrequency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('products.payment_plan.weekly', 'Weekly')}</SelectItem>
                  <SelectItem value="biweekly">{t('products.payment_plan.biweekly', 'Bi-weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('products.payment_plan.monthly', 'Monthly')}</SelectItem>
                  <SelectItem value="custom">{t('products.payment_plan.custom', 'Custom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.frequency === 'custom' && (
              <div>
                <Label>{t('products.payment_plan.custom_days', 'Custom Frequency (days)')}</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={config.custom_frequency_days || 30}
                  onChange={(e) => updateConfig({ custom_frequency_days: parseInt(e.target.value) || 30 })}
                  placeholder="30"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Preview */}
        <PricingPreview
          productPrice={productPrice}
          currency={currency}
          depositAmount={calculateDeposit()}
          installmentAmount={calculateInstallmentAmount()}
          installments={config.installments || 1}
          frequency={config.frequency || 'monthly'}
          t={t}
        />
      </div>
    );
  };

  const renderSubscriptionConfig = () => {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('products.payment_plan.subscription', 'Subscription Configuration')}
            </CardTitle>
            <CardDescription>
              {t('products.payment_plan.subscription_desc', 'Recurring subscription billing')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t('products.payment_plan.billing_interval', 'Billing Interval')}</Label>
              <Select
                value={config.subscription_interval || 'monthly'}
                onValueChange={(value) => updateConfig({ subscription_interval: value as SubscriptionInterval })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('products.payment_plan.weekly', 'Weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('products.payment_plan.monthly', 'Monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('products.payment_plan.quarterly', 'Quarterly')}</SelectItem>
                  <SelectItem value="annually">{t('products.payment_plan.annually', 'Annually')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('products.payment_plan.trial_days', 'Trial Period (days)')}</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={config.trial_days || 0}
                onChange={(e) => updateConfig({ trial_days: parseInt(e.target.value) || 0 })}
                placeholder="7"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t('products.payment_plan.trial_desc', 'Free trial period before first charge')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Preview */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">{t('products.payment_plan.preview', 'Subscription Preview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{t('products.payment_plan.subscription_price', 'Subscription Price')}:</span>
                <Badge variant="secondary">{currency} {productPrice.toFixed(2)} / {config.subscription_interval || 'month'}</Badge>
              </div>
              {config.trial_days && config.trial_days > 0 && (
                <div className="flex justify-between">
                  <span>{t('products.payment_plan.trial_period', 'Trial Period')}:</span>
                  <Badge>{config.trial_days} {t('products.payment_plan.days', 'days')}</Badge>
                </div>
              )}
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>{t('products.payment_plan.first_charge', 'First Charge')}:</span>
                <span>{currency} {productPrice.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderConfig()}
    </div>
  );
}

// Pricing Preview Component
function PricingPreview({
  productPrice,
  currency,
  depositAmount,
  installmentAmount,
  installments,
  frequency,
  t,
}: {
  productPrice: number;
  currency: string;
  depositAmount: number;
  installmentAmount: number;
  installments: number;
  frequency: PaymentFrequency;
  t: (key: string, fallback: string) => string;
}) {
  const frequencyLabel = {
    weekly: t('products.payment_plan.weekly', 'weekly'),
    biweekly: t('products.payment_plan.biweekly', 'bi-weekly'),
    monthly: t('products.payment_plan.monthly', 'monthly'),
    custom: t('products.payment_plan.custom', 'custom'),
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-base">{t('products.payment_plan.preview', 'Payment Preview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>{t('products.payment_plan.total_price', 'Total Price')}:</span>
            <Badge variant="secondary">{currency} {productPrice.toFixed(2)}</Badge>
          </div>

          {depositAmount > 0 && (
            <div className="flex justify-between">
              <span>{t('products.payment_plan.initial_deposit', 'Initial Deposit')}:</span>
              <Badge>{currency} {depositAmount.toFixed(2)}</Badge>
            </div>
          )}

          <div className="flex justify-between">
            <span>{t('products.payment_plan.installment_amount', 'Installment Amount')}:</span>
            <Badge>{currency} {installmentAmount.toFixed(2)}</Badge>
          </div>

          <div className="flex justify-between">
            <span>{t('products.payment_plan.payment_schedule', 'Payment Schedule')}:</span>
            <span className="font-medium">
              {installments} × {currency} {installmentAmount.toFixed(2)} ({frequencyLabel[frequency]})
            </span>
          </div>

          <div className="flex justify-between font-medium pt-2 border-t">
            <span>{t('products.payment_plan.total_collected', 'Total to be Collected')}:</span>
            <span>{currency} {productPrice.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
