'use client';

import { useState } from 'react';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTemplateDialog({ open, onOpenChange, onSuccess }: CreateTemplateDialogProps) {
  const { t, direction } = useAdminLanguage();
  const { tenantId } = useTenant();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    template_key: '',
    template_name: '',
    template_category: 'system',
    description: '',
    en_subject: '',
    en_body_html: '',
    en_body_text: '',
    he_subject: '',
    he_body_html: '',
    he_body_text: '',
  });

  const categories = [
    { value: 'enrollment', label: t('emails.category.enrollment', 'Enrollment') },
    { value: 'payment', label: t('emails.category.payment', 'Payment') },
    { value: 'lesson', label: t('emails.category.lesson', 'Lesson') },
    { value: 'parent', label: t('emails.category.parent', 'Parent') },
    { value: 'system', label: t('emails.category.system', 'System') },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tenantId) {
      toast({
        title: t('common.error', 'Error'),
        description: t('emails.create.no_tenant', 'Tenant not found'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      // Create template
      const { data: newTemplate, error: templateError } = await supabase
        .from('email_templates')
        .insert({
          tenant_id: tenantId,
          template_key: formData.template_key,
          template_name: formData.template_name,
          template_category: formData.template_category,
          description: formData.description,
          is_system: false,
          is_active: true,
          allow_customization: true,
          variables: [],
        })
        .select('id')
        .single();

      if (templateError) throw templateError;

      // Create English version
      const { error: enVersionError } = await supabase
        .from('email_template_versions')
        .insert({
          template_id: newTemplate.id,
          language_code: 'en',
          subject: formData.en_subject,
          body_html: formData.en_body_html,
          body_text: formData.en_body_text,
          version: 1,
          is_current: true,
        });

      if (enVersionError) throw enVersionError;

      // Create Hebrew version
      const { error: heVersionError } = await supabase
        .from('email_template_versions')
        .insert({
          template_id: newTemplate.id,
          language_code: 'he',
          subject: formData.he_subject,
          body_html: formData.he_body_html,
          body_text: formData.he_body_text,
          version: 1,
          is_current: true,
        });

      if (heVersionError) throw heVersionError;

      toast({
        title: t('common.success', 'Success'),
        description: t('emails.create.success', 'Template created successfully'),
      });

      // Reset form
      setFormData({
        template_key: '',
        template_name: '',
        template_category: 'system',
        description: '',
        en_subject: '',
        en_body_html: '',
        en_body_text: '',
        he_subject: '',
        he_body_html: '',
        he_body_text: '',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: t('common.error', 'Error'),
        description: t('emails.create.error', 'Failed to create template'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={direction}>
        <DialogHeader>
          <DialogTitle>{t('emails.create.title', 'Create Email Template')}</DialogTitle>
          <DialogDescription>
            {t('emails.create.description', 'Create a new email template with English and Hebrew versions')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_key">
                  {t('emails.create.template_key', 'Template Key')} *
                </Label>
                <Input
                  id="template_key"
                  value={formData.template_key}
                  onChange={(e) => setFormData({ ...formData, template_key: e.target.value })}
                  placeholder="e.g., custom.welcome"
                  required
                  dir={direction}
                />
                <p className="text-xs text-muted-foreground">
                  {t('emails.create.template_key_hint', 'Unique identifier (e.g., category.name)')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template_name">
                  {t('emails.create.template_name', 'Template Name')} *
                </Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder={t('emails.create.template_name_placeholder', 'Display name')}
                  required
                  dir={direction}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_category">
                {t('emails.create.category', 'Category')} *
              </Label>
              <Select
                value={formData.template_category}
                onValueChange={(value) => setFormData({ ...formData, template_category: value })}
              >
                <SelectTrigger dir={direction}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t('emails.create.description_label', 'Description')}
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('emails.create.description_placeholder', 'Describe when this template is used')}
                rows={2}
                dir={direction}
              />
            </div>
          </div>

          {/* English Version */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">{t('emails.editor.language.en', 'English')}</h3>

            <div className="space-y-2">
              <Label htmlFor="en_subject">
                {t('emails.editor.subject', 'Subject')} *
              </Label>
              <Input
                id="en_subject"
                value={formData.en_subject}
                onChange={(e) => setFormData({ ...formData, en_subject: e.target.value })}
                placeholder={t('emails.editor.subject_placeholder', 'Enter email subject')}
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="en_body_html">
                {t('emails.editor.html', 'HTML Version')} *
              </Label>
              <Textarea
                id="en_body_html"
                value={formData.en_body_html}
                onChange={(e) => setFormData({ ...formData, en_body_html: e.target.value })}
                placeholder={t('emails.editor.html_placeholder', 'Enter HTML content')}
                rows={10}
                className="font-mono text-sm"
                required
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="en_body_text">
                {t('emails.editor.text', 'Plain Text Version')}
              </Label>
              <Textarea
                id="en_body_text"
                value={formData.en_body_text}
                onChange={(e) => setFormData({ ...formData, en_body_text: e.target.value })}
                placeholder={t('emails.editor.text_placeholder', 'Enter plain text content')}
                rows={6}
                className="font-mono text-sm"
                dir="ltr"
              />
            </div>
          </div>

          {/* Hebrew Version */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">{t('emails.editor.language.he', 'עברית')}</h3>

            <div className="space-y-2">
              <Label htmlFor="he_subject">
                {t('emails.editor.subject', 'Subject')} *
              </Label>
              <Input
                id="he_subject"
                value={formData.he_subject}
                onChange={(e) => setFormData({ ...formData, he_subject: e.target.value })}
                placeholder={t('emails.editor.subject_placeholder', 'Enter email subject')}
                required
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="he_body_html">
                {t('emails.editor.html', 'HTML Version')} *
              </Label>
              <Textarea
                id="he_body_html"
                value={formData.he_body_html}
                onChange={(e) => setFormData({ ...formData, he_body_html: e.target.value })}
                placeholder={t('emails.editor.html_placeholder', 'Enter HTML content')}
                rows={10}
                className="font-mono text-sm"
                required
                dir="rtl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="he_body_text">
                {t('emails.editor.text', 'Plain Text Version')}
              </Label>
              <Textarea
                id="he_body_text"
                value={formData.he_body_text}
                onChange={(e) => setFormData({ ...formData, he_body_text: e.target.value })}
                placeholder={t('emails.editor.text_placeholder', 'Enter plain text content')}
                rows={6}
                className="font-mono text-sm"
                dir="rtl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className={`h-4 w-4 animate-spin ${isRtl ? 'ml-2' : 'mr-2'}`} />}
              {loading ? t('common.creating', 'Creating...') : t('emails.create.button', 'Create Template')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
