'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Download,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Shield,
  Bell,
  Globe,
  Key,
  Trash2,
  Loader2,
  Upload,
  BookOpen,
  Award,
  Target,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
} from 'lucide-react';
import Image from 'next/image';
import { useUserLanguage } from '@/context/AppContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditableProfileCard } from '@/components/user/EditableProfileCard';
import Link from 'next/link';

interface Enrollment {
  id: string;
  product_name: string;
  product_type: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  enrolled_date: string;
  currency: string;
  payment_plan_name: string;
}

interface PaymentSchedule {
  id: string;
  payment_number: number;
  amount: number;
  currency: string;
  scheduled_date: string;
  paid_date?: string;
  status: string;
  payment_type: string;
  product_name?: string;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  due_date: number | null;
  paid_at: number | null;
  invoice_pdf: string | null;
  hosted_invoice_url: string | null;
  description: string;
  metadata: Record<string, string>;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { t, language } = useUserLanguage();
  const { data: profileData, isLoading, error } = useUserProfile();
  const queryClient = useQueryClient();
  const isRtl = language === 'he';

  // Enrollments state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentSchedule[]>([]);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Pagination state for payment schedules (per enrollment)
  const [paymentPages, setPaymentPages] = useState<Record<string, number>>({});
  const PAYMENTS_PER_PAGE = 10;

  // Dialog states
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Handler to save profile changes
  const handleSaveProfile = async (data: any) => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to upload avatar
  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      setUploadError(t('user.profile.upload.error.no_file'));
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/user/profile/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Avatar updated successfully');
      setIsAvatarDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler to remove avatar
  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/user/profile/remove-avatar', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove avatar');
      }

      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Avatar removed successfully');
      setIsAvatarDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler to change password
  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError(t('user.profile.security.password_error.all_fields_required'));
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('user.profile.security.password_error.passwords_dont_match'));
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError(t('user.profile.security.password_error.password_too_short'));
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to change password');
      }

      toast.success(t('user.profile.security.password_changed_success'));
      setIsPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler to deactivate account
  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    setShowDeactivateDialog(false);

    try {
      const response = await fetch('/api/user/profile/deactivate', {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to deactivate account');
      }

      toast.success(t('user.profile.security.account_deactivated_success'));
      window.location.href = '/auth/logout';
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Local state for preferences
  const [notificationPrefs, setNotificationPrefs] = useState(
    profileData?.preferences.notifications || {
      lesson_reminders: true,
      achievement_updates: true,
      assignment_due_dates: true,
      course_announcements: true,
    }
  );

  // Fetch enrollments and invoices when billing tab is active
  useEffect(() => {
    if (activeTab === 'billing') {
      if (enrollments.length === 0) {
        fetchEnrollments();
      }
      if (invoices.length === 0) {
        fetchInvoices();
      }
    }
  }, [activeTab, enrollments.length, invoices.length]);

  const fetchEnrollments = async () => {
    setLoadingEnrollments(true);
    try {
      const response = await fetch('/api/enrollments');
      const data = await response.json();

      if (data.enrollments) {
        const formatted = data.enrollments.map((e: any) => ({
          id: e.id,
          product_name: e.products.title || e.products.product_name,
          product_type: e.products.type || e.products.product_type,
          total_amount: e.total_amount,
          paid_amount: e.paid_amount,
          payment_status: e.payment_status,
          enrolled_date: e.enrolled_date || e.created_at,
          currency: e.products.currency || 'ILS',
          payment_plan_name: e.payment_plans?.plan_name || t('user.profile.billing.fullPayment', 'Full Payment'),
        }));
        setEnrollments(formatted);

        // Fetch payment schedules for all enrollments
        const allSchedules: PaymentSchedule[] = [];
        const updatedEnrollments = [...formatted];

        for (let i = 0; i < formatted.length; i++) {
          const enrollment = formatted[i];
          try {
            const scheduleRes = await fetch(`/api/enrollments/${enrollment.id}/payment`);
            const scheduleData = await scheduleRes.json();

            // Update enrollment with actual payment plan information
            if (scheduleData.payment_plan) {
              updatedEnrollments[i] = {
                ...enrollment,
                payment_plan_name: scheduleData.payment_plan.plan_name || t('user.profile.billing.fullPayment', 'Full Payment'),
              };
            }

            if (scheduleData.schedules) {
              const schedulesWithProduct = scheduleData.schedules.map((s: any) => ({
                ...s,
                product_name: enrollment.product_name,
              }));
              allSchedules.push(...schedulesWithProduct);
            }
          } catch (error) {
            console.error(`Error fetching schedules for enrollment ${enrollment.id}:`, error);
          }
        }

        setEnrollments(updatedEnrollments);

        // Sort schedules by date (most recent first for paid, earliest first for pending)
        const sortedSchedules = allSchedules.sort((a, b) => {
          if (a.status === 'paid' && b.status === 'paid') {
            return new Date(b.paid_date || b.scheduled_date).getTime() - new Date(a.paid_date || a.scheduled_date).getTime();
          }
          return new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime();
        });

        setPaymentSchedules(sortedSchedules);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error(t('user.profile.billing.errorLoading', 'Failed to load enrollment data'));
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await fetch('/api/user/invoices');
      const data = await response.json();

      if (data.success && data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error(t('invoices.error_loading', 'Failed to load invoices'));
    } finally {
      setLoadingInvoices(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: currency || 'ILS',
    }).format(amount);
  };

  // Translate payment plan names
  const translatePaymentPlanName = (planName: string) => {
    // Map of English plan names to translation keys
    const planNameMap: Record<string, string> = {
      'Full Payment': 'user.profile.billing.fullPayment',
      'One-Time Payment': 'user.profile.billing.fullPayment',
      'Deposit + Installments': 'payment.plan.type.deposit',
      'Subscription': 'payment.plan.type.subscription',
      'Free': 'payment.plan.type.free',
    };

    const translationKey = planNameMap[planName];
    if (translationKey) {
      return t(translationKey, planName);
    }

    // If it's not a known English name, return as-is (might already be in Hebrew)
    return planName;
  };

  const getPaymentStatusBadge = (status: string) => {
    const badgeClass = isRtl ? 'flex flex-row-reverse gap-1' : 'flex gap-1';
    switch (status) {
      case 'paid':
        return (
          <Badge className={`bg-green-600 text-white ${badgeClass}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t('user.profile.billing.status.paid', 'Paid')}
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary" className={badgeClass}>
            <Clock className="h-3 w-3" />
            {t('user.profile.billing.status.partial', 'Partial')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={badgeClass}>
            <AlertCircle className="h-3 w-3" />
            {t('user.profile.billing.status.pending', 'Pending')}
          </Badge>
        );
    }
  };

  const getScheduleStatusBadge = (status: string) => {
    const badgeClass = isRtl ? 'flex flex-row-reverse gap-1' : 'flex gap-1';
    switch (status) {
      case 'paid':
        return (
          <Badge className={`bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 border ${badgeClass}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t('user.profile.billing.schedule.paid', 'Paid')}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className={`bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 border ${badgeClass}`}>
            <Clock className="h-3 w-3" />
            {t('user.profile.billing.schedule.pending', 'Pending')}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className={`bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 border ${badgeClass}`}>
            <AlertCircle className="h-3 w-3" />
            {t('user.profile.billing.schedule.overdue', 'Overdue')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    const badgeClass = isRtl ? 'flex flex-row-reverse gap-1' : 'flex gap-1';
    switch (status) {
      case 'paid':
        return (
          <Badge className={`bg-green-500 hover:bg-green-600 text-white ${badgeClass}`}>
            <CheckCircle2 className="h-3 w-3" />
            {t('invoices.status.paid', 'Paid')}
          </Badge>
        );
      case 'open':
        return (
          <Badge className={`bg-yellow-500 hover:bg-yellow-600 text-white ${badgeClass}`}>
            <Clock className="h-3 w-3" />
            {t('invoices.status.open', 'Open')}
          </Badge>
        );
      case 'overdue':
        return (
          <Badge variant="destructive" className={badgeClass}>
            <AlertCircle className="h-3 w-3" />
            {t('invoices.status.overdue', 'Overdue')}
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline" className={badgeClass}>
            {t('invoices.status.draft', 'Draft')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className={badgeClass}>
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(isRtl ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-6 max-w-2xl">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">{t('user.profile.error.title')}</h2>
            <p className="text-muted-foreground">
              {error instanceof Error ? error.message : t('user.profile.error.description')}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { user, preferences, security } = profileData;
  const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name}`;

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" suppressHydrationWarning>
          {t('user.profile.title')}
        </h1>
        <p className="text-muted-foreground" suppressHydrationWarning>
          {t('user.profile.subtitle')}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
          <TabsTrigger value="profile">{t('user.profile.tabs.profile')}</TabsTrigger>
          <TabsTrigger value="billing">{t('user.profile.tabs.billing')}</TabsTrigger>
          <TabsTrigger value="security">{t('user.profile.tabs.security')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('user.profile.tabs.preferences')}</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="space-y-6">
          <EditableProfileCard
            user={user}
            onSave={handleSaveProfile}
            isSaving={isSaving}
            t={t}
            avatarUrl={avatarUrl}
            onChangeAvatar={() => setIsAvatarDialogOpen(true)}
          />
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="space-y-6">
          {loadingEnrollments ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-muted-foreground">{t('user.profile.billing.loading', 'Loading billing data...')}</p>
              </div>
            </Card>
          ) : enrollments.length === 0 ? (
            <Card className="p-12 text-center border-2 border-dashed">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
                  <CreditCard className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {t('user.profile.billing.noEnrollments', 'No Enrollments Yet')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('user.profile.billing.noEnrollmentsDesc', "You haven't enrolled in any programs yet.")}
              </p>
              <Button variant="outline" asChild>
                <Link href="/courses">
                  {t('user.profile.billing.browseCourses', 'Browse Courses')}
                </Link>
              </Button>
            </Card>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('user.profile.billing.totalSpent', 'Total Spent')}
                    </p>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      enrollments.reduce((sum, e) => sum + e.paid_amount, 0),
                      enrollments[0]?.currency || 'ILS'
                    )}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('user.profile.billing.outstanding', 'Outstanding')}
                    </p>
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      enrollments.reduce((sum, e) => sum + (e.total_amount - e.paid_amount), 0),
                      enrollments[0]?.currency || 'ILS'
                    )}
                  </p>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('user.profile.billing.activeEnrollments', 'Active Enrollments')}
                    </p>
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                </Card>
              </div>

              {/* Enrollments List with Integrated Payment History */}
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-6">
                  {t('user.profile.billing.myEnrollments', 'My Enrollments')}
                </h3>

                <Accordion type="multiple" className="space-y-4">
                  {enrollments.map((enrollment) => {
                    const enrollmentPayments = paymentSchedules.filter(
                      schedule => schedule.product_name === enrollment.product_name
                    );

                    // Pagination for this enrollment's payments
                    const currentPage = paymentPages[enrollment.id] || 1;
                    const totalPaymentPages = Math.ceil(enrollmentPayments.length / PAYMENTS_PER_PAGE);
                    const startIndex = (currentPage - 1) * PAYMENTS_PER_PAGE;
                    const endIndex = startIndex + PAYMENTS_PER_PAGE;
                    const paginatedPayments = enrollmentPayments.slice(startIndex, endIndex);

                    const handlePageChange = (enrollmentId: string, newPage: number) => {
                      setPaymentPages(prev => ({
                        ...prev,
                        [enrollmentId]: newPage
                      }));
                    };

                    return (
                      <AccordionItem
                        key={enrollment.id}
                        value={enrollment.id}
                        className="border-none"
                      >
                        <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
                          <div className="p-6">
                            {/* Top: Header with Icon, Title, and Badge */}
                            <div className="flex items-start gap-4 mb-4">
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center border-2 border-primary/10 group-hover:scale-105 transition-transform">
                                  <BookOpen className="h-8 w-8 text-primary" />
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : 'text-left'}`}>
                                    <h4 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1">
                                      {enrollment.product_name}
                                    </h4>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {t(`product.type.${enrollment.product_type}`, enrollment.product_type)}
                                    </p>
                                  </div>
                                  {getPaymentStatusBadge(enrollment.payment_status)}
                                </div>
                              </div>
                            </div>

                            <Separator className="mb-4" />

                            {/* Middle: Info Grid */}
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  {t('user.profile.billing.enrolled', 'Enrolled')}
                                </p>
                                <p className="text-sm font-medium">
                                  {new Date(enrollment.enrolled_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                  {t('user.profile.billing.paymentPlan', 'Payment Plan')}
                                </p>
                                <p className="text-sm font-medium">
                                  {translatePaymentPlanName(enrollment.payment_plan_name)}
                                </p>
                              </div>
                            </div>

                            {/* Payment Progress */}
                            <div className="space-y-2 p-4 bg-muted/30 rounded-lg mb-4">
                              <div className={`flex items-center justify-between text-sm mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="font-medium text-muted-foreground">
                                  {t('user.profile.billing.paymentProgress', 'Payment Progress')}
                                </span>
                                <span className="font-bold">
                                  {formatCurrency(enrollment.paid_amount, enrollment.currency)} / {formatCurrency(enrollment.total_amount, enrollment.currency)}
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-3">
                                <div
                                  className={`bg-gradient-to-r from-primary to-primary/80 h-3 transition-all duration-500 flex items-center px-2 ${isRtl ? 'rounded-r-full justify-start' : 'rounded-l-full justify-end'}`}
                                  style={{
                                    width: `${Math.min(100, (enrollment.paid_amount / enrollment.total_amount) * 100)}%`,
                                    [isRtl ? 'marginLeft' : 'marginRight']: 'auto',
                                    [isRtl ? 'marginRight' : 'marginLeft']: '0'
                                  }}
                                >
                                  {enrollment.paid_amount > 0 && (
                                    <span className="text-[10px] font-bold text-white">
                                      {Math.round((enrollment.paid_amount / enrollment.total_amount) * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                              {enrollment.payment_status !== 'paid' && (
                                <p className={`text-xs font-medium text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                                  {t('user.profile.billing.remaining', 'Remaining')}: {formatCurrency(enrollment.total_amount - enrollment.paid_amount, enrollment.currency)}
                                </p>
                              )}
                            </div>

                            {/* Payment History Toggle */}
                            {enrollmentPayments.length > 0 && (
                              <>
                                <Separator className="mb-3" />
                                <AccordionTrigger className="hover:no-underline py-2">
                                  <div className="flex items-center gap-2 w-full">
                                    {isRtl ? (
                                      <>
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-right">
                                          {t('user.profile.billing.paymentHistory', 'Payment History')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          ({enrollmentPayments.filter(p => p.status === 'paid').length}/{enrollmentPayments.length})
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium flex-1 text-left">
                                          {t('user.profile.billing.paymentHistory', 'Payment History')}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                          ({enrollmentPayments.filter(p => p.status === 'paid').length}/{enrollmentPayments.length})
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </AccordionTrigger>
                              </>
                            )}
                          </div>

                          {/* Payment History Content */}
                          {enrollmentPayments.length > 0 && (
                            <AccordionContent>
                              <div className="px-6 pb-6 pt-2 bg-muted/5">
                                {/* Table Header */}
                                <div className={`grid grid-cols-12 gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b mb-2`}>
                                  <div className={`col-span-1 ${isRtl ? 'text-right' : 'text-left'}`}>#</div>
                                  <div className={`col-span-3 ${isRtl ? 'text-right' : 'text-left'}`}>{t('user.profile.billing.paymentType.deposit', 'Type')}</div>
                                  <div className={`col-span-3 hidden sm:block ${isRtl ? 'text-right' : 'text-left'}`}>{t('user.profile.billing.dueOn', 'Date')}</div>
                                  <div className={`col-span-3 sm:col-span-2 ${isRtl ? 'text-right' : 'text-right'}`}>{t('user.profile.billing.amount', 'Amount')}</div>
                                  <div className={`col-span-2 ${isRtl ? 'text-right' : 'text-right'}`}>{t('user.profile.billing.status.paid', 'Status')}</div>
                                </div>

                                {/* Payment Rows */}
                                <div className="space-y-1">
                                  {paginatedPayments.map((schedule) => (
                                    <div
                                      key={schedule.id}
                                      className={`grid grid-cols-12 gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors items-center ${isRtl ? 'text-right' : 'text-left'}`}
                                    >
                                      {/* Payment Number */}
                                      <div className="col-span-1">
                                        <span className="text-xs font-semibold text-foreground">
                                          {schedule.payment_number}
                                        </span>
                                      </div>

                                      {/* Payment Type */}
                                      <div className="col-span-3">
                                        <span className="text-xs text-muted-foreground">
                                          {t(`user.profile.billing.paymentType.${schedule.payment_type}`, schedule.payment_type)}
                                        </span>
                                      </div>

                                      {/* Date */}
                                      <div className="col-span-3 hidden sm:block">
                                        <span className="text-xs text-muted-foreground">
                                          {schedule.status === 'paid' && schedule.paid_date
                                            ? new Date(schedule.paid_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                              })
                                            : new Date(schedule.scheduled_date).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                              })
                                          }
                                        </span>
                                      </div>

                                      {/* Amount */}
                                      <div className={`col-span-3 sm:col-span-2 ${isRtl ? 'text-right' : 'text-right'}`}>
                                        <span className="text-sm font-bold text-foreground">
                                          {formatCurrency(schedule.amount, schedule.currency)}
                                        </span>
                                      </div>

                                      {/* Status Badge */}
                                      <div className={`col-span-2 flex ${isRtl ? 'justify-end' : 'justify-end'}`}>
                                        {getScheduleStatusBadge(schedule.status)}
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Pagination Controls */}
                                {totalPaymentPages > 1 && (
                                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePageChange(enrollment.id, currentPage - 1)}
                                      disabled={currentPage === 1}
                                    >
                                      {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                                    </Button>
                                    <span className="text-sm text-muted-foreground px-2">
                                      {t('common.page', 'Page')} {currentPage} {t('common.of', 'of')} {totalPaymentPages}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handlePageChange(enrollment.id, currentPage + 1)}
                                      disabled={currentPage === totalPaymentPages}
                                    >
                                      {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          )}
                        </Card>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </Card>

              {/* Invoices Section */}
              <Card className="p-6" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">
                    {t('user.invoices.title', 'My Invoices')}
                  </h3>
                  {invoices.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {invoices.length} {t('invoices.filter.all', 'Invoices')}
                    </Badge>
                  )}
                </div>

                {loadingInvoices ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h4 className="text-lg font-semibold mb-2">
                      {t('invoices.empty.title', 'No invoices yet')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {t('invoices.empty.subtitle', 'Your invoices will appear here')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <Card key={invoice.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20">
                        <div className="p-5" dir={isRtl ? 'rtl' : 'ltr'}>
                          {/* Top Row: Invoice Number, Status, and Amount - Spread Across */}
                          <div className="flex items-start justify-between gap-6 mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold mb-1.5">{invoice.number}</h4>
                              {getInvoiceStatusBadge(invoice.status)}
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                {t('invoices.amount_due', 'Amount Due')}
                              </div>
                              <div className="text-2xl font-bold">
                                {formatCurrency(invoice.amount_due, invoice.currency)}
                              </div>
                            </div>
                          </div>

                          {/* Description - Full Width */}
                          <p className="text-sm text-muted-foreground mb-4 pb-4 border-b">
                            {invoice.description}
                          </p>

                          {/* Date Information - Spread Across in 3 Columns */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1.5">
                                {t('invoices.invoice_date', 'Invoice Date')}
                              </div>
                              <div className="text-sm font-medium">{formatDate(invoice.created)}</div>
                            </div>
                            {invoice.paid_at && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                                  {t('invoices.paid_on', 'Paid on')}
                                </div>
                                <div className="text-sm font-medium text-green-600">{formatDate(invoice.paid_at)}</div>
                              </div>
                            )}
                            {invoice.due_date && !invoice.paid_at && (
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1.5">
                                  {t('invoices.due_date', 'Due Date')}
                                </div>
                                <div className="text-sm font-medium text-orange-600">{formatDate(invoice.due_date)}</div>
                              </div>
                            )}
                          </div>

                          {/* Actions Row - Spread Across Bottom */}
                          <div className="flex gap-2 flex-wrap pt-4 border-t">
                            {invoice.hosted_invoice_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                              >
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                                {t('invoices.actions.view', 'View')}
                              </Button>
                            )}
                            {invoice.invoice_pdf && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(invoice.invoice_pdf!, '_blank')}
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                {t('invoices.actions.download', 'PDF')}
                              </Button>
                            )}
                            {(invoice.status === 'open' || invoice.status === 'overdue') &&
                              invoice.hosted_invoice_url && (
                                <Button
                                  size="sm"
                                  onClick={() => window.open(invoice.hosted_invoice_url!, '_blank')}
                                >
                                  {t('invoices.actions.pay_now', 'Pay Now')}
                                </Button>
                              )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">{t('user.profile.security.password_auth')}</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('user.profile.security.password')}</p>
                    <p className="text-sm text-muted-foreground">
                      {security.password_last_changed
                        ? `${t('user.profile.security.last_changed', 'Last changed')}: ${new Date(security.password_last_changed).toLocaleDateString()}`
                        : t('user.profile.security.never_changed', 'Never changed')
                      }
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  {t('user.profile.security.change_password')}
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 className="font-semibold mb-4">{t('user.profile.security.active_sessions')}</h4>
              <div className="space-y-3">
                {security.active_sessions.map((session) => (
                  <div key={session.id} className={`flex items-center justify-between p-4 rounded-lg ${session.is_current ? 'bg-muted' : 'border'}`}>
                    <div>
                      <p className="font-medium">
                        {session.is_current ? t('user.profile.security.current_session') : session.device}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.location} • {new Date(session.last_active).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {t('user.profile.security.active')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-1 text-red-900 dark:text-red-100">
                    {t('user.profile.security.danger_zone')}
                  </p>
                  <p className="text-sm mb-3 text-red-700 dark:text-red-300">
                    {t('user.profile.security.delete_warning')}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeactivateDialog(true)}
                    disabled={isDeactivating}
                  >
                    {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    {t('user.profile.security.deactivate_account')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">{t('user.profile.preferences.notifications')}</h3>

            <div className="space-y-4">
              {[
                { key: 'lesson_reminders' as const, label: t('user.profile.preferences.lesson_reminders'), description: t('user.profile.preferences.lesson_reminders_desc') },
                { key: 'achievement_updates' as const, label: t('user.profile.preferences.achievement_updates'), description: t('user.profile.preferences.achievement_updates_desc') },
                { key: 'assignment_due_dates' as const, label: t('user.profile.preferences.assignment_due_dates'), description: t('user.profile.preferences.assignment_due_dates_desc') },
                { key: 'course_announcements' as const, label: t('user.profile.preferences.course_announcements'), description: t('user.profile.preferences.course_announcements_desc') }
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{pref.label}</p>
                      <p className="text-sm text-muted-foreground">{pref.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs[pref.key]}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs(prev => ({ ...prev, [pref.key]: checked }));
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-6">{t('user.profile.preferences.regional_settings')}</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('user.profile.preferences.language')}</p>
                    <p className="text-sm text-muted-foreground">
                      {preferences.regional.language === 'en' ? 'English' : 'עברית'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t('user.profile.preferences.change')}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('user.profile.preferences.timezone')}</p>
                    <p className="text-sm text-muted-foreground">{preferences.regional.timezone}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  {t('user.profile.preferences.change')}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Avatar Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('user.profile.buttons.change_avatar')}</DialogTitle>
            <DialogDescription>
              {t('user.profile.upload.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      setUploadError(t('user.profile.upload.error.file_size'));
                      setSelectedFile(null);
                    } else {
                      setUploadError(null);
                      setSelectedFile(file);
                    }
                  }
                }}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm">
                  {selectedFile ? selectedFile.name : t('user.profile.upload.select_image')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('user.profile.upload.file_types')}
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="flex justify-center">
                <Image
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-muted"
                />
              </div>
            )}

            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{uploadError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAvatarDialogOpen(false);
                setSelectedFile(null);
                setUploadError(null);
              }}
              disabled={isUploading}
            >
              {t('user.profile.upload.cancel')}
            </Button>
            {user.avatar_url && (
              <Button
                variant="destructive"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {t('user.profile.upload.remove_avatar')}
              </Button>
            )}
            <Button
              onClick={handleAvatarUpload}
              disabled={isUploading || !selectedFile}
            >
              {isUploading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isUploading ? t('user.profile.upload.uploading') : t('user.profile.upload.upload_avatar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('user.profile.security.change_password')}</DialogTitle>
            <DialogDescription>
              {t('user.profile.security.change_password_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('user.profile.security.current_password')}
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('user.profile.security.new_password')}
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('user.profile.security.confirm_password')}
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError(null);
              }}
              disabled={isSaving}
            >
              {t('user.profile.edit.cancel')}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isSaving ? t('user.profile.edit.saving') : t('user.profile.security.change_password')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent dir={isRtl ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('user.profile.security.deactivate_account')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('user.profile.security.deactivate_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeactivating ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('user.profile.security.deactivating')}
                </>
              ) : (
                t('user.profile.security.deactivate_account')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
