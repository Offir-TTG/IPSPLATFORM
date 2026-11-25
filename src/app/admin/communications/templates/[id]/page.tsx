'use client';

export const dynamic = 'force-dynamic';

/**
 * Communications · Edit a template: its category, and for each language the
 * subject, the email (rich text, with a variable inserter) and the plain-text
 * version. A preview shows the words as they are now, unsaved changes too,
 * inside the school's email layout. Saved with the floating save bar.
 * Replaces the old editor at /admin/emails/templates/[id] (same data, same rules:
 * only languages the template already has are saved).
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, Loader2, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { PlainTextEditor } from '@/components/admin/PlainTextEditor';
import { SaveBar, joinedBar, joinedSegment, kitButton, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import { WizardField } from '@/components/admin/wizard/StepWizard';
import { renderEmailLayout } from '@/lib/email/layout';
import { COMMS } from '@/components/admin/comms/CommsPage';

interface Version {
  id: string;
  language_code: string;
  subject: string;
  body_html: string;
  body_text: string;
}
interface Category {
  value: string;
  label_en: string;
  label_he: string;
  color: string;
  dark_color: string;
}
type Words = Record<string, { subject: string; body_html: string; body_text: string }>;

const DEFAULT_CATS: Category[] = [
  { value: 'enrollment', label_en: 'Enrollment', label_he: 'הרשמה', color: 'bg-blue-100 text-blue-800', dark_color: 'dark:bg-blue-900 dark:text-blue-300' },
  { value: 'payment', label_en: 'Payment', label_he: 'תשלום', color: 'bg-green-100 text-green-800', dark_color: 'dark:bg-green-900 dark:text-green-300' },
  { value: 'lesson', label_en: 'Lesson', label_he: 'שיעור', color: 'bg-purple-100 text-purple-800', dark_color: 'dark:bg-purple-900 dark:text-purple-300' },
  { value: 'parent', label_en: 'Parent', label_he: 'הורה', color: 'bg-pink-100 text-pink-800', dark_color: 'dark:bg-pink-900 dark:text-pink-300' },
  { value: 'system', label_en: 'System', label_he: 'מערכת', color: 'bg-gray-100 text-gray-800', dark_color: 'dark:bg-gray-900 dark:text-gray-300' },
];

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const words = saveBarText(t);
  const rtl = direction === 'rtl';

  const [template, setTemplate] = useState<any>(null);
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATS);
  const [langs, setLangs] = useState<string[]>([]);
  const [form, setForm] = useState<{ category: string; versions: Words } | null>(null);
  const [saved, setSaved] = useState<{ category: string; versions: Words } | null>(null);
  const [tab, setTab] = useState<string>('he');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [preview, setPreview] = useState(false);
  const [brand, setBrand] = useState<any>({});

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/communications/templates/${id}/edit`, { cache: 'no-store' });
    if (!res.ok) {
      setNotFound(true);
      return;
    }
    const body = await res.json();
    const versions: Words = {};
    for (const v of body.versions as Version[]) versions[v.language_code] = { subject: v.subject ?? '', body_html: v.body_html ?? '', body_text: v.body_text ?? '' };
    const order = Object.keys(versions).sort((a, b) => (a === 'he' ? -1 : b === 'he' ? 1 : a.localeCompare(b)));
    const f = { category: body.template.template_category, versions };
    setTemplate(body.template);
    if (body.categories?.length) setCats(body.categories);
    setLangs(order);
    setTab((x) => (order.includes(x) ? x : order[0] ?? 'he'));
    setForm(f);
    setSaved(f);
  }, [id]);

  useEffect(() => {
    load();
    fetch('/api/admin/tenant', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setBrand(j?.data ?? {}))
      .catch(() => {});
  }, [load]);

  const dirty = !!form && !!saved && JSON.stringify(form) !== JSON.stringify(saved);
  const { dialog } = useLeaveGuard(dirty, words.leave);

  const variables: { name: string; description: string }[] = useMemo(() => {
    const v = template?.variables;
    const list = Array.isArray(v) ? v : v && typeof v === 'object' ? Object.entries(v).map(([name, d]: [string, any]) => ({ name, description: typeof d === 'string' ? d : d?.description ?? '' })) : [];
    return list.filter((x: any) => x?.name).map((x: any) => ({ name: x.name, description: t(`email_variable.${x.name}`, x.description ?? '') }));
  }, [template, t]);

  const setWords = (patch: Partial<{ subject: string; body_html: string; body_text: string }>) => {
    setForm((f) => (f ? { ...f, versions: { ...f.versions, [tab]: { ...f.versions[tab], ...patch } } } : f));
    setErrors({});
  };

  const save = async () => {
    if (!form) return;
    const e: Record<string, string> = {};
    for (const l of langs) {
      if (!form.versions[l]?.subject.trim()) e[`${l}.subject`] = t('admin.comms.editor.subjectRequired', 'Write a subject.');
      if (!form.versions[l]?.body_html.replace(/<[^>]*>/g, '').trim()) e[`${l}.body_html`] = t('admin.comms.editor.bodyRequired', 'Write the email.');
    }
    if (Object.keys(e).length) {
      setErrors(e);
      const first = Object.keys(e)[0].split('.')[0];
      setTab(first);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/communications/templates/${id}/edit`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.field) setErrors({ [body.field]: body.error });
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSaved(form);
      toast({ title: t('emails.editor.saved', 'Template saved successfully') });
    } catch (err) {
      toast({ title: t('common.error', 'Error'), description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const cat = cats.find((c) => c.value === form?.category);
  const catLabel = (c: Category) => (rtl ? c.label_he : c.label_en);
  const name = template ? t(`email_template.${String(template.template_key).replace('.', '_')}.name`, template.template_name) : '';
  const Back = rtl ? ArrowRight : ArrowLeft;
  const current = form?.versions[tab];

  const previewHtml = current
    ? renderEmailLayout(current.body_html, {
        language: tab === 'en' ? 'en' : 'he',
        organizationName: brand.name || 'Preview',
        primaryColor: brand.email_primary_color || brand.primary_color || undefined,
        buttonColor: brand.email_button_color || undefined,
        logoUrl: brand.email_logo_url || brand.logo_url || undefined,
        footerNote: brand.email_footer_text || undefined,
        headerStyle: brand.email_header_style || undefined,
      })
    : '';

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 pb-28 md:p-6 md:pb-28" dir={direction}>
        <Link href={COMMS.templates} className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <Back className="h-4 w-4" aria-hidden />
          {t('admin.comms.editor.back', 'Communications · Templates')}
        </Link>

        {notFound ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">{t('admin.comms.editor.notFound', 'This template was not found.')}</p>
        ) : !form || !template ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-3 text-[26px] font-extrabold leading-tight tracking-tight [font-family:inherit] sm:text-3xl">
                  <bdi>{name}</bdi>
                  {cat && <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${cat.color} ${cat.dark_color}`}>{catLabel(cat)}</span>}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground" dir="ltr" style={{ textAlign: rtl ? 'right' : 'left' }}>
                  {template.template_key}
                </p>
              </div>
              <button type="button" onClick={() => setPreview(true)} className={kitButton.secondary}>
                <Eye className="h-4 w-4" aria-hidden />
                {t('admin.comms.editor.preview', 'Preview')}
              </button>
            </header>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section className="grid min-w-0 gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <WizardField label={t('admin.comms.editor.category', 'Category')}>
                  <div className={`${joinedBar} max-w-full overflow-x-auto`}>
                    {cats.map((c) => (
                      <button key={c.value} type="button" aria-pressed={form.category === c.value} onClick={() => setForm({ ...form, category: c.value })} className={joinedSegment(form.category === c.value)}>
                        {catLabel(c)}
                      </button>
                    ))}
                  </div>
                </WizardField>

                {langs.length > 0 ? (
                  <>
                    <div className="flex gap-1 border-b border-border">
                      {langs.map((l) => (
                        <button
                          key={l}
                          type="button"
                          aria-pressed={tab === l}
                          onClick={() => setTab(l)}
                          className={`min-h-11 border-b-[3px] px-4 text-sm font-semibold ${tab === l ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'} ${
                            errors[`${l}.subject`] || errors[`${l}.body_html`] ? 'text-red-700 dark:text-red-400' : ''
                          }`}
                        >
                          {l === 'he' ? 'עברית' : l === 'en' ? 'English' : l}
                        </button>
                      ))}
                    </div>
                    {current && (
                      <div key={tab} className="grid gap-5">
                        <WizardField label={t('admin.comms.editor.subject', 'Subject')} required error={errors[`${tab}.subject`]} htmlFor="tpl-subject">
                          <input
                            id="tpl-subject"
                            dir={tab === 'he' ? 'rtl' : 'ltr'}
                            value={current.subject}
                            onChange={(e) => setWords({ subject: e.target.value })}
                            className={`h-11 rounded-lg border bg-card px-3 text-base focus:outline-none ${errors[`${tab}.subject`] ? 'border-red-500' : 'border-border focus:border-primary'}`}
                          />
                        </WizardField>
                        <div className="grid gap-1.5">
                          <RichTextEditor
                            value={current.body_html}
                            onChange={(v) => setWords({ body_html: v })}
                            label={`${t('admin.comms.editor.body', 'The email')} *`}
                            height={380}
                            dir={tab === 'he' ? 'rtl' : 'ltr'}
                            variables={variables}
                          />
                          {errors[`${tab}.body_html`] && <p className="text-[13px] font-semibold text-red-700 dark:text-red-400">{errors[`${tab}.body_html`]}</p>}
                        </div>
                        <PlainTextEditor
                          value={current.body_text}
                          onChange={(v) => setWords({ body_text: v })}
                          label={t('admin.comms.editor.plain', 'Plain text (for email apps without design)')}
                          rows={8}
                          dir={tab === 'he' ? 'rtl' : 'ltr'}
                          variables={variables}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('admin.comms.templates.noVersions', 'This template has no words yet.')}</p>
                )}
              </section>

              <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-extrabold [font-family:inherit]">{t('admin.comms.editor.variables', 'Available variables')}</h2>
                <p className="mb-3 mt-1 text-sm text-muted-foreground">{t('admin.comms.editor.variablesHint', "Add them with '+ variable' in the editor. The client gets them filled in.")}</p>
                {variables.length ? (
                  <ul className="m-0 divide-y divide-border p-0">
                    {variables.map((v) => (
                      <li key={v.name} className="grid list-none gap-0.5 py-2 text-sm">
                        <code dir="ltr" className="justify-self-start rounded bg-muted px-1.5 py-0.5 text-[12.5px]">{`{{${v.name}}}`}</code>
                        <span className="text-muted-foreground">{v.description}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('admin.comms.editor.noVariables', 'This template has no variables.')}</p>
                )}
              </aside>
            </div>
          </>
        )}

        {preview && current && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t('admin.comms.editor.preview', 'Preview')}>
            <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-muted-foreground">{tab === 'he' ? 'עברית' : 'English'} · {t('admin.comms.editor.unsavedToo', 'including unsaved changes')}</div>
                  <div className="font-bold [overflow-wrap:anywhere]">{current.subject}</div>
                </div>
                <button type="button" onClick={() => setPreview(false)} aria-label={t('common.close', 'Close')} className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <iframe title={t('admin.comms.templates.preview', 'Email preview')} srcDoc={previewHtml} sandbox="" className="h-[70vh] w-full border-0 bg-white" />
            </div>
          </div>
        )}

        {form && !notFound && (
          <SaveBar isNew={false} dirty={dirty} saving={saving} onSave={save} onDiscard={() => setForm(saved)} saveLabel={t('admin.saveBar.save', 'Save')} text={words.bar} />
        )}
        {dialog}
      </div>
    </AdminLayout>
  );
}
