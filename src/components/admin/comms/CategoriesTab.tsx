'use client';

/**
 * Communications settings · Template categories (was on Email settings):
 * each category's key, its name in Hebrew and English, and its badge
 * colour, with a preview of the badges. Saved with the floating save bar.
 */

import { useEffect, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { SaveBar, kitButton, saveBarText, useLeaveGuard } from '@/components/admin/notifications/kit';
import type { TemplateCategory } from '@/lib/messaging/comms';

const DEFAULTS: TemplateCategory[] = [
  { value: 'enrollment', label_en: 'Enrollment', label_he: 'הרשמה', color: 'bg-blue-100 text-blue-800', dark_color: 'dark:bg-blue-900 dark:text-blue-300' },
  { value: 'payment', label_en: 'Payment', label_he: 'תשלום', color: 'bg-green-100 text-green-800', dark_color: 'dark:bg-green-900 dark:text-green-300' },
  { value: 'lesson', label_en: 'Lesson', label_he: 'שיעור', color: 'bg-purple-100 text-purple-800', dark_color: 'dark:bg-purple-900 dark:text-purple-300' },
  { value: 'parent', label_en: 'Parent', label_he: 'הורה', color: 'bg-pink-100 text-pink-800', dark_color: 'dark:bg-pink-900 dark:text-pink-300' },
  { value: 'system', label_en: 'System', label_he: 'מערכת', color: 'bg-gray-100 text-gray-800', dark_color: 'dark:bg-gray-900 dark:text-gray-300' },
];

const COLORS = ['blue', 'green', 'purple', 'pink', 'red', 'orange', 'yellow', 'indigo', 'teal', 'gray'].map((c) => ({
  name: c,
  light: `bg-${c}-100 text-${c}-800`,
  dark: `dark:bg-${c}-900 dark:text-${c}-300`,
}));
// Tailwind keeps only class names it sees in full; these are the ten badge colours.
const SWATCH: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const card = 'rounded-2xl border border-border bg-card p-5 shadow-sm';
const input = 'h-11 w-full rounded-lg border border-border bg-card px-3 text-base focus:border-primary focus:outline-none';

export function CategoriesTab() {
  const { t, direction } = useAdminLanguage();
  const { toast } = useToast();
  const words = saveBarText(t);
  const [list, setList] = useState<TemplateCategory[] | null>(null);
  const [saved, setSaved] = useState<TemplateCategory[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/communications/categories', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { categories: null }))
      .then((b) => {
        const c = b.categories?.length ? b.categories : DEFAULTS;
        setList(c);
        setSaved(c);
      })
      .catch(() => {
        setList(DEFAULTS);
        setSaved(DEFAULTS);
      });
  }, []);

  const dirty = !!list && !!saved && JSON.stringify(list) !== JSON.stringify(saved);
  const { dialog } = useLeaveGuard(dirty, words.leave);
  const update = (i: number, p: Partial<TemplateCategory>) => {
    setList((l) => (l ? l.map((c, j) => (j === i ? { ...c, ...p } : c)) : l));
    setError(null);
  };

  const save = async () => {
    if (!list) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/communications/categories', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categories: list }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error);
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setSaved(list);
      toast({ title: t('emails.settings.saved', 'Email settings saved successfully') });
    } catch (e) {
      toast({ title: t('common.error', 'Error'), description: (e as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!list) {
    return (
      <div className="grid min-h-[240px] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const he = direction === 'rtl';
  return (
    <div className="space-y-5">
      <section className={card}>
        <h2 className="text-lg font-extrabold [font-family:inherit]">{t('emails.settings.category_preview', 'How the badges look')}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {list.map((c, i) => (
            <span key={i} className={`rounded-full px-2.5 py-0.5 text-[13px] font-semibold ${c.color} ${c.dark_color}`}>
              {(he ? c.label_he : c.label_en) || c.value || '—'}
            </span>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-extrabold [font-family:inherit]">{t('emails.settings.categories_title', 'Template categories')}</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">{t('emails.settings.categories_hint', 'Templates are grouped by these. The key is used inside the system; the names are what you see.')}</p>
        {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
        <div className="grid gap-3">
          {list.map((c, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <label className="grid gap-1.5 text-sm font-semibold">
                {t('emails.settings.category_key', 'Key')}
                <input dir="ltr" className={input} value={c.value} onChange={(e) => update(i, { value: e.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                {t('emails.settings.label_he', 'Name in Hebrew')}
                <input dir="rtl" className={input} value={c.label_he} onChange={(e) => update(i, { label_he: e.target.value })} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">
                {t('emails.settings.label_en', 'Name in English')}
                <input dir="ltr" className={input} value={c.label_en} onChange={(e) => update(i, { label_en: e.target.value })} />
              </label>
              {list.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setList((l) => (l ? l.filter((_, j) => j !== i) : l))}
                  aria-label={t('emails.settings.remove_category', 'Remove the category')}
                  className="grid h-11 w-11 place-items-center rounded-lg border border-border text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-wrap gap-1.5 md:col-span-4" role="group" aria-label={t('emails.settings.badge_color', 'Badge colour')}>
                {COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    aria-pressed={c.color === col.light}
                    onClick={() => update(i, { color: col.light, dark_color: col.dark })}
                    className={`min-h-8 rounded-full px-3 text-[12.5px] font-semibold ${SWATCH[col.name]} ${c.color === col.light ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                  >
                    {t(`colors.${col.name}`, col.name)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className={`${kitButton.secondary} mt-3`}
          onClick={() => setList((l) => [...(l ?? []), { value: '', label_en: '', label_he: '', color: 'bg-gray-100 text-gray-800', dark_color: 'dark:bg-gray-900 dark:text-gray-300' }])}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {t('emails.settings.add_category', 'Add a category')}
        </button>
      </section>

      <SaveBar isNew={false} dirty={dirty} saving={saving} onSave={save} onDiscard={() => setList(saved)} saveLabel={t('admin.saveBar.save', 'Save')} text={words.bar} />
      {dialog}
    </div>
  );
}
