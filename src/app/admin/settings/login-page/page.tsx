'use client';

export const dynamic = 'force-dynamic';

/**
 * Settings → Login page. The login page is the portal's home page; here the
 * admin changes its picture and its words. Saved on the organization
 * (tenants.metadata.login_page) with the floating save bar. A small preview
 * shows the result as it is typed.
 */

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Home, ImageIcon, Loader2, LogIn } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { PageTitle, SaveBar, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { WizardField } from '@/components/admin/wizard/StepWizard';
import {
  DEFAULT_LOGIN_IMAGE,
  EMPTY_LOGIN_PAGE,
  LOGIN_PAGE_HE_DEFAULTS,
  readLoginPage,
  type LoginPageContent,
} from '@/lib/portal/loginPage';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const card = 'rounded-2xl border border-border bg-card p-5 shadow-sm';
const input = 'h-11 w-full rounded-lg border border-border bg-card px-3 text-base focus:border-primary focus:outline-none';

export default function LoginPageSettings() {
  const { t } = useAdminLanguage();
  const { toast } = useToast();
  const words = saveBarText(t);
  const [form, setForm] = useState<LoginPageContent | null>(null);
  const [saved, setSaved] = useState<LoginPageContent | null>(null);
  const [orgName, setOrgName] = useState('');
  const [logo, setLogo] = useState('/IPS.png');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/admin/tenant', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data ?? {};
        const content = readLoginPage(d.metadata?.login_page);
        setForm(content);
        setSaved(content);
        setOrgName(d.name || '');
        if (d.logo_url) setLogo(d.logo_url);
        setWebsiteUrl(d.website_url || '');
      })
      .catch(() => {
        setForm({ ...EMPTY_LOGIN_PAGE });
        setSaved({ ...EMPTY_LOGIN_PAGE });
      });
  }, []);

  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const { dialog } = useLeaveGuard(dirty, words.leave);
  const set = (p: Partial<LoginPageContent>) => setForm((f) => (f ? { ...f, ...p } : f));

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError(t('admin.courses.form.imageType', 'Choose a PNG, JPG, GIF or WEBP picture.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError(t('admin.courses.form.imageSize', 'This picture is larger than 20MB. Choose a smaller one.'));
      return;
    }
    setImageError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('courseId', 'login-page');
      const res = await fetch('/api/lms/courses/upload-image', { method: 'POST', body: fd });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.success || !result.url) throw new Error();
      set({ image_url: result.url });
    } catch {
      setImageError(t('admin.courses.form.imageUploadError', 'The picture was not uploaded'));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form) return;
    const site = form.site_url.trim();
    if (site && !/^https?:\/\/\S+$/i.test(site)) {
      setUrlError(t('admin.loginPage.siteUrlInvalid', 'Write the full address, starting with https://'));
      return;
    }
    setUrlError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_page: { ...form, site_url: site } }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');
      const stored = readLoginPage(json.data?.metadata?.login_page ?? form);
      setForm(stored);
      setSaved(stored);
      toast({ title: t('admin.loginPage.saved', 'Login page saved') });
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <AdminLayout>
        <div className="grid min-h-[240px] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const shown = {
    badge: form.badge || LOGIN_PAGE_HE_DEFAULTS.badge,
    title: form.title || LOGIN_PAGE_HE_DEFAULTS.title,
    subtitle: form.subtitle || LOGIN_PAGE_HE_DEFAULTS.subtitle,
    caption: form.caption || LOGIN_PAGE_HE_DEFAULTS.caption,
    image: form.image_url || DEFAULT_LOGIN_IMAGE,
  };
  const emptyHint = (text: string) => `${t('admin.loginPage.emptyShows', 'Leave empty to show:')} ${text}`;

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 pb-28 md:p-6 md:pb-28">
        <PageTitle
          icon={LogIn}
          title={t('admin.settingsHub.loginPageTitle', 'Login page')}
          description={t(
            'admin.loginPage.description',
            "This is the portal's home page, the first thing clients see. Change its picture and its words here.",
          )}
          actions={
            <a
              href="/login"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold hover:border-primary/50"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {t('admin.loginPage.viewPage', 'View page')}
            </a>
          }
        />

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <section className={card}>
              <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.loginPage.pictureTitle', 'Picture')}</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {t('admin.loginPage.pictureHint', 'Shown beside the form on a computer and on top on a phone. A wide picture works best. PNG, JPG, GIF or WEBP, up to 20MB.')}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <span className="grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary/10 text-primary">
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <img src={shown.image} alt="" className="h-full w-full object-cover" />}
                </span>
                <div className="flex flex-wrap items-center gap-x-4">
                  <button type="button" disabled={uploading} onClick={() => fileInput.current?.click()} className="min-h-[44px] text-sm font-semibold text-primary hover:underline disabled:opacity-50">
                    {t('admin.programs.form.replaceImage', 'Replace picture')}
                  </button>
                  {form.image_url && !uploading && (
                    <button type="button" onClick={() => set({ image_url: '' })} className="min-h-[44px] text-sm font-semibold text-muted-foreground hover:underline">
                      {t('admin.loginPage.useDefaultImage', 'Back to the built-in picture')}
                    </button>
                  )}
                </div>
                <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} onChange={pickImage} className="hidden" />
              </div>
              {imageError && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{imageError}</p>}
            </section>

            <section className={card}>
              <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.loginPage.wordsTitle', 'Words')}</h2>
              <p className="mb-4 mt-1 text-sm text-muted-foreground">
                {t('admin.loginPage.wordsHint', 'In Hebrew. The English page keeps its built-in wording.')}
              </p>
              <div className="grid gap-5">
                <WizardField label={t('admin.loginPage.badge', 'Small label above the heading')} hint={emptyHint(LOGIN_PAGE_HE_DEFAULTS.badge)} htmlFor="lp-badge">
                  <input id="lp-badge" dir="rtl" maxLength={300} className={input} value={form.badge} onChange={(e) => set({ badge: e.target.value })} placeholder={LOGIN_PAGE_HE_DEFAULTS.badge} />
                </WizardField>
                <WizardField label={t('admin.loginPage.title', 'Heading')} hint={emptyHint(LOGIN_PAGE_HE_DEFAULTS.title)} htmlFor="lp-title">
                  <input id="lp-title" dir="rtl" maxLength={300} className={input} value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder={LOGIN_PAGE_HE_DEFAULTS.title} />
                </WizardField>
                <WizardField label={t('admin.loginPage.subtitle', 'Line under the heading')} hint={emptyHint(LOGIN_PAGE_HE_DEFAULTS.subtitle)} htmlFor="lp-subtitle">
                  <input id="lp-subtitle" dir="rtl" maxLength={300} className={input} value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder={LOGIN_PAGE_HE_DEFAULTS.subtitle} />
                </WizardField>
                <WizardField label={t('admin.loginPage.caption', 'Line on the picture')} hint={`${emptyHint(LOGIN_PAGE_HE_DEFAULTS.caption)} ${t('admin.loginPage.captionComputer', '(computer only)')}`} htmlFor="lp-caption">
                  <input id="lp-caption" dir="rtl" maxLength={300} className={input} value={form.caption} onChange={(e) => set({ caption: e.target.value })} placeholder={LOGIN_PAGE_HE_DEFAULTS.caption} />
                </WizardField>
              </div>
            </section>

            <section className={card}>
              <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.loginPage.siteTitle', '"To the website" link')}</h2>
              <div className="mt-4">
                <WizardField
                  label={t('admin.loginPage.siteUrl', 'Website address')}
                  hint={
                    websiteUrl
                      ? `${t('admin.loginPage.siteUrlEmptyOrg', "Leave empty to use the organization's website:")} ${websiteUrl}`
                      : t('admin.loginPage.siteUrlEmpty', 'Leave empty to hide the link.')
                  }
                  error={urlError ?? undefined}
                  htmlFor="lp-site"
                >
                  <input id="lp-site" dir="ltr" type="url" inputMode="url" autoCapitalize="off" spellCheck={false} className={`${input} ![direction:ltr] text-left`} value={form.site_url} onChange={(e) => { setUrlError(null); set({ site_url: e.target.value }); }} placeholder="https://" />
                </WizardField>
              </div>
            </section>
          </div>

          {/* Live preview, the computer layout in small. */}
          <section className={`${card} lg:sticky lg:top-4`} aria-label={t('admin.loginPage.preview', 'Preview')}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('admin.loginPage.preview', 'Preview')}</h2>
            <div dir="rtl" className="overflow-hidden rounded-xl border border-[#e9e3f1] bg-[#faf8fd] text-[#221a2e]">
              <div className="flex items-center gap-2 border-b border-[#e9e3f1] bg-white px-4 py-2.5">
                <img src={logo} alt="" className="h-6 w-6 object-contain" />
                <span className="text-xs font-bold">{orgName}</span>
              </div>
              <div className="flex gap-4 p-4">
                <div className="flex w-[45%] shrink-0 flex-col justify-center gap-2">
                  <span className="self-start rounded-full bg-[#fbefd6] px-2 py-0.5 text-[10px] font-bold text-[#7a4f00]">{shown.badge}</span>
                  <p className="m-0 text-lg font-extrabold leading-tight">{shown.title}</p>
                  <p className="m-0 text-[11px] text-[#73698a]">{shown.subtitle}</p>
                  <span className="mt-1 h-6 rounded-md border border-[#e9e3f1] bg-white" />
                  <span className="h-6 rounded-md border border-[#e9e3f1] bg-white" />
                  <span className="h-7 rounded-md bg-[#221a2e]" />
                </div>
                <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-xl bg-[#e9e3f1]">
                  <img src={shown.image} alt="" className="absolute inset-0 h-full w-full object-cover object-[50%_30%]" />
                  <div className="absolute inset-x-2 bottom-2 flex items-center gap-2 rounded-lg bg-white px-2 py-1.5">
                    <Home className="h-3.5 w-3.5 shrink-0 text-[#5b3a8e]" aria-hidden />
                    <span className="text-[10px] font-semibold">{shown.caption}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" aria-hidden />
              {t('admin.loginPage.previewHint', 'Changes show here as you type. Save to put them on the page.')}
            </p>
          </section>
        </div>

        <SaveBar isNew={false} dirty={dirty} saving={saving} onSave={save} onDiscard={() => { setForm(saved); setUrlError(null); }} saveLabel={t('admin.saveBar.save', 'Save')} text={words.bar} />
        {dialog}
      </div>
    </AdminLayout>
  );
}
