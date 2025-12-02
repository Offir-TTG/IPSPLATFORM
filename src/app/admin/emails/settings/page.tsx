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
import { Save, Plus, X } from 'lucide-react';
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
  { name: 'Blue', light: 'bg-blue-100 text-blue-800', dark: 'dark:bg-blue-900 dark:text-blue-300' },
  { name: 'Green', light: 'bg-green-100 text-green-800', dark: 'dark:bg-green-900 dark:text-green-300' },
  { name: 'Purple', light: 'bg-purple-100 text-purple-800', dark: 'dark:bg-purple-900 dark:text-purple-300' },
  { name: 'Pink', light: 'bg-pink-100 text-pink-800', dark: 'dark:bg-pink-900 dark:text-pink-300' },
  { name: 'Red', light: 'bg-red-100 text-red-800', dark: 'dark:bg-red-900 dark:text-red-300' },
  { name: 'Orange', light: 'bg-orange-100 text-orange-800', dark: 'dark:bg-orange-900 dark:text-orange-300' },
  { name: 'Yellow', light: 'bg-yellow-100 text-yellow-800', dark: 'dark:bg-yellow-900 dark:text-yellow-300' },
  { name: 'Indigo', light: 'bg-indigo-100 text-indigo-800', dark: 'dark:bg-indigo-900 dark:text-indigo-300' },
  { name: 'Teal', light: 'bg-teal-100 text-teal-800', dark: 'dark:bg-teal-900 dark:text-teal-300' },
  { name: 'Gray', light: 'bg-gray-100 text-gray-800', dark: 'dark:bg-gray-900 dark:text-gray-300' },
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

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadSettings();
    }
  }, [tenantId]);

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
        {/* Header */}
        <div>
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
                          {colorOption.name}
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
