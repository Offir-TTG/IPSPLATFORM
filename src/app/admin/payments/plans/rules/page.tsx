'use client';

export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import React, { useState, useEffect } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  TestTube,
  ArrowLeft,
  Check,
  X,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface AutoDetectRule {
  id: string;
  rule_type: 'price_range' | 'product_type' | 'product_metadata' | 'user_segment';
  operator: 'between' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'equals' | 'contains';
  value: any;
  value_min?: number;
  value_max?: number;
}

interface PaymentPlan {
  id: string;
  plan_name: string;
  plan_type: string;
  auto_detect_rules?: AutoDetectRule[];
  priority: number;
}

interface TestResult {
  matched_plan?: PaymentPlan;
  detection_method: 'auto' | 'forced' | 'default';
  matched_rules: string[];
  failed_rules: string[];
}

export default function AutoDetectionRulesPage() {
  const { t } = useAdminLanguage();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/plans');
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load payment plans');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRules = async (planId: string, rules: AutoDetectRule[]) => {
    try {
      const response = await fetch(`/api/admin/payments/plans/${planId}/rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules }),
      });

      if (!response.ok) throw new Error('Failed to update rules');
      toast.success('Auto-detection rules updated successfully');
      setRulesDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error('Error updating rules:', error);
      toast.error(error.message || 'Failed to update rules');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/payments/plans">
              <Button variant="ghost" className="mb-2">
                <ArrowLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                Back to Payment Plans
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Auto-Detection Rules</h1>
            <p className="text-muted-foreground mt-1">
              Configure automatic payment plan detection rules
            </p>
          </div>
          <Button onClick={() => setTestDialogOpen(true)}>
            <TestTube className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            Test Detection
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>How it works:</strong> When a user enrolls in a product, the system evaluates plans by priority (highest first).
            The first plan where ALL rules match is selected. If no rules match, the default plan is used.
          </AlertDescription>
        </Alert>

        {/* Plans with Rules */}
        <div className="grid gap-4">
          {plans
            .sort((a, b) => b.priority - a.priority)
            .map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle>{plan.plan_name}</CardTitle>
                        <Badge variant="outline">Priority: {plan.priority}</Badge>
                        <Badge variant="outline" className="capitalize">{plan.plan_type}</Badge>
                      </div>
                      <CardDescription>
                        {plan.auto_detect_rules && plan.auto_detect_rules.length > 0
                          ? `${plan.auto_detect_rules.length} rule(s) configured`
                          : 'No auto-detection rules configured'}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPlan(plan);
                        setRulesDialogOpen(true);
                      }}
                    >
                      Configure Rules
                    </Button>
                  </div>
                </CardHeader>

                {plan.auto_detect_rules && plan.auto_detect_rules.length > 0 && (
                  <CardContent>
                    <div className="space-y-2">
                      {plan.auto_detect_rules.map((rule, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="font-medium capitalize">{rule.rule_type.replace('_', ' ')}:</span>
                          <span className="text-muted-foreground">
                            {getRuleDescription(rule)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
        </div>

        {/* Rules Editor Dialog */}
        <RulesEditorDialog
          open={rulesDialogOpen}
          plan={selectedPlan}
          onClose={() => setRulesDialogOpen(false)}
          onSave={handleUpdateRules}
        />

        {/* Test Detection Dialog */}
        <TestDetectionDialog
          open={testDialogOpen}
          plans={plans}
          onClose={() => setTestDialogOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}

function getRuleDescription(rule: AutoDetectRule): string {
  switch (rule.rule_type) {
    case 'price_range':
      if (rule.operator === 'between') {
        return `$${rule.value_min} - $${rule.value_max}`;
      } else if (rule.operator === 'greater_than') {
        return `> $${rule.value}`;
      } else if (rule.operator === 'less_than') {
        return `< $${rule.value}`;
      }
      return String(rule.value);
    case 'product_type':
      if (rule.operator === 'in') {
        return `in [${Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}]`;
      } else if (rule.operator === 'not_in') {
        return `not in [${Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}]`;
      }
      return String(rule.value);
    case 'product_metadata':
      return `${rule.operator} "${rule.value}"`;
    case 'user_segment':
      return `${rule.operator} [${Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}]`;
    default:
      return String(rule.value);
  }
}

// Rules Editor Dialog
function RulesEditorDialog({
  open,
  plan,
  onClose,
  onSave,
}: {
  open: boolean;
  plan: PaymentPlan | null;
  onClose: () => void;
  onSave: (planId: string, rules: AutoDetectRule[]) => void;
}) {
  const [rules, setRules] = useState<AutoDetectRule[]>([]);

  useEffect(() => {
    if (plan) {
      setRules(plan.auto_detect_rules || []);
    }
  }, [plan]);

  const addRule = () => {
    setRules([
      ...rules,
      {
        id: `temp_${Date.now()}`,
        rule_type: 'price_range',
        operator: 'between',
        value: 0,
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, updates: Partial<AutoDetectRule>) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    setRules(newRules);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan) {
      onSave(plan.id, rules);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Auto-Detection Rules</DialogTitle>
          <DialogDescription>
            Set rules for automatic payment plan detection for: {plan.plan_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All rules must match for this plan to be selected. If you need OR logic, create multiple plans.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {rules.map((rule, index) => (
              <Card key={index}>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid gap-4 md:grid-cols-3">
                      <div>
                        <Label>Rule Type</Label>
                        <Select
                          value={rule.rule_type}
                          onValueChange={(value: any) => updateRule(index, { rule_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price_range">Price Range</SelectItem>
                            <SelectItem value="product_type">Product Type</SelectItem>
                            <SelectItem value="product_metadata">Product Metadata</SelectItem>
                            <SelectItem value="user_segment">User Segment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Operator</Label>
                        <Select
                          value={rule.operator}
                          onValueChange={(value: any) => updateRule(index, { operator: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {rule.rule_type === 'price_range' && (
                              <>
                                <SelectItem value="between">Between</SelectItem>
                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                <SelectItem value="less_than">Less Than</SelectItem>
                              </>
                            )}
                            {(rule.rule_type === 'product_type' || rule.rule_type === 'user_segment') && (
                              <>
                                <SelectItem value="in">In</SelectItem>
                                <SelectItem value="not_in">Not In</SelectItem>
                              </>
                            )}
                            {rule.rule_type === 'product_metadata' && (
                              <>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Value</Label>
                        {rule.rule_type === 'price_range' && rule.operator === 'between' ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={rule.value_min || ''}
                              onChange={(e) => updateRule(index, { value_min: Number(e.target.value) })}
                            />
                            <Input
                              type="number"
                              placeholder="Max"
                              value={rule.value_max || ''}
                              onChange={(e) => updateRule(index, { value_max: Number(e.target.value) })}
                            />
                          </div>
                        ) : rule.rule_type === 'price_range' ? (
                          <Input
                            type="number"
                            value={rule.value || ''}
                            onChange={(e) => updateRule(index, { value: Number(e.target.value) })}
                          />
                        ) : (
                          <Input
                            value={Array.isArray(rule.value) ? rule.value.join(', ') : rule.value || ''}
                            onChange={(e) =>
                              updateRule(index, {
                                value: e.target.value.includes(',')
                                  ? e.target.value.split(',').map(v => v.trim())
                                  : e.target.value,
                              })
                            }
                            placeholder={
                              rule.rule_type === 'product_type'
                                ? 'e.g., course, program'
                                : rule.rule_type === 'user_segment'
                                ? 'e.g., student, professional'
                                : 'e.g., category=premium'
                            }
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="button" variant="outline" onClick={addRule} className="w-full">
            <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            Add Rule
          </Button>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Rules</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Test Detection Dialog
function TestDetectionDialog({
  open,
  plans,
  onClose,
}: {
  open: boolean;
  plans: PaymentPlan[];
  onClose: () => void;
}) {
  const [productType, setProductType] = useState('course');
  const [price, setPrice] = useState(1000);
  const [metadata, setMetadata] = useState('');
  const [userSegment, setUserSegment] = useState('student');
  const [result, setResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    try {
      setTesting(true);
      const response = await fetch('/api/admin/payments/plans/test-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: productType,
          price,
          metadata: metadata ? JSON.parse(metadata) : {},
          user_segment: userSegment,
        }),
      });

      if (!response.ok) throw new Error('Failed to test detection');
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('Error testing detection:', error);
      toast.error(error.message || 'Failed to test detection');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Test Auto-Detection</DialogTitle>
          <DialogDescription>
            Test which payment plan would be automatically selected based on product and user attributes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Product Type</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="program">Program</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="lecture">Lecture</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Price</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

            <div>
              <Label>User Segment</Label>
              <Select value={userSegment} onValueChange={setUserSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Product Metadata (JSON)</Label>
              <Input
                value={metadata}
                onChange={(e) => setMetadata(e.target.value)}
                placeholder='{"category": "premium"}'
              />
            </div>
          </div>

          <Button onClick={handleTest} disabled={testing} className="w-full">
            {testing ? 'Testing...' : 'Run Test'}
          </Button>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.matched_plan ? (
                  <>
                    <Alert>
                      <Check className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        <strong>Matched Plan:</strong> {result.matched_plan.plan_name}
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label className="text-muted-foreground">Detection Method</Label>
                      <Badge variant="outline" className="capitalize">
                        {result.detection_method}
                      </Badge>
                    </div>

                    {result.matched_rules.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Matched Rules</Label>
                        <div className="space-y-1 mt-2">
                          {result.matched_rules.map((rule, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-green-500" />
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.failed_rules.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Failed Rules</Label>
                        <div className="space-y-1 mt-2">
                          {result.failed_rules.map((rule, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <X className="h-4 w-4 text-red-500" />
                              <span>{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert variant="destructive">
                    <X className="h-4 w-4" />
                    <AlertDescription>
                      No matching payment plan found. Default plan would be used.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
