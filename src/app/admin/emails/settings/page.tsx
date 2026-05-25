'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Save, Plus, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CategoryConfig {
  value: string;
  label_en: string;
  label_he: string;
  color: string;
  dark_color: string;
}

const DEFAULT_CATEGORIES: CategoryConfig[] = [
  {
    value: 'enrollment',
    label_en: 'Enrollment',
    label_he: 'הרשמה',
    color: 'bg-blue-100 text-blue-800',
    dark_color: 'dark:bg-blue-900 dark:text-blue-300',
  },
  {
    value: 'payment',
    label_en: 'Payment',
    label_he: 'תשלום',
    color: 'bg-green-100 text-green-800',
    dark_color: 'dark:bg-green-900 dark:text-green-300',
  },
  {
    value: 'lesson',
    label_en: 'Lesson',
    label_he: 'שיעור',
    color: 'bg-purple-100 text-purple-800',
    dark_color: 'dark:bg-purple-900 dark:text-purple-300',
  },
  {
    value: 'parent',
    label_en: 'Parent',
    label_he: 'הורה',
    color: 'bg-pink-100 text-pink-800',
    dark_color: 'dark:bg-pink-900 dark:text-pink-300',
  },
  {
    value: 'system',
    label_en: 'System',
    label_he: 'מערכת',
    color: 'bg-gray-100 text-gray-800',
    dark_color: 'dark:bg-gray-900 dark:text-gray-300',
  },
];

const COLOR_OPTIONS = [
  { nameKey: 'colors.blue', name: 'Blue', light: 'bg-blue-100 text-blue-800', dark: 'dark:bg-blue-900 dark:text-blue-300' },
  { nameKey: 'colors.green', name: 'Green', light: 'bg-green-100 text-green-800', dark: 'dark:bg-green-900 dark:text-green-300' },
  { nameKey: 'colors.purple', name: 'Purple', light: 'bg-purple-100 text-purple-800', dark: 'dark:bg-purple-900 dark:text-purple-300' },
  { nameKey: 'colors.pink', name: 'Pink', light: 'bg-pink-100 text-pink-800', dark: 'dark:bg-pink-900 dark:text-pink-300' },
  { nameKey: 'colors.red', name: 'Red', light: 'bg-red-100 text-red-800', dark: 'dark:bg-red-900 dark:text-red-300' },
  { nameKey: 'colors.orange', name: 'Orange', light: 'bg-orange-100 text-orange-800', dark: 'dark:bg-orange-900 dark:text-orange-300' },
  { nameKey: 'colors.yellow', name: 'Yellow', light: 'bg-yellow-100 text-yellow-800', dark: 'dark:bg-yellow-900 dark:text-yellow-300' },
  { nameKey: 'colors.indigo', name: 'Indigo', light: 'bg-indigo-100 text-indigo-800', dark: 'dark:bg-indigo-900 dark:text-indigo-300' },
  { nameKey: 'colors.teal', name: 'Teal', light: 'bg-teal-100 text-teal-800', dark: 'dark:bg-teal-900 dark:text-teal-300' },
  { nameKey: 'colors.gray', name: 'Gray', light: 'bg-gray-100 text-gray-800', dark: 'dark:bg-gray-900 dark:text-gray-300' },
];

export default function EmailSettingsPage() {
  const { t, direction } = useAdminLanguage();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const isRtl = direction === 'rtl';

  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Email branding state — wired to the new tenants.email_* columns. These
  // feed the master layout in src/lib/email/layout.ts on every render.
  const [branding, setBranding] = useState({
    email_primary_color: '#4f46e5',
    email_button_color: '',
    email_logo_url: '',
    email_footer_text: '',
    email_sender_name: '',
    email_reply_to: '',
    email_header_style: 'text' as 'logo' | 'text' | 'none',
  });
  // Site-wide branding fallback — surfaced to the admin so they know the
  // email_* fields are *optional overrides*; leaving them empty just
  // inherits the platform's main logo and primary color.
  const [siteDefaults, setSiteDefaults] = useState<{
    logo_url: string | null;
    primary_color: string | null;
  }>({ logo_url: null, primary_color: null });
  const [savingBranding, setSavingBranding] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadSettings();
      loadBranding();
    }
  }, [tenantId]);

  async function loadBranding() {
    try {
      const res = await fetch('/api/admin/tenant');
      const json = await res.json();
      if (json.success && json.data) {
        setBranding({
          email_primary_color: json.data.email_primary_color || json.data.primary_color || '#4f46e5',
          email_button_color: json.data.email_button_color || '',
          email_logo_url: json.data.email_logo_url || '',
          email_footer_text: json.data.email_footer_text || '',
          email_sender_name: json.data.email_sender_name || '',
          email_reply_to: json.data.email_reply_to || '',
          email_header_style: (json.data.email_header_style as 'logo' | 'text' | 'none') || 'text',
        });
        setSiteDefaults({
          logo_url: json.data.logo_url || null,
          primary_color: json.data.primary_color || null,
        });
      }
    } catch (err) {
      console.error('Failed to load email branding:', err);
    }
  }

  async function handleSaveBranding() {
    try {
      setSavingBranding(true);
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // Send empty strings as null so optional fields actually clear in DB.
        body: JSON.stringify({
          email_primary_color: branding.email_primary_color || null,
          email_button_color: branding.email_button_color || null,
          email_logo_url: branding.email_logo_url || null,
          email_footer_text: branding.email_footer_text || null,
          email_sender_name: branding.email_sender_name || null,
          email_reply_to: branding.email_reply_to || null,
          email_header_style: branding.email_header_style,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed');
      }
      toast({
        title: t('common.success', 'Success'),
        description: t('emails.settings.branding_saved', 'Email branding saved'),
      });
    } catch (err) {
      console.error('Failed to save email branding:', err);
      toast({
        title: t('common.error', 'Error'),
        description: err instanceof Error ? err.message : 'Failed to save email branding',
        variant: 'destructive',
      });
    } finally {
      setSavingBranding(false);
    }
  }

  async function loadSettings() {
    try {
      setLoading(true);

      // Load tenant-specific email settings
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('settings')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'email_categories')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.settings?.categories) {
        setCategories(data.settings.categories);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!tenantId) return;

    try {
      setSaving(true);

      // Save to tenant_settings
      const { error } = await supabase
        .from('tenant_settings')
        .upsert({
          tenant_id: tenantId,
          setting_key: 'email_categories',
          settings: { categories },
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: t('common.success', 'Success'),
        description: t('emails.settings.saved', 'Email settings saved successfully'),
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('emails.settings.save_error', 'Failed to save settings'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  function updateCategory(index: number, field: keyof CategoryConfig, value: string) {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  }

  function addCategory() {
    setCategories([
      ...categories,
      {
        value: '',
        label_en: '',
        label_he: '',
        color: 'bg-gray-100 text-gray-800',
        dark_color: 'dark:bg-gray-900 dark:text-gray-300',
      },
    ]);
  }

  function removeCategory(index: number) {
    setCategories(categories.filter((_, i) => i !== index));
  }

  function selectColor(index: number, colorOption: typeof COLOR_OPTIONS[0]) {
    const updated = [...categories];
    updated[index] = {
      ...updated[index],
      color: colorOption.light,
      dark_color: colorOption.dark,
    };
    setCategories(updated);
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl p-6 space-y-6" dir={direction}>
        {/* Header — back link inline with title block */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <Link href="/admin/emails">
            <Button variant="ghost" size="sm">
              <ArrowLeft className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2 rotate-180' : 'mr-2'}`} />
              <span suppressHydrationWarning>{t('common.back', 'Back')}</span>
            </Button>
          </Link>
          <div className="min-w-0">
          <h1 suppressHydrationWarning style={{
            fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))'
          }}>
            {t('emails.settings.title', 'Email Settings')}
          </h1>
          <p suppressHydrationWarning style={{
            marginTop: '0.5rem',
            color: 'hsl(var(--muted-foreground))'
          }}>
            {t('emails.settings.description', 'Configure email template categories and badge colors')}
          </p>
          </div>
        </div>

        {/* Email Branding ─ drives the master email layout */}
        <Card>
          <CardHeader>
            <CardTitle>{t('emails.settings.branding.title', 'Email Branding')}</CardTitle>
            <CardDescription>
              {t(
                'emails.settings.branding.description',
                'Customize how every outgoing email looks. These settings drive the master email layout — header color, logo, footer, and sender details apply to every email type.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('emails.settings.branding.primary_color', 'Header Color')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={branding.email_primary_color}
                    onChange={(e) => setBranding({ ...branding, email_primary_color: e.target.value })}
                    style={{ width: '4rem', padding: '0.25rem', height: '2.5rem' }}
                  />
                  <Input
                    value={branding.email_primary_color}
                    onChange={(e) => setBranding({ ...branding, email_primary_color: e.target.value })}
                    placeholder={siteDefaults.primary_color || '#4f46e5'}
                  />
                </div>
                {siteDefaults.primary_color && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    style={{ padding: 0, height: 'auto', fontSize: 'var(--font-size-xs)' }}
                    onClick={() =>
                      setBranding({ ...branding, email_primary_color: siteDefaults.primary_color || '#4f46e5' })
                    }
                  >
                    {t('emails.settings.branding.use_site_color', 'Use site color')}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('emails.settings.branding.button_color', 'Button Color')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={branding.email_button_color || branding.email_primary_color}
                    onChange={(e) => setBranding({ ...branding, email_button_color: e.target.value })}
                    style={{ width: '4rem', padding: '0.25rem', height: '2.5rem' }}
                  />
                  <Input
                    value={branding.email_button_color}
                    onChange={(e) => setBranding({ ...branding, email_button_color: e.target.value })}
                    placeholder={branding.email_primary_color || '#4f46e5'}
                  />
                </div>
                {/* When empty, the button colour falls back to the
                    header colour. Surfacing this so admins know they
                    can leave it blank to match. */}
                <p
                  suppressHydrationWarning
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--muted-foreground))',
                    margin: 0,
                  }}
                >
                  {t(
                    'emails.settings.branding.button_default_hint',
                    'Leave empty to match the header color'
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t('emails.settings.branding.header_style', 'Header Style')}</Label>
                <select
                  value={branding.email_header_style}
                  onChange={(e) =>
                    setBranding({ ...branding, email_header_style: e.target.value as 'logo' | 'text' | 'none' })
                  }
                  style={{
                    width: '100%',
                    height: '2.5rem',
                    padding: '0 0.75rem',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <option value="text">{t('emails.settings.branding.header_text', 'Organization name (text)')}</option>
                  <option value="logo">{t('emails.settings.branding.header_logo', 'Logo image')}</option>
                  <option value="none">{t('emails.settings.branding.header_none', 'No header')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('emails.settings.branding.logo_url', 'Logo URL (used when header style is Logo)')}</Label>
              <Input
                value={branding.email_logo_url}
                onChange={(e) => setBranding({ ...branding, email_logo_url: e.target.value })}
                placeholder={
                  siteDefaults.logo_url
                    ? siteDefaults.logo_url
                    : t('emails.settings.branding.logo_url_placeholder', 'https://your-cdn.com/logo.png')
                }
              />
              {/* Show the site default + a quick "use it" button so admins
                  don't have to copy/paste the URL from elsewhere. Leaving
                  this field empty automatically falls back to the site
                  logo at render time (see renderTemplate.ts). */}
              {siteDefaults.logo_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <p
                    suppressHydrationWarning
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--muted-foreground))',
                      margin: 0,
                    }}
                  >
                    {t(
                      'emails.settings.branding.logo_default_hint',
                      'Leave empty to use your site logo'
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    style={{ padding: 0, height: 'auto', fontSize: 'var(--font-size-xs)' }}
                    onClick={() =>
                      setBranding({ ...branding, email_logo_url: siteDefaults.logo_url || '' })
                    }
                  >
                    {t('emails.settings.branding.use_site_logo', 'Use site logo')}
                  </Button>
                </div>
              ) : (
                <p
                  suppressHydrationWarning
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--muted-foreground))',
                    margin: 0,
                  }}
                >
                  {t(
                    'emails.settings.branding.logo_no_default_hint',
                    'No site logo set. Set one in tenant settings to use it as the email logo automatically.'
                  )}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('emails.settings.branding.footer_text', 'Footer Text')}</Label>
              <Input
                value={branding.email_footer_text}
                onChange={(e) => setBranding({ ...branding, email_footer_text: e.target.value })}
                placeholder={t(
                  'emails.settings.branding.footer_placeholder',
                  'e.g. Contact support at help@example.com'
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('emails.settings.branding.sender_name', 'Sender Display Name')}</Label>
                <Input
                  value={branding.email_sender_name}
                  onChange={(e) => setBranding({ ...branding, email_sender_name: e.target.value })}
                  placeholder={t('emails.settings.branding.sender_placeholder', 'e.g. Acme Academy')}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('emails.settings.branding.reply_to', 'Reply-To Address')}</Label>
                <Input
                  type="email"
                  value={branding.email_reply_to}
                  onChange={(e) => setBranding({ ...branding, email_reply_to: e.target.value })}
                  placeholder="support@example.com"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveBranding} disabled={savingBranding}>
                <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {savingBranding
                  ? t('common.saving', 'Saving...')
                  : t('emails.settings.branding.save', 'Save Branding')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{t('emails.settings.preview.title', 'Category Preview')}</CardTitle>
            <CardDescription>
              {t('emails.settings.preview.description', 'Preview how your category badges will appear')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <Badge key={index} className={`${category.color} ${category.dark_color}`}>
                  {direction === 'rtl' ? category.label_he || category.label_en : category.label_en}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t('emails.settings.categories.title', 'Template Categories')}</CardTitle>
            <CardDescription>
              {t('emails.settings.categories.description', 'Define categories for organizing email templates with custom labels and colors')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {categories.map((category, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={`${category.color} ${category.dark_color}`}>
                    {direction === 'rtl' ? category.label_he || category.label_en : category.label_en}
                  </Badge>
                  {categories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCategory(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('emails.settings.categories.value', 'Category Key')}</Label>
                    <Input
                      value={category.value}
                      onChange={(e) => updateCategory(index, 'value', e.target.value)}
                      placeholder="e.g., enrollment"
                      dir={direction}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('emails.settings.categories.label_en', 'English Label')}</Label>
                    <Input
                      value={category.label_en}
                      onChange={(e) => updateCategory(index, 'label_en', e.target.value)}
                      placeholder="e.g., Enrollment"
                      dir="ltr"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('emails.settings.categories.label_he', 'Hebrew Label')}</Label>
                    <Input
                      value={category.label_he}
                      onChange={(e) => updateCategory(index, 'label_he', e.target.value)}
                      placeholder="e.g., הרשמה"
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('emails.settings.categories.color', 'Badge Color')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((colorOption) => (
                        <button
                          key={colorOption.name}
                          type="button"
                          onClick={() => selectColor(index, colorOption)}
                          className={`${colorOption.light} ${colorOption.dark} px-3 py-1 rounded text-xs font-medium border-2 ${
                            category.color === colorOption.light ? 'border-primary' : 'border-transparent'
                          }`}
                        >
                          {t(colorOption.nameKey, colorOption.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addCategory}
              className="w-full"
            >
              <Plus className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('emails.settings.categories.add', 'Add Category')}
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          flexDirection: isMobile ? 'column-reverse' : 'row'
        }}>
          <Link href="/admin/emails" style={{ width: isMobile ? '100%' : 'auto' }}>
            <Button variant="outline" style={{ width: '100%' }}>
              {t('common.cancel', 'Cancel')}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} style={{ width: isMobile ? '100%' : 'auto' }}>
            <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {saving ? t('common.saving', 'Saving...') : t('common.save', 'Save Changes')}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
