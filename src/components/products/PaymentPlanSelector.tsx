'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PaymentPlan {
  id: string;
  plan_name: string;
  plan_type: 'one_time' | 'deposit' | 'installments' | 'subscription';
  deposit_percentage?: number;
  installment_count?: number;
  installment_frequency?: string;
  is_active: boolean;
}

interface PaymentPlanSelectorProps {
  useTemplates: boolean;
  onUseTemplatesChange: (use: boolean) => void;
  defaultPlanId?: string;
  onDefaultPlanIdChange: (planId: string) => void;
  alternativePlanIds?: string[];
  onAlternativePlanIdsChange: (planIds: string[]) => void;
  allowPlanSelection: boolean;
  onAllowPlanSelectionChange: (allow: boolean) => void;
  t: (key: string, fallback: string) => string;
}

export function PaymentPlanSelector({
  useTemplates,
  onUseTemplatesChange,
  defaultPlanId,
  onDefaultPlanIdChange,
  alternativePlanIds = [],
  onAlternativePlanIdsChange,
  allowPlanSelection,
  onAllowPlanSelectionChange,
  t,
}: PaymentPlanSelectorProps) {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch payment plans
  useEffect(() => {
    if (useTemplates) {
      fetchPaymentPlans();
    }
  }, [useTemplates]);

  const fetchPaymentPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/payments/plans');
      if (!response.ok) throw new Error('Failed to fetch payment plans');

      const data = await response.json();
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch payment plans');
    } finally {
      setLoading(false);
    }
  };

  // Format plan description
  const getPlanDescription = (plan: PaymentPlan): string => {
    switch (plan.plan_type) {
      case 'one_time':
        return t('products.payment_plans.description.one_time', 'One-time payment');
      case 'deposit':
        return t('products.payment_plans.description.deposit', '{percentage}% deposit')
          .replace('{percentage}', (plan.deposit_percentage || 0).toString());
      case 'installments': {
        const frequencyKey = `products.payment_plans.frequency.${plan.installment_frequency}`;
        const frequency = t(frequencyKey, plan.installment_frequency || '');
        return t('products.payment_plans.description.installments', '{count} {frequency} installments')
          .replace('{count}', (plan.installment_count || 0).toString())
          .replace('{frequency}', frequency);
      }
      case 'subscription':
        return t('products.payment_plans.description.subscription', 'Subscription');
      default:
        return '';
    }
  };

  // Handle alternative plan toggle
  const toggleAlternativePlan = (planId: string) => {
    if (alternativePlanIds.includes(planId)) {
      onAlternativePlanIdsChange(alternativePlanIds.filter(id => id !== planId));
    } else {
      onAlternativePlanIdsChange([...alternativePlanIds, planId]);
    }
  };

  return (
    <div className="space-y-4">
      {useTemplates && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : error ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : plans.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {t('products.payment_plans.no_plans_available', 'No payment plans available. Create plans first.')}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Available Payment Plans */}
                <div>
                  <Label>
                    {t('products.payment_plans.available_plans', 'Available Payment Plans')} *
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    {t('products.payment_plans.available_plans_desc', 'Select which payment plans users can choose from for this product')}
                  </p>
                  <div className="space-y-2">
                    {plans.filter(p => p.is_active).map((plan) => {
                      const isSelected = alternativePlanIds.includes(plan.id);

                      return (
                        <div key={plan.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <input
                            type="checkbox"
                            id={`plan_${plan.id}`}
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                // Uncheck - remove from alternatives
                                onAlternativePlanIdsChange(alternativePlanIds.filter(id => id !== plan.id));
                              } else {
                                // Check - add to alternatives
                                onAlternativePlanIdsChange([...alternativePlanIds, plan.id]);
                              }
                            }}
                            className="cursor-pointer h-4 w-4"
                          />
                          <div className="flex-1">
                            <label htmlFor={`plan_${plan.id}`} className="text-sm font-medium cursor-pointer">
                              {plan.plan_name}
                            </label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {getPlanDescription(plan)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Alert */}
                {alternativePlanIds.length > 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription suppressHydrationWarning>
                      {t('products.payment_plans.users_can_choose', 'Users will be able to choose from {count} payment plan(s) at checkout.')
                        .replace('{count}', alternativePlanIds.length.toString())}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </>
        )}
    </div>
  );
}
