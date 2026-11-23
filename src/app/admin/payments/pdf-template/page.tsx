'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Eye, FileBarChart, FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminLanguage } from '@/context/AppContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageTitle, SaveBar, kitButton, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { StepWizard, WizardField, useStepWizard } from '@/components/admin/wizard/StepWizard';
import type { PDFBrandingConfig } from '@/app/api/admin/payments/pdf-template/route';

const STEPS = ['organization', 'branding', 'footer'] as const;
type Step = (typeof STEPS)[number];

const EMPTY: PDFBrandingConfig = {
  organization: { name: '', email: '', phone: '', address: '', website: '', tax_id: '' },
  branding: { logo_url: '', primary_color: '#3B82F6', show_logo: true, show_organization_name: true },
  footer: { show_contact_info: true, custom_footer_text: '', show_page_numbers: true },
};

// Fields may be missing in older saved settings: empty counts as fine (except the colour).
const isEmail = (v?: string) => !v?.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isUrl = (v?: string) => !v?.trim() || /^https?:\/\/\S+\.\S+/.test(v.trim());
const isColor = (v?: string) => !!v && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v.trim());
const isLogo = (v?: string) => !v?.trim() || v.startsWith('data:image/') || /^https?:\/\/\S+/.test(v.trim());

function ToggleRow({ id, title, text, checked, onChange }: { id: string; title: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{title}</span>
        <span className="block text-[13px] text-muted-foreground">{text}</span>
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * The receipt and payment-schedule PDF settings, step by step like the other
 * admin editors: organization details, branding, footer. Every field of the
 * old tabbed form is kept; Continue stops on a wrong email, website or colour
 * with the reason in red. Saving is in the floating Save/Discard bar; Preview
 * PDF stays at the top.
 */
export default function PDFTemplatePage() {
  const { t, direction } = useAdminLanguage();
  const words = saveBarText(t);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<'invoice' | 'schedule' | 'both'>('invoice');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'he'>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<PDFBrandingConfig>(EMPTY);
  const [saved, setSaved] = useState<PDFBrandingConfig>(EMPTY);

  const check = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 'organization') {
      if (!isEmail(config.organization.email)) e.email = t('admin.pdf.err.email', 'Write a full email address, like name@example.com.');
      if (!isUrl(config.organization.website)) e.website = t('admin.pdf.err.website', 'Write a full address starting with https://');
    }
    if (s === 'branding') {
      if (!isColor(config.branding.primary_color)) e.primary_color = t('admin.pdf.err.color', 'Choose a colour, or write it like #3B82F6.');
      if (!isLogo(config.branding.logo_url)) e.logo_url = t('admin.pdf.err.logo', 'Upload a logo, or write an address starting with https://');
    }
    return e;
  };
  const w = useStepWizard(STEPS, check);
  const errors = w.errors;

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/admin/payments/pdf-template');
        const data = await response.json();
        if (data.success && data.config) {
          setConfig(data.config);
          setSaved(data.config);
        } else {
          toast.error(t('admin.pdf.loadError', 'Failed to load configuration'));
        }
      } catch (error) {
        console.error('Error loading config:', error);
        toast.error(t('admin.pdf.loadError', 'Failed to load configuration'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(saved), [config, saved]);
  const guard = useLeaveGuard(dirty, words.leave);

  const updateOrganization = (field: keyof PDFBrandingConfig['organization'], value: string) => {
    setConfig((prev) => ({ ...prev, organization: { ...prev.organization, [field]: value } }));
    w.clearError(field);
  };
  const updateBranding = (field: keyof PDFBrandingConfig['branding'], value: any) => {
    setConfig((prev) => ({ ...prev, branding: { ...prev.branding, [field]: value } }));
    w.clearError(field);
  };
  const updateFooter = (field: keyof PDFBrandingConfig['footer'], value: any) => {
    setConfig((prev) => ({ ...prev, footer: { ...prev.footer, [field]: value } }));
  };

  const handleSave = async () => {
    if (!w.checkAll()) return;
    try {
      setSaving(true);
      const response = await fetch('/api/admin/payments/pdf-template', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await response.json();
      if (data.success) {
        setSaved(config);
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

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      w.setErrors((x) => ({ ...x, logo_url: t('admin.pdf.branding.invalidFileType', 'Please upload a PNG, JPG, or SVG file') }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      w.setErrors((x) => ({ ...x, logo_url: t('admin.pdf.branding.fileTooLarge', 'File size must be less than 2MB') }));
      return;
    }
    // Kept in the settings as a data URL, as before.
    const reader = new FileReader();
    reader.onload = (e) => {
      updateBranding('logo_url', e.target?.result as string);
      toast.success(t('admin.pdf.branding.logoUploaded', 'Logo uploaded successfully'));
    };
    reader.onerror = () => toast.error(t('admin.pdf.branding.uploadError', 'Failed to upload logo'));
    reader.readAsDataURL(file);
  };

  const handlePreview = async () => {
    try {
      setPreviewing(true);
      setShowPreviewDialog(false);
      const response = await fetch('/api/admin/payments/pdf-template/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branding: config, documentType: selectedDocType, language: selectedLanguage }),
      });
      if (!response.ok) throw new Error('Failed to generate preview');
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

  const labels: Record<Step, string> = {
    organization: t('admin.pdf.tabs.organization', 'Organization Info'),
    branding: t('admin.pdf.tabs.branding', 'Branding'),
    footer: t('admin.pdf.tabs.footer', 'Footer'),
  };
  const leads: Record<Step, string> = {
    organization: t('admin.pdf.lead.organization', 'Who the receipt is from: the details printed at the top.'),
    branding: t('admin.pdf.lead.branding', 'Your logo and colour on every PDF.'),
    footer: t('admin.pdf.lead.footer', 'What appears at the bottom of each page.'),
  };
  const errBorder = (k: string) => (errors[k] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : '');

  const docTypes = [
    { value: 'invoice' as const, icon: FileBarChart, label: t('admin.pdf.dialog.invoice', 'Invoice') },
    { value: 'schedule' as const, icon: Calendar, label: t('admin.pdf.dialog.schedule', 'Payment Schedule') },
    { value: 'both' as const, icon: FileText, label: t('admin.pdf.dialog.both', 'Both Documents') },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-4 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={FileText}
          title={t('admin.pdf.title', 'PDF Template Configuration')}
          description={t('admin.pdf.description', 'Customize the branding and information that appears on enrollment payment receipts')}
          actions={
            <button type="button" onClick={() => setShowPreviewDialog(true)} disabled={previewing || loading} className={kitButton.secondary}>
              {previewing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {previewing ? t('admin.pdf.previewing', 'Generating...') : t('admin.pdf.preview', 'Preview PDF')}
            </button>
          }
        />

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden />
          </div>
        ) : (
          <StepWizard steps={STEPS} step={w.step} labels={labels} onGo={w.go} blocked={w.blocked} title={labels[w.step]} lead={leads[w.step]}>
            {w.step === 'organization' && (
              <>
                <WizardField label={t('admin.pdf.org.name', 'Organization Name')} hint={t('admin.pdf.org.nameHint', 'This name will appear in the PDF header')} htmlFor="org-name">
                  <Input
                    id="org-name"
                    value={config.organization.name}
                    onChange={(e) => updateOrganization('name', e.target.value)}
                    placeholder={t('admin.pdf.org.namePlaceholder', 'Your Organization Name')}
                    className="h-11"
                  />
                </WizardField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <WizardField label={t('admin.pdf.org.email', 'Contact Email')} error={errors.email} htmlFor="org-email">
                    <Input
                      id="org-email"
                      type="email"
                      dir="ltr"
                      value={config.organization.email}
                      onChange={(e) => updateOrganization('email', e.target.value)}
                      placeholder="contact@example.com"
                      className={`h-11 ${errBorder('email')}`}
                    />
                  </WizardField>
                  <WizardField label={t('admin.pdf.org.phone', 'Contact Phone')} htmlFor="org-phone">
                    <Input
                      id="org-phone"
                      type="tel"
                      dir="ltr"
                      value={config.organization.phone}
                      onChange={(e) => updateOrganization('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="h-11"
                    />
                  </WizardField>
                </div>
                <WizardField label={t('admin.pdf.org.address', 'Address')} htmlFor="org-address">
                  <Textarea
                    id="org-address"
                    value={config.organization.address}
                    onChange={(e) => updateOrganization('address', e.target.value)}
                    placeholder={'123 Main Street\nCity, State ZIP'}
                    rows={3}
                  />
                </WizardField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <WizardField label={t('admin.pdf.org.website', 'Website')} error={errors.website} htmlFor="org-website">
                    <Input
                      id="org-website"
                      type="url"
                      dir="ltr"
                      value={config.organization.website}
                      onChange={(e) => updateOrganization('website', e.target.value)}
                      placeholder="https://www.example.com"
                      className={`h-11 ${errBorder('website')}`}
                    />
                  </WizardField>
                  <WizardField label={t('admin.pdf.org.taxId', 'Tax ID / Business Registration')} htmlFor="org-tax-id">
                    <Input
                      id="org-tax-id"
                      dir="ltr"
                      value={config.organization.tax_id}
                      onChange={(e) => updateOrganization('tax_id', e.target.value)}
                      placeholder="12-3456789"
                      className="h-11"
                    />
                  </WizardField>
                </div>
              </>
            )}

            {w.step === 'branding' && (
              <>
                <WizardField label={t('admin.pdf.branding.logo', 'Organization Logo')} error={errors.logo_url} hint={t('admin.pdf.branding.uploadHint', 'Upload your organization logo (PNG, JPG, or SVG)')}>
                  <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml" onChange={handleLogoUpload} className="hidden" />
                  {config.branding.logo_url ? (
                    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-3">
                      <span className="grid h-20 w-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2 ring-1 ring-border">
                        <img src={config.branding.logo_url} alt="" className="max-h-full max-w-full object-contain" />
                      </span>
                      <div className="flex flex-wrap items-center gap-x-4">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="min-h-[44px] text-sm font-semibold text-primary hover:underline">
                          {t('admin.pdf.branding.replaceLogo', 'Replace logo')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            updateBranding('logo_url', '');
                            toast.success(t('admin.pdf.branding.logoRemoved', 'Logo removed'));
                          }}
                          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-red-600 hover:underline"
                        >
                          <X className="h-4 w-4" aria-hidden />
                          {t('admin.pdf.branding.removeLogo', 'Remove')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/[0.03] px-4 py-7 text-center hover:border-primary/60 hover:bg-primary/[0.06]"
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary" aria-hidden>
                        <Upload className="h-6 w-6" />
                      </span>
                      <span className="font-semibold">{t('admin.pdf.branding.uploadLogo', 'Upload Logo')}</span>
                      <span className="text-[13px] text-muted-foreground">PNG, JPG, SVG · 2MB</span>
                    </button>
                  )}
                </WizardField>

                <WizardField label={t('admin.pdf.branding.orEnterUrl', 'Or enter logo URL:')} htmlFor="logo-url">
                  <Input
                    id="logo-url"
                    dir="ltr"
                    value={(config.branding.logo_url ?? '').startsWith('data:') ? '' : config.branding.logo_url ?? ''}
                    onChange={(e) => updateBranding('logo_url', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`h-11 ${errBorder('logo_url')}`}
                  />
                </WizardField>

                <WizardField label={t('admin.pdf.branding.primaryColor', 'Primary Color')} error={errors.primary_color} hint={t('admin.pdf.branding.colorHint', 'This color will be used for headers, borders, and accents in the PDF')} htmlFor="primary-color">
                  <div className="flex gap-2">
                    <input
                      id="primary-color"
                      type="color"
                      value={isColor(config.branding.primary_color) ? config.branding.primary_color : '#3B82F6'}
                      onChange={(e) => updateBranding('primary_color', e.target.value)}
                      className="h-11 w-16 cursor-pointer rounded-lg border border-border bg-card p-1"
                    />
                    <Input
                      dir="ltr"
                      value={config.branding.primary_color}
                      onChange={(e) => updateBranding('primary_color', e.target.value)}
                      placeholder="#3B82F6"
                      className={`h-11 flex-1 ${errBorder('primary_color')}`}
                    />
                  </div>
                </WizardField>

                <div className="grid gap-3">
                  <ToggleRow
                    id="show-logo"
                    title={t('admin.pdf.branding.showLogo', 'Show Logo')}
                    text={t('admin.pdf.branding.showLogoDesc', 'Display the logo in the PDF header')}
                    checked={config.branding.show_logo}
                    onChange={(v) => updateBranding('show_logo', v)}
                  />
                  <ToggleRow
                    id="show-org-name"
                    title={t('admin.pdf.branding.showOrgName', 'Show Organization Name')}
                    text={t('admin.pdf.branding.showOrgNameDesc', 'Display the organization name in the PDF header')}
                    checked={config.branding.show_organization_name}
                    onChange={(v) => updateBranding('show_organization_name', v)}
                  />
                </div>

                {/* How the top of the PDF will look */}
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="h-1.5" style={{ background: isColor(config.branding.primary_color) ? config.branding.primary_color : '#3B82F6' }} aria-hidden />
                  <div className="flex items-center gap-3 bg-white p-4 text-slate-800">
                    {config.branding.show_logo &&
                      (config.branding.logo_url ? (
                        <img src={config.branding.logo_url} alt="" className="h-10 max-w-[120px] object-contain" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-400" aria-hidden>
                          <ImageIcon className="h-5 w-5" />
                        </span>
                      ))}
                    {config.branding.show_organization_name && (
                      <b className="text-lg" style={{ color: isColor(config.branding.primary_color) ? config.branding.primary_color : undefined }}>
                        {config.organization.name || t('admin.pdf.org.namePlaceholder', 'Your Organization Name')}
                      </b>
                    )}
                  </div>
                </div>
              </>
            )}

            {w.step === 'footer' && (
              <>
                <div className="grid gap-3">
                  <ToggleRow
                    id="show-contact"
                    title={t('admin.pdf.footer.showContact', 'Show Contact Information')}
                    text={t('admin.pdf.footer.showContactDesc', 'Display contact info (email, phone, address) in the footer')}
                    checked={config.footer.show_contact_info}
                    onChange={(v) => updateFooter('show_contact_info', v)}
                  />
                  <ToggleRow
                    id="show-page-numbers"
                    title={t('admin.pdf.footer.showPageNumbers', 'Show Page Numbers')}
                    text={t('admin.pdf.footer.showPageNumbersDesc', 'Display "Page X of Y" in the footer')}
                    checked={config.footer.show_page_numbers}
                    onChange={(v) => updateFooter('show_page_numbers', v)}
                  />
                </div>
                <WizardField label={t('admin.pdf.footer.customText', 'Custom Footer Text (Optional)')} hint={t('admin.pdf.footer.customTextHint', 'This text will appear at the bottom of each page')} htmlFor="custom-footer">
                  <Textarea
                    id="custom-footer"
                    value={config.footer.custom_footer_text}
                    onChange={(e) => updateFooter('custom_footer_text', e.target.value)}
                    placeholder={t('admin.pdf.footer.customTextPlaceholder', 'Enter any additional text you want to appear in the footer')}
                    rows={3}
                  />
                </WizardField>
              </>
            )}
          </StepWizard>
        )}

        <div className="h-20" aria-hidden />
        {!loading && (
          <SaveBar
            isNew={false}
            dirty={dirty}
            saving={saving}
            onSave={() => void handleSave()}
            onDiscard={() => {
              setConfig(saved);
              w.reset();
            }}
            saveLabel={t('admin.pdf.save', 'Save Changes')}
            text={words.bar}
          />
        )}
        {guard.dialog}
      </div>

      {/* Preview: which document and which language */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="sm:max-w-lg" dir={direction}>
          <DialogHeader>
            <DialogTitle className="[font-family:inherit]">{t('admin.pdf.dialog.title', 'Select Document Type')}</DialogTitle>
            <DialogDescription>{t('admin.pdf.dialog.description', 'Choose which document you would like to preview')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5">
            <div className="grid gap-1.5 text-sm">
              <span className="font-semibold">{t('admin.pdf.dialog.documentType', 'Document Type')}</span>
              <div role="radiogroup" className="grid grid-cols-3 gap-2">
                {docTypes.map(({ value, icon: Icon, label }) => {
                  const on = selectedDocType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSelectedDocType(value)}
                      className={`flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-[13px] font-semibold ${
                        on ? 'border-2 border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-lg ${on ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`} aria-hidden>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-1.5 text-sm">
              <span className="font-semibold">{t('admin.pdf.dialog.language', 'Language')}</span>
              <div role="radiogroup" className="grid grid-cols-2 gap-2">
                {(['en', 'he'] as const).map((lang) => {
                  const on = selectedLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`min-h-[44px] rounded-xl border font-semibold ${on ? 'border-2 border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/50'}`}
                    >
                      {lang === 'en' ? t('admin.pdf.dialog.english', 'English') : t('admin.pdf.dialog.hebrew', 'Hebrew')}
                    </button>
                  );
                })}
              </div>
            </div>
            <button type="button" onClick={() => void handlePreview()} disabled={previewing} className={kitButton.primary}>
              {previewing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {previewing ? t('admin.pdf.previewing', 'Generating...') : t('admin.pdf.dialog.generate', 'Generate Preview')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
