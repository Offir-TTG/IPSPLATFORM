'use client';

/**
 * Communications settings · Email branding (was Email settings): header and
 * button colour, header style, logo, footer, sender name, reply-to and the
 * portal address. Every email uses them. Saved with the floating save bar.
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { SaveBar, joinedBar, joinedSegment, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { WizardField } from '@/components/admin/wizard/StepWizard';

interface Branding {
  email_primary_color: string;
  email_button_color: string;
  email_logo_url: string;
  email_footer_text: string;
  email_sender_name: string;
  email_reply_to: string;
  email_header_style: 'logo' | 'text' | 'none';
  portal_url: string;
}

const card = 'rounded-2xl border border-border bg-card p-5 shadow-sm';
const input = 'h-11 w-full rounded-lg border border-border bg-card px-3 text-base focus:border-primary focus:outline-none';

export function BrandingTab() {
  const { t } = useAdminLanguage();
  const { toast } = useToast();
  const words = saveBarText(t);
  const [form, setForm] = useState<Branding | null>(null);
  const [saved, setSaved] = useState<Branding | null>(null);
  const [site, setSite] = useState<{ logo_url: string | null; primary_color: string | null }>({ logo_url: null, primary_color: null });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tenant', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data ?? {};
        const b: Branding = {
          email_primary_color: d.email_primary_color || d.primary_color || '#4f46e5',
          email_button_color: d.email_button_color || '',
          email_logo_url: d.email_logo_url || '',
          email_footer_text: d.email_footer_text || '',
          email_sender_name: d.email_sender_name || '',
          email_reply_to: d.email_reply_to || '',
          email_header_style: (d.email_header_style as Branding['email_header_style']) || 'text',
          portal_url: d.portal_url || '',
        };
        setForm(b);
        setSaved(b);
        setSite({ logo_url: d.logo_url || null, primary_color: d.primary_color || null });
      })
      .catch(() => {});
  }, []);

  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const { dialog } = useLeaveGuard(dirty, words.leave);
  const set = (p: Partial<Branding>) => setForm((f) => (f ? { ...f, ...p } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_primary_color: form.email_primary_color || null,
          email_button_color: form.email_button_color || null,
          email_logo_url: form.email_logo_url || null,
          email_footer_text: form.email_footer_text || null,
          email_sender_name: form.email_sender_name || null,
          email_reply_to: form.email_reply_to || null,
          email_header_style: form.email_header_style,
          portal_url: form.portal_url.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');
      setSaved(form);
      toast({ title: t('emails.settings.branding_saved', 'Email branding saved') });
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="grid min-h-[240px] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const colour = (value: string, onChange: (v: string) => void, placeholder?: string) => (
    <div className="flex items-center gap-2">
      <input type="color" value={value || placeholder || '#4f46e5'} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-card p-1" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir="ltr" className={`${input} max-w-[140px] font-mono`} />
    </div>
  );

  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.comms.branding.lookTitle', 'How emails look')}</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">{t('admin.comms.branding.lookHint', 'Every email uses these. Empty fields take the site\'s logo and colour.')}</p>
        <div className="grid gap-5 md:grid-cols-2">
          <WizardField label={t('emails.settings.header_color', 'Header colour')}>
            {colour(form.email_primary_color, (v) => set({ email_primary_color: v }))}
            <button type="button" onClick={() => set({ email_primary_color: site.primary_color || '#4f46e5' })} className="justify-self-start text-[13px] font-semibold text-primary hover:underline">
              {t('emails.settings.use_site_color', "Use the site's colour")}
            </button>
          </WizardField>
          <WizardField label={t('emails.settings.button_color', 'Button colour')} hint={t('emails.settings.button_color_hint', 'Empty = the same as the header')}>
            {colour(form.email_button_color, (v) => set({ email_button_color: v }), form.email_primary_color)}
          </WizardField>
          <WizardField label={t('emails.settings.header_style', 'Header')}>
            <div className={joinedBar}>
              {(['text', 'logo', 'none'] as const).map((s) => (
                <button key={s} type="button" aria-pressed={form.email_header_style === s} onClick={() => set({ email_header_style: s })} className={joinedSegment(form.email_header_style === s)}>
                  {s === 'text' ? t('emails.settings.header_text', 'Name as text') : s === 'logo' ? t('emails.settings.header_logo', 'Logo') : t('emails.settings.header_none', 'No header')}
                </button>
              ))}
            </div>
          </WizardField>
          <WizardField label={t('emails.settings.logo_url', 'Logo address')} htmlFor="b-logo">
            <input id="b-logo" dir="ltr" className={input} value={form.email_logo_url} onChange={(e) => set({ email_logo_url: e.target.value })} placeholder="https://" />
            {site.logo_url && (
              <button type="button" onClick={() => set({ email_logo_url: site.logo_url || '' })} className="justify-self-start text-[13px] font-semibold text-primary hover:underline">
                {t('emails.settings.use_site_logo', "Use the site's logo")}
              </button>
            )}
          </WizardField>
          <WizardField label={t('emails.settings.footer_text', 'Footer line')} htmlFor="b-footer">
            <input id="b-footer" className={input} value={form.email_footer_text} onChange={(e) => set({ email_footer_text: e.target.value })} />
          </WizardField>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.comms.branding.senderTitle', 'Sender and links')}</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <WizardField label={t('emails.settings.sender_name', 'Sender name')} htmlFor="b-sender">
            <input id="b-sender" className={input} value={form.email_sender_name} onChange={(e) => set({ email_sender_name: e.target.value })} />
          </WizardField>
          <WizardField label={t('emails.settings.reply_to', 'Reply-to address')} htmlFor="b-reply">
            <input id="b-reply" dir="ltr" type="email" className={input} value={form.email_reply_to} onChange={(e) => set({ email_reply_to: e.target.value })} />
          </WizardField>
          <WizardField label={t('emails.settings.portal_url', 'Client portal address')} hint={t('emails.settings.portal_url_hint', 'Buttons in emails lead here.')} htmlFor="b-portal">
            <input id="b-portal" dir="ltr" className={input} value={form.portal_url} onChange={(e) => set({ portal_url: e.target.value })} placeholder="https://" />
          </WizardField>
        </div>
      </section>

      <SaveBar isNew={false} dirty={dirty} saving={saving} onSave={save} onDiscard={() => setForm(saved)} saveLabel={t('admin.saveBar.save', 'Save')} text={words.bar} />
      {dialog}
    </div>
  );
}
