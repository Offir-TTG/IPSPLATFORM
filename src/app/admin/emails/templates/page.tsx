'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, FileText, Eye, Edit, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { CreateTemplateDialog } from '@/components/email/CreateTemplateDialog';

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_category: string;
  description: string;
  is_system: boolean;
  is_active: boolean;
  variables: any[];
  created_at: string;
}

interface EmailTemplateVersion {
  id: string;
  template_id: string;
  language_code: string;
  subject: string;
  body_html: string;
  body_text: string;
}

interface CategoryConfig {
  value: string;
  label_en: string;
  label_he: string;
  color: string;
  dark_color: string;
}

export default function EmailTemplatesPage() {
  const { t, direction } = useAdminLanguage();
  const { tenantId } = useTenant();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth <= 640;
  const isRtl = direction === 'rtl';

  // Debug log state changes
  console.log('🔄 [Component] Render - templates.length:', templates.length, 'loading:', loading);

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [previewVersions, setPreviewVersions] = useState<{ en?: EmailTemplateVersion; he?: EmailTemplateVersion }>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activePreviewLanguage, setActivePreviewLanguage] = useState<'en' | 'he'>('en');

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [tenantId]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  async function loadTemplates() {
    if (!tenantId) {
      console.log('🔍 [Templates] No tenantId, skipping load');
      return;
    }

    console.log('🔍 [Templates] Loading templates for tenant:', tenantId);

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('template_category', { ascending: true })
        .order('template_name', { ascending: true });

      if (error) {
        console.error('❌ [Templates] Error loading templates:', error);
        return;
      }

      console.log('✅ [Templates] Loaded templates:', data?.length || 0);
      console.log('📋 [Templates] Template keys:', data?.map(t => t.template_key));

      // Check specifically for password reset
      const hasPasswordReset = data?.some(t => t.template_key === 'system.password_reset');
      console.log('🔑 [Templates] Has password_reset template:', hasPasswordReset);

      setTemplates(data || []);
      console.log('✅ [Templates] State updated with', data?.length || 0, 'templates');
    } catch (error) {
      console.error('❌ [Templates] Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    if (!tenantId) return;

    try {
      const { data } = await supabase
        .from('tenant_settings')
        .select('settings')
        .eq('tenant_id', tenantId)
        .eq('setting_key', 'email_categories')
        .single();

      if (data?.settings?.categories) {
        setCategories(data.settings.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function handlePreview(template: EmailTemplate) {
    setPreviewTemplate(template);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setActivePreviewLanguage(direction === 'rtl' ? 'he' : 'en');

    try {
      // Load template versions
      const { data: versions, error } = await supabase
        .from('email_template_versions')
        .select('*')
        .eq('template_id', template.id)
        .eq('is_current', true);

      if (error) {
        console.error('Error loading template versions:', error);
        return;
      }

      const versionsMap: { en?: EmailTemplateVersion; he?: EmailTemplateVersion } = {};
      versions?.forEach((version) => {
        if (version.language_code === 'en') {
          versionsMap.en = version;
        } else if (version.language_code === 'he') {
          versionsMap.he = version;
        }
      });

      setPreviewVersions(versionsMap);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  }

  const getCategoryColor = (category: string) => {
    // Try to find custom category config
    const customCategory = categories.find(c => c.value === category);
    if (customCategory) {
      return `${customCategory.color} ${customCategory.dark_color}`;
    }

    // Fallback to default colors
    switch (category) {
      case 'enrollment':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'payment':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'lesson':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'parent':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      case 'system':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCategoryLabel = (category: string) => {
    // Try to find custom category config
    const customCategory = categories.find(c => c.value === category);
    if (customCategory) {
      return direction === 'rtl' ? customCategory.label_he || customCategory.label_en : customCategory.label_en;
    }

    // Fallback to translation keys
    return t(`emails.category.${category}`, category);
  };

  // Get translated template name
  const getTemplateName = (template: EmailTemplate) => {
    const key = template.template_key.replace('.', '_');
    return t(`email_template.${key}.name`, template.template_name);
  };

  // Get translated template description
  const getTemplateDescription = (template: EmailTemplate) => {
    const key = template.template_key.replace('.', '_');
    return t(`email_template.${key}.description`, template.description);
  };

  if (loading) {
    console.log('⏳ [Component] Showing loading state');
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">{t('common.loading', 'Loading templates...')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  console.log('✅ [Component] Rendering main content, templates:', templates.length);

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
          <div>
            <h1 suppressHydrationWarning style={{
              fontSize: isMobile ? 'var(--font-size-2xl)' : 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }}>
              {t('emails.templates.title', 'Email Templates')}
            </h1>
            <p suppressHydrationWarning style={{
              marginTop: '0.5rem',
              color: 'hsl(var(--muted-foreground))'
            }}>
              {templates.length === 0
                ? t('emails.getting_started.seed_desc', 'Seed the database with system templates to get started')
                : t('emails.templates.description', `Manage ${templates.length} email templates`)}
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <FileText className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            {t('emails.templates.create', 'Create Template')}
          </Button>
        </div>

        {/* No Templates Message */}
        {templates.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t('emails.getting_started.seed', 'Get Started')}
              </CardTitle>
              <CardDescription>
                {t('emails.getting_started.seed_desc', 'Seed the database with system templates to get started')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg" dir="ltr">
                <p className="font-mono text-sm mb-2">npx tsx scripts/seed-email-templates.ts</p>
                <p className="text-sm text-muted-foreground" dir={direction}>
                  {t('emails.getting_started.seed_info', 'This will create 4 system templates: Enrollment Confirmation, Payment Receipt, Lesson Reminder, and Parent Progress Report')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {templates.length > 0 && (
          <div style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
          }}>
            {(() => {
              console.log('🎨 [Render] Rendering', templates.length, 'templates');
              console.log('🎨 [Render] Template keys:', templates.map(t => t.template_key));
              return null;
            })()}
            {templates.map((template) => {
              console.log('🎴 [Card] Rendering card for:', template.template_key, 'Name:', getTemplateName(template));
              return (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    {template.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <CardTitle className="text-lg">
                    {getTemplateName(template)}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {getTemplateDescription(template)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(template.template_category)}>
                      {getCategoryLabel(template.template_category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.variables?.length || 0} {t('emails.card.variables_count', 'variables')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePreview(template)}>
                      <Eye className={`h-4 w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                      {t('emails.action.preview', 'Preview')}
                    </Button>
                    <Link href={`/admin/emails/templates/${template.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className={`h-4 w-4 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                        {t('emails.templates.edit', 'Edit')}
                      </Button>
                    </Link>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <code className="bg-muted px-1 py-0.5 rounded">
                        {template.template_key}
                      </code>
                    </p>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}

        {/* System Templates Info */}
        {templates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t('emails.templates.title', 'System Templates')}
              </CardTitle>
              <CardDescription>
                {t('emails.templates.description', 'Pre-built templates for common platform events')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('enrollment')}>
                    {getCategoryLabel('enrollment')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">enrollment.confirmation</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.enrollment_confirmation.description', 'Sent when a user successfully enrolls in a course or program')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('enrollment')}>
                    {getCategoryLabel('enrollment')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">enrollment.invitation</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.enrollment_invitation.description', 'Sent when admin invites a user to enroll via enrollment link')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('enrollment')}>
                    {getCategoryLabel('enrollment')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">enrollment.reminder</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.enrollment_reminder.description', 'Sent to remind users about pending enrollment or incomplete registration')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('payment')}>
                    {getCategoryLabel('payment')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">payment.receipt</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.payment_receipt.description', 'Sent when a payment is successfully processed')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('lesson')}>
                    {getCategoryLabel('lesson')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">lesson.reminder</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.lesson_reminder.description', 'Sent before a scheduled lesson starts')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('parent')}>
                    {getCategoryLabel('parent')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">parent.progress_report</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.parent_progress_report.description', 'Sent to parents with student progress updates')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('system')}>
                    {getCategoryLabel('system')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">system.user_invitation</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.system_user_invitation.description', 'Sent when admin invites a new user to the platform')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Badge className={getCategoryColor('system')}>
                    {getCategoryLabel('system')}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">system.password_reset</p>
                    <p className="text-xs text-muted-foreground">
                      {t('email_template.system_password_reset.description', 'Sent when admin triggers password reset for a user')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="flex justify-center">
          <Link href="/admin/emails">
            <Button variant="outline">
              {t('common.back', 'Back to Email Dashboard')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Create Template Dialog */}
      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTemplates}
      />

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle suppressHydrationWarning>
              {t('emails.editor.preview_title', 'Email Preview')}
            </DialogTitle>
            <DialogDescription suppressHydrationWarning>
              {previewTemplate && getTemplateName(previewTemplate)}
            </DialogDescription>
          </DialogHeader>

          {previewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Mail className="h-8 w-8 text-muted-foreground animate-pulse" />
            </div>
          ) : (
            <Tabs value={activePreviewLanguage} onValueChange={(val) => setActivePreviewLanguage(val as 'en' | 'he')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="he">עברית</TabsTrigger>
              </TabsList>

              <TabsContent value="en" className="space-y-4" dir="ltr">
                {previewVersions.en ? (
                  <>
                    {/* Subject */}
                    <div>
                      <h3 suppressHydrationWarning style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))',
                        marginBottom: '0.5rem'
                      }}>
                        {t('emails.editor.subject', 'Subject')}
                      </h3>
                      <div style={{
                        padding: '0.75rem',
                        background: 'hsl(var(--muted))',
                        borderRadius: 'var(--border-radius-md)',
                        direction: 'ltr',
                        textAlign: 'left'
                      }}>
                        {previewVersions.en.subject || t('emails.editor.no_subject', 'No subject')}
                      </div>
                    </div>

                    {/* HTML Preview */}
                    <div>
                      <h3 suppressHydrationWarning style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))',
                        marginBottom: '0.5rem'
                      }}>
                        {t('emails.editor.html_preview', 'HTML Preview')}
                      </h3>
                      <div style={{
                        padding: '1rem',
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--border-radius-md)',
                        minHeight: '200px',
                        direction: 'ltr',
                        textAlign: 'left'
                      }} dangerouslySetInnerHTML={{ __html: previewVersions.en.body_html }} />
                    </div>

                    {/* Plain Text Preview */}
                    {previewVersions.en.body_text && (
                      <div>
                        <h3 suppressHydrationWarning style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'hsl(var(--text-heading))',
                          marginBottom: '0.5rem'
                        }}>
                          {t('emails.editor.text_preview', 'Plain Text Preview')}
                        </h3>
                        <pre style={{
                          padding: '1rem',
                          background: 'hsl(var(--muted))',
                          borderRadius: 'var(--border-radius-md)',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          direction: 'ltr',
                          textAlign: 'left'
                        }}>
                          {previewVersions.en.body_text}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('emails.editor.no_version', 'No English version available')}
                  </p>
                )}
              </TabsContent>

              <TabsContent value="he" className="space-y-4" dir="rtl">
                {previewVersions.he ? (
                  <>
                    {/* Subject */}
                    <div>
                      <h3 suppressHydrationWarning style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))',
                        marginBottom: '0.5rem'
                      }}>
                        {t('emails.editor.subject', 'נושא')}
                      </h3>
                      <div style={{
                        padding: '0.75rem',
                        background: 'hsl(var(--muted))',
                        borderRadius: 'var(--border-radius-md)',
                        direction: 'rtl',
                        textAlign: 'right'
                      }}>
                        {previewVersions.he.subject || t('emails.editor.no_subject', 'אין נושא')}
                      </div>
                    </div>

                    {/* HTML Preview */}
                    <div>
                      <h3 suppressHydrationWarning style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-heading))',
                        marginBottom: '0.5rem'
                      }}>
                        {t('emails.editor.html_preview', 'תצוגה מקדימה HTML')}
                      </h3>
                      <div style={{
                        padding: '1rem',
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--border-radius-md)',
                        minHeight: '200px',
                        direction: 'rtl',
                        textAlign: 'right'
                      }} dangerouslySetInnerHTML={{ __html: previewVersions.he.body_html }} />
                    </div>

                    {/* Plain Text Preview */}
                    {previewVersions.he.body_text && (
                      <div>
                        <h3 suppressHydrationWarning style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'hsl(var(--text-heading))',
                          marginBottom: '0.5rem'
                        }}>
                          {t('emails.editor.text_preview', 'תצוגה מקדימה טקסט רגיל')}
                        </h3>
                        <pre style={{
                          padding: '1rem',
                          background: 'hsl(var(--muted))',
                          borderRadius: 'var(--border-radius-md)',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          direction: 'rtl',
                          textAlign: 'right'
                        }}>
                          {previewVersions.he.body_text}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('emails.editor.no_version', 'אין גרסה עברית זמינה')}
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
