'use client';

import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';

export type PickerOption = { id: string; label: string; hint?: string };

/**
 * Pick several students, courses or programs: a search box over a ticked
 * list, with the chosen ones shown as chips above it. Same choices as the
 * old form's popovers, laid out in the page so nothing hides.
 */
export function TargetPicker({
  options,
  selected,
  onChange,
  searchPlaceholder,
  emptyText,
  noResultsText,
  invalid,
}: {
  options: PickerOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  searchPlaceholder: string;
  emptyText: string;
  noResultsText: string;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState('');
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => (o.label ?? '').toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q));
  }, [options, query]);
  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className={`rounded-xl border bg-card ${invalid ? 'border-red-400 dark:border-red-500' : 'border-border'}`}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-border/60 p-3">
          {selected.map((id) => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 text-xs font-medium text-blue-800 dark:text-blue-200">
              <bdi>{byId.get(id)?.label ?? id}</bdi>
              <button type="button" onClick={() => toggle(id)} aria-label="Remove" className="rounded-full p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative border-b border-border/60">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-t-xl bg-transparent pe-3 ps-9 text-sm outline-none"
        />
      </div>
      <ul className="max-h-64 overflow-y-auto p-1">
        {options.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
        ) : shown.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">{noResultsText}</li>
        ) : (
          shown.map((o) => {
            const on = selected.includes(o.id);
            return (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-sm hover:bg-muted ${on ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''}`}
                >
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-border'}`}>
                    {on && <Check className="h-3 w-3" />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <bdi>{o.label}</bdi>
                    {o.hint && <span className="ms-1.5 text-xs text-muted-foreground">{o.hint}</span>}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
