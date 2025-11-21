'use client';

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
import { toast } from 'sonner';
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
  const { t } = useAdminLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch payment plans from API
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching payment plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setLoading(false);
    }
  };

  // Load plans on mount
  useEffect(() => {
    fetchPlans();
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
    if (!confirm(t('admin.payments.plans.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/admin/payments/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete plan');
      }

      toast.success('Payment plan deleted successfully');
      fetchPlans();
    } catch (error: any) {
      console.error('Error deleting payment plan:', error);
      toast.error(error.message || 'Failed to delete payment plan');
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

      toast.success(`Payment plan ${isEditing ? 'updated' : 'created'} successfully`);
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving payment plan:', error);
      toast.error(error.message || 'Failed to save payment plan');
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
      case 'one_time': return t('admin.payments.plans.types.oneTime');
      case 'deposit': return t('admin.payments.plans.types.deposit');
      case 'installments': return t('admin.payments.plans.types.installments');
      case 'subscription': return t('admin.payments.plans.types.subscription');
      default: return type;
    }
  };

  const getPlanDetails = (plan: PaymentPlan) => {
    switch (plan.plan_type) {
      case 'deposit':
        return `${plan.deposit_percentage}% deposit, ${plan.installment_count} ${plan.installment_frequency} payments`;
      case 'installments':
        return `${plan.installment_count} ${plan.installment_frequency} payments`;
      case 'subscription':
        return `${plan.subscription_frequency} recurring billing`;
      default:
        return 'Pay full amount upfront';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('common.back', 'Back')}
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{t('admin.payments.plans.title')}</h1>
              <p className="text-muted-foreground mt-1">
                {t('admin.payments.plans.description')}
              </p>
            </div>
          </div>
          <Button onClick={handleCreatePlan}>
            <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            {t('admin.payments.plans.createPlan')}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('admin.payments.plans.autoDetection')}</AlertTitle>
          <AlertDescription>
            {t('admin.payments.plans.autoDetectionDesc')}
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
                    <div className="flex items-center gap-2">
                      <CardTitle>{plan.plan_name}</CardTitle>
                      <Badge className={getPlanTypeColor(plan.plan_type)}>
                        {getPlanTypeLabel(plan.plan_type)}
                      </Badge>
                      {plan.is_default && (
                        <Badge variant="outline" className="border-primary text-primary">
                          {t('admin.payments.plans.default')}
                        </Badge>
                      )}
                      {plan.auto_detect_enabled && (
                        <Badge variant="outline">
                          <TrendingUp className="ltr:mr-1 rtl:ml-1 h-3 w-3" />
                          {t('admin.payments.plans.autoDetect')}
                        </Badge>
                      )}
                      {!plan.is_active && (
                        <Badge variant="outline" className="border-gray-400 text-gray-600">
                          {t('admin.payments.plans.inactive')}
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{plan.plan_description}</CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{t('admin.payments.plans.priority')}: {plan.priority}</span>
                      <span>•</span>
                      <span>{getPlanDetails(plan)}</span>
                      {plan.usage_count !== undefined && (
                        <>
                          <span>•</span>
                          <span>{plan.usage_count} {t('admin.payments.plans.enrollments')}</span>
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
        {plans.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">{t('admin.payments.plans.noPlans')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.payments.plans.noPlansDesc')}
              </p>
              <Button onClick={handleCreatePlan}>
                <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('admin.payments.plans.createPlan')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? t('admin.payments.plans.form.editTitle') : t('admin.payments.plans.form.createTitle')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.payments.plans.form.description')}
              </DialogDescription>
            </DialogHeader>
            <PaymentPlanForm
              plan={editingPlan}
              onSave={handleSavePlan}
              onCancel={() => setIsDialogOpen(false)}
              t={t}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Payment Plan Form Component
function PaymentPlanForm({ plan, onSave, onCancel, t }: {
  plan: PaymentPlan | null;
  onSave: (plan: PaymentPlan) => void;
  onCancel: () => void;
  t: (key: string) => string;
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
          <Label htmlFor="plan_name">{t('admin.payments.plans.form.planName')} *</Label>
          <Input
            id="plan_name"
            value={formData.plan_name}
            onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
            placeholder={t('admin.payments.plans.form.planNamePlaceholder')}
            required
          />
        </div>

        <div>
          <Label htmlFor="plan_description">{t('admin.payments.plans.form.planDescription')}</Label>
          <Textarea
            id="plan_description"
            value={formData.plan_description}
            onChange={(e) => setFormData({ ...formData, plan_description: e.target.value })}
            placeholder={t('admin.payments.plans.form.planDescriptionPlaceholder')}
          />
        </div>

        <div>
          <Label htmlFor="plan_type">{t('admin.payments.plans.form.planType')} *</Label>
          <Select
            value={formData.plan_type}
            onValueChange={(value: any) => setFormData({ ...formData, plan_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">{t('admin.payments.plans.form.oneTimePayment')}</SelectItem>
              <SelectItem value="deposit">{t('admin.payments.plans.form.depositInstallments')}</SelectItem>
              <SelectItem value="installments">{t('admin.payments.plans.form.installmentsOnly')}</SelectItem>
              <SelectItem value="subscription">{t('admin.payments.plans.form.subscription')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deposit Configuration */}
      {formData.plan_type === 'deposit' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('admin.payments.plans.form.depositConfig')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="deposit_percentage">{t('admin.payments.plans.form.depositPercentage')} *</Label>
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
            <div>
              <Label htmlFor="installment_count">{t('admin.payments.plans.form.numberOfInstallments')} *</Label>
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
              <Label htmlFor="installment_frequency">{t('admin.payments.plans.form.frequency')} *</Label>
              <Select
                value={formData.installment_frequency}
                onValueChange={(value) => setFormData({ ...formData, installment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.selectFrequency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('admin.payments.plans.form.weekly')}</SelectItem>
                  <SelectItem value="biweekly">{t('admin.payments.plans.form.biweekly')}</SelectItem>
                  <SelectItem value="monthly">{t('admin.payments.plans.form.monthly')}</SelectItem>
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
            <CardTitle className="text-base">{t('admin.payments.plans.form.installmentsConfig')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="installment_count">{t('admin.payments.plans.form.numberOfInstallments')} *</Label>
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
              <Label htmlFor="installment_frequency">{t('admin.payments.plans.form.frequency')} *</Label>
              <Select
                value={formData.installment_frequency}
                onValueChange={(value) => setFormData({ ...formData, installment_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.selectFrequency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('admin.payments.plans.form.weekly')}</SelectItem>
                  <SelectItem value="biweekly">{t('admin.payments.plans.form.biweekly')}</SelectItem>
                  <SelectItem value="monthly">{t('admin.payments.plans.form.monthly')}</SelectItem>
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
            <CardTitle className="text-base">{t('admin.payments.plans.form.subscriptionConfig')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subscription_frequency">{t('admin.payments.plans.form.billingFrequency')} *</Label>
              <Select
                value={formData.subscription_frequency}
                onValueChange={(value) => setFormData({ ...formData, subscription_frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.payments.plans.form.selectFrequency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t('admin.payments.plans.form.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('admin.payments.plans.form.monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('admin.payments.plans.form.quarterly')}</SelectItem>
                  <SelectItem value="annually">{t('admin.payments.plans.form.annually')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.payments.plans.form.settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="priority">{t('admin.payments.plans.priority')}</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.payments.plans.form.priorityDesc')}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_detect_enabled">{t('admin.payments.plans.form.autoDetectionEnabled')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('admin.payments.plans.form.autoDetectionDesc')}
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
              <Label htmlFor="is_active">{t('admin.payments.plans.form.active')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('admin.payments.plans.form.activeDesc')}
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
              <Label htmlFor="is_default">{t('admin.payments.plans.form.defaultPlan')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('admin.payments.plans.form.defaultPlanDesc')}
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
          {t('admin.payments.plans.form.cancel')}
        </Button>
        <Button type="submit">
          {plan ? t('admin.payments.plans.form.saveChanges') : t('admin.payments.plans.form.createPlan')}
        </Button>
      </DialogFooter>
    </form>
  );
}
