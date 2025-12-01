'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Save, Eye, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_category: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  variables: any[];
}

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

interface TemplateVersion {
  id: string;
  language_code: string;
  subject: string;
  body_html: string;
  body_text: string;
  version: number;
  is_current: boolean;
}

export default function EditEmailTemplatePage() {
  const params = useParams();
  const { t, direction } = useAdminLanguage();
  const { tenantId } = useTenant();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const isRtl = direction === 'rtl';

  const [template, setTemplate] = useState<EmailTemplate | null>(null);
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'he'>('en');
  const [categories, setCategories] = useState<CategoryConfig[]>(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    en: { subject: string; body_html: string; body_text: string };
    he: { subject: string; body_html: string; body_text: string };
  }>({
    en: { subject: '', body_html: '', body_text: '' },
    he: { subject: '', body_html: '', body_text: '' },
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadCategories();
    }
  }, [tenantId]);

  useEffect(() => {
    if (params.id && tenantId) {
      loadTemplate();
    }
  }, [params.id, tenantId]);

  async function loadCategories() {
    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('settings')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'email_categories')
        .single();

      if (!error && data?.settings?.categories) {
        setCategories(data.settings.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Keep default categories
    }
  }

  async function loadTemplate() {
    try {
      setLoading(true);

      // Load template
      const { data: templateData, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', params.id)
        .eq('tenant_id', tenantId)
        .single();

      if (templateError) throw templateError;
      setTemplate(templateData);
      setSelectedCategory(templateData.template_category);

      // Load versions
      const { data: versionsData, error: versionsError } = await supabase
        .from('email_template_versions')
        .select('*')
        .eq('template_id', params.id)
        .eq('is_current', true);

      if (versionsError) throw versionsError;
      setVersions(versionsData || []);

      // Populate form data
      const newFormData: typeof formData = {
        en: { subject: '', body_html: '', body_text: '' },
        he: { subject: '', body_html: '', body_text: '' },
      };
      versionsData?.forEach((version) => {
        if (version.language_code === 'en' || version.language_code === 'he') {
          newFormData[version.language_code as 'en' | 'he'] = {
            subject: version.subject,
            body_html: version.body_html,
            body_text: version.body_text,
          };
        }
      });
      setFormData(newFormData);
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error(t('emails.editor.load_error', 'Failed to load template'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!template) return;

    try {
      setSaving(true);

      // Update template category if changed
      if (selectedCategory !== template.template_category) {
        console.log('Updating category from', template.template_category, 'to', selectedCategory);
        const { error: categoryError } = await supabase
          .from('email_templates')
          .update({ template_category: selectedCategory })
          .eq('id', template.id);

        if (categoryError) {
          console.error('Category update error:', categoryError);
          throw categoryError;
        }
        console.log('Category updated successfully');
      }

      // Save both language versions
      for (const lang of ['en', 'he'] as const) {
        const currentVersion = versions.find((v) => v.language_code === lang);

        if (currentVersion) {
          console.log(`Updating ${lang} version:`, {
            subject: formData[lang].subject,
            body_html_length: formData[lang].body_html.length,
            body_text_length: formData[lang].body_text.length,
          });

          // Update existing version
          const { error } = await supabase
            .from('email_template_versions')
            .update({
              subject: formData[lang].subject,
              body_html: formData[lang].body_html,
              body_text: formData[lang].body_text,
            })
            .eq('id', currentVersion.id);

          if (error) {
            console.error(`Error updating ${lang} version:`, error);
            throw error;
          }
          console.log(`${lang} version updated successfully`);
        }
      }

      console.log('Save completed successfully, showing toast');
      toast.success(t('emails.editor.saved', 'Template saved successfully'));

      // Reload template
      await loadTemplate();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(t('emails.editor.save_error', 'Failed to save template'));
    } finally {
      setSaving(false);
    }
  }

  const getCategoryColor = (category: string) => {
    const customCategory = categories.find(c => c.value === category);
    if (customCategory) {
      return `${customCategory.color} ${customCategory.dark_color}`;
    }
    // Fallback
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const getCategoryLabel = (category: string) => {
    const customCategory = categories.find(c => c.value === category);
    if (customCategory) {
      return direction === 'rtl' ? customCategory.label_he || customCategory.label_en : customCategory.label_en;
    }
    return t(`emails.category.${category}`, category);
  };

  // Get translated template name
  const getTemplateName = (template: EmailTemplate) => {
    const key = template.template_key.replace('.', '_');
    return t(`email_template.${key}.name`, template.template_name);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t('common.loading', 'Loading...')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!template) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">{t('emails.editor.not_found', 'Template not found')}</p>
            <Link href="/admin/emails/templates">
              <Button variant="outline" className="mt-4">
                {t('common.back', 'Back to Templates')}
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1 }}>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/emails/templates">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('common.back', 'Back')}
                </Button>
              </Link>
              <Badge className={getCategoryColor(selectedCategory || template.template_category)}>
                {getCategoryLabel(selectedCategory || template.template_category)}
              </Badge>
            </div>
            <h1 suppressHydrationWarning style={{
              fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {getTemplateName(template)}
            </h1>
            <p suppressHydrationWarning style={{
              marginTop: '0.5rem',
              color: 'hsl(var(--muted-foreground))',
              fontSize: 'var(--font-size-sm)'
            }}>
              {template.description}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <code className="bg-muted px-2 py-1 rounded">{template.template_key}</code>
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            width: isMobile ? '100%' : 'auto',
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <Button variant="outline" onClick={() => setShowPreview(true)} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Eye className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {t('emails.action.preview', 'Preview')}
            </Button>
            <Button onClick={handleSave} disabled={saving} style={{ width: isMobile ? '100%' : 'auto' }}>
              <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {saving ? t('common.saving', 'Saving...') : t('emails.editor.save', 'Save Changes')}
            </Button>
          </div>
        </div>

        {/* Variables Info */}
        {template.variables && template.variables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('emails.editor.variables', 'Available Variables')}</CardTitle>
              <CardDescription>
                {t('emails.editor.variables_desc', 'Use these variables in your template')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div style={{
                display: 'grid',
                gap: '0.5rem',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))'
              }}>
                {template.variables.map((variable: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {`{{${variable.name}}}`}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {t(`email_variable.${variable.name}`, variable.description)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Category */}
        <Card>
          <CardHeader>
            <CardTitle suppressHydrationWarning style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('emails.editor.category', 'Template Category')}
            </CardTitle>
            <CardDescription suppressHydrationWarning style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--muted-foreground))'
            }}>
              {t('emails.editor.category_desc', 'Organize your email template by selecting a category')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Label suppressHydrationWarning style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'hsl(var(--text-primary))'
                }}>
                  {t('emails.editor.select_category', 'Category')}
                </Label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {categories.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setSelectedCategory(category.value)}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--border-radius-lg)',
                        border: `2px solid ${selectedCategory === category.value ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                        backgroundColor: selectedCategory === category.value ? 'hsl(var(--primary) / 0.05)' : 'transparent',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedCategory !== category.value) {
                          e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.5)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCategory !== category.value) {
                          e.currentTarget.style.borderColor = 'hsl(var(--border))';
                        }
                      }}
                    >
                      <Badge className={`${category.color} ${category.dark_color} w-full justify-center`} suppressHydrationWarning>
                        {direction === 'rtl' ? category.label_he || category.label_en : category.label_en}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
              {selectedCategory !== template.template_category && (
                <p suppressHydrationWarning style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--muted-foreground))',
                  marginTop: '0.5rem'
                }}>
                  {t('emails.editor.category_changed', 'Category will be updated when you save')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Language Tabs */}
        <Tabs value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as 'en' | 'he')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="en">{t('emails.editor.language.en', 'English')}</TabsTrigger>
            <TabsTrigger value="he">{t('emails.editor.language.he', 'עברית')}</TabsTrigger>
          </TabsList>

          {(['en', 'he'] as const).map((lang) => (
            <TabsContent key={lang} value={lang} className="space-y-4" dir={lang === 'he' ? 'rtl' : 'ltr'}>
              {/* Subject */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('emails.editor.subject', 'Subject')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData[lang].subject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [lang]: { ...formData[lang], subject: e.target.value },
                      })
                    }
                    placeholder={t('emails.editor.subject_placeholder', 'Enter email subject')}
                    dir={lang === 'he' ? 'rtl' : 'ltr'}
                  />
                </CardContent>
              </Card>

              {/* HTML Body */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('emails.editor.html', 'HTML Version')}</CardTitle>
                  <CardDescription>
                    {t('emails.editor.html_desc', 'Rich HTML email content')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData[lang].body_html}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [lang]: { ...formData[lang], body_html: e.target.value },
                      })
                    }
                    placeholder={t('emails.editor.html_placeholder', 'Enter HTML content')}
                    rows={15}
                    className="font-mono text-sm"
                    dir={lang === 'he' ? 'rtl' : 'ltr'}
                  />
                </CardContent>
              </Card>

              {/* Plain Text Body */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('emails.editor.text', 'Plain Text Version')}</CardTitle>
                  <CardDescription>
                    {t('emails.editor.text_desc', 'Fallback for email clients that don\'t support HTML')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData[lang].body_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [lang]: { ...formData[lang], body_text: e.target.value },
                      })
                    }
                    placeholder={t('emails.editor.text_placeholder', 'Enter plain text content')}
                    rows={10}
                    className="font-mono text-sm"
                    dir={lang === 'he' ? 'rtl' : 'ltr'}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Save Button (Bottom) */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          flexDirection: isMobile ? 'column-reverse' : 'row'
        }}>
          <Link href="/admin/emails/templates" style={{ width: isMobile ? '100%' : 'auto' }}>
            <Button variant="outline" style={{ width: '100%' }}>
              {t('emails.editor.cancel', 'Cancel')}
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} style={{ width: isMobile ? '100%' : 'auto' }}>
            <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {saving ? t('common.saving', 'Saving...') : t('emails.editor.save', 'Save Changes')}
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning style={{
              fontFamily: 'var(--font-family-heading)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('emails.editor.preview_title', 'Email Preview')} - {activeLanguage === 'en' ? 'English' : 'עברית'}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--muted-foreground))'
            }}>
              {t('emails.editor.preview_desc', 'Preview how your email will appear')}
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
            {/* Subject */}
            <div>
              <Label suppressHydrationWarning style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-primary))',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {t('emails.editor.subject', 'Subject')}
              </Label>
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--muted) / 0.3)',
                fontSize: 'var(--font-size-base)',
                color: 'hsl(var(--text-body))',
                direction: activeLanguage === 'he' ? 'rtl' : 'ltr',
                textAlign: activeLanguage === 'he' ? 'right' : 'left'
              }}>
                {formData[activeLanguage].subject || t('emails.editor.no_subject', 'No subject')}
              </div>
            </div>

            {/* HTML Preview */}
            <div>
              <Label suppressHydrationWarning style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-primary))',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {t('emails.editor.html_preview', 'HTML Preview')}
              </Label>
              <div style={{
                padding: '1.5rem',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'white',
                minHeight: '300px',
                fontSize: 'var(--font-size-base)',
                lineHeight: '1.6',
                direction: activeLanguage === 'he' ? 'rtl' : 'ltr',
                textAlign: activeLanguage === 'he' ? 'right' : 'left'
              }} dangerouslySetInnerHTML={{ __html: formData[activeLanguage].body_html }} />
            </div>

            {/* Plain Text Preview */}
            <div>
              <Label suppressHydrationWarning style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'hsl(var(--text-primary))',
                marginBottom: '0.5rem',
                display: 'block'
              }}>
                {t('emails.editor.text_preview', 'Plain Text Preview')}
              </Label>
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--muted) / 0.3)',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                color: 'hsl(var(--text-body))',
                direction: activeLanguage === 'he' ? 'rtl' : 'ltr',
                textAlign: activeLanguage === 'he' ? 'right' : 'left'
              }}>
                {formData[activeLanguage].body_text || t('emails.editor.no_text', 'No plain text version')}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
