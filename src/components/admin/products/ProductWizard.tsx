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
import { useAdminLanguage, useCurrency } from '@/context/AppContext';
import { Product, ProductFormData, PaymentModel, ProductType, PaymentPlanConfig } from '@/types/product';
import { ContentSelector } from '@/components/products/ContentSelector';
import { PaymentPlanConfig as PaymentPlanConfigComponent } from '@/components/products/PaymentPlanConfig';
import { DocuSignConfig } from '@/components/products/DocuSignConfig';
import { PaymentPlanSelector } from '@/components/products/PaymentPlanSelector';
import { EmailTemplateSelector } from '@/components/products/EmailTemplateSelector';
import { SaveBar, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { SubscriptionPriceSection } from './SubscriptionPriceSection';
import { CoachingServiceFields } from './CoachingServiceFields';
import { ProductImageField } from './ProductImageField';
import { TypePicture } from '@/components/admin/plans/TypePicture';
import { PLAN_TONE } from '@/components/admin/plans/planFormat';
import { EMPTY_FUTURE_PRICE, FuturePriceFields, checkFuturePrice, type FuturePriceDraft } from './FuturePriceFields';
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
  PenLine,
  ListChecks,
} from 'lucide-react';


// Name and description first; completion, access and on/off have their own step.
const STEP_IDS = ['basic', 'details', 'content', 'pricing', 'emails', 'integrations'] as const;
type StepId = (typeof STEP_IDS)[number];

/** The custom payment types, as cards: picture, name, one line on how it charges. */
const CUSTOM_MODELS: { model: PaymentModel; picture: 'one_time' | 'deposit' | 'subscription' | 'per_session' | 'free'; name: [string, string]; text: [string, string] }[] = [
  { model: 'one_time', picture: 'one_time', name: ['products.pricing.one_time', 'One-time Payment'], text: ['products.pricing.cards.oneTimeText', 'The full price at enrollment.'] },
  { model: 'deposit_then_plan', picture: 'deposit', name: ['products.pricing.deposit_installments', 'Deposit + Installments'], text: ['products.pricing.cards.depositText', 'A deposit at enrollment, the rest in installments.'] },
  { model: 'subscription', picture: 'subscription', name: ['products.pricing.subscription', 'Subscription'], text: ['products.pricing.cards.subscriptionText', 'Charged again every period until cancelled.'] },
  { model: 'per_session', picture: 'per_session', name: ['admin.payments.plans.form.perSession', 'Pay per session'], text: ['admin.payments.plans.wizard.perSessionText', 'Nothing upfront: the card is saved, and each session is charged when it is held.'] },
  { model: 'free', picture: 'free', name: ['products.payment_model.free', 'Free'], text: ['products.pricing.cards.freeText', 'No payment.'] },
];

/** Which step each check belongs to, so Save can open the step with the problem. */
const ERROR_STEP: Record<string, StepId> = {
  title: 'basic',
  program_id: 'content',
  course_id: 'content',
  contains_courses: 'content',
  session_count: 'content',
  price: 'pricing',
  session_amount: 'pricing',
  deposit_type: 'pricing',
  deposit_percentage: 'pricing',
  deposit_amount: 'pricing',
  installments: 'pricing',
  subscription_interval: 'pricing',
  payment_plans: 'pricing',
  future_amount: 'pricing',
  future_date: 'pricing',
  future_applies: 'pricing',
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
  // Every price is in the business currency (Organization settings); the server sets it on save.
  const businessCurrency = useCurrency().config?.code ?? product?.currency ?? 'USD';
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
  // A future membership price for a new product (scheduled once it is created).
  const [futurePrice, setFuturePrice] = useState<FuturePriceDraft>(EMPTY_FUTURE_PRICE);
  // Subscription plans (id -> own price or null, and how often), to know when the product is a membership.
  const [subscriptionPlans, setSubscriptionPlans] = useState<Map<string, { amount: number | null; frequency: string }>>(new Map());
  // Per-session plans (id -> price per session): a product on one costs its sessions × that price.
  const [sessionPlans, setSessionPlans] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    void fetch('/api/admin/payments/plans')
      .then((r) => r.json())
      .then((plans: any[]) => {
        const list = Array.isArray(plans) ? plans : [];
        setSubscriptionPlans(
          new Map(list.filter((p) => p.plan_type === 'subscription').map((p) => [p.id, { amount: Number(p.subscription_amount) > 0 ? Number(p.subscription_amount) : null, frequency: p.subscription_frequency || 'monthly' }])),
        );
        setSessionPlans(new Map(list.filter((p) => p.plan_type === 'per_session' && Number(p.session_amount) > 0).map((p) => [p.id, Number(p.session_amount)])));
      })
      .catch(() => undefined);
  }, []);

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
        if (!currentFormData.payment_plan?.deposit_type || currentFormData.payment_plan.deposit_type === 'none') {
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

      if (configMode === 'template' && !(currentFormData.alternative_payment_plan_ids || []).length) {
        errors.payment_plans = t('products.validation.plan_required', 'Tick at least one payment plan.');
      }
      if (currentFormData.payment_model === 'per_session' && !(Number(currentFormData.payment_plan?.session_amount) > 0)) {
        errors.session_amount = t('products.validation.session_amount_required', 'Write the price of one session');
      }
      if (currentFormData.payment_model === 'subscription' && !currentFormData.payment_plan?.subscription_interval) {
        errors.subscription_interval = t('products.validation.subscription_interval_required', 'Please select billing interval');
      }
      // A future price on a new membership is checked before moving on, like any field.
      Object.assign(errors, futureCheck.current());
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
  }, [activeTab, t, configMode]);

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
        session_duration_minutes: product.session_duration_minutes ?? null,
        payment_model: product.payment_model,
        price: product.price,
        currency: product.currency || 'USD',
        payment_plan: product.payment_plan || {},
        payment_start_date: product.payment_start_date ? product.payment_start_date.split('T')[0] : undefined,
        default_payment_plan_id: product.default_payment_plan_id,
        // The plan list holds every plan the client can choose, the main one first.
        alternative_payment_plan_ids:
          product.default_payment_plan_id && !(product.alternative_payment_plan_ids || []).includes(product.default_payment_plan_id)
            ? [product.default_payment_plan_id, ...(product.alternative_payment_plan_ids || [])]
            : product.alternative_payment_plan_ids || [],
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
  const saveWords = saveBarText(t);
  // Leaving with unsaved changes asks first (inside the admin, and on closing the tab).
  const { dialog: leaveDialog } = useLeaveGuard(dirty, saveWords.leave);

  const discard = () => {
    if (!initialData) return;
    setFormData(initialData);
    setClubPick(null);
    setConfigMode(initialConfigMode);
    setUseTemplates(initialConfigMode === 'template');
    setValidationErrors({});
    setFormError(null);
  };

  // "Club" in the type cards: a course product sold as a monthly membership.
  // Null = not chosen in this visit, so a saved product shows as a club when
  // it is a course on a subscription.
  const [clubPick, setClubPick] = useState<boolean | null>(null);

  // Is this product a membership? Its own payment type, or a subscription plan template.
  const templatePlanIds = [formData.default_payment_plan_id, ...(formData.alternative_payment_plan_ids || [])].filter(Boolean) as string[];
  const isSubscription =
    (configMode === 'custom' && formData.payment_model === 'subscription') ||
    (configMode === 'template' && templatePlanIds.some((id) => subscriptionPlans.has(id)));
  // A default subscription plan with its own price is the price that changes; otherwise the product price.
  const ownPricePlanId =
    configMode === 'template' && formData.default_payment_plan_id && subscriptionPlans.get(formData.default_payment_plan_id)?.amount != null ? formData.default_payment_plan_id : null;
  const isClub = clubPick ?? (formData.type === 'course' && isSubscription);
  // Choosing "Club" sets the monthly membership: the subscription plan when
  // there is one ("Club membership"), otherwise a monthly subscription here.
  const selectClub = () => {
    setClubPick(true);
    const planId = [...subscriptionPlans.entries()].find(([, p]) => p.frequency === 'monthly')?.[0] ?? [...subscriptionPlans.keys()][0];
    if (planId) {
      setConfigMode('template');
      setUseTemplates(true);
      setFormData((f) => ({ ...f, type: 'course', payment_model: 'one_time', payment_plan: {}, default_payment_plan_id: planId, alternative_payment_plan_ids: [planId] }));
    } else {
      setConfigMode('custom');
      setUseTemplates(false);
      setFormData((f) => ({ ...f, type: 'course', default_payment_plan_id: undefined, alternative_payment_plan_ids: [], payment_model: 'subscription', payment_plan: { subscription_interval: 'monthly' } }));
    }
  };
  const membershipPrice = ownPricePlanId ? (subscriptionPlans.get(ownPricePlanId)?.amount as number) : Number(formData.price) || 0;

  // Pay per session: the price comes from the plan. Total = sessions × price per session.
  const mainPlanId = configMode === 'template' ? formData.default_payment_plan_id || templatePlanIds[0] : undefined;
  const customSessionPrice = configMode === 'custom' && formData.payment_model === 'per_session' && Number(formData.payment_plan?.session_amount) > 0 ? Number(formData.payment_plan?.session_amount) : null;
  const perSessionPrice = customSessionPrice ?? (mainPlanId ? sessionPlans.get(mainPlanId) ?? null : null);
  const sessionTotal =
    perSessionPrice != null && formData.type === 'session_pack' && Number(formData.session_count) > 0
      ? Math.round(perSessionPrice * Number(formData.session_count) * 100) / 100
      : null;
  useEffect(() => {
    if (sessionTotal != null && formData.price !== sessionTotal) {
      setFormData((prev) => ({ ...prev, price: sessionTotal }));
      setValidationErrors((prev) => (prev.price ? { ...prev, price: '' } : prev));
    }
  }, [sessionTotal, formData.price]);

  // Read through a ref so the step check always sees the latest values.
  const futureCheck = useRef<() => Record<string, string>>(() => ({}));
  futureCheck.current = () => (!product && isSubscription ? checkFuturePrice(futurePrice, membershipPrice, t) : {});

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

    if (configMode === 'template' && !(formData.alternative_payment_plan_ids || []).length) {
      errors.payment_plans = t('products.validation.plan_required', 'Tick at least one payment plan.');
    }
    if (formData.payment_model === 'per_session' && !(Number(formData.payment_plan?.session_amount) > 0)) {
      errors.session_amount = t('products.validation.session_amount_required', 'Write the price of one session');
    }
    if (formData.payment_model === 'subscription' && !formData.payment_plan.subscription_interval) {
      errors.subscription_interval = t('products.validation.subscription_interval_required', 'Please select billing interval');
    }

    // Validation - Future price (new subscription products)
    if (!product && isSubscription) Object.assign(errors, checkFuturePrice(futurePrice, membershipPrice, t));

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
    // With plan templates, the product must say how it is paid: the first
    // chosen plan is the default when none is set, and a subscription default
    // makes the product a subscription (enrollment links and checkout read
    // payment_model, not the plan list).
    if (configMode === 'template') {
      const chosen = (formData.alternative_payment_plan_ids || []).filter(Boolean) as string[];
      const defaultId = formData.default_payment_plan_id && chosen.includes(formData.default_payment_plan_id) ? formData.default_payment_plan_id : chosen[0];
      if (defaultId) cleanedData.default_payment_plan_id = defaultId;
      const defaultSub = defaultId ? subscriptionPlans.get(defaultId) : undefined;
      if (defaultSub) {
        cleanedData.payment_model = 'subscription';
        cleanedData.payment_plan = { ...(formData.payment_plan || {}), subscription_interval: defaultSub.frequency as any };
      } else if (defaultId && sessionPlans.has(defaultId)) {
        // A per-session plan makes the product pay as you go.
        cleanedData.payment_model = 'per_session';
        cleanedData.payment_plan = { session_amount: sessionPlans.get(defaultId) };
      }
    }
    // Scheduled by the page right after the product is created.
    if (!product && isSubscription && futurePrice.enabled) {
      (cleanedData as any).__future_price = {
        payment_plan_id: ownPricePlanId,
        new_amount: Number(futurePrice.amount),
        effective_date: futurePrice.date,
        applies_to: futurePrice.appliesTo,
        notice_days: futurePrice.noticeDays,
      };
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
    // Any card other than "Club" is not a club; "Club" sets it right after.
    setClubPick(false);
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
      basic: t('products.tabs.nameDescription', 'Name and description'),
      details: t('products.tabs.benefitAccess', 'Benefit and access'),
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
          <span className="text-sm font-medium text-primary">
            {t('admin.notifications.wizard.stepOf', 'Step {n} of {total}')
              .replace('{n}', String(index + 1))
              .replace('{total}', String(STEP_IDS.length))}
          </span>
          <span className="text-xs text-muted-foreground">{t('admin.notifications.wizard.jumpHint', 'Click a step to jump to it')}</span>
        </div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden>
          {STEP_IDS.map((id, i) => (
            <i key={id} className={`h-1.5 flex-1 rounded ${i <= index ? 'bg-primary' : 'bg-primary/15'}`} />
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
                    ? 'border-primary bg-primary text-primary-foreground'
                    : i < index
                      ? 'border-primary/30 bg-primary/10 text-primary hover:border-primary/60'
                      : 'border-border text-muted-foreground hover:border-primary/40'
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

          {/* The product's own picture: the client portal's cards show this one. */}
          <ProductImageField
            value={formData.metadata?.image_url || null}
            onChange={(url) => setFormData((prev) => ({ ...prev, metadata: { ...(prev.metadata || {}), image_url: url } }))}
            productId={product?.id}
            t={t}
          />
        </TabsContent>

        {/* Benefit, access and on/off */}
        <TabsContent value="details" className="space-y-4 mt-4">
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
            isClub={isClub}
            onClubSelect={selectClub}
            validationErrors={validationErrors}
            t={t}
          />
          {/* Session packs: parent or child coaching, and the session length. */}
          {formData.type === 'session_pack' && (
            <CoachingServiceFields
              kind={formData.metadata?.coaching_kind === 'parent' || formData.metadata?.coaching_kind === 'child' ? formData.metadata.coaching_kind : null}
              onKindChange={(kind) => setFormData((prev) => ({ ...prev, metadata: { ...(prev.metadata || {}), coaching_kind: kind } }))}
              minutes={formData.session_duration_minutes ?? null}
              onMinutesChange={(m) => setFormData((prev) => ({ ...prev, session_duration_minutes: m }))}
              t={t}
            />
          )}
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
                readOnly={sessionTotal != null}
                aria-readonly={sessionTotal != null}
                onChange={(e) => {
                  if (sessionTotal != null) return;
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 });
                  if (validationErrors.price) {
                    setValidationErrors({ ...validationErrors, price: '' });
                  }
                }}
                className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.price ? 'border-destructive' : ''} ${sessionTotal != null ? 'bg-muted/50 font-semibold' : ''}`}
              />
              {validationErrors.price && (
                <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {validationErrors.price}
                </p>
              )}
              {/* Pay per session: the total follows the plan and the number of sessions. */}
              {perSessionPrice != null && !validationErrors.price && (
                <p className={`mt-1 text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
                  {sessionTotal != null
                    ? t('products.pricing.perSessionTotal', '{count} sessions × {price} per session, from the payment plan')
                        .replace('{count}', String(formData.session_count))
                        .replace('{price}', `${perSessionPrice.toLocaleString()} ${businessCurrency}`)
                    : t('products.pricing.perSessionNeedsCount', 'Set the number of sessions in Content, and the total is worked out from the payment plan.')}
                </p>
              )}
            </div>
            <div>
              {/* Every price is in the business currency (Organization settings). */}
              <Label htmlFor="currency" suppressHydrationWarning>{t('products.currency', 'Currency')}</Label>
              <div id="currency" dir="ltr" className="flex h-10 items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-semibold">
                {businessCurrency}
              </div>
              <p className={`mt-1 text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
                {t('products.currencyFromSettings', 'Set for the whole business in Organization settings')}
              </p>
            </div>
          </div>

          {/* How the product is paid: set here, or existing plans. Two cards side by side. */}
          <div>
            <Label suppressHydrationWarning>{t('products.pricing.howPaid', 'How is this product paid?')}</Label>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2" role="radiogroup">
              {(
                [
                  ['custom', PenLine, t('products.pricing.create_custom', 'Create Custom Plan'), t('products.pricing.create_custom_desc', 'Define payment terms directly for this product')],
                  ['template', ListChecks, t('products.pricing.use_template', 'Use Existing Payment Plan Template'), t('products.pricing.use_template_desc', 'Select from pre-configured payment plans')],
                ] as const
              ).map(([mode, Icon, title, text]) => {
                const on = configMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      if (on) return;
                      setConfigMode(mode);
                      setUseTemplates(mode === 'template');
                      setValidationErrors({});
                      // Switching clears the other way's settings.
                      setFormData(
                        mode === 'custom'
                          ? { ...formData, default_payment_plan_id: undefined, alternative_payment_plan_ids: [] }
                          : { ...formData, payment_model: 'one_time', payment_plan: {} },
                      );
                    }}
                    className={`relative flex items-center gap-3 rounded-[14px] border p-3.5 text-start transition-colors ${
                      on ? 'border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))]' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`} aria-hidden>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1 pe-6">
                      <span className="block font-bold" suppressHydrationWarning>{title}</span>
                      <span className="block text-[13px] text-muted-foreground" suppressHydrationWarning>{text}</span>
                    </span>
                    {on && (
                      <span className="absolute end-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Plan Configuration */}
          {configMode === 'custom' && (
            <>
              {/* Payment Type: cards with a small picture of how the payments spread. */}
              <div>
                <Label suppressHydrationWarning>{t('products.pricing.payment_type', 'Payment Type')} *</Label>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-2" role="radiogroup">
                  {CUSTOM_MODELS.map(({ model, picture, name, text }) => {
                    const on = formData.payment_model === model;
                    return (
                      <button
                        key={model}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          if (on) return;
                          setFormData({ ...formData, payment_model: model, payment_plan: {} });
                          setValidationErrors({});
                        }}
                        className={`relative flex items-center gap-4 rounded-[14px] border p-3.5 text-start transition-colors ${
                          on ? 'border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))]' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <span className={`grid h-14 w-20 shrink-0 place-items-center rounded-xl ${PLAN_TONE[picture]?.tile ?? 'bg-muted text-muted-foreground'}`}>
                          <TypePicture type={picture} />
                        </span>
                        <span className="min-w-0 flex-1 pe-6">
                          <span className="block font-bold" suppressHydrationWarning>{t(name[0], name[1])}</span>
                          <span className="block text-[13px] text-muted-foreground" suppressHydrationWarning>{t(text[0], text[1])}</span>
                        </span>
                        {on && (
                          <span className="absolute end-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pay as you go: the price of one session; the product total is sessions x this. */}
              {formData.payment_model === 'per_session' && (
                <div className="max-w-xs">
                  <Label htmlFor="session_amount" suppressHydrationWarning>{t('admin.payments.plans.form.pricePerSession', 'Price per session')} *</Label>
                  <Input
                    id="session_amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.payment_plan?.session_amount ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? undefined : Number(e.target.value);
                      setFormData({ ...formData, payment_plan: { ...(formData.payment_plan || {}), session_amount: v } });
                      if (validationErrors.session_amount) setValidationErrors({ ...validationErrors, session_amount: '' });
                    }}
                    placeholder="175"
                    className={`${isRtl ? 'text-right' : 'text-left'} ${validationErrors.session_amount ? 'border-destructive' : ''}`}
                  />
                  {validationErrors.session_amount ? (
                    <p className={`text-sm text-destructive mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>{validationErrors.session_amount}</p>
                  ) : (
                    <p className={`mt-1 text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`} suppressHydrationWarning>
                      {t('products.pricing.perSessionHelp', 'Nothing is charged at enrollment: the card is saved, and each session is charged after it is held.')}
                    </p>
                  )}
                </div>
              )}

              {/* Payment Plan Configuration Component */}
              {formData.payment_model !== 'free' && formData.payment_model !== 'one_time' && formData.payment_model !== 'per_session' && (
                <PaymentPlanConfigComponent
                  value={formData.payment_plan}
                  onChange={(config) => setFormData({ ...formData, payment_plan: config })}
                  paymentModel={formData.payment_model}
                  productPrice={formData.price || 0}
                  currency={businessCurrency}
                  startDate={formData.payment_start_date}
                  errors={validationErrors}
                  t={t}
                />
              )}

              {/* First payment date (payments and memberships): optional, same as with existing plans. */}
              {(formData.payment_model === 'deposit_then_plan' || formData.payment_model === 'subscription') && (
                <div className="space-y-1.5">
                  <Label htmlFor="payment_start_date" suppressHydrationWarning>
                    {t('products.planCards.firstDate', 'First payment date')}{' '}
                    <span className="text-xs font-medium text-muted-foreground">· {t('common.optional', 'Optional')}</span>
                  </Label>
                  <Input
                    type="date"
                    id="payment_start_date"
                    value={formData.payment_start_date || ''}
                    onChange={(e) => setFormData({ ...formData, payment_start_date: e.target.value || undefined })}
                    min={new Date().toISOString().split('T')[0]}
                    className={`max-w-[220px] ${isRtl ? 'text-right' : 'text-left'}`}
                  />
                  <p className="text-[13px] text-muted-foreground" suppressHydrationWarning>
                    {formData.payment_model === 'deposit_then_plan'
                      ? t('products.customPlan.firstDateHelp', 'With a date, the first payment of every new enrollment is on it, and the preview dates follow it. Without one, the first payment is on the day the client enrolls.')
                      : t('products.customPlan.firstDateHelpSub', 'With a date, the first charge of every new enrollment is on it. Without one, it is on the day the client enrolls.')}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Existing plans: cards with what the client pays, one of them the main plan. */}
          {configMode === 'template' && (
            <>
              {product && enrollmentStats && enrollmentStats.total > 0 && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    <span className="block font-bold" suppressHydrationWarning>
                      {t('products.planCards.onlyNew', 'Changes here apply only to new enrollments')}
                    </span>
                    <span suppressHydrationWarning>
                      {[
                        enrollmentStats.active_enrollments > 0
                          ? t('products.payment_plans.active_enrollments_using_plans', 'Active enrollments using current plans: {count}').replace('{count}', String(enrollmentStats.active_enrollments))
                          : '',
                        enrollmentStats.pending_invitations > 0
                          ? t('products.payment_plans.pending_invitations', 'Pending invitations: {count}').replace('{count}', String(enrollmentStats.pending_invitations))
                          : '',
                        t('products.planCards.keepTerms', 'They keep their own terms.'),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </div>
              )}

              <PaymentPlanSelector
                defaultPlanId={formData.default_payment_plan_id}
                onDefaultPlanIdChange={(planId) => setFormData((f) => ({ ...f, default_payment_plan_id: planId }))}
                alternativePlanIds={formData.alternative_payment_plan_ids}
                onAlternativePlanIdsChange={(planIds) => {
                  setFormData((f) => ({ ...f, alternative_payment_plan_ids: planIds }));
                  if (planIds.length && validationErrors.payment_plans) setValidationErrors((x) => ({ ...x, payment_plans: '' }));
                }}
                productPrice={formData.price}
                currency={businessCurrency}
                error={validationErrors.payment_plans}
                t={t}
              />

              {/* First payment date: optional; without it the first payment is on the day of enrolling. */}
              <div className="space-y-1.5">
                <Label htmlFor="template_payment_start_date" suppressHydrationWarning>
                  {t('products.planCards.firstDate', 'First payment date')}{' '}
                  <span className="text-xs font-medium text-muted-foreground">· {t('common.optional', 'Optional')}</span>
                </Label>
                <Input
                  type="date"
                  id="template_payment_start_date"
                  value={formData.payment_start_date || ''}
                  onChange={(e) => setFormData({ ...formData, payment_start_date: e.target.value || undefined })}
                  min={new Date().toISOString().split('T')[0]}
                  className={`max-w-[220px] ${isRtl ? 'text-right' : 'text-left'}`}
                />
                <p className="text-[13px] text-muted-foreground" suppressHydrationWarning>
                  {t(
                    'products.planCards.firstDateHelp',
                    'With a date, the first payment of every new enrollment is on it. Without one, the first payment is on the day the client enrolls. Not used by per-session plans.',
                  )}
                </p>
              </div>
            </>
          )}

          {/* Memberships: a future price (new product) or the scheduled changes (existing product) */}
          {isSubscription &&
            (product ? (
              <SubscriptionPriceSection productId={product.id} />
            ) : (
              <FuturePriceFields
                draft={futurePrice}
                onChange={setFuturePrice}
                currentPrice={membershipPrice}
                currency={businessCurrency}
                errors={validationErrors}
                clearError={(k) => validationErrors[k] && setValidationErrors((x) => ({ ...x, [k]: '' }))}
              />
            ))}
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
            <button type="button" onClick={() => handleTabChange(STEP_IDS[index - 1])} className="min-h-10 px-2 text-sm font-medium text-primary hover:underline">
              {t('admin.notifications.wizard.back', 'Back')}
            </button>
          ) : (
            <span />
          )}
          {index < STEP_IDS.length - 1 && (
            <button
              type="button"
              onClick={() => handleTabChange(STEP_IDS[index + 1])}
              className="min-h-10 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              {t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', stepLabel(STEP_IDS[index + 1]))}
            </button>
          )}
        </div>
      </div>

      {/* The one save bar: always here */}
      <SaveBar
        isNew={!product}
        dirty={dirty}
        saving={isSubmitting}
        onSave={() => (document.getElementById('product-wizard') as HTMLFormElement | null)?.requestSubmit()}
        onDiscard={discard}
        cancelHref="/admin/payments/products"
        saveLabel={product ? t('common.save', 'Save Changes') : t('common.create', 'Create Product')}
        text={saveWords.bar}
      />
      {leaveDialog}
    </form>
  );
}
