'use client';

/**
 * Choosing what a product opens, with search (approved mockup "Product
 * content picker"). One choice (a course, a lecture or a program): picking a
 * row closes the list into a card with "Change". Several (a bundle's
 * courses): chosen ones show as chips on top, each with ✕, and the list has
 * checkboxes. A link at the bottom opens a new course or program in a new
 * tab; the list reloads when the admin comes back to this tab.
 */

import { useMemo, useState } from 'react';
import { Check, Loader2, Plus, Search, X } from 'lucide-react';

export type PickerItem = {
  id: string;
  title: string;
  meta: string;
  /** Tag beside the name ("Course" / "Lecture"); also the filter it belongs to. */
  kind?: { key: string; label: string };
  imageUrl?: string | null;
};

type Common = {
  label: string;
  hint: string;
  items: PickerItem[];
  loading: boolean;
  error?: string;
  searchPlaceholder: string;
  emptyText: string;
  noneFoundText: string;
  createLabel: string;
  createHref: string;
  /** Filter buttons ("All", then one per kind). Shown when the items have more than one kind. */
  allLabel: string;
  dir: 'ltr' | 'rtl';
  t: (key: string, fallback: string) => string;
};

type Single = Common & { multiple?: false; value?: string; onChange: (id: string | undefined) => void };
type Multi = Common & { multiple: true; values: string[]; onChangeMany: (ids: string[]) => void };

const SHADES = ['#5b3a8e', '#2f6f8f', '#3f7d58', '#b0563b', '#7a5bab', '#8a5a12'];
const shadeOf = (id: string) => SHADES[[...id].reduce((a, ch) => a + ch.charCodeAt(0), 0) % SHADES.length];

function Thumb({ item, big }: { item: PickerItem; big?: boolean }) {
  const size = big ? 'h-[46px] w-16' : 'h-[37px] w-[52px]';
  return item.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.imageUrl} alt="" className={`${size} shrink-0 rounded-[10px] object-cover`} />
  ) : (
    <span aria-hidden className={`${size} shrink-0 rounded-[10px]`} style={{ background: shadeOf(item.id) }} />
  );
}

function KindTag({ kind }: { kind?: PickerItem['kind'] }) {
  if (!kind) return null;
  const lecture = kind.key === 'lecture';
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${lecture ? 'bg-amber-100 text-amber-900' : 'bg-primary/10 text-primary'}`}>
      {kind.label}
    </span>
  );
}

export function ContentPicker(props: Single | Multi) {
  const { label, hint, items, loading, error, searchPlaceholder, emptyText, noneFoundText, createLabel, createHref, allLabel, t } = props;
  const multiple = props.multiple === true;
  const chosenIds = multiple ? props.values : props.value ? [props.value] : [];
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [reopened, setReopened] = useState(false);

  const kinds = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of items) if (i.kind) map.set(i.kind.key, i.kind.label);
    return [...map.entries()];
  }, [items]);

  const q = query.trim().toLowerCase();
  const visible = items.filter((i) => (filter === 'all' || i.kind?.key === filter) && (!q || i.title.toLowerCase().includes(q)));
  const chosen = chosenIds.map((id) => items.find((i) => i.id === id)).filter(Boolean) as PickerItem[];
  const single = !multiple ? chosen[0] : undefined;
  const listOpen = multiple || !single || reopened;

  const pick = (id: string) => {
    if (props.multiple) {
      props.onChangeMany(chosenIds.includes(id) ? chosenIds.filter((x) => x !== id) : [...chosenIds, id]);
    } else {
      props.onChange(id);
      setReopened(false);
      setQuery('');
    }
  };

  const searchId = `picker-${label.length}-${multiple ? 'm' : 's'}`;

  return (
    <div className="grid gap-3" dir={props.dir}>
      <div className="grid gap-1">
        <label htmlFor={searchId} className="text-[15px] font-bold">
          {label} <span className="text-red-600">*</span>
        </label>
        <span className="text-[13px] text-muted-foreground">{hint}</span>
      </div>

      {/* One choice, made: a card with "Change". */}
      {single && (
        <div className="flex flex-wrap items-center gap-3.5 rounded-2xl border-2 border-primary bg-primary/[0.03] p-3.5">
          <Thumb item={single} big />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-base font-bold">{single.title}</span>
            {single.meta && <span className="text-[13px] text-muted-foreground">{single.meta}</span>}
          </span>
          <KindTag kind={single.kind} />
          {!reopened && (
            <button
              type="button"
              onClick={() => setReopened(true)}
              className="min-h-[44px] rounded-xl border border-border bg-card px-3.5 text-sm font-semibold text-primary hover:bg-muted"
            >
              {t('products.picker.change', 'Change')}
            </button>
          )}
        </div>
      )}

      {/* Several: chips on top. */}
      {multiple && (
        <div className="flex min-h-[44px] flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-2.5 py-2">
          {chosen.length === 0 ? (
            <span className="px-1 text-[13px] text-muted-foreground">{t('products.picker.noneChosen', 'No courses chosen yet')}</span>
          ) : (
            <>
              <span className="px-1 text-[13px] font-bold text-primary">
                {t('products.picker.chosenCount', '{n} chosen:').replace('{n}', String(chosen.length))}
              </span>
              {chosen.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pe-1.5 ps-3 text-[13px] font-semibold">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-[3px]" style={{ background: shadeOf(c.id) }} />
                  {c.title}
                  <button
                    type="button"
                    onClick={() => pick(c.id)}
                    aria-label={t('products.picker.remove', 'Remove {name}').replace('{name}', c.title)}
                    className="grid h-7 w-7 place-items-center rounded-full bg-muted hover:bg-muted-foreground/20"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => props.multiple && props.onChangeMany([])}
                className="ms-auto min-h-[36px] px-2.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
              >
                {t('products.picker.clearAll', 'Clear all')}
              </button>
            </>
          )}
        </div>
      )}

      {listOpen && (
        <div className="grid gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3.5 top-[15px] h-[18px] w-[18px] text-muted-foreground" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className={`h-12 w-full rounded-xl border-[1.5px] bg-card pe-3.5 ps-11 text-[15px] focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 ${error ? 'border-red-500' : 'border-border'}`}
            />
          </div>

          {kinds.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {[['all', allLabel] as [string, string], ...kinds].map(([key, text]) => {
                const on = filter === key;
                const count = items.filter((i) => key === 'all' || i.kind?.key === key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(key)}
                    className={`min-h-[36px] rounded-full border px-3.5 text-[13px] font-semibold ${on ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:bg-muted'}`}
                  >
                    {text} <span className="opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div role="listbox" aria-multiselectable={multiple || undefined} aria-label={label} className="max-h-[360px] overflow-y-auto rounded-2xl border border-border">
            {loading && (
              <div className="grid place-items-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
              </div>
            )}
            {!loading && items.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted-foreground">{emptyText}</div>}
            {!loading && items.length > 0 && visible.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">{noneFoundText}</div>
            )}
            {!loading &&
              visible.map((i) => {
                const on = chosenIds.includes(i.id);
                return (
                  <button
                    key={i.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(i.id)}
                    className={`flex min-h-[64px] w-full items-center gap-3 border-b border-border/60 px-3.5 py-2.5 text-start last:border-b-0 ${on ? 'bg-primary/[0.07]' : 'bg-card hover:bg-muted/50'}`}
                  >
                    {multiple ? (
                      <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-2 ${on ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-card'}`}>
                        {on && <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} aria-hidden />}
                      </span>
                    ) : (
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-primary' : 'border-muted-foreground/40'}`}>
                        {on && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                    )}
                    <Thumb item={i} />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold">{i.title}</span>
                      {i.meta && <span className="text-[13px] text-muted-foreground">{i.meta}</span>}
                    </span>
                    <KindTag kind={i.kind} />
                  </button>
                );
              })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <a
              href={createHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-primary no-underline hover:underline"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {createLabel}
            </a>
            {single && reopened && (
              <button type="button" onClick={() => setReopened(false)} className="min-h-[44px] px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                {t('common.cancel', 'Cancel')}
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
    </div>
  );
}
