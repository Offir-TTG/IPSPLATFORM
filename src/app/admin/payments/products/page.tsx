'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
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
} from 'lucide-react';

export default function ProductsPage() {
  const { t, direction, language, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [paymentModelFilter, setPaymentModelFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (paymentModelFilter !== 'all') params.append('payment_model', paymentModelFilter);
      if (activeFilter !== 'all') params.append('is_active', activeFilter);

      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const result = await response.json();
      const data = result.success ? result.data : result;

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.products.loadFailed', 'Failed to load products'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, paymentModelFilter, activeFilter]);

  // Filter products by search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm(t('admin.payments.products.deleteConfirm', 'Are you sure you want to delete this product? This action cannot be undone.'))) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('admin.payments.products.deleteFailed', 'Failed to delete product'));
      }

      toast({
        title: t('common.success', 'Success'),
        description: t('admin.payments.products.deleteSuccess', 'Product deleted successfully'),
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.products.deleteFailed', 'Failed to delete product'),
        variant: 'destructive',
      });
    }
  };

  const handleSaveProduct = async (product: ProductFormData) => {
    try {
      const isEditing = !!editingProduct;
      const url = isEditing
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('admin.payments.products.saveFailed', 'Failed to save product'));
      }

      toast({
        title: t('common.success', 'Success'),
        description: isEditing
          ? t('admin.payments.products.updateSuccess', 'Product updated successfully')
          : t('admin.payments.products.createSuccess', 'Product created successfully'),
      });
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.products.saveFailed', 'Failed to save product'),
        variant: 'destructive',
      });
    }
  };

  const getProductTypeIcon = (type: ProductType) => {
    switch (type) {
      case 'program': return <GraduationCap className="h-4 w-4" />;
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'lecture': return <Video className="h-4 w-4" />;
      case 'workshop': return <Users className="h-4 w-4" />;
      case 'webinar': return <Video className="h-4 w-4" />;
      case 'session': return <Calendar className="h-4 w-4" />;
      case 'session_pack': return <Package className="h-4 w-4" />;
      case 'bundle': return <Grid3x3 className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getProductTypeColor = (type: ProductType) => {
    switch (type) {
      case 'program': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'course': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'lecture': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'workshop': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'bundle': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'session_pack': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getPaymentModelColor = (model: PaymentModel) => {
    switch (model) {
      case 'one_time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'deposit_then_plan': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'subscription': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Show loading while translations are loading
  if (translationsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/payments">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                <span suppressHydrationWarning>{t('admin.payments.products.back', 'Back')}</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold" suppressHydrationWarning>
                {t('admin.payments.products.title', 'Products')}
              </h1>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.payments.products.description', 'Manage billable products and their pricing')}
              </p>
            </div>
          </div>
          <Button onClick={handleCreateProduct}>
            <Plus className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
            <span suppressHydrationWarning>{t('admin.payments.products.createProduct', 'Create Product')}</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label htmlFor="search" suppressHydrationWarning>
                  {t('admin.payments.products.search', 'Search')}
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder={t('admin.payments.products.searchPlaceholder', 'Search products...')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="type-filter" suppressHydrationWarning>
                  {t('admin.payments.products.productType', 'Product Type')}
                </Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="all"><span suppressHydrationWarning>{t('admin.payments.products.allTypes', 'All Types')}</span></SelectItem>
                    <SelectItem value="program"><span suppressHydrationWarning>{t('products.type.program', 'Program')}</span></SelectItem>
                    <SelectItem value="course"><span suppressHydrationWarning>{t('products.type.course', 'Course')}</span></SelectItem>
                    <SelectItem value="bundle"><span suppressHydrationWarning>{t('products.type.bundle', 'Bundle')}</span></SelectItem>
                    <SelectItem value="session_pack"><span suppressHydrationWarning>{t('products.type.session_pack', 'Session Pack')}</span></SelectItem>
                    <SelectItem value="lecture"><span suppressHydrationWarning>{t('products.type.lecture', 'Lecture')}</span></SelectItem>
                    <SelectItem value="workshop"><span suppressHydrationWarning>{t('products.type.workshop', 'Workshop')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="payment-filter" suppressHydrationWarning>
                  {t('admin.payments.products.paymentModel', 'Payment Model')}
                </Label>
                <Select value={paymentModelFilter} onValueChange={setPaymentModelFilter}>
                  <SelectTrigger id="payment-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="all"><span suppressHydrationWarning>{t('admin.payments.products.allModels', 'All Models')}</span></SelectItem>
                    <SelectItem value="one_time"><span suppressHydrationWarning>{t('products.payment_model.one_time', 'One-time')}</span></SelectItem>
                    <SelectItem value="deposit_then_plan"><span suppressHydrationWarning>{t('products.payment_model.deposit_then_plan', 'Deposit + Plan')}</span></SelectItem>
                    <SelectItem value="subscription"><span suppressHydrationWarning>{t('products.payment_model.subscription', 'Subscription')}</span></SelectItem>
                    <SelectItem value="free"><span suppressHydrationWarning>{t('products.payment_model.free', 'Free')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="active-filter" suppressHydrationWarning>
                  {t('admin.payments.products.status', 'Status')}
                </Label>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger id="active-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                    <SelectItem value="all"><span suppressHydrationWarning>{t('admin.payments.products.all', 'All')}</span></SelectItem>
                    <SelectItem value="true"><span suppressHydrationWarning>{t('admin.payments.products.active', 'Active')}</span></SelectItem>
                    <SelectItem value="false"><span suppressHydrationWarning>{t('admin.payments.products.inactive', 'Inactive')}</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground" suppressHydrationWarning>
              {t('admin.payments.products.loading', 'Loading products...')}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2" suppressHydrationWarning>
                {products.length === 0
                  ? t('admin.payments.products.noProductsCreated', 'No products created')
                  : t('admin.payments.products.noProductsFound', 'No products found')}
              </h3>
              <p className="text-muted-foreground mb-4" suppressHydrationWarning>
                {products.length === 0
                  ? t('admin.payments.products.createFirst', 'Create your first product to start accepting payments')
                  : t('admin.payments.products.tryAdjustingFilters', 'Try adjusting your filters')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => (
            <Card key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="flex items-center gap-2">
                        {getProductTypeIcon(product.type)}
                        {product.title}
                      </CardTitle>
                      <Badge className={getProductTypeColor(product.type)}>
                        {t(`products.type.${product.type}`, product.type)}
                      </Badge>
                      <Badge className={getPaymentModelColor(product.payment_model)}>
                        {t(`products.payment_model.${product.payment_model}`, product.payment_model)}
                      </Badge>
                      {!product.is_active && (
                        <Badge variant="outline" className="border-gray-400 text-gray-600">
                          {t('admin.payments.products.inactive', 'Inactive')}
                        </Badge>
                      )}
                      {product.requires_signature && (
                        <Badge variant="outline" className="border-blue-400 text-blue-600">
                          <FileSignature className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                          {t('products.requires_signature', 'Signature Required')}
                        </Badge>
                      )}
                      {product.keap_tag && (
                        <Badge variant="outline" className="border-purple-400 text-purple-600">
                          {t('products.keap_tag', 'Keap Tag')}
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <div
                        className="text-sm text-muted-foreground prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {product.payment_model !== 'free' && (
                        <>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {product.price} {product.currency}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      {product.program && (
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          {product.program.name}
                        </span>
                      )}
                      {product.course && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {product.course.title}
                        </span>
                      )}
                      {product.session_count && (
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {product.session_count} {t('products.sessions', 'sessions')}
                        </span>
                      )}
                      {product.contains_courses && product.contains_courses.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Grid3x3 className="h-3 w-3" />
                          {product.contains_courses.length} {t('products.courses', 'courses')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={direction}>
            <DialogHeader>
              <DialogTitle suppressHydrationWarning>
                {editingProduct
                  ? t('admin.payments.products.form.editTitle', 'Edit Product')
                  : t('admin.payments.products.form.createTitle', 'Create Product')}
              </DialogTitle>
              <DialogDescription suppressHydrationWarning>
                {editingProduct
                  ? t('admin.payments.products.form.editDescription', 'Update product details and pricing')
                  : t('admin.payments.products.form.createDescription', 'Create a new billable product in the system')}
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => setIsDialogOpen(false)}
              t={t}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

// Product Form Component
function ProductForm({ product, onSave, onCancel, t }: {
  product: Product | null;
  onSave: (product: ProductFormData) => void;
  onCancel: () => void;
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
    is_active: true,
  });

  // Payment plan selection state
  const [useTemplates, setUseTemplates] = useState(false);

  // Error states for inline display
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

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
        if (!currentFormData.payment_plan?.plan_start_date) {
          errors.plan_start_date = t('products.validation.plan_start_date_required', 'Please select installment plan start date');
        }
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

  useEffect(() => {
    if (product) {
      setFormData({
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
        default_payment_plan_id: product.default_payment_plan_id,
        alternative_payment_plan_ids: product.alternative_payment_plan_ids || [],
        allow_plan_selection: product.allow_plan_selection ?? true,
        requires_signature: product.requires_signature,
        signature_template_id: product.signature_template_id,
        keap_tag: product.keap_tag || undefined,
        enrollment_invitation_template_key: product.enrollment_invitation_template_key,
        enrollment_confirmation_template_key: product.enrollment_confirmation_template_key,
        enrollment_reminder_template_key: product.enrollment_reminder_template_key,
        is_active: product.is_active,
        metadata: product.metadata,
      });

      // Set useTemplates based on whether product has payment plan references
      setUseTemplates(!!product.default_payment_plan_id);
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
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

      if (!plan.plan_start_date) {
        errors.plan_start_date = t('products.validation.plan_start_date_required', 'Please select installment plan start date');
      }
    }

    if (formData.payment_model === 'subscription' && !formData.payment_plan.subscription_interval) {
      errors.subscription_interval = t('products.validation.subscription_interval_required', 'Please select billing interval');
    }

    // Validation - Integrations
    if (formData.requires_signature && !formData.signature_template_id) {
      errors.signature_template_id = t('products.validation.template_required', 'DocuSign template is required when signature is required');
    }

    // If there are validation errors, set them and return
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    // Clean up data based on payment model
    const cleanedData = { ...formData };
    if (formData.payment_model === 'free') {
      cleanedData.price = undefined;
    }

    onSave(cleanedData);
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* General Error Alert */}
      {formError && (
        <Alert variant="destructive" className={isRtl ? 'text-right' : 'text-left'}>
          <XCircle className="h-4 w-4" />
          <AlertTitle suppressHydrationWarning>{t('common.error', 'Error')}</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic"><span suppressHydrationWarning>{t('products.tabs.basic', 'Basic Info')}</span></TabsTrigger>
          <TabsTrigger value="content"><span suppressHydrationWarning>{t('products.tabs.content', 'Content')}</span></TabsTrigger>
          <TabsTrigger value="pricing"><span suppressHydrationWarning>{t('products.tabs.pricing', 'Pricing')}</span></TabsTrigger>
          <TabsTrigger value="emails"><span suppressHydrationWarning>{t('products.tabs.emails', 'Email Templates')}</span></TabsTrigger>
          <TabsTrigger value="integrations"><span suppressHydrationWarning>{t('products.tabs.integrations', 'Integrations')}</span></TabsTrigger>
        </TabsList>

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
          {/* Payment Model */}
          <div>
            <Label suppressHydrationWarning>{t('products.payment_model', 'Payment Model')} *</Label>
            <Select
              value={formData.payment_model}
              onValueChange={(value: PaymentModel) => setFormData({ ...formData, payment_model: value, payment_plan: {} })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
                <SelectItem value="one_time"><span suppressHydrationWarning>{t('products.payment_model.one_time', 'One-time Payment')}</span></SelectItem>
                <SelectItem value="deposit_then_plan"><span suppressHydrationWarning>{t('products.payment_model.deposit_then_plan', 'Deposit + Installments')}</span></SelectItem>
                <SelectItem value="subscription"><span suppressHydrationWarning>{t('products.payment_model.subscription', 'Subscription')}</span></SelectItem>
                <SelectItem value="free"><span suppressHydrationWarning>{t('products.payment_model.free', 'Free')}</span></SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price and Currency */}
          {formData.payment_model !== 'free' && (
            <div className="grid grid-cols-2 gap-4">
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
          )}

          {/* Payment Plan Configuration - Only show when NOT using templates */}
          {!useTemplates && (
            <PaymentPlanConfigComponent
              value={formData.payment_plan}
              onChange={(config) => setFormData({ ...formData, payment_plan: config })}
              paymentModel={formData.payment_model}
              productPrice={formData.price || 0}
              currency={formData.currency || 'USD'}
              t={t}
            />
          )}

          {/* Payment Plan Selection - Template Mode */}
          {formData.payment_model !== 'free' && (
            <PaymentPlanSelector
              useTemplates={useTemplates}
              onUseTemplatesChange={(use) => {
                setUseTemplates(use);
                if (!use) {
                  // Clear payment plan references when switching to embedded mode
                  setFormData({
                    ...formData,
                    default_payment_plan_id: undefined,
                    alternative_payment_plan_ids: [],
                    allow_plan_selection: true,
                  });
                }
              }}
              defaultPlanId={formData.default_payment_plan_id}
              onDefaultPlanIdChange={(planId) => setFormData({ ...formData, default_payment_plan_id: planId })}
              alternativePlanIds={formData.alternative_payment_plan_ids}
              onAlternativePlanIdsChange={(planIds) => setFormData({ ...formData, alternative_payment_plan_ids: planIds })}
              allowPlanSelection={formData.allow_plan_selection ?? true}
              onAllowPlanSelectionChange={(allow) => setFormData({ ...formData, allow_plan_selection: allow })}
              t={t}
            />
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
            keapTag={formData.keap_tag}
            onKeapTagChange={(tag) => setFormData({ ...formData, keap_tag: tag })}
            t={t}
          />
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
        </Button>
        <Button type="submit">
          <span suppressHydrationWarning>
            {product
              ? t('common.save', 'Save Changes')
              : t('common.create', 'Create Product')}
          </span>
        </Button>
      </DialogFooter>
    </form>
  );
}
