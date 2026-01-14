'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_category: string;
  description: string;
}

interface EmailTemplateSelectorProps {
  invitationTemplateKey?: string;
  confirmationTemplateKey?: string;
  reminderTemplateKey?: string;
  onInvitationTemplateChange: (key: string | undefined) => void;
  onConfirmationTemplateChange: (key: string | undefined) => void;
  onReminderTemplateChange: (key: string | undefined) => void;
  t: (key: string, fallback: string) => string;
  direction?: 'ltr' | 'rtl';
}

export function EmailTemplateSelector({
  invitationTemplateKey,
  confirmationTemplateKey,
  reminderTemplateKey,
  onInvitationTemplateChange,
  onConfirmationTemplateChange,
  onReminderTemplateChange,
  t,
  direction = 'ltr',
}: EmailTemplateSelectorProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const isRtl = direction === 'rtl';

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      // Get current user's tenant_id from users table
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      // Query users table to get tenant_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }

      const tenantId = userData?.tenant_id;
      console.log('Current tenant ID:', tenantId);

      let query = supabase
        .from('email_templates')
        .select('id, template_key, template_name, template_category, description, tenant_id')
        .eq('template_category', 'enrollment')
        .eq('is_active', true);

      // Filter by tenant_id: prefer tenant-specific, fallback to any if none found
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      let { data, error } = await query.order('template_name');

      if (error) {
        console.error('Error loading email templates:', error);
        return;
      }

      console.log('Loaded email templates for tenant:', data);

      // If no templates found for this tenant, try to load global templates (tenant_id IS NULL)
      if (!data || data.length === 0) {
        console.log('No tenant-specific templates found, trying global templates...');
        const { data: globalData, error: globalError } = await supabase
          .from('email_templates')
          .select('id, template_key, template_name, template_category, description, tenant_id')
          .eq('template_category', 'enrollment')
          .eq('is_active', true)
          .is('tenant_id', null)
          .order('template_name');

        if (globalError) {
          console.error('Error loading global templates:', globalError);
          return;
        }

        data = globalData;
        console.log('Loaded global templates:', data);
      }

      // Remove duplicates by template_key (shouldn't be needed now but keeping for safety)
      const uniqueTemplates = data?.reduce((acc, template) => {
        const existing = acc.find(t => t.template_key === template.template_key);
        if (!existing) {
          acc.push(template);
        }
        return acc;
      }, [] as EmailTemplate[]) || [];

      console.log('Final templates:', uniqueTemplates);
      setTemplates(uniqueTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to get translated template name
  function getTemplateName(template: EmailTemplate): string {
    // Convert template_key dots to underscores for translation key
    // e.g., "enrollment.invitation" -> "email_template.enrollment_invitation.name"
    const translationKey = `email_template.${template.template_key.replace('.', '_')}.name`;
    return t(translationKey, template.template_name);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle suppressHydrationWarning>
              {t('products.email_templates.section_title', 'Email Templates')}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <CardTitle suppressHydrationWarning>
            {t('products.email_templates.section_title', 'Email Templates')}
          </CardTitle>
        </div>
        <CardDescription suppressHydrationWarning>
          {t('products.email_templates.section_description', 'Customize which email templates to use for this product')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enrollment Invitation Template */}
        <div className="space-y-2">
          <Label htmlFor="invitation-template" suppressHydrationWarning>
            {t('products.email_templates.invitation_label', 'Enrollment Invitation Template')}
          </Label>
          <Select
            value={invitationTemplateKey || 'default'}
            onValueChange={(value) => onInvitationTemplateChange(value === 'default' ? undefined : value)}
          >
            <SelectTrigger id="invitation-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
              <SelectItem value="default">
                <span suppressHydrationWarning>
                  {t('products.email_templates.use_default', 'Use Default Template')}
                </span>
              </SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.template_key} value={template.template_key}>
                  <span>{getTemplateName(template)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('products.email_templates.invitation_help', 'Template used when admin sends enrollment link to a user')}
          </p>
        </div>

        {/* Enrollment Confirmation Template */}
        <div className="space-y-2">
          <Label htmlFor="confirmation-template" suppressHydrationWarning>
            {t('products.email_templates.confirmation_label', 'Enrollment Confirmation Template')}
          </Label>
          <Select
            value={confirmationTemplateKey || 'default'}
            onValueChange={(value) => onConfirmationTemplateChange(value === 'default' ? undefined : value)}
          >
            <SelectTrigger id="confirmation-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
              <SelectItem value="default">
                <span suppressHydrationWarning>
                  {t('products.email_templates.use_default', 'Use Default Template')}
                </span>
              </SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.template_key} value={template.template_key}>
                  <span>{getTemplateName(template)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('products.email_templates.confirmation_help', 'Template sent when user completes enrollment')}
          </p>
        </div>

        {/* Enrollment Reminder Template */}
        <div className="space-y-2">
          <Label htmlFor="reminder-template" suppressHydrationWarning>
            {t('products.email_templates.reminder_label', 'Enrollment Reminder Template')}
          </Label>
          <Select
            value={reminderTemplateKey || 'default'}
            onValueChange={(value) => onReminderTemplateChange(value === 'default' ? undefined : value)}
          >
            <SelectTrigger id="reminder-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent dir={direction} className={isRtl ? 'text-right' : 'text-left'}>
              <SelectItem value="default">
                <span suppressHydrationWarning>
                  {t('products.email_templates.use_default', 'Use Default Template')}
                </span>
              </SelectItem>
              {templates.map((template) => (
                <SelectItem key={template.template_key} value={template.template_key}>
                  <span>{getTemplateName(template)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground" suppressHydrationWarning>
            {t('products.email_templates.reminder_help', 'Template for reminders about incomplete enrollments')}
          </p>
        </div>

        {/* Help Text */}
        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground">
          <p suppressHydrationWarning>
            💡 {t('products.email_templates.help_note', 'Leave as "Use Default Template" to use the standard enrollment email template. Create custom templates in')} {' '}
            <a href="/admin/emails/templates" className="underline hover:text-foreground" suppressHydrationWarning>
              {t('products.email_templates.template_management', 'Email Template Management')}
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
