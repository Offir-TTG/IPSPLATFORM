'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Globe,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X
} from 'lucide-react';

interface TenantData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  subscription_tier: string;
  max_users: number;
  max_courses: number;
  logo_url: string | null;
  primary_color: string | null;
  admin_email: string;
  default_language: string;
  timezone: string;
  currency: string;
  enabled_features: Record<string, boolean>;
  created_at: string;
  userRole?: string;
}

export default function OrganizationSettingsPage() {
  const { t, direction, availableLanguages } = useAdminLanguage();
  const { isAdmin, tenantName } = useTenant();
  const { toast } = useToast();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    primary_color: '',
    admin_email: '',
    default_language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    enabled_features: {
      courses: true,
      zoom: false,
      docusign: false,
    },
  });

  useEffect(() => {
    loadTenantData();
  }, []);

  useEffect(() => {
    console.log('FormData updated:', formData);
  }, [formData]);

  const loadTenantData = async () => {
    try {
      const response = await fetch('/api/admin/tenant');
      const data = await response.json();

      console.log('Tenant API Response:', data);

      if (data.success) {
        console.log('Admin Email:', data.data.admin_email);
        console.log('Logo URL:', data.data.logo_url);

        setTenantData(data.data);
        setFormData({
          name: data.data.name || '',
          logo_url: data.data.logo_url || '',
          primary_color: data.data.primary_color || '',
          admin_email: data.data.admin_email || '',
          default_language: data.data.default_language || 'en',
          timezone: data.data.timezone || 'UTC',
          currency: data.data.currency || 'USD',
          enabled_features: data.data.enabled_features || {
            courses: true,
            zoom: false,
            docusign: false,
          },
        });
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: data.error || t('organization.loadError', 'Failed to load organization data'),
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('organization.loadError', 'Error loading organization data'),
        variant: 'destructive',
      });
      console.error('Error loading tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('organization.saveSuccess', 'Organization updated successfully'),
        });
        setTenantData(data.data);

        // Trigger a page reload to update the logo in AdminLayout
        window.location.reload();
      } else {
        toast({
          title: t('common.error', 'Error'),
          description: data.error || t('organization.saveError', 'Failed to update organization'),
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('organization.saveError', 'Error updating organization'),
        variant: 'destructive',
      });
      console.error('Error updating tenant:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = (feature: keyof typeof formData.enabled_features) => {
    setFormData({
      ...formData,
      enabled_features: {
        ...formData.enabled_features,
        [feature]: !formData.enabled_features[feature],
      },
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t('common.error', 'Error'),
        description: t('organization.logoError', 'Please upload an image file'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t('common.error', 'Error'),
        description: t('organization.logoSizeError', 'Image must be less than 2MB'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setFormData(prev => ({ ...prev, logo_url: data.url }));
        toast({
          title: t('common.success', 'Success'),
          description: t('organization.logoSuccess', 'Logo uploaded successfully'),
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast({
        title: t('common.error', 'Error'),
        description: t('organization.logoUploadError', 'Failed to upload logo'),
        variant: 'destructive',
      });
      console.error('Error uploading logo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: '' });
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription suppressHydrationWarning>
            {t('organization.adminRequired', 'Admin access required')}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" suppressHydrationWarning>
              {t('organization.title', 'Organization Settings')}
            </h1>
            <p className="text-muted-foreground mt-1" suppressHydrationWarning>
              {t('organization.subtitle', 'Manage your organization settings and preferences')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle suppressHydrationWarning>
                  {t('organization.basicInfo', 'Basic Information')}
                </CardTitle>
              </div>
              <CardDescription suppressHydrationWarning>
                {t('organization.basicInfoDesc', 'Core details about your organization')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" suppressHydrationWarning>
                    {t('organization.name', 'Organization Name')}
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" suppressHydrationWarning>
                    {t('organization.slug', 'Slug')}
                  </Label>
                  <Input
                    id="slug"
                    type="text"
                    disabled
                    value={tenantData?.slug || ''}
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                    {t('organization.slugNote', 'Slug cannot be changed')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_email" suppressHydrationWarning>
                    {t('organization.adminEmail', 'Admin Email')}
                  </Label>
                  <Input
                    id="admin_email"
                    type="email"
                    required
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" suppressHydrationWarning>
                    {t('organization.status', 'Status')}
                  </Label>
                  <Input
                    id="status"
                    type="text"
                    disabled
                    value={tenantData?.status || ''}
                    className="bg-muted capitalize"
                  />
                </div>
              </div>

              {/* Logo Upload */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="logo" suppressHydrationWarning>
                  {t('organization.logo', 'Organization Logo')}
                </Label>
                <div className="flex items-start gap-4">
                  {formData.logo_url ? (
                    <div className="relative group">
                      <div className="h-24 w-24 border-2 rounded-lg bg-muted flex items-center justify-center p-2">
                        <img
                          src={formData.logo_url}
                          alt="Organization logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-24 w-24 border-2 border-dashed rounded-lg bg-muted flex items-center justify-center">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        {uploading ? (
                          <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        )}
                        <span suppressHydrationWarning>
                          {uploading ? t('organization.uploading', 'Uploading...') : t('organization.uploadLogo', 'Upload Logo')}
                        </span>
                      </Button>
                      <input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2" suppressHydrationWarning>
                      {t('organization.logoNote', 'PNG, JPG or SVG. Max 2MB.')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle suppressHydrationWarning>
                  {t('organization.localization', 'Localization')}
                </CardTitle>
              </div>
              <CardDescription suppressHydrationWarning>
                {t('organization.localizationDesc', 'Language, timezone, and currency settings')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_language" suppressHydrationWarning>
                    {t('organization.defaultLanguage', 'Default Language')}
                  </Label>
                  <Select
                    value={formData.default_language}
                    onValueChange={(value) => setFormData({ ...formData, default_language: value })}
                  >
                    <SelectTrigger id="default_language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLanguages
                        .filter(lang => lang.is_active)
                        .map(lang => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.native_name} ({lang.name})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone" suppressHydrationWarning>
                    {t('organization.timezone', 'Timezone')}
                  </Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New York</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los Angeles</SelectItem>
                      <SelectItem value="Europe/London">Europe/London</SelectItem>
                      <SelectItem value="Asia/Jerusalem">Asia/Jerusalem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency" suppressHydrationWarning>
                    {t('organization.currency', 'Currency')}
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="ILS">ILS - Israeli Shekel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle suppressHydrationWarning>
                  {t('organization.features', 'Enabled Features')}
                </CardTitle>
              </div>
              <CardDescription suppressHydrationWarning>
                {t('organization.featuresDesc', 'Enable or disable platform features')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="courses" suppressHydrationWarning>
                  {t('organization.coursesFeature', 'Courses')}
                </Label>
                <Switch
                  id="courses"
                  checked={formData.enabled_features.courses}
                  onCheckedChange={() => handleFeatureToggle('courses')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="zoom" suppressHydrationWarning>
                  {t('organization.zoomFeature', 'Zoom Integration')}
                </Label>
                <Switch
                  id="zoom"
                  checked={formData.enabled_features.zoom}
                  onCheckedChange={() => handleFeatureToggle('zoom')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="docusign" suppressHydrationWarning>
                  {t('organization.docusignFeature', 'DocuSign Integration')}
                </Label>
                <Switch
                  id="docusign"
                  checked={formData.enabled_features.docusign}
                  onCheckedChange={() => handleFeatureToggle('docusign')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle suppressHydrationWarning>
                  {t('organization.subscription', 'Subscription')}
                </CardTitle>
              </div>
              <CardDescription suppressHydrationWarning>
                {t('organization.subscriptionDesc', 'Your subscription details and limits')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tier" suppressHydrationWarning>
                    {t('organization.tier', 'Tier')}
                  </Label>
                  <Input
                    id="tier"
                    type="text"
                    disabled
                    value={tenantData?.subscription_tier || ''}
                    className="bg-muted capitalize"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_users" suppressHydrationWarning>
                    {t('organization.maxUsers', 'Max Users')}
                  </Label>
                  <Input
                    id="max_users"
                    type="number"
                    disabled
                    value={tenantData?.max_users || 0}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_courses" suppressHydrationWarning>
                    {t('organization.maxCourses', 'Max Courses')}
                  </Label>
                  <Input
                    id="max_courses"
                    type="number"
                    disabled
                    value={tenantData?.max_courses || 0}
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="created_at" suppressHydrationWarning>
                    {t('organization.createdAt', 'Created At')}
                  </Label>
                  <Input
                    id="created_at"
                    type="text"
                    disabled
                    value={tenantData?.created_at ? new Date(tenantData.created_at).toLocaleDateString() : ''}
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={loadTenantData}
              suppressHydrationWarning
            >
              {t('organization.reset', 'Reset')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
              <span suppressHydrationWarning>
                {saving ? t('organization.saving', 'Saving...') : t('organization.saveChanges', 'Save Changes')}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
