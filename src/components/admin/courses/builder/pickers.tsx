'use client';

import { useMemo, useState } from 'react';
import { Combobox } from '@/components/ui/combobox';
import { Switch } from '@/components/ui/switch';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import type { Translate } from './types';

/** The short list everyone needs first; every other zone follows. */
const COMMON_ZONES = ['Asia/Jerusalem', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'UTC'];

/** "Israel Time (Jerusalem)": the zone's name in the admin's language, then its city. */
export function zoneLabel(zone: string, locale: string): string {
  const city = zone.split('/').pop()?.replace(/_/g, ' ') ?? zone;
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: 'longGeneric' }).formatToParts(new Date());
    const name = parts.find((p) => p.type === 'timeZoneName')?.value;
    return name && name !== zone ? `${name} (${city})` : city;
  } catch {
    return city;
  }
}

/**
 * A time zone picker you can search, with every zone the browser knows, named
 * in the admin's language. The tenant's own zone and the common ones come first.
 */
export function TimezonePicker({
  value,
  onChange,
  tenantTimezone,
  locale,
  t,
}: {
  value: string;
  onChange: (zone: string) => void;
  tenantTimezone: string;
  locale: string;
  t: Translate;
}) {
  const options = useMemo(() => {
    let all: string[] = [];
    try {
      all = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
    } catch {
      all = [];
    }
    const first = Array.from(new Set([tenantTimezone, value, ...COMMON_ZONES].filter(Boolean)));
    const rest = all.filter((z) => !first.includes(z));
    return [...first, ...rest].map((z) => ({ value: z, label: zoneLabel(z, locale) }));
  }, [tenantTimezone, value, locale]);

  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={(v) => v && onChange(v)}
      placeholder={t('admin.courses.builder.timezonePick', 'Choose a time zone')}
      searchPlaceholder={t('admin.courses.builder.timezoneSearch', 'Search a city or country')}
      emptyText={t('admin.courses.builder.timezoneNone', 'No time zone found')}
      className="w-full"
    />
  );
}

/** One-click lengths, plus "Other" for any number of minutes. */
export function DurationPicker({
  value,
  onChange,
  t,
  id,
}: {
  value: string;
  onChange: (minutes: string) => void;
  t: Translate;
  id?: string;
}) {
  const presets = ['30', '45', '60', '90'];
  const [custom, setCustom] = useState(!presets.includes(value));
  const chipCls = (on: boolean) => `${joinedSegment(on)} min-h-10`;
  return (
    <div className="flex flex-wrap items-center gap-2" id={id}>
     <div className={joinedBar} role="group">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={!custom && value === p}
          onClick={() => {
            setCustom(false);
            onChange(p);
          }}
          className={chipCls(!custom && value === p)}
        >
          {t('admin.courses.builder.minutes', '{n} min').replace('{n}', p)}
        </button>
      ))}
      <button type="button" aria-pressed={custom} onClick={() => setCustom(true)} className={chipCls(custom)}>
        {t('admin.courses.builder.otherLength', 'Other')}
      </button>
     </div>
      {custom && (
        <input
          type="number"
          min={5}
          max={600}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={t('lms.lesson.duration_label', 'Duration (minutes)')}
          className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm"
        />
      )}
    </div>
  );
}

/** "One" or "Several": the switch at the top of the add windows. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={joinedBar}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`${joinedSegment(value === o.value)} min-h-10 px-4`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled on/off row: title, a short hint, and the switch. */
export function SwitchRow({ title, hint, checked, onChange }: { title: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        {hint && <div className="text-[13px] text-muted-foreground">{hint}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} />
    </div>
  );
}
