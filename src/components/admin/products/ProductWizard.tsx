'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import { Product, ProductFormData, PaymentModel, ProductType, PaymentPlanConfig } from '@/types/product';
import { ContentSelector } from '@/components/products/ContentSelector';
import { PaymentPlanConfig as PaymentPlanConfigComponent } from '@/components/products/PaymentPlanConfig';
import { DocuSignConfig } from '@/components/products/DocuSignConfig';
import { PaymentPlanSelector } from '@/components/products/PaymentPlanSelector';
import { EmailTemplateSelector } from '@/components/products/EmailTemplateSelector';
import {
  Plus,
  Edit,
  Trash2,
  Link2,
  Package,
  DollarSign,
  Search,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Video,
  Users,
  Star,
  FileSignature,
  Grid3x3,
  Calendar,
  Sparkles,
  XCircle,
  Info,
  Check,
  X,
} from 'lucide-react';


const STEP_IDS = ['basic', 'content', 'pricing', 'emails', 'integrations'] as const;
type StepId = (typeof STEP_IDS)[number];

/** Which step each check belongs to, so Save can open the step with the problem. */
const ERROR_STEP: Record<string, StepId> = {
  title: 'basic',
  program_id: 'content',
  course_id: 'content',
  contains_courses: 'content',
  session_count: 'content',
  price: 'pricing',
  deposit_type: 'pricing',
  deposit_percentage: 'pricing',
  deposit_amount: 'pricing',
  installments: 'pricing',
  subscription_interval: 'pricing',
  signature_template_id: 'integrations',
};

/**
 * Creating or editing a product, step by step on its own page (it used to
 * be a dialog with tabs). Every field, check and saving rule is the same as
 * before: Continue stops on a step with something missing and says why by
 * the field; Save checks every step and opens the first one with a problem.
 * Saving is in the floating bar that appears once something changes.
 */
export function ProductWizard({ product, onSave, t }: {
  product: Product | null;
  /** Saves; resolves true when it worked, so the bar can settle. */
  onSave: (product: ProductFormData) => Promise<boolean>;
  t: (key: string, fallback: string) => string;
}) {
  const { direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [formData, setFormData] = useState<ProductFormData>({
    type: 'course',
    title: '',
    description: '',
    payment_model: 'one_time',
    price: 0,
    currency: 'USD',
    payment_plan: {},
    requires_signature: false,
    completion_benefit: '',
    completion_description: '',
    access_duration: '',
    access_description: '',
    is_active: true,
  });

  // Payment plan selection state
  const [useTemplates, setUseTemplates] = useState(false);

  // Payment configuration mode: 'custom' or 'template'
  const [configMode, setConfigMode] = useState<'custom' | 'template'>('custom');

  // Error states for inline display
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enrollment stats for warning
  const [enrollmentStats, setEnrollmentStats] = useState<{
    active_enrollments: number;
    pending_invitations: number;
    total: number;
  } | null>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('basic');

  // Use ref to access product without adding it as a dependency
  const productRef = useRef(product);
  useEffect(() => {
    productRef.current = product;
  }, [product]);

  // Use ref to track formData without causing callback recreation
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Handle tab change with validation
  const handleTabChange = useCallback((newTab: string) => {
    // Don't validate if user is just clicking on current tab
    if (newTab === activeTab) return;
    // Going back never needs a check.
    if (STEP_IDS.indexOf(newTab as StepId) < STEP_IDS.indexOf(activeTab as StepId)) {
      setActiveTab(newTab);
      setValidationErrors({});
      setFormError(null);
      return;
    }

    // Get current formData from ref
    const currentFormData = formDataRef.current;

    // Validate current tab before switching
    const errors: Record<string, string> = {};

    if (activeTab === 'basic') {
      // Basic Info validation
      if (!currentFormData.title.trim()) {
        errors.title = t('products.validation.title_required', 'Product title is required');
      }
    } else if (activeTab === 'content') {
      // Content validation
      if (currentFormData.type === 'program' && !currentFormData.program_id) {
        errors.program_id = t('products.validation.program_required', 'Please select a program');
      } else if (currentFormData.type === 'bundle' && (!currentFormData.contains_courses || currentFormData.contains_courses.length === 0)) {
        errors.contains_courses = t('products.validation.courses_required', 'Please select at least one course for the bundle');
      } else if (currentFormData.type === 'session_pack' && (!currentFormData.session_count || currentFormData.session_count <= 0)) {
        errors.session_count = t('products.validation.session_count_required', 'Please specify number of sessions');
      } else if (currentFormData.type === 'course' && !currentFormData.course_id) {
        errors.course_id = t('products.validation.course_required', 'Please select a course');
      }
    } else if (activeTab === 'pricing') {
      // Pricing validation
      if (currentFormData.payment_model !== 'free' && (!currentFormData.price || currentFormData.price <= 0)) {
        errors.price = t('products.validation.price_required', 'Price is required for paid products');
      }

      // Payment plan validation
      if (currentFormData.payment_model === 'deposit_then_plan') {
        if (!currentFormData.payment_plan?.deposit_type) {
          errors.deposit_type = t('products.validation.deposit_type_required', 'Please select a deposit type');
        }
        if (currentFormData.payment_plan?.deposit_type === 'percentage' && (!currentFormData.payment_plan?.deposit_percentage || currentFormData.payment_plan.deposit_percentage <= 0)) {
          errors.deposit_percentage = t('products.validation.deposit_percentage_required', 'Please specify deposit percentage');
        }
        if (currentFormData.payment_plan?.deposit_type === 'fixed' && (!currentFormData.payment_plan?.deposit_amount || currentFormData.payment_plan.deposit_amount <= 0)) {
          errors.deposit_amount = t('products.validation.deposit_amount_required', 'Please specify deposit amount');
        }
        if (!currentFormData.payment_plan?.installments || currentFormData.payment_plan.installments <= 0) {
          errors.installments = t('products.validation.installments_required', 'Please specify number of installments');
        }
        // Note: payment_start_date moved to product level and is optional
      }

      if (currentFormData.payment_model === 'subscription' && !currentFormData.payment_plan?.subscription_interval) {
        errors.subscription_interval = t('products.validation.subscription_interval_required', 'Please select billing interval');
      }
    } else if (activeTab === 'integrations') {
      // Integrations validation
      if (currentFormData.requires_signature && !currentFormData.signature_template_id) {
        errors.signature_template_id = t('products.validation.template_required', 'DocuSign template is required when signature is required');
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setFormError(t('products.validation.complete_required', 'Please complete all required fields before proceeding'));
      return; // Prevent tab change
    }

    // Validation passed - switch tabs and clear errors
    setActiveTab(newTab);
    setValidationErrors({});
    setFormError(null);
  }, [activeTab, t]);

  const [initialData, setInitialData] = useState<ProductFormData | null>(null);
  const [initialConfigMode, setInitialConfigMode] = useState<'custom' | 'template'>('custom');

  useEffect(() => {
    if (product) {
      const loaded: ProductFormData = {
        type: product.type,
        title: product.title,
        description: product.description,
        program_id: product.program_id,
        course_id: product.course_id,
        contains_courses: product.contains_courses,
        session_count: product.session_count,
        payment_model: product.payment_model,
        price: product.price,
        currency: product.currency || 'USD',
        payment_plan: product.payment_plan || {},
        payment_start_date: product.payment_start_date ? product.payment_start_date.split('T')[0] : undefined,
        default_payment_plan_id: product.default_payment_plan_id,
        alternative_payment_plan_ids: product.alternative_payment_plan_ids || [],
        allow_plan_selection: product.allow_plan_selection ?? true,
        requires_signature: product.requires_signature,
        signature_template_id: product.signature_template_id,
        completion_benefit: product.completion_benefit || '',
        completion_description: product.completion_description || '',
        access_duration: product.access_duration || '',
        access_description: product.access_description || '',
        crm_tag_slugs: product.crm_tag_slugs || [],
        enrollment_invitation_template_key: product.enrollment_invitation_template_key,
        enrollment_confirmation_template_key: product.enrollment_confirmation_template_key,
        enrollment_reminder_template_key: product.enrollment_reminder_template_key,
        is_active: product.is_active,
        metadata: product.metadata,
      };
      setFormData(loaded);
      setInitialData(loaded);

      // Set useTemplates based on whether product has payment plan references
      // Check both default_payment_plan_id (legacy) and alternative_payment_plan_ids
      const hasTemplates: boolean = !!product.default_payment_plan_id || (!!product.alternative_payment_plan_ids && product.alternative_payment_plan_ids.length > 0);
      setUseTemplates(hasTemplates);

      // Set config mode based on whether product uses templates
      setConfigMode(hasTemplates ? 'template' : 'custom');
      setInitialConfigMode(hasTemplates ? 'template' : 'custom');

      // Fetch enrollment stats for warning display
      if (product.id) {
        fetch(`/api/admin/payments/products/${product.id}/enrollment-stats`)
          .then(res => res.json())
          .then(data => setEnrollmentStats(data))
          .catch(err => {
            console.error('Failed to fetch enrollment stats:', err);
            setEnrollmentStats(null);
          });
      }
    } else {
      // Reset enrollment stats when creating new product
      setEnrollmentStats(null);
      setInitialData(formDataRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const dirty = !!initialData && (JSON.stringify(formData) !== JSON.stringify(initialData) || configMode !== initialConfigMode);
  const showBar = dirty || !product;

  // Leaving the page with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const discard = () => {
    if (!initialData) return;
    setFormData(initialData);
    setConfigMode(initialConfigMode);
    setUseTemplates(initialConfigMode === 'template');
    setValidationErrors({});
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setValidationErrors({});
    setFormError(null);

    const errors: Record<string, string> = {};

    // Validation - Basic Info
    if (!formData.title.trim()) {
      errors.title = t('products.validation.title_required', 'Product title is required');
    }

    // Validation - Content
    if (formData.type === 'program' && !formData.program_id) {
      errors.program_id = t('products.validation.program_required', 'Please select a program');
    }

    if (formData.type === 'bundle' && (!formData.contains_courses || formData.contains_courses.length === 0)) {
      errors.contains_courses = t('products.validation.courses_required', 'Please select at least one course for the bundle');
    }

    if (formData.type === 'session_pack' && (!formData.session_count || formData.session_count <= 0)) {
      errors.session_count = t('products.validation.session_count_required', 'Please specify number of sessions');
    }

    if (!['program', 'bundle', 'session_pack'].includes(formData.type) && !formData.course_id) {
      errors.course_id = t('products.validation.course_required', 'Please select a course');
    }

    // Validation - Pricing
    if (formData.payment_model !== 'free' && (!formData.price || formData.price <= 0)) {
      errors.price = t('products.validation.price_required', 'Price is required for paid products');
    }

    if (formData.payment_model === 'deposit_then_plan') {
      const plan = formData.payment_plan || {};

      if (!plan.deposit_type || plan.deposit_type === 'none') {
        errors.deposit_type = t('products.validation.deposit_type_required', 'Please select a deposit type');
      }

      if (plan.deposit_type === 'percentage' && (!plan.deposit_percentage || plan.deposit_percentage <= 0)) {
        errors.deposit_percentage = t('products.validation.deposit_percentage_required', 'Please specify deposit percentage');
      }

      if (plan.deposit_type === 'fixed' && (!plan.deposit_amount || plan.deposit_amount <= 0)) {
        errors.deposit_amount = t('products.validation.deposit_amount_required', 'Please specify deposit amount');
      }

      if (!plan.installments || plan.installments <= 0) {
        errors.installments = t('products.validation.installments_required', 'Please specify number of installments');
      }

      // Note: payment_start_date moved to product level and is optional
    }

    if (formData.payment_model === 'subscription' && !formData.payment_plan.subscription_interval) {
      errors.subscription_interval = t('products.validation.subscription_interval_required', 'Please select billing interval');
    }

    // Validation - Integrations
    if (formData.requires_signature && !formData.signature_template_id) {
      errors.signature_template_id = t('products.validation.template_required', 'DocuSign template is required when signature is required');
    }

    // If there are validation errors, open the first step with one and say so
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstStep = STEP_IDS.find((id) => Object.keys(errors).some((k) => ERROR_STEP[k] === id)) ?? 'basic';
      setActiveTab(firstStep);
      setFormError(t('products.validation.complete_required', 'Please complete all required fields before proceeding'));
      document.getElementById('product-wizard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Clean up data based on payment model
    const cleanedData = { ...formData };
    if (formData.payment_model === 'free') {
      cleanedData.price = undefined;
    }

    // Set submitting state
    setIsSubmitting(true);
    try {
      const ok = await onSave(cleanedData);
      if (ok) setInitialData(formData);
      if (ok) setInitialConfigMode(configMode);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoized callbacks for ContentSelector to prevent infinite loops
  const handleTypeChange = useCallback((type: ProductType) => {
    setFormData(prev => ({ ...prev, type }));
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.program_id;
      delete newErrors.course_id;
      delete newErrors.contains_courses;
      delete newErrors.session_count;
      return newErrors;
    });
  }, []);

  const handleProgramChange = useCallback((id: string | undefined) => {
    setFormData(prev => ({ ...prev, program_id: id }));
    setValidationErrors(prev => ({ ...prev, program_id: '' }));
  }, []);

  const handleCourseChange = useCallback((id: string | undefined) => {
    setFormData(prev => ({ ...prev, course_id: id }));
    setValidationErrors(prev => ({ ...prev, course_id: '' }));
  }, []);

  const handleContainsCoursesChange = useCallback((ids: string[]) => {
    setFormData(prev => ({ ...prev, contains_courses: ids }));
    setValidationErrors(prev => ({ ...prev, contains_courses: '' }));
  }, []);

  const handleSessionCountChange = useCallback((count: number | undefined) => {
    setFormData(prev => ({ ...prev, session_count: count }));
    setValidationErrors(prev => ({ ...prev, session_count: '' }));
  }, []);

  const handleContentNameChange = useCallback((name: string) => {
    if (!productRef.current) {
      setFormData(prev => {
        // Only update if the title actually changed
        if (prev.title === name) return prev;
        return { ...prev, title: name };
      });
    }
  }, []);

  const index = STEP_IDS.indexOf(activeTab as StepId);
  const stepLabel = (id: StepId) =>
    ({
      basic: t('products.tabs.basic', 'Basic Info'),
      content: t('products.tabs.content', 'Content'),
      pricing: t('products.tabs.pricing', 'Pricing'),
      emails: t('products.tabs.emails', 'Email Templates'),
      integrations: t('products.tabs.integrations', 'Integrations'),
    })[id];

  return (
    <form id="product-wizard" onSubmit={handleSubmit} className="scroll-mt-4 pb-28" noValidate dir={direction}>
      {/* Steps */}
      <header className="mb-4 rounded-md border border-border bg-card px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {t('admin.notifications.wizard.stepOf', 'Step {n} of {total}')
              .replace('{n}', String(index + 1))
              .replace('{total}', String(STEP_IDS.length))}
          </span>
          <span className="text-xs text-muted-foreground">{t('admin.notifications.wizard.jumpHint', 'Click a step to jump to it')}</span>
        </div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden>
          {STEP_IDS.map((id, i) => (
            <i key={id} className={`h-1.5 flex-1 rounded ${i <= index ? 'bg-blue-600' : 'bg-blue-100 dark:bg-blue-900/50'}`} />
          ))}
        </div>
        <ol className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {STEP_IDS.map((id, i) => (
            <li key={id} className="shrink-0">
              <button
                type="button"
                onClick={() => handleTabChange(id)}
                aria-current={id === activeTab ? 'step' : undefined}
                className={`inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors ${
                  id === activeTab
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : i < index
                      ? 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
                      : 'border-border text-muted-foreground hover:border-blue-300'
                }`}
              >
                <span className="opacity-70">{i + 1}</span>
                {stepLabel(id)}
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="space-y-6 rounded-xl border border-border bg-card p-5">
      {/* General Error Alert */}
      {formError && (
        <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
          <XCircle className="h-4 w-4" />
          <AlertTitle suppressHydrationWarning>{t('common.error', 'Error')}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title" suppressHydrationWarning>{t('products.title', 'Product Title')} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (validationErrors.title) {
                  setValidationErrors({ ...validationErrors, title: '' });
                }
              }}
              placeholder={t('products.title_placeholder', 'e.g., Advanced Leadership Program')}
              className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.title ? 'border-destructive' : ''}`}
            />
            {validationErrors.title && (
              <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                {validationErrors.title}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description" suppressHydrationWarning>{t('products.description', 'Description')}</Label>
            <RichTextEditor
              value={formData.description || ''}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder={t('products.description_placeholder', 'Describe what this product includes...')}
              dir={direction}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="completion_benefit" suppressHydrationWarning>
                {t('products.completion_benefit', 'Completion Benefit')}
              </Label>
              <Input
                id="completion_benefit"
                value={formData.completion_benefit || ''}
                onChange={(e) => setFormData({ ...formData, completion_benefit: e.target.value })}
                placeholder={t('products.completion_benefit_placeholder', 'e.g., Certificate, Digital Badge')}
                className={isRtl ? 'text-right' : 'text-left'}
              />
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('products.completion_benefit_desc', 'What users receive upon completing the product')}
              </p>
            </div>

            <div>
              <Label htmlFor="completion_description" suppressHydrationWarning>
                {t('products.completion_description', 'Completion Description')}
              </Label>
              <Input
                id="completion_description"
                value={formData.completion_description || ''}
                onChange={(e) => setFormData({ ...formData, completion_description: e.target.value })}
                placeholder={t('products.completion_description_placeholder', 'e.g., Upon completion, After all modules')}
                className={isRtl ? 'text-right' : 'text-left'}
              />
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('products.completion_description_desc', 'When/how users receive the benefit')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="access_duration" suppressHydrationWarning>
                {t('products.access_duration', 'Access Duration')}
              </Label>
              <Input
                id="access_duration"
                value={formData.access_duration || ''}
                onChange={(e) => setFormData({ ...formData, access_duration: e.target.value })}
                placeholder={t('products.access_duration_placeholder', 'e.g., Lifetime access, 1 year')}
                className={isRtl ? 'text-right' : 'text-left'}
              />
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('products.access_duration_desc', 'How long users have access to the content')}
              </p>
            </div>

            <div>
              <Label htmlFor="access_description" suppressHydrationWarning>
                {t('products.access_description', 'Access Description')}
              </Label>
              <Input
                id="access_description"
                value={formData.access_description || ''}
                onChange={(e) => setFormData({ ...formData, access_description: e.target.value })}
                placeholder={t('products.access_description_placeholder', 'e.g., Learn at your own pace, Full access')}
                className={isRtl ? 'text-right' : 'text-left'}
              />
              <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                {t('products.access_description_desc', 'Description of access terms')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="is_active" suppressHydrationWarning>{t('products.active', 'Active')}</Label>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {t('products.active_desc', 'Only active products can accept new enrollments')}
              </p>
            </div>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <ContentSelector
            productType={formData.type}
            onTypeChange={handleTypeChange}
            programId={formData.program_id}
            onProgramChange={handleProgramChange}
            courseId={formData.course_id}
            onCourseChange={handleCourseChange}
            containsCourses={formData.contains_courses}
            onContainsCoursesChange={handleContainsCoursesChange}
            sessionCount={formData.session_count}
            onSessionCountChange={handleSessionCountChange}
            onContentNameChange={handleContentNameChange}
            validationErrors={validationErrors}
            t={t}
          />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="space-y-4 mt-4">
          {/* Price and Currency - Always at top */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price" suppressHydrationWarning>{t('products.price', 'Price')} *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => {
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                  if (validationErrors.price) {
                    setValidationErrors({ ...validationErrors, price: '' });
                  }
                }}
                className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.price ? 'border-destructive' : ''}`}
              />
              {validationErrors.price && (
                <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {validationErrors.price}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="currency" suppressHydrationWarning>{t('products.currency', 'Currency')} *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                  <SelectItem value="USD"><span suppressHydrationWarning>USD</span></SelectItem>
                  <SelectItem value="EUR"><span suppressHydrationWarning>EUR</span></SelectItem>
                  <SelectItem value="GBP"><span suppressHydrationWarning>GBP</span></SelectItem>
                  <SelectItem value="ILS"><span suppressHydrationWarning>ILS</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Configuration Mode - Radio Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base" suppressHydrationWarning>
                {t('products.pricing.configuration_title', 'Payment Configuration')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Custom Plan Option */}
              <div
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  configMode === 'custom' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => {
                  setConfigMode('custom');
                  setUseTemplates(false);
                  setFormData({
                    ...formData,
                    default_payment_plan_id: undefined,
                    alternative_payment_plan_ids: [],
                  });
                }}
              >
                <input
                  type="radio"
                  name="config_mode"
                  value="custom"
                  checked={configMode === 'custom'}
                  onChange={() => {}}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label className="text-base font-medium cursor-pointer" suppressHydrationWarning>
                    {t('products.pricing.create_custom', 'Create Custom Plan')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('products.pricing.create_custom_desc', 'Define payment terms directly for this product')}
                  </p>
                </div>
              </div>

              {/* Template Plan Option */}
              <div
                className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                  configMode === 'template' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => {
                  setConfigMode('template');
                  setUseTemplates(true);
                  // Clear custom payment configuration when switching to templates
                  setFormData({
                    ...formData,
                    payment_model: 'one_time', // Set to one_time as default
                    payment_plan: {}, // Clear custom plan config
                  });
                }}
              >
                <input
                  type="radio"
                  name="config_mode"
                  value="template"
                  checked={configMode === 'template'}
                  onChange={() => {}}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label className="text-base font-medium cursor-pointer" suppressHydrationWarning>
                    {t('products.pricing.use_template', 'Use Existing Payment Plan Template')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('products.pricing.use_template_desc', 'Select from pre-configured payment plans')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Plan Configuration */}
          {configMode === 'custom' && (
            <>
              {/* Payment Type */}
              <div>
                <Label suppressHydrationWarning>{t('products.pricing.payment_type', 'Payment Type')} *</Label>
                <Select
                  value={formData.payment_model}
                  onValueChange={(value: PaymentModel) => setFormData({ ...formData, payment_model: value, payment_plan: {} })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="one_time"><span suppressHydrationWarning>{t('products.pricing.one_time', 'One-time Payment')}</span></SelectItem>
                    <SelectItem value="deposit_then_plan"><span suppressHydrationWarning>{t('products.pricing.deposit_installments', 'Deposit + Installments')}</span></SelectItem>
                    <SelectItem value="subscription"><span suppressHydrationWarning>{t('products.pricing.subscription', 'Subscription')}</span></SelectItem>
                    <SelectItem value="free"><span suppressHydrationWarning>{t('products.payment_model.free', 'Free')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Plan Configuration Component */}
              {formData.payment_model !== 'free' && formData.payment_model !== 'one_time' && (
                <PaymentPlanConfigComponent
                  value={formData.payment_plan}
                  onChange={(config) => setFormData({ ...formData, payment_plan: config })}
                  paymentModel={formData.payment_model}
                  productPrice={formData.price || 0}
                  currency={formData.currency || 'USD'}
                  t={t}
                />
              )}

              {/* Payment Start Date - Only for installments and subscription */}
              {(formData.payment_model === 'deposit_then_plan' || formData.payment_model === 'subscription') && (
                <div>
                  <Label htmlFor="payment_start_date" suppressHydrationWarning>
                    {t('admin.products.payment_start_date', 'Payment Start Date')}
                  </Label>
                  <Input
                    type="date"
                    id="payment_start_date"
                    value={formData.payment_start_date || ''}
                    onChange={(e) => setFormData({ ...formData, payment_start_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>
                    {t('admin.products.payment_start_date_help', 'Default date when first payment is due for new enrollments. Works for all payment models.')}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Template Mode - Payment Plan Selector */}
          {configMode === 'template' && (
            <>
              {/* Warning Alert - Only show when editing existing product with enrollments */}
              {product && enrollmentStats && enrollmentStats.total > 0 && (
                <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-900 dark:text-amber-100" suppressHydrationWarning>
                    {t('products.payment_plans.change_warning_title', 'Note: Payment Plan Changes')}
                  </AlertTitle>
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <p className="mb-2" suppressHydrationWarning>
                      {t('products.payment_plans.change_warning_desc',
                        'Changes to payment plans only affect NEW enrollments. Existing enrollments (including pending invitations) will keep their original payment terms.')}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {enrollmentStats.active_enrollments > 0 && (
                        <li suppressHydrationWarning>
                          {t('products.payment_plans.active_enrollments_using_plans',
                            'Active enrollments using current plans: {count}')
                            .replace('{count}', enrollmentStats.active_enrollments.toString())}
                        </li>
                      )}
                      {enrollmentStats.pending_invitations > 0 && (
                        <li suppressHydrationWarning>
                          {t('products.payment_plans.pending_invitations',
                            'Pending invitations: {count}')
                            .replace('{count}', enrollmentStats.pending_invitations.toString())}
                        </li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <PaymentPlanSelector
                useTemplates={true}
                onUseTemplatesChange={() => {}}
                defaultPlanId={formData.default_payment_plan_id}
                onDefaultPlanIdChange={(planId) => setFormData({ ...formData, default_payment_plan_id: planId })}
                alternativePlanIds={formData.alternative_payment_plan_ids}
                onAlternativePlanIdsChange={(planIds) => setFormData({ ...formData, alternative_payment_plan_ids: planIds })}
                allowPlanSelection={true}
                onAllowPlanSelectionChange={() => {}}
                t={t}
              />

              {/* Payment Start Date - For Template Mode */}
              <div>
                <Label htmlFor="template_payment_start_date" suppressHydrationWarning>
                  {t('admin.products.payment_start_date', 'תאריך תחילת תשלום')}
                </Label>
                <Input
                  type="date"
                  id="template_payment_start_date"
                  value={formData.payment_start_date || ''}
                  onChange={(e) => setFormData({ ...formData, payment_start_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className={isRtl ? 'text-right' : 'text-left'}
                />
                <p className="text-sm text-muted-foreground mt-1" suppressHydrationWarning>
                  {t('admin.products.payment_start_date_help', 'תאריך ברירת מחדל למועד תשלום ראשון עבור הרשמות חדשות. עובד עבור כל תבניות התשלום.')}
                </p>
              </div>
            </>
          )}
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="emails" className="space-y-4 mt-4">
          <EmailTemplateSelector
            invitationTemplateKey={formData.enrollment_invitation_template_key}
            confirmationTemplateKey={formData.enrollment_confirmation_template_key}
            reminderTemplateKey={formData.enrollment_reminder_template_key}
            onInvitationTemplateChange={(key) => setFormData({ ...formData, enrollment_invitation_template_key: key })}
            onConfirmationTemplateChange={(key) => setFormData({ ...formData, enrollment_confirmation_template_key: key })}
            onReminderTemplateChange={(key) => setFormData({ ...formData, enrollment_reminder_template_key: key })}
            t={t}
            direction={direction}
          />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4 mt-4">
          <DocuSignConfig
            requiresSignature={formData.requires_signature}
            onRequiresSignatureChange={(required) => setFormData({ ...formData, requires_signature: required })}
            signatureTemplateId={formData.signature_template_id}
            onSignatureTemplateIdChange={(id) => setFormData({ ...formData, signature_template_id: id })}
            crmTagSlugs={formData.crm_tag_slugs}
            onCrmTagSlugsChange={(slugs) => setFormData({ ...formData, crm_tag_slugs: slugs })}
            direction={direction}
            t={t}
          />
        </TabsContent>
      </Tabs>

        {/* Back / Continue */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {index > 0 ? (
            <button type="button" onClick={() => handleTabChange(STEP_IDS[index - 1])} className="min-h-10 px-2 text-sm font-medium text-blue-700 hover:underline dark:text-blue-300">
              {t('admin.notifications.wizard.back', 'Back')}
            </button>
          ) : (
            <span />
          )}
          {index < STEP_IDS.length - 1 && (
            <button
              type="button"
              onClick={() => handleTabChange(STEP_IDS[index + 1])}
              className="min-h-10 rounded-md bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', stepLabel(STEP_IDS[index + 1]))}
            </button>
          )}
        </div>
      </div>

      {/* Save / Discard, floating at the bottom once something changes (always there for a new product) */}
      {showBar && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur">
            <span className="text-sm text-muted-foreground">
              {product ? t('admin.products.wizard.unsaved', 'You have unsaved changes') : t('admin.products.wizard.newNote', 'New product, not saved yet')}
            </span>
            <div className="flex gap-2">
              {dirty && (
                <Button type="button" variant="outline" onClick={discard} disabled={isSubmitting}>
                  {t('admin.products.wizard.discard', 'Discard')}
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? product
                    ? t('common.saving', 'Saving...')
                    : t('common.creating', 'Creating...')
                  : product
                    ? t('common.save', 'Save Changes')
                    : t('common.create', 'Create Product')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
