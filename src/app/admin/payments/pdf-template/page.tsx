'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Save, FileText, ArrowLeft, Upload, X, Eye, FileBarChart, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { PDFBrandingConfig } from '@/app/api/admin/payments/pdf-template/route';

export default function PDFTemplatePage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'schedule' | 'both'>('invoice');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'he'>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<PDFBrandingConfig>({
    organization: {
      name: '',
      email: '',
      phone: '',
      address: '',
      website: '',
      tax_id: '',
    },
    branding: {
      logo_url: '',
      primary_color: '#3B82F6',
      show_logo: true,
      show_organization_name: true,
    },
    footer: {
      show_contact_info: true,
      custom_footer_text: '',
      show_page_numbers: true,
    },
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payments/pdf-template');
      const data = await response.json();

      if (data.success && data.config) {
        setConfig(data.config);
      } else {
        toast.error(t('admin.pdf.loadError', 'Failed to load configuration'));
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error(t('admin.pdf.loadError', 'Failed to load configuration'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/payments/pdf-template', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t('admin.pdf.saveSuccess', 'Configuration saved successfully'));
      } else {
        toast.error(data.error || t('admin.pdf.saveError', 'Failed to save configuration'));
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(t('admin.pdf.saveError', 'Failed to save configuration'));
    } finally {
      setSaving(false);
    }
  };

  const updateOrganization = (field: keyof PDFBrandingConfig['organization'], value: string) => {
    setConfig(prev => ({
      ...prev,
      organization: {
        ...prev.organization,
        [field]: value,
      },
    }));
  };

  const updateBranding = (field: keyof PDFBrandingConfig['branding'], value: any) => {
    setConfig(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: value,
      },
    }));
  };

  const updateFooter = (field: keyof PDFBrandingConfig['footer'], value: any) => {
    setConfig(prev => ({
      ...prev,
      footer: {
        ...prev.footer,
        [field]: value,
      },
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('admin.pdf.branding.invalidFileType', 'Please upload a PNG, JPG, or SVG file'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('admin.pdf.branding.fileTooLarge', 'File size must be less than 2MB'));
      return;
    }

    try {
      setUploading(true);

      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateBranding('logo_url', dataUrl);
        toast.success(t('admin.pdf.branding.logoUploaded', 'Logo uploaded successfully'));
      };
      reader.onerror = () => {
        toast.error(t('admin.pdf.branding.uploadError', 'Failed to upload logo'));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error(t('admin.pdf.branding.uploadError', 'Failed to upload logo'));
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    updateBranding('logo_url', '');
    toast.success(t('admin.pdf.branding.logoRemoved', 'Logo removed'));
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      setShowPreviewDialog(false);

      const response = await fetch('/api/admin/payments/pdf-template/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branding: config,
          documentType: selectedDocType,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pdf-preview-${selectedDocType}-${selectedLanguage}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(t('admin.pdf.previewSuccess', 'Preview PDF generated successfully'));
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error(t('admin.pdf.previewError', 'Failed to generate preview'));
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
          </div>
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
                {t('admin.pdf.title', 'PDF Template Configuration')}
              </h1>
              <p className="text-muted-foreground mt-1" suppressHydrationWarning>
                {t('admin.pdf.description', 'Customize the branding and information that appears on enrollment payment receipts')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreviewDialog(true)} disabled={previewing}>
              {previewing ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>{t('admin.pdf.previewing', 'Generating...')}</span>
                </>
              ) : (
                <>
                  <Eye className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>{t('admin.pdf.preview', 'Preview PDF')}</span>
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('admin.pdf.saving', 'Saving...')}
                </>
              ) : (
                <>
                  <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('admin.pdf.save', 'Save Changes')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle suppressHydrationWarning>{t('admin.pdf.cardTitle', 'Branding Configuration')}</CardTitle>
            </div>
            <CardDescription suppressHydrationWarning>
              {t('admin.pdf.cardDescription', 'Configure how your organization\'s branding appears on PDF receipts')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="organization" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="organization" suppressHydrationWarning>
                  {t('admin.pdf.tabs.organization', 'Organization Info')}
                </TabsTrigger>
                <TabsTrigger value="branding" suppressHydrationWarning>
                  {t('admin.pdf.tabs.branding', 'Branding')}
                </TabsTrigger>
                <TabsTrigger value="footer" suppressHydrationWarning>
                  {t('admin.pdf.tabs.footer', 'Footer')}
                </TabsTrigger>
              </TabsList>

            {/* Organization Info Tab */}
            <TabsContent value="organization" className="space-y-4 mt-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="org-name" suppressHydrationWarning>
                    {t('admin.pdf.org.name', 'Organization Name')}
                  </Label>
                  <Input
                    id="org-name"
                    value={config.organization.name}
                    onChange={(e) => updateOrganization('name', e.target.value)}
                    placeholder={t('admin.pdf.org.namePlaceholder', 'Your Organization Name')}
                  />
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('admin.pdf.org.nameHint', 'This name will appear in the PDF header')}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="org-email" suppressHydrationWarning>
                    {t('admin.pdf.org.email', 'Contact Email')}
                  </Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={config.organization.email}
                    onChange={(e) => updateOrganization('email', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="org-phone" suppressHydrationWarning>
                    {t('admin.pdf.org.phone', 'Contact Phone')}
                  </Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    value={config.organization.phone}
                    onChange={(e) => updateOrganization('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="org-address" suppressHydrationWarning>
                    {t('admin.pdf.org.address', 'Address')}
                  </Label>
                  <Textarea
                    id="org-address"
                    value={config.organization.address}
                    onChange={(e) => updateOrganization('address', e.target.value)}
                    placeholder="123 Main Street&#10;City, State ZIP"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="org-website" suppressHydrationWarning>
                    {t('admin.pdf.org.website', 'Website')}
                  </Label>
                  <Input
                    id="org-website"
                    type="url"
                    value={config.organization.website}
                    onChange={(e) => updateOrganization('website', e.target.value)}
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="org-tax-id" suppressHydrationWarning>
                    {t('admin.pdf.org.taxId', 'Tax ID / Business Registration')}
                  </Label>
                  <Input
                    id="org-tax-id"
                    value={config.organization.tax_id}
                    onChange={(e) => updateOrganization('tax_id', e.target.value)}
                    placeholder="12-3456789"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-4 mt-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label suppressHydrationWarning>
                    {t('admin.pdf.branding.logo', 'Organization Logo')}
                  </Label>

                  {/* Logo Preview or Upload Area */}
                  {config.branding.logo_url ? (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-2" suppressHydrationWarning>
                            {t('admin.pdf.branding.logoPreview', 'Preview:')}
                          </p>
                          <div className="bg-gray-50 p-4 rounded-md flex items-center justify-center min-h-[100px]">
                            <img
                              src={config.branding.logo_url}
                              alt="Logo preview"
                              className="max-h-24 max-w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '';
                                (e.target as HTMLImageElement).alt = 'Failed to load image';
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4 mr-2" />
                          <span suppressHydrationWarning>{t('admin.pdf.branding.removeLogo', 'Remove')}</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-3" suppressHydrationWarning>
                        {t('admin.pdf.branding.uploadHint', 'Upload your organization logo (PNG, JPG, or SVG)')}
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span suppressHydrationWarning>{t('admin.pdf.branding.uploading', 'Uploading...')}</span>
                          </>
                        ) : (
                          <>
                            <Upload className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                            <span suppressHydrationWarning>{t('admin.pdf.branding.uploadLogo', 'Upload Logo')}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Alternative: Logo URL Input */}
                  <div className="space-y-2">
                    <Label htmlFor="logo-url" className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('admin.pdf.branding.orEnterUrl', 'Or enter logo URL:')}
                    </Label>
                    <Input
                      id="logo-url"
                      value={config.branding.logo_url}
                      onChange={(e) => updateBranding('logo_url', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="primary-color" suppressHydrationWarning>
                    {t('admin.pdf.branding.primaryColor', 'Primary Color')}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={config.branding.primary_color}
                      onChange={(e) => updateBranding('primary_color', e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={config.branding.primary_color}
                      onChange={(e) => updateBranding('primary_color', e.target.value)}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('admin.pdf.branding.colorHint', 'This color will be used for headers, borders, and accents in the PDF')}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-logo" suppressHydrationWarning>
                      {t('admin.pdf.branding.showLogo', 'Show Logo')}
                    </Label>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('admin.pdf.branding.showLogoDesc', 'Display the logo in the PDF header')}
                    </p>
                  </div>
                  <Switch
                    id="show-logo"
                    checked={config.branding.show_logo}
                    onCheckedChange={(checked) => updateBranding('show_logo', checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-org-name" suppressHydrationWarning>
                      {t('admin.pdf.branding.showOrgName', 'Show Organization Name')}
                    </Label>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('admin.pdf.branding.showOrgNameDesc', 'Display the organization name in the PDF header')}
                    </p>
                  </div>
                  <Switch
                    id="show-org-name"
                    checked={config.branding.show_organization_name}
                    onCheckedChange={(checked) => updateBranding('show_organization_name', checked)}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Footer Tab */}
            <TabsContent value="footer" className="space-y-4 mt-6">
              <div className="grid gap-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-contact" suppressHydrationWarning>
                      {t('admin.pdf.footer.showContact', 'Show Contact Information')}
                    </Label>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('admin.pdf.footer.showContactDesc', 'Display contact info (email, phone, address) in the footer')}
                    </p>
                  </div>
                  <Switch
                    id="show-contact"
                    checked={config.footer.show_contact_info}
                    onCheckedChange={(checked) => updateFooter('show_contact_info', checked)}
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-page-numbers" suppressHydrationWarning>
                      {t('admin.pdf.footer.showPageNumbers', 'Show Page Numbers')}
                    </Label>
                    <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                      {t('admin.pdf.footer.showPageNumbersDesc', 'Display "Page X of Y" in the footer')}
                    </p>
                  </div>
                  <Switch
                    id="show-page-numbers"
                    checked={config.footer.show_page_numbers}
                    onCheckedChange={(checked) => updateFooter('show_page_numbers', checked)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="custom-footer" suppressHydrationWarning>
                    {t('admin.pdf.footer.customText', 'Custom Footer Text (Optional)')}
                  </Label>
                  <Textarea
                    id="custom-footer"
                    value={config.footer.custom_footer_text}
                    onChange={(e) => updateFooter('custom_footer_text', e.target.value)}
                    placeholder={t('admin.pdf.footer.customTextPlaceholder', 'Enter any additional text you want to appear in the footer')}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                    {t('admin.pdf.footer.customTextHint', 'This text will appear at the bottom of each page')}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Save Button (Bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('admin.pdf.saving', 'Saving...')}
            </>
          ) : (
            <>
              <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('admin.pdf.save', 'Save Changes')}
            </>
          )}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-lg" dir={direction}>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>
              {t('admin.pdf.dialog.title', 'Select Document Type')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {t('admin.pdf.dialog.description', 'Choose which document you would like to preview')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Document Type Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold" suppressHydrationWarning>
                {t('admin.pdf.dialog.documentType', 'Document Type')}
              </Label>
              <div className="grid gap-2">
                <Button
                  variant={selectedDocType === 'invoice' ? 'default' : 'outline'}
                  className="justify-start h-auto py-3"
                  onClick={() => setSelectedDocType('invoice')}
                >
                  <FileBarChart className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <div className={`flex flex-col items-start ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="font-medium" suppressHydrationWarning>
                      {t('admin.pdf.dialog.invoice', 'Invoice')}
                    </span>
                  </div>
                </Button>
                <Button
                  variant={selectedDocType === 'schedule' ? 'default' : 'outline'}
                  className="justify-start h-auto py-3"
                  onClick={() => setSelectedDocType('schedule')}
                >
                  <Calendar className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <div className={`flex flex-col items-start ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="font-medium" suppressHydrationWarning>
                      {t('admin.pdf.dialog.schedule', 'Payment Schedule')}
                    </span>
                  </div>
                </Button>
                <Button
                  variant={selectedDocType === 'both' ? 'default' : 'outline'}
                  className="justify-start h-auto py-3"
                  onClick={() => setSelectedDocType('both')}
                >
                  <FileText className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <div className={`flex flex-col items-start ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="font-medium" suppressHydrationWarning>
                      {t('admin.pdf.dialog.both', 'Both Documents')}
                    </span>
                  </div>
                </Button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold" suppressHydrationWarning>
                {t('admin.pdf.dialog.language', 'Language')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                  className="justify-center"
                  onClick={() => setSelectedLanguage('en')}
                >
                  <span suppressHydrationWarning>
                    {t('admin.pdf.dialog.english', 'English')}
                  </span>
                </Button>
                <Button
                  variant={selectedLanguage === 'he' ? 'default' : 'outline'}
                  className="justify-center"
                  onClick={() => setSelectedLanguage('he')}
                >
                  <span suppressHydrationWarning>
                    {t('admin.pdf.dialog.hebrew', 'Hebrew')}
                  </span>
                </Button>
              </div>
            </div>

            {/* Preview Button */}
            <Button
              onClick={handlePreview}
              disabled={previewing}
              className="w-full"
            >
              {previewing ? (
                <>
                  <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>{t('admin.pdf.previewing', 'Generating...')}</span>
                </>
              ) : (
                <>
                  <Eye className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  <span suppressHydrationWarning>{t('admin.pdf.dialog.generate', 'Generate Preview')}</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
