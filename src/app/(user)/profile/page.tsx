'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  UnderlineTabsList,
  UnderlineTabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  User,
  Mail,
  AlertCircle,
  Shield,
  Bell,
  Globe,
  Key,
  Trash2,
  Loader2,
  Upload,
  Clock,
} from 'lucide-react';
import Image from 'next/image';
import { useUserLanguage } from '@/context/AppContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EditableProfileCard } from '@/components/user/EditableProfileCard';
import { LanguagePreferenceDialog } from '@/components/user/LanguagePreferenceDialog';
import { TimezonePreferenceDialog } from '@/components/user/TimezonePreferenceDialog';
import { NotificationPreferences } from '@/components/user/NotificationPreferences';

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const { t, language, direction } = useUserLanguage();
  const { data: profileData, isLoading, error } = useUserProfile();
  const queryClient = useQueryClient();
  const isRtl = language === 'he';

  // Redirect legacy ?tab=billing links to the new standalone /billing page
  useEffect(() => {
    if (searchParams?.get('tab') === 'billing') {
      router.replace('/billing');
    }
  }, [searchParams, router]);

  // Dialog states
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [isTimezoneDialogOpen, setIsTimezoneDialogOpen] = useState(false);
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
      toast.success(t('user.profile.update.success', 'Profile updated successfully'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : t('user.profile.update.error', 'Failed to update profile'));
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
      toast.success(t('user.profile.avatar.upload_success', 'Avatar updated successfully'));
      setIsAvatarDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError(error instanceof Error ? error.message : t('user.profile.avatar.upload_error', 'Failed to upload avatar'));
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
      toast.success(t('user.profile.avatar.remove_success', 'Avatar removed successfully'));
      setIsAvatarDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
      setUploadError(error instanceof Error ? error.message : t('user.profile.avatar.remove_error', 'Failed to remove avatar'));
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
      toast.error(error instanceof Error ? error.message : t('user.profile.deactivate.error', 'Failed to deactivate account'));
    } finally {
      setIsDeactivating(false);
    }
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

  // Sidebar nav items — single source of truth for icon + label + value
  // mapping. Order here = order in the sidebar.
  const sidebarItems: Array<{
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
    labelFallback: string;
  }> = [
    { value: 'profile',     icon: User,        labelKey: 'user.profile.tabs.profile',     labelFallback: 'Profile' },
    { value: 'security',    icon: Shield,      labelKey: 'user.profile.tabs.security',    labelFallback: 'Security' },
    { value: 'preferences', icon: Bell,        labelKey: 'user.profile.tabs.preferences', labelFallback: 'Preferences' },
  ];

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim()
    || t('user.profile.title', 'My Profile');

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* HERO — identity at a glance: avatar (click to change), name,
          email, and a role badge. Gradient surface so the rest of the
          page (cards in the content area) feels visually distinct. */}
      <Card className="overflow-hidden mb-6 border-0 shadow-sm bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Avatar with edit overlay */}
            <button
              type="button"
              onClick={() => setIsAvatarDialogOpen(true)}
              className="relative group shrink-0 rounded-full ring-4 ring-background shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-primary"
              aria-label={t('user.profile.buttons.change_avatar', 'Change avatar')}
            >
              <Image
                src={avatarUrl}
                alt={displayName}
                width={96}
                height={96}
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover"
              />
              <div className="absolute inset-0 rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </button>

            {/* Identity column */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold truncate" suppressHydrationWarning>
                {displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted-foreground">
                {user.email && (
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </span>
                )}
                {(user as any).role && (
                  <Badge variant="secondary" className="capitalize font-medium">
                    {t(`user.profile.role.${(user as any).role}`, String((user as any).role))}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* MAIN — horizontal underline tabs at the top, matching the
          dashboard pattern. Replaces the previous sidebar layout. */}
      <Tabs value={activeTab} onValueChange={setActiveTab} dir={direction}>
        {/* Container padding is `px-4`, so we bleed `-mx-4 px-4` to make
            the underline rail extend to the page edges on mobile. On lg+
            the page is `max-w-6xl mx-auto` with `px-4` still applied, so
            same bleed values work. overflow-x-auto + flex-nowrap on the
            list keeps the (3) tabs on one line and triggers a scrollbar
            only if labels overflow on the narrowest phone. */}
        <div className="-mx-4 px-4 overflow-x-auto mb-6">
          <UnderlineTabsList className="gap-6">
            {sidebarItems.map(({ value, icon: Icon, labelKey, labelFallback }) => (
              <UnderlineTabsTrigger key={value} value={value}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{t(labelKey, labelFallback)}</span>
              </UnderlineTabsTrigger>
            ))}
          </UnderlineTabsList>
        </div>

        {/* Content area — min-w-0 prevents content blow-out on long content */}
        <div className="min-w-0 space-y-6">

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

        {/* PREFERENCES TAB
            Regional Settings (language + timezone) is rendered as a 4th
            tab INSIDE <NotificationPreferences> via the `regionalSlot`
            prop, so it sits next to Channels / Categories / Quiet Hours
            instead of being a separate card below them. */}
        <TabsContent value="preferences" className="space-y-6">
          <NotificationPreferences
            regionalSlot={
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('user.profile.preferences.regional_settings')}
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('user.profile.preferences.language')}</p>
                        <p className="text-sm text-muted-foreground">
                          {preferences.regional.language === null
                            ? t('user.profile.preferences.languageAuto', 'Auto (Organization Default)')
                            : preferences.regional.language === 'en'
                            ? 'English'
                            : preferences.regional.language === 'he'
                            ? 'עברית'
                            : preferences.regional.language === 'es'
                            ? 'Español'
                            : preferences.regional.language === 'fr'
                            ? 'Français'
                            : preferences.regional.language}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsLanguageDialogOpen(true)}>
                      {t('user.profile.preferences.change')}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{t('user.profile.preferences.timezone')}</p>
                        <p className="text-sm text-muted-foreground">
                          {preferences.regional.timezone
                            ? preferences.regional.timezone
                            : preferences.regional.tenantTimezone
                            ? `${preferences.regional.tenantTimezone} · ${t('user.profile.preferences.timezoneAutoBadge', 'אוטומטי (ברירת מחדל של הארגון)')}`
                            : t('user.profile.preferences.timezoneAutoBadge', 'אוטומטי (ברירת מחדל של הארגון)')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsTimezoneDialogOpen(true)}
                    >
                      {t('user.profile.preferences.change')}
                    </Button>
                  </div>
                </div>
              </Card>
            }
          />
        </TabsContent>
        </div>
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

      {/* Language Preference Dialog */}
      <LanguagePreferenceDialog
        open={isLanguageDialogOpen}
        onOpenChange={setIsLanguageDialogOpen}
        currentLanguage={profileData?.preferences.regional.language || null}
        onLanguageChanged={() => {
          // Refresh profile data after language change
          queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        }}
      />

      {/* Timezone Preference Dialog — focused picker for just the timezone,
          parallel to the Language Preference Dialog. We `refetchQueries`
          (not just invalidate) so the Regional Settings card shows the
          new value immediately; useUserProfile has staleTime=5min and
          plain invalidation defers the refetch. */}
      <TimezonePreferenceDialog
        open={isTimezoneDialogOpen}
        onOpenChange={setIsTimezoneDialogOpen}
        currentTimezone={profileData?.preferences.regional.timezone || null}
        tenantTimezone={profileData?.preferences.regional.tenantTimezone || null}
        onTimezoneChanged={() => {
          queryClient.refetchQueries({ queryKey: ['userProfile'] });
        }}
      />
    </div>
  );
}
