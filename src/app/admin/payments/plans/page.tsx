'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Settings,
  TestTube,
  ArrowLeft,
} from 'lucide-react';

interface PaymentPlan {
  id: string;
  plan_name: string;
  plan_description: string;
  plan_type: 'one_time' | 'deposit' | 'installments' | 'subscription';
  deposit_type?: 'percentage' | 'fixed';
  deposit_percentage?: number;
  deposit_amount?: number;
  installment_count?: number;
  installment_frequency?: string;
  subscription_frequency?: string;
  auto_detect_enabled: boolean;
  priority: number;
  is_active: boolean;
  is_default: boolean;
  usage_count?: number;
}

export default function PaymentPlansPage() {
  const { t, direction, language, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Fetch payment plans from API
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch('/api/admin/payments/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.plans.loadError', 'Failed to load payment plans'),
        variant: 'destructive',
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Window resize listener for mobile responsiveness
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCreatePlan = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm(t('admin.payments.plans.deleteConfirm', 'Are you sure you want to delete this payment plan?'))) return;

    try {
      const response = await fetch(`/api/admin/payments/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete plan');
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.plans.deleteSuccess', 'Payment plan deleted successfully'),
      });
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting payment plan:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.plans.deleteError', 'Failed to delete payment plan'),
        variant: 'destructive',
      });
    }
  };

  const handleSavePlan = async (plan: Partial<PaymentPlan>) => {
    try {
      const isEditing = !!plan.id;
      const url = isEditing
        ? `/api/admin/payments/plans/${plan.id}`
        : '/api/admin/payments/plans';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${isEditing ? 'update' : 'create'} plan`);
      }

      toast({
        title: t('common.success', 'Success'),
        description: isEditing
          ? t('admin.payments.plans.updateSuccess', 'Payment plan updated successfully')
          : t('admin.payments.plans.createSuccess', 'Payment plan created successfully'),
      });
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving payment plan:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.plans.saveError', 'Failed to save payment plan'),
        variant: 'destructive',
      });
    }
  };

  const getPlanTypeColor = (type: string) => {
    switch (type) {
      case 'one_time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'deposit': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'installments': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'subscription': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPlanTypeLabel = (type: string) => {
    switch (type) {
      case 'one_time': return t('admin.payments.plans.types.oneTime', 'One-Time');
      case 'deposit': return t('admin.payments.plans.types.deposit', 'Deposit');
      case 'installments': return t('admin.payments.plans.types.installments', 'Installments');
      case 'subscription': return t('admin.payments.plans.types.subscription', 'Subscription');
      default: return type;
    }
  };

  const getPlanDetails = (plan: PaymentPlan) => {
    // Helper function to translate frequency
    const translateFrequency = (freq: string | undefined) => {
      if (!freq) return '';
      return t(`admin.payments.plans.frequency.${freq.toLowerCase()}`, freq);
    };

    switch (plan.plan_type) {
      case 'deposit':
        const depositTemplate = plan.deposit_type === 'fixed'
          ? t('admin.payments.plans.details.fixedDeposit', `$${plan.deposit_amount} deposit`)
          : t('admin.payments.plans.details.percentDeposit', `${plan.deposit_percentage}% deposit`);
        const depositText = depositTemplate
          .replace('{amount}', String(plan.deposit_amount))
          .replace('{percentage}', String(plan.deposit_percentage));

        const translatedFrequency = translateFrequency(plan.installment_frequency);
        const paymentsTemplate = t('admin.payments.plans.details.payments', `${plan.installment_count} ${plan.installment_frequency} payments`);
        const paymentsText = paymentsTemplate
          .replace('{count}', String(plan.installment_count))
          .replace('{frequency}', translatedFrequency);

        return `${depositText}, ${paymentsText}`;
      case 'installments':
        const installmentsFrequency = translateFrequency(plan.installment_frequency);
        const installmentsTemplate = t('admin.payments.plans.details.installments', `${plan.installment_count} ${plan.installment_frequency} payments`);
        return installmentsTemplate
          .replace('{count}', String(plan.installment_count))
          .replace('{frequency}', installmentsFrequency);
      case 'subscription':
        const subscriptionFrequency = translateFrequency(plan.subscription_frequency);
        const subscriptionTemplate = t('admin.payments.plans.details.subscription', `${plan.subscription_frequency} recurring billing`);
        return subscriptionTemplate
          .replace('{frequency}', subscriptionFrequency);
      default:
        return t('admin.payments.plans.details.fullPayment', 'Pay full amount upfront');
    }
  };

  // Show loading state while translations are loading
  if (translationsLoading) {
    return (
      <AdminLayout>
        <div className="max-w-6xl p-6 space-y-6" dir={direction}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
              </Button>
            </Link>
            <div>
              <h1 suppressHydrationWarning style={{
                fontSize: 'var(--font-size-3xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>
                {t('admin.payments.plans.title', 'Payment Plans')}
              </h1>
              <p suppressHydrationWarning style={{
                color: 'hsl(var(--muted-foreground))',
                fontSize: 'var(--font-size-sm)',
                marginTop: '0.25rem'
              }}>
                {t('admin.payments.plans.description', 'Configure and manage payment plans')}
              </p>
            </div>
          </div>
          <Button onClick={handleCreatePlan} style={{
            width: isMobile ? '100%' : 'auto'
          }}>
            <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span suppressHydrationWarning>{t('admin.payments.plans.createPlan', 'Create Plan')}</span>
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle suppressHydrationWarning>{t('admin.payments.plans.autoDetection', 'Auto-Detection')}</AlertTitle>
          <AlertDescription suppressHydrationWarning>
            {t('admin.payments.plans.autoDetectionDesc', 'Payment plans with auto-detection enabled will be automatically assigned to enrollments based on priority.')}
          </AlertDescription>
        </Alert>

        {/* Plans List */}
        <div className="grid gap-4">
          {plans
            .sort((a, b) => b.priority - a.priority)
            .map((plan) => (
            <Card key={plan.id} className={!plan.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle suppressHydrationWarning>{plan.plan_name}</CardTitle>
                      <Badge className={getPlanTypeColor(plan.plan_type)} suppressHydrationWarning>
                        {getPlanTypeLabel(plan.plan_type)}
                      </Badge>
                      {plan.is_default && (
                        <Badge variant="outline" className="border-primary text-primary" suppressHydrationWarning>
                          {t('admin.payments.plans.default', 'Default')}
                        </Badge>
                      )}
                      {plan.auto_detect_enabled && (
                        <Badge variant="outline">
                          <TrendingUp className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                          <span suppressHydrationWarning>{t('admin.payments.plans.autoDetect', 'Auto-Detect')}</span>
                        </Badge>
                      )}
                      {!plan.is_active && (
                        <Badge variant="outline" className="border-gray-400 text-gray-600" suppressHydrationWarning>
                          {t('admin.payments.plans.inactive', 'Inactive')}
                        </Badge>
                      )}
                    </div>
                    <CardDescription suppressHydrationWarning>{plan.plan_description}</CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span suppressHydrationWarning>{t('admin.payments.plans.priority', 'Priority')}: {plan.priority}</span>
                      <span>•</span>
                      <span suppressHydrationWarning>{getPlanDetails(plan)}</span>
                      {plan.usage_count !== undefined && (
                        <>
                          <span>•</span>
                          <span suppressHydrationWarning>{plan.usage_count} {t('admin.payments.plans.enrollments', 'enrollments')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeletePlan(plan.id)}
                      disabled={plan.usage_count! > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {plans.length === 0 && !loadingPlans && (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>{t('admin.payments.plans.noPlans', 'No Payment Plans')}</h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning>
                {t('admin.payments.plans.noPlansDesc', 'Get started by creating your first payment plan.')}
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                <span suppressHydrationWarning>{t('admin.payments.plans.createPlan', 'Create Plan')}</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={direction}>
            <DialogHeader>
              <DialogTitle suppressHydrationWarning>
                {editingPlan ? t('admin.payments.plans.form.editTitle', 'Edit Payment Plan') : t('admin.payments.plans.form.createTitle', 'Create Payment Plan')}
              </DialogTitle>
              <DialogDescription suppressHydrationWarning>
                {t('admin.payments.plans.form.description', 'Configure payment plan details and settings.')}
              </DialogDescription>
            </DialogHeader>
            <PaymentPlanForm
              plan={editingPlan}
              onSave={handleSavePlan}
              onCancel={() => setIsDialogOpen(false)}
              t={t}
              direction={direction}
              isRtl={isRtl}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Payment Plan Form Component
function PaymentPlanForm({ plan, onSave, onCancel, t, direction, isRtl }: {
  plan: PaymentPlan | null;
  onSave: (plan: PaymentPlan) => void;
  onCancel: () => void;
  t: (key: string, fallback?: string) => string;
  direction: 'ltr' | 'rtl';
  isRtl: boolean;
}) {
  const [formData, setFormData] = useState<Partial<PaymentPlan>>({
    plan_name: '',
    plan_description: '',
    plan_type: 'one_time',
    auto_detect_enabled: true,
    priority: 10,
    is_active: true,
    is_default: false,
  });

  // Update form data when plan prop changes
  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData({
        plan_name: '',
        plan_description: '',
        plan_type: 'one_time',
        auto_detect_enabled: true,
        priority: 10,
        is_active: true,
        is_default: false,
      });
    }
  }, [plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as PaymentPlan);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="plan_name" suppressHydrationWarning>{t('admin.payments.plans.form.planName', 'Plan Name')} *</Label>
          <Input
            id="plan_name"
            value={formData.plan_name}
            onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
            placeholder={t('admin.payments.plans.form.planNamePlaceholder', 'e.g., Monthly Installments')}
            required
          />
        </div>

        <div>
          <Label htmlFor="plan_description" suppressHydrationWarning>{t('admin.payments.plans.form.planDescription', 'Description')}</Label>
          <Textarea
            id="plan_description"
            value={formData.plan_description}
            onChange={(e) => setFormData({ ...formData, plan_description: e.target.value })}
            placeholder={t('admin.payments.plans.form.planDescriptionPlaceholder', 'Describe this payment plan...')}
          />
        </div>

        <div>
          <Label htmlFor="plan_type" suppressHydrationWarning>{t('admin.payments.plans.form.planType', 'Payment Type')} *</Label>
          <Select
            key={`plan-type-${plan?.id || 'new'}-${formData.plan_type || 'one_time'}`}
            value={formData.plan_type || 'one_time'}
            onValueChange={(value: any) => setFormData({ ...formData, plan_type: value })}
          >
            <SelectTrigger>
              <SelectValue>
                <span suppressHydrationWarning>
                  {formData.plan_type === 'one_time' && t('admin.payments.plans.form.oneTimePayment', 'One-Time Payment')}
                  {formData.plan_type === 'deposit' && t('admin.payments.plans.form.depositInstallments', 'Deposit + Installments')}
                  {formData.plan_type === 'installments' && t('admin.payments.plans.form.installmentsOnly', 'Installments Only')}
                  {formData.plan_type === 'subscription' && t('admin.payments.plans.form.subscription', 'Subscription')}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent dir={direction}>
              <SelectItem value="one_time" suppressHydrationWarning>{t('admin.payments.plans.form.oneTimePayment', 'One-Time Payment')}</SelectItem>
              <SelectItem value="deposit" suppressHydrationWarning>{t('admin.payments.plans.form.depositInstallments', 'Deposit + Installments')}</SelectItem>
              <SelectItem value="installments" suppressHydrationWarning>{t('admin.payments.plans.form.installmentsOnly', 'Installments Only')}</SelectItem>
              <SelectItem value="subscription" suppressHydrationWarning>{t('admin.payments.plans.form.subscription', 'Subscription')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deposit Configuration */}
      {formData.plan_type === 'deposit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.plans.form.depositConfig', 'Deposit Configuration')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deposit_type" suppressHydrationWarning>{t('admin.payments.plans.form.depositType', 'Deposit Type')} *</Label>
              <Select
                key={`deposit-type-${formData.deposit_type || 'percentage'}`}
                value={formData.deposit_type || 'percentage'}
                onValueChange={(value: 'percentage' | 'fixed') => setFormData({
                  ...formData,
                  deposit_type: value,
                  // Clear the other field when switching types
                  deposit_percentage: value === 'percentage' ? formData.deposit_percentage : undefined,
                  deposit_amount: value === 'fixed' ? formData.deposit_amount : undefined
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.percentage', 'Percentage')} />
                </SelectTrigger>
                <SelectContent dir={direction}>
                  <SelectItem value="percentage" suppressHydrationWarning>{t('admin.payments.plans.form.percentage', 'Percentage')}</SelectItem>
                  <SelectItem value="fixed" suppressHydrationWarning>{t('admin.payments.plans.form.fixedAmount', 'Fixed Amount')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.deposit_type === 'percentage' ? (
              <div>
                <Label htmlFor="deposit_percentage" suppressHydrationWarning>{t('admin.payments.plans.form.depositPercentage', 'Deposit Percentage')} *</Label>
                <Input
                  id="deposit_percentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.deposit_percentage || ''}
                  onChange={(e) => setFormData({ ...formData, deposit_percentage: Number(e.target.value) })}
                  placeholder="30"
                  required
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="deposit_amount" suppressHydrationWarning>{t('admin.payments.plans.form.depositAmount', 'Deposit Amount')} *</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deposit_amount || ''}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: Number(e.target.value) })}
                  placeholder="1000"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="installment_count" suppressHydrationWarning>{t('admin.payments.plans.form.numberOfInstallments', 'Number of Installments')} *</Label>
              <Input
                id="installment_count"
                type="number"
                min="1"
                value={formData.installment_count || ''}
                onChange={(e) => setFormData({ ...formData, installment_count: Number(e.target.value) })}
                placeholder="6"
                required
              />
            </div>
            <div>
              <Label htmlFor="installment_frequency" suppressHydrationWarning>{t('admin.payments.plans.form.frequency', 'Frequency')} *</Label>
              <Select
                value={formData.installment_frequency}
                onValueChange={(value) => setFormData({ ...formData, installment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.selectFrequency', 'Select frequency')} />
                </SelectTrigger>
                <SelectContent dir={direction}>
                  <SelectItem value="weekly" suppressHydrationWarning>{t('admin.payments.plans.form.weekly', 'Weekly')}</SelectItem>
                  <SelectItem value="biweekly" suppressHydrationWarning>{t('admin.payments.plans.form.biweekly', 'Bi-weekly')}</SelectItem>
                  <SelectItem value="monthly" suppressHydrationWarning>{t('admin.payments.plans.form.monthly', 'Monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installments Configuration */}
      {formData.plan_type === 'installments' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.plans.form.installmentsConfig', 'Installments Configuration')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="installment_count" suppressHydrationWarning>{t('admin.payments.plans.form.numberOfInstallments', 'Number of Installments')} *</Label>
              <Input
                id="installment_count"
                type="number"
                min="1"
                value={formData.installment_count || ''}
                onChange={(e) => setFormData({ ...formData, installment_count: Number(e.target.value) })}
                placeholder="12"
                required
              />
            </div>
            <div>
              <Label htmlFor="installment_frequency" suppressHydrationWarning>{t('admin.payments.plans.form.frequency', 'Frequency')} *</Label>
              <Select
                value={formData.installment_frequency}
                onValueChange={(value) => setFormData({ ...formData, installment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.selectFrequency', 'Select frequency')} />
                </SelectTrigger>
                <SelectContent dir={direction}>
                  <SelectItem value="weekly" suppressHydrationWarning>{t('admin.payments.plans.form.weekly', 'Weekly')}</SelectItem>
                  <SelectItem value="biweekly" suppressHydrationWarning>{t('admin.payments.plans.form.biweekly', 'Bi-weekly')}</SelectItem>
                  <SelectItem value="monthly" suppressHydrationWarning>{t('admin.payments.plans.form.monthly', 'Monthly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Configuration */}
      {formData.plan_type === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.plans.form.subscriptionConfig', 'Subscription Configuration')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subscription_frequency" suppressHydrationWarning>{t('admin.payments.plans.form.billingFrequency', 'Billing Frequency')} *</Label>
              <Select
                value={formData.subscription_frequency}
                onValueChange={(value) => setFormData({ ...formData, subscription_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.selectFrequency', 'Select frequency')} />
                </SelectTrigger>
                <SelectContent dir={direction}>
                  <SelectItem value="weekly" suppressHydrationWarning>{t('admin.payments.plans.form.weekly', 'Weekly')}</SelectItem>
                  <SelectItem value="monthly" suppressHydrationWarning>{t('admin.payments.plans.form.monthly', 'Monthly')}</SelectItem>
                  <SelectItem value="quarterly" suppressHydrationWarning>{t('admin.payments.plans.form.quarterly', 'Quarterly')}</SelectItem>
                  <SelectItem value="annually" suppressHydrationWarning>{t('admin.payments.plans.form.annually', 'Annually')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base" suppressHydrationWarning>{t('admin.payments.plans.form.settings', 'Settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="priority" suppressHydrationWarning>{t('admin.payments.plans.priority', 'Priority')}</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
              {t('admin.payments.plans.form.priorityDesc', 'Higher priority plans are selected first during auto-detection')}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_detect_enabled" suppressHydrationWarning>{t('admin.payments.plans.form.autoDetectionEnabled', 'Auto-Detection Enabled')}</Label>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.plans.form.autoDetectionDesc', 'Automatically assign this plan to eligible enrollments')}
              </p>
            </div>
            <Switch
              id="auto_detect_enabled"
              checked={formData.auto_detect_enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, auto_detect_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active" suppressHydrationWarning>{t('admin.payments.plans.form.active', 'Active')}</Label>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.plans.form.activeDesc', 'Inactive plans cannot be assigned to new enrollments')}
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_default" suppressHydrationWarning>{t('admin.payments.plans.form.defaultPlan', 'Default Plan')}</Label>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('admin.payments.plans.form.defaultPlanDesc', 'Use this plan when no other plan matches')}
              </p>
            </div>
            <Switch
              id="is_default"
              checked={formData.is_default}
              onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          <span suppressHydrationWarning>{t('admin.payments.plans.form.cancel', 'Cancel')}</span>
        </Button>
        <Button type="submit">
          <span suppressHydrationWarning>{plan ? t('admin.payments.plans.form.saveChanges', 'Save Changes') : t('admin.payments.plans.form.createPlan', 'Create Plan')}</span>
        </Button>
      </DialogFooter>
    </form>
  );
}
