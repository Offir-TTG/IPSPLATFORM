'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Linkedin,
  Facebook,
  Instagram
} from 'lucide-react';
import Image from 'next/image';
import { useUserLanguage } from '@/context/AppContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditableProfileCard } from '@/components/user/EditableProfileCard';

// MOCKUP DATA
const mockUser = {
  id: 'd7cb0921-4af6-4641-bdbd-c14c59eba9dc',
  first_name: 'Offir',
  last_name: 'Omer',
  email: 'offir.omer@gmail.com',
  phone: '+1 (555) 123-4567',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Offir',
  location: 'Tel Aviv, Israel',
  timezone: 'Asia/Jerusalem',
  language: 'English',
  joined_date: '2024-09-01',
  role: 'student',
  verified: true,
  bio: 'Passionate learner exploring web development and data science. Love building things and solving problems.',
  social: {
    linkedin: 'linkedin.com/in/offiromer',
    github: 'github.com/offiromer',
    website: 'offiromer.com'
  }
};

const mockBillingInfo = {
  payment_method: {
    type: 'visa',
    last4: '4242',
    expires: '12/2026',
    name: 'Offir Omer'
  },
  billing_address: {
    street: '123 Rothschild Blvd',
    city: 'Tel Aviv',
    state: '',
    zip: '6688101',
    country: 'Israel'
  },
  subscription: {
    plan: 'Pro',
    status: 'active',
    billing_cycle: 'monthly',
    amount: 49.99,
    currency: 'USD',
    next_billing_date: '2025-02-20',
    auto_renew: true
  }
};

const mockInvoices = [
  {
    id: 'inv_001',
    date: '2025-01-20',
    description: 'Pro Plan - Monthly Subscription',
    amount: 49.99,
    status: 'paid',
    invoice_url: '#'
  },
  {
    id: 'inv_002',
    date: '2024-12-20',
    description: 'Pro Plan - Monthly Subscription',
    amount: 49.99,
    status: 'paid',
    invoice_url: '#'
  },
  {
    id: 'inv_003',
    date: '2024-11-20',
    description: 'Pro Plan - Monthly Subscription',
    amount: 49.99,
    status: 'paid',
    invoice_url: '#'
  },
  {
    id: 'inv_004',
    date: '2024-10-20',
    description: 'Professional Photography Course',
    amount: 299.00,
    status: 'paid',
    invoice_url: '#'
  }
];

const mockEnrollments = [
  {
    id: 'enr_001',
    program: 'Full Stack Web Development Bootcamp',
    amount: 1299.00,
    enrolled_date: '2025-01-15',
    payment_status: 'paid'
  },
  {
    id: 'enr_002',
    program: 'Data Science & Machine Learning',
    amount: 1499.00,
    enrolled_date: '2025-02-01',
    payment_status: 'paid'
  },
  {
    id: 'enr_003',
    program: 'Professional Photography Course',
    amount: 299.00,
    enrolled_date: '2024-09-01',
    payment_status: 'paid'
  }
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { t, direction } = useUserLanguage();
  const { data: profileData, isLoading, error } = useUserProfile();
  const queryClient = useQueryClient();

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

      // Invalidate and refetch profile data
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
      throw error; // Re-throw to let the component handle it
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

      // Invalidate and refetch profile data
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

      // Invalidate and refetch profile data
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

    // Validation
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

      // Redirect to logout or home page
      window.location.href = '/auth/logout';
    } catch (error) {
      console.error('Error deactivating account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate account');
    } finally {
      setIsDeactivating(false);
    }
  };

  // Local state for preferences - initialize from API data
  const [notificationPrefs, setNotificationPrefs] = useState(
    profileData?.preferences.notifications || {
      lesson_reminders: true,
      achievement_updates: true,
      assignment_due_dates: true,
      course_announcements: true,
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pb-12 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: 'hsl(var(--primary))' }} />
          <p style={{
            color: 'hsl(var(--text-muted))',
            fontSize: 'var(--font-size-base)',
            fontFamily: 'var(--font-family-primary)'
          }}>{t('user.profile.loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <div className="min-h-screen pb-12">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '0.5rem'
            }}>{t('user.profile.error.title')}</h2>
            <p style={{
              color: 'hsl(var(--text-muted))',
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {error instanceof Error ? error.message : t('user.profile.error.description')}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const { user, preferences, security } = profileData;

  // Use user's avatar or generate default
  const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name}`;

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 style={{
          fontSize: 'var(--font-size-3xl)',
          fontFamily: 'var(--font-family-heading)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'hsl(var(--text-heading))',
          marginBottom: '0.5rem'
        }}>{t('user.profile.title')}</h1>
        <p style={{
          color: 'hsl(var(--text-muted))',
          fontSize: 'var(--font-size-base)',
          fontFamily: 'var(--font-family-primary)'
        }}>
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
          {/* Subscription Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'hsl(var(--text-heading))',
                  marginBottom: '0.25rem'
                }}>{t('user.profile.billing.current_subscription')}</h3>
                <p style={{
                  color: 'hsl(var(--text-muted))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)'
                }}>{t('user.profile.billing.manage_subscription_text')}</p>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                backgroundColor: 'rgb(22, 163, 74)',
                color: 'white',
                borderRadius: 'calc(var(--radius) * 1.5)',
                fontSize: 'var(--font-size-lg)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>
                {mockBillingInfo.subscription.plan} {t('user.profile.billing.plan')}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem'
                }}>{t('user.profile.billing.billing_cycle')}</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))'
                }}>{t(`user.profile.billing.cycle.${mockBillingInfo.subscription.billing_cycle}`)}</p>
              </div>
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem'
                }}>{t('user.profile.billing.amount')}</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))'
                }}>
                  ${mockBillingInfo.subscription.amount} {mockBillingInfo.subscription.currency}
                </p>
              </div>
              <div>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))',
                  marginBottom: '0.25rem'
                }}>{t('user.profile.billing.next_billing_date')}</p>
                <p style={{
                  fontSize: 'var(--font-size-lg)',
                  fontFamily: 'var(--font-family-heading)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))'
                }}>
                  {new Date(mockBillingInfo.subscription.next_billing_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'hsl(var(--text-body))'
                }}>{t('user.profile.billing.auto_renewal')} {mockBillingInfo.subscription.auto_renew ? t('user.profile.billing.enabled') : t('user.profile.billing.disabled')}</span>
              </div>
              <button
                style={{
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                {t('user.profile.billing.manage_subscription')}
              </button>
            </div>

            <div className="flex gap-2">
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  transition: 'opacity 0.2s'
                }}
                className="hover:opacity-90"
              >
                {t('user.profile.billing.upgrade_plan')}
              </button>
              <button
                style={{
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                {t('user.profile.billing.cancel_subscription')}
              </button>
            </div>
          </Card>

          {/* Payment Method */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{t('user.profile.billing.payment_method')}</h3>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                <Edit className="h-4 w-4" />
                {t('user.profile.billing.update')}
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="p-3 bg-background rounded">
                <CreditCard className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p style={{
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'hsl(var(--text-heading))',
                  textTransform: 'capitalize'
                }}>{mockBillingInfo.payment_method.type} •••• {mockBillingInfo.payment_method.last4}</p>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))'
                }}>
                  {t('user.profile.billing.expires')} {mockBillingInfo.payment_method.expires}
                </p>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                paddingInlineStart: '0.625rem',
                paddingInlineEnd: '0.625rem',
                paddingTop: '0.25rem',
                paddingBottom: '0.25rem',
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
                borderRadius: 'calc(var(--radius) * 1.5)',
                fontSize: 'var(--font-size-xs)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)'
              }}>{t('user.profile.billing.default')}</span>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.75rem'
              }}>{t('user.profile.billing.billing_address')}</h4>
              <div className="space-y-1" style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-muted))'
              }}>
                <p>{mockBillingInfo.payment_method.name}</p>
                <p>{mockBillingInfo.billing_address.street}</p>
                <p>{mockBillingInfo.billing_address.city}, {mockBillingInfo.billing_address.zip}</p>
                <p>{mockBillingInfo.billing_address.country}</p>
              </div>
            </div>
          </Card>

          {/* Billing History */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{
                fontSize: 'var(--font-size-xl)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'hsl(var(--text-heading))'
              }}>{t('user.profile.billing.billing_history')}</h3>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.375rem',
                  paddingBottom: '0.375rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                className="hover:bg-accent"
              >
                <Download className="h-4 w-4" />
                {t('user.profile.billing.export')}
              </button>
            </div>

            <div className="space-y-3">
              {mockInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-heading))'
                      }}>{invoice.description}</p>
                      <div className="flex items-center gap-2" style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(invoice.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-end">
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))'
                      }}>${invoice.amount.toFixed(2)}</p>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        paddingInlineStart: '0.625rem',
                        paddingInlineEnd: '0.625rem',
                        paddingTop: '0.25rem',
                        paddingBottom: '0.25rem',
                        backgroundColor: invoice.status === 'paid' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                        color: invoice.status === 'paid' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--secondary-foreground))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        {t(`user.profile.billing.status.${invoice.status}`)}
                      </span>
                    </div>
                    <button
                      style={{
                        padding: '0.375rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--text-body))',
                        transition: 'background-color 0.2s',
                        borderRadius: 'calc(var(--radius))'
                      }}
                      className="hover:bg-accent"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Enrollments */}
          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>{t('user.profile.billing.program_enrollments')}</h3>
            <div className="space-y-3">
              {mockEnrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.25rem'
                    }}>{enrollment.program}</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      {t('user.profile.billing.enrolled')} {new Date(enrollment.enrolled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-end">
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-heading))',
                      marginBottom: '0.25rem'
                    }}>${enrollment.amount.toFixed(2)}</p>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      <CheckCircle2 className="h-3 w-3" />
                      {t(`user.profile.billing.status.${enrollment.payment_status}`)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>{t('user.profile.security.password_auth')}</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>{t('user.profile.security.password')}</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>
                      {security.password_last_changed
                        ? `${t('user.profile.security.last_changed', 'Last changed')}: ${new Date(security.password_last_changed).toLocaleDateString()}`
                        : t('user.profile.security.never_changed', 'Never changed')
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPasswordDialogOpen(true)}
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >{t('user.profile.security.change_password')}</button>
              </div>
            </div>

            <Separator className="my-6" />

            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontFamily: 'var(--font-family-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '1rem'
              }}>{t('user.profile.security.active_sessions')}</h4>
              <div className="space-y-3">
                {security.active_sessions.map((session) => (
                  <div key={session.id} className={`flex items-center justify-between p-4 rounded-lg ${session.is_current ? 'bg-muted' : 'border'}`}>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-heading))'
                      }}>
                        {session.is_current ? t('user.profile.security.current_session') : session.device}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>{session.location} • {new Date(session.last_active).toLocaleString()}</p>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      paddingInlineStart: '0.625rem',
                      paddingInlineEnd: '0.625rem',
                      paddingTop: '0.25rem',
                      paddingBottom: '0.25rem',
                      backgroundColor: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      fontSize: 'var(--font-size-xs)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>{t('user.profile.security.active')}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p style={{
                    fontSize: 'var(--font-size-base)',
                    fontFamily: 'var(--font-family-heading)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '0.25rem'
                  }} className="text-red-900 dark:text-red-100">{t('user.profile.security.danger_zone')}</p>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    marginBottom: '0.75rem'
                  }} className="text-red-700 dark:text-red-300">
                    {t('user.profile.security.delete_warning')}
                  </p>
                  <button
                    onClick={() => setShowDeactivateDialog(true)}
                    disabled={isDeactivating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.375rem',
                      paddingBottom: '0.375rem',
                      backgroundColor: 'hsl(var(--destructive))',
                      color: 'hsl(var(--destructive-foreground))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      border: 'none',
                      cursor: isDeactivating ? 'not-allowed' : 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'opacity 0.2s',
                      opacity: isDeactivating ? 0.5 : 1
                    }}
                    className="hover:opacity-90"
                  >
                    {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {t('user.profile.security.deactivate_account')}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* PREFERENCES TAB */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>{t('user.profile.preferences.notifications')}</h3>

            <div className="space-y-4">
              {[
                { key: 'lesson_reminders' as const, label: t('user.profile.preferences.lesson_reminders'), description: t('user.profile.preferences.lesson_reminders_desc') },
                { key: 'achievement_updates' as const, label: t('user.profile.preferences.achievement_updates'), description: t('user.profile.preferences.achievement_updates_desc') },
                { key: 'assignment_due_dates' as const, label: t('user.profile.preferences.assignment_due_dates'), description: t('user.profile.preferences.assignment_due_dates_desc') },
                { key: 'course_announcements' as const, label: t('user.profile.preferences.course_announcements'), description: t('user.profile.preferences.course_announcements_desc') }
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-base)',
                        fontFamily: 'var(--font-family-primary)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'hsl(var(--text-heading))'
                      }}>{pref.label}</p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-muted))'
                      }}>{pref.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificationPrefs[pref.key]}
                    onCheckedChange={(checked) => {
                      setNotificationPrefs(prev => ({ ...prev, [pref.key]: checked }));
                      // TODO: Save to backend
                    }}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 style={{
              fontSize: 'var(--font-size-xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1.5rem'
            }}>{t('user.profile.preferences.regional_settings')}</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>{t('user.profile.preferences.language')}</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>{preferences.regional.language === 'en' ? 'English' : 'עברית'}</p>
                  </div>
                </div>
                <button
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >{t('user.profile.preferences.change')}</button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-base)',
                      fontFamily: 'var(--font-family-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'hsl(var(--text-heading))'
                    }}>{t('user.profile.preferences.timezone')}</p>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-muted))'
                    }}>{preferences.regional.timezone}</p>
                  </div>
                </div>
                <button
                  style={{
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.375rem',
                    paddingBottom: '0.375rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                >{t('user.profile.preferences.change')}</button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Avatar Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle>{t('user.profile.buttons.change_avatar')}</DialogTitle>
            <DialogDescription>
              {t('user.profile.upload.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Input */}
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
                style={{ display: 'none' }}
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Upload className="h-8 w-8" style={{ color: 'hsl(var(--text-muted))' }} />
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-body))'
                }}>
                  {selectedFile ? selectedFile.name : t('user.profile.upload.select_image')}
                </p>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'hsl(var(--text-muted))'
                }}>
                  {t('user.profile.upload.file_types')}
                </p>
              </label>
            </div>

            {/* Preview */}
            {selectedFile && (
              <div className="flex justify-center">
                <div className="relative">
                  <Image
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    width={120}
                    height={120}
                    className="rounded-full border-4 border-muted"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }} className="text-red-700 dark:text-red-300">
                  {uploadError}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setIsAvatarDialogOpen(false);
                  setSelectedFile(null);
                  setUploadError(null);
                }}
                disabled={isUploading}
                style={{
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius))',
                  backgroundColor: 'transparent',
                  color: 'hsl(var(--text-body))',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  opacity: isUploading ? 0.5 : 1
                }}
                className="hover:bg-accent"
              >
                {t('user.profile.upload.cancel')}
              </button>
              {user.avatar_url && (
                <button
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    paddingInlineStart: '1rem',
                    paddingInlineEnd: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    backgroundColor: 'hsl(var(--destructive))',
                    color: 'hsl(var(--destructive-foreground))',
                    borderRadius: 'calc(var(--radius))',
                    border: 'none',
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    opacity: isUploading ? 0.5 : 1
                  }}
                  className="hover:opacity-90"
                >
                  {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('user.profile.upload.remove_avatar')}
                </button>
              )}
              <button
                onClick={handleAvatarUpload}
                disabled={isUploading || !selectedFile}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'calc(var(--radius))',
                  border: 'none',
                  cursor: (isUploading || !selectedFile) ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  opacity: (isUploading || !selectedFile) ? 0.5 : 1
                }}
                className="hover:opacity-90"
              >
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isUploading ? t('user.profile.upload.uploading') : t('user.profile.upload.upload_avatar')}
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent dir={direction}>
          <DialogHeader>
            <DialogTitle>{t('user.profile.security.change_password')}</DialogTitle>
            <DialogDescription>
              {t('user.profile.security.change_password_desc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'hsl(var(--text-heading))'
              }}>
                {t('user.profile.security.current_password')}
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--text-body))'
                }}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'hsl(var(--text-heading))'
              }}>
                {t('user.profile.security.new_password')}
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--text-body))'
                }}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label style={{
                display: 'block',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'hsl(var(--text-heading))'
              }}>
                {t('user.profile.security.confirm_password')}
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius))',
                  fontSize: 'var(--font-size-base)',
                  fontFamily: 'var(--font-family-primary)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--text-body))'
                }}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }} className="text-red-700 dark:text-red-300">
                  {passwordError}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError(null);
              }}
              disabled={isSaving}
              style={{
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius))',
                backgroundColor: 'transparent',
                color: 'hsl(var(--text-body))',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                opacity: isSaving ? 0.5 : 1
              }}
              className="hover:bg-accent"
            >
              {t('user.profile.edit.cancel')}
            </button>
            <button
              onClick={handleChangePassword}
              disabled={isSaving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                paddingInlineStart: '1rem',
                paddingInlineEnd: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: 'calc(var(--radius))',
                border: 'none',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: 'var(--font-weight-medium)',
                opacity: isSaving ? 0.5 : 1
              }}
              className="hover:opacity-90"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? t('user.profile.edit.saving') : t('user.profile.security.change_password')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent dir={direction}>
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
                  <Loader2 className="h-4 w-4 animate-spin" style={{ marginInlineEnd: '0.5rem' }} />
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
