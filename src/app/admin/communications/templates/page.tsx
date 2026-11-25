'use client';

export const dynamic = 'force-dynamic';

/**
 * Communications · Templates: the email templates in the standard list,
 * with a preview drawer (Hebrew and English, in the school's email layout)
 * and "used in". Creating uses the existing dialog; editing opens the
 * existing editor. System templates can be edited, not deleted.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Lock, Pencil, Plus, SearchX, WifiOff } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { ListFooter, ListPanel, ListRow, ListSearch, ListSkeleton, ListState, QuickPills, kitButton, usePagedList } from '@/components/admin/notifications/kit';
import { DrawerSection, DrawerShell, DrawerStat, drawerPrimary } from '@/components/admin/drawer-kit';
import { CreateTemplateDialog } from '@/components/email/CreateTemplateDialog';
import { CommsPage, COMMS } from '@/components/admin/comms/CommsPage';
import { useBi } from '@/components/admin/reminders/shared';

interface Category {
  value: string;
  label_en: string;
  label_he: string;
  color: string;
  dark_color: string;
}

interface Template {
  id: string;
  template_key: string;
  template_name: string;
  template_category: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
  languages: string[];
  variableCount: number;
  usedBy: { kind: string; name: string; active: boolean }[];
}

const DEFAULT_CATS: Category[] = [
  { value: 'enrollment', label_en: 'Enrollment', label_he: 'הרשמה', color: 'bg-blue-100 text-blue-800', dark_color: 'dark:bg-blue-900 dark:text-blue-300' },
  { value: 'payment', label_en: 'Payment', label_he: 'תשלום', color: 'bg-green-100 text-green-800', dark_color: 'dark:bg-green-900 dark:text-green-300' },
  { value: 'lesson', label_en: 'Lesson', label_he: 'שיעור', color: 'bg-purple-100 text-purple-800', dark_color: 'dark:bg-purple-900 dark:text-purple-300' },
  { value: 'parent', label_en: 'Parent', label_he: 'הורה', color: 'bg-pink-100 text-pink-800', dark_color: 'dark:bg-pink-900 dark:text-pink-300' },
  { value: 'system', label_en: 'System', label_he: 'מערכת', color: 'bg-gray-100 text-gray-800', dark_color: 'dark:bg-gray-900 dark:text-gray-300' },
];

const COLUMNS = 'minmax(0,1.5fr) 120px minmax(0,1.1fr) 80px minmax(0,1fr) 100px';

/** Template names and descriptions are translated by key, as on the old list. */
function useTemplateWords() {
  const { t } = useAdminLanguage();
  const key = (x: { template_key: string }) => x.template_key.replace('.', '_');
  return {
    name: (x: { template_key: string; template_name: string }) => t(`email_template.${key(x)}.name`, x.template_name),
    description: (x: { template_key: string; description: string | null }) => (x.description ? t(`email_template.${key(x)}.description`, x.description) : ''),
  };
}

export default function CommsTemplatesPage() {
  const { t } = useAdminLanguage();
  const { lang, rtl } = useBi();
  const [data, setData] = useState<{ templates: Template[]; categories: Category[] | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [open, setOpen] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const words = useTemplateWords();

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/communications/templates', { cache: 'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setData(body);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cats = data?.categories?.length ? data.categories : DEFAULT_CATS;
  const catOf = (v: string) => cats.find((c) => c.value === v);
  const catLabel = (v: string) => {
    const c = catOf(v);
    return c ? (lang === 'he' ? c.label_he : c.label_en) : v;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.templates ?? []).filter(
      (x) => (cat === 'all' || x.template_category === cat) && (!q || `${x.template_name} ${words.name(x)} ${x.template_key} ${x.description ?? ''}`.toLowerCase().includes(q)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, cat]);
  const paged = usePagedList(filtered, `${query}|${cat}`);

  const state = error ? (
    <ListState icon={WifiOff} tone="red" title={t('admin.comms.templates.loadError', "Couldn't load the templates")} text={error} />
  ) : !data ? (
    <ListSkeleton rows={6} />
  ) : !data.templates.length ? (
    <ListState
      icon={FileText}
      title={t('admin.comms.templates.emptyTitle', 'No templates yet')}
      text={t('admin.comms.templates.emptyText', 'The system templates are added with: npx tsx scripts/seed-email-templates.ts')}
    />
  ) : !filtered.length ? (
    <ListState icon={SearchX} tone="grey" title={t('admin.comms.templates.noResults', 'No templates match')} />
  ) : undefined;

  return (
    <CommsPage
      icon={FileText}
      title={t('admin.comms.templates.title', 'Templates')}
      badge={data ? data.templates.length : undefined}
      description={t(
        'admin.comms.templates.subtitle',
        'The design and wording of emails. Automatic reminders write their own words inside the reminder, and use the same design.',
      )}
      actions={
        <button type="button" onClick={() => setCreating(true)} className={kitButton.primary}>
          <Plus className="h-4 w-4" aria-hidden />
          {t('admin.comms.templates.new', 'New template')}
        </button>
      }
    >
      <ListPanel
        label={t('admin.comms.templates.title', 'Templates')}
        toolbar={<ListSearch value={query} onChange={setQuery} placeholder={t('admin.comms.templates.search', 'Search a template or key')} clearLabel={t('admin.reminders.clearSearch', 'Clear search')} />}
        pills={
          <QuickPills
            label={t('admin.comms.templates.category', 'Category')}
            value={cat}
            onChange={setCat}
            options={[
              { value: 'all', label: t('admin.reminders.all', 'All'), count: data?.templates.length },
              ...cats.map((c) => ({ value: c.value, label: lang === 'he' ? c.label_he : c.label_en, count: (data?.templates ?? []).filter((x) => x.template_category === c.value).length })),
            ]}
          />
        }
        columns={COLUMNS}
        head={[
          t('admin.comms.templates.col.name', 'Template'),
          t('admin.comms.templates.col.category', 'Category'),
          t('admin.comms.templates.col.key', 'Key'),
          t('admin.comms.templates.col.languages', 'Languages'),
          t('admin.comms.templates.col.used', 'Used in'),
          t('admin.comms.templates.col.status', 'Status'),
        ]}
        state={state}
        footer={
          filtered.length > 0 && (
            <ListFooter
              showingText={t('admin.comms.showing', 'Showing {from}–{to} of {total}')
                .replace('{from}', String(paged.start + 1))
                .replace('{to}', String(paged.start + paged.pageItems.length))
                .replace('{total}', String(filtered.length))}
              pageText={t('admin.reminders.log.page', 'Page {n} of {total}').replace('{n}', String(paged.page)).replace('{total}', String(paged.totalPages))}
              page={paged.page}
              totalPages={paged.totalPages}
              onPage={paged.setPage}
              prevLabel={t('common.previous', 'Previous')}
              nextLabel={t('common.next', 'Next')}
              rtl={rtl}
            />
          )
        }
      >
        {paged.pageItems.map((x) => {
          const c = catOf(x.template_category);
          return (
            <ListRow key={x.id} columns={COLUMNS} onOpen={() => setOpen(x)} label={words.name(x)} selected={open?.id === x.id} rtl={rtl}>
              <div className="min-w-0 pe-10 md:pe-0">
                <div className="font-bold [overflow-wrap:anywhere]">{words.name(x)}</div>
                {x.description && <div className="text-[13px] text-muted-foreground [overflow-wrap:anywhere]">{words.description(x)}</div>}
              </div>
              <span>
                <span className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold ${c ? `${c.color} ${c.dark_color}` : 'bg-muted'}`}>{catLabel(x.template_category)}</span>
              </span>
              <span className="min-w-0 text-[13px] text-muted-foreground [overflow-wrap:anywhere]" dir="ltr">
                {x.template_key}
              </span>
              <span className="text-sm">{x.languages.map((l) => (l === 'he' ? 'עב' : l === 'en' ? 'En' : l)).join(' · ') || '—'}</span>
              <span className="min-w-0 text-[13px] text-muted-foreground [overflow-wrap:anywhere]">
                {x.usedBy.length ? x.usedBy.map((u) => u.name).join(', ') : x.template_key === 'notification.generic' ? t('admin.comms.templates.usedGeneric', 'Messages and scheduled emails') : '—'}
              </span>
              <span className="text-sm font-semibold">
                {x.is_system ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[12.5px]">
                    <Lock className="h-3 w-3" aria-hidden />
                    {t('admin.comms.templates.system', 'System')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${x.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}`} aria-hidden />
                    {x.is_active ? t('admin.comms.templates.active', 'Active') : t('admin.comms.templates.inactive', 'Off')}
                  </span>
                )}
              </span>
            </ListRow>
          );
        })}
      </ListPanel>
      <p className="text-sm text-muted-foreground">
        {t('admin.comms.templates.note', "System templates can be edited but not deleted. Template categories are edited in Communications settings.")}{' '}
        <Link href={`${COMMS.settings}?tab=categories`} className="font-semibold text-primary hover:underline">
          {t('admin.comms.templates.toCategories', 'Template categories')}
        </Link>
      </p>

      <TemplateDrawer template={open} categoryLabel={open ? catLabel(open.template_category) : ''} onClose={() => setOpen(null)} />
      <CreateTemplateDialog open={creating} onOpenChange={setCreating} onSuccess={load} />
    </CommsPage>
  );
}

function TemplateDrawer({ template, categoryLabel, onClose }: { template: Template | null; categoryLabel: string; onClose: () => void }) {
  const { t } = useAdminLanguage();
  const { lang } = useBi();
  const [versions, setVersions] = useState<Record<string, { subject: string; html: string; text: string }> | null>(null);
  const [tab, setTab] = useState<string>(lang);
  const words = useTemplateWords();

  useEffect(() => {
    setVersions(null);
    if (!template) return;
    fetch(`/api/admin/communications/templates/${template.id}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        setVersions(b?.versions ?? {});
        const langs = Object.keys(b?.versions ?? {});
        setTab(langs.includes(lang) ? lang : langs[0] ?? lang);
      })
      .catch(() => setVersions({}));
  }, [template, lang]);

  const v = versions?.[tab];
  return (
    <DrawerShell
      open={!!template}
      onClose={onClose}
      status={`${categoryLabel} · ${template?.is_system ? t('admin.comms.templates.system', 'System') : template?.is_active ? t('admin.comms.templates.active', 'Active') : t('admin.comms.templates.inactive', 'Off')}`}
      statusDot={template?.is_active ? 'bg-green-500' : 'bg-muted-foreground/40'}
      lead={
        <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden>
          <FileText className="h-5 w-5" />
        </span>
      }
      title={template ? words.name(template) : ''}
      subtitle={<span dir="ltr">{template?.template_key}</span>}
      description={t('admin.comms.templates.drawerDescription', 'A preview of the email template in each language.')}
      wide
      stats={
        <>
          <DrawerStat label={t('admin.comms.templates.languages', 'Languages')} value={String(template?.languages.length ?? 0)} />
          <DrawerStat label={t('admin.comms.templates.variables', 'Variables')} value={String(template?.variableCount ?? 0)} />
          <DrawerStat label={t('admin.comms.templates.usedIn', 'Used in')} value={String(template?.usedBy.length ?? 0)} />
        </>
      }
      footer={
        template && (
          <Link href={`${COMMS.templates}/${template.id}`} className={drawerPrimary}>
            <Pencil className="h-4 w-4" aria-hidden />
            {t('admin.comms.templates.edit', 'Edit')}
          </Link>
        )
      }
    >
      {!versions ? (
        <div className="grid min-h-[200px] place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !Object.keys(versions).length ? (
        <p className="text-sm text-muted-foreground">{t('admin.comms.templates.noVersions', 'This template has no words yet.')}</p>
      ) : (
        <>
          <div className="flex gap-1 border-b border-border">
            {Object.keys(versions).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setTab(l)}
                aria-pressed={tab === l}
                className={`min-h-11 border-b-[3px] px-4 text-sm font-semibold ${tab === l ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
              >
                {l === 'he' ? 'עברית' : l === 'en' ? 'English' : l}
              </button>
            ))}
          </div>
          {v && (
            <>
              <DrawerSection title={t('admin.comms.templates.subject', 'Subject')}>
                <p className="px-3.5 py-2.5 text-sm [overflow-wrap:anywhere]">{v.subject}</p>
              </DrawerSection>
              <DrawerSection title={t('admin.comms.templates.looks', 'How the email looks')}>
                <iframe title={t('admin.comms.templates.preview', 'Email preview')} srcDoc={v.html} sandbox="" className="h-[520px] w-full border-0 bg-white" />
              </DrawerSection>
              {v.text && (
                <DrawerSection title={t('admin.comms.templates.plain', 'Plain text')}>
                  <pre className="whitespace-pre-wrap px-3.5 py-2.5 text-[13px] text-muted-foreground [font-family:inherit]">{v.text}</pre>
                </DrawerSection>
              )}
            </>
          )}
          {template?.usedBy.length ? (
            <DrawerSection title={t('admin.comms.templates.usedIn', 'Used in')}>
              <ul className="m-0 divide-y divide-border p-0">
                {template.usedBy.map((u, i) => (
                  <li key={i} className="flex list-none justify-between px-3.5 py-2.5 text-sm">
                    <span>{u.name}</span>
                    <span className="text-muted-foreground">{t('admin.comms.templates.oldTrigger', 'Email trigger')}</span>
                  </li>
                ))}
              </ul>
            </DrawerSection>
          ) : null}
        </>
      )}
    </DrawerShell>
  );
}
