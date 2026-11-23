'use client';

/**
 * Session-pack products: which coaching service the product is (parent or
 * child coaching) and how long a session is. Approved mockup
 * "7 · מוצר: הגדרת השירות". The service decides whether the enrollment picks
 * a child, and which service's "open a package" list shows the product.
 * Stored on the product: metadata.coaching_kind and session_duration_minutes.
 */
import { useAdminLanguage } from '@/context/AppContext';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type CoachingKind = 'parent' | 'child';
const MINUTES = [30, 45, 50, 60, 75, 90, 120];

export function CoachingServiceFields({
  kind,
  onKindChange,
  minutes,
  onMinutesChange,
  t,
}: {
  kind: CoachingKind | null;
  onKindChange: (kind: CoachingKind) => void;
  minutes: number | null;
  onMinutesChange: (minutes: number) => void;
  t: (key: string, fallback: string) => string;
}) {
  const { direction } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const options: { value: CoachingKind; name: string; text: string; tile: string }[] = [
    {
      value: 'parent',
      name: t('admin.coaching.kind.parent', 'ליווי הורי'),
      text: t('products.coaching.parentText', 'ההורה עצמו בליווי'),
      tile: 'from-violet-600 to-violet-900',
    },
    {
      value: 'child',
      name: t('admin.coaching.kind.child', 'ליווי ילד'),
      text: t('products.coaching.childText', 'בהרשמה בוחרים או מוסיפים ילד'),
      tile: 'from-teal-600 to-teal-800',
    },
  ];
  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <p className="text-base font-semibold">{t('products.coaching.title', 'איזה שירות זה?')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('products.coaching.help', 'קובע אם בהרשמה בוחרים ילד, ואיפה זה מופיע ללקוח בפורטל.')}</p>
      </div>
      <div role="radiogroup" aria-label={t('products.coaching.title', 'איזה שירות זה?')} className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const on = kind === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onKindChange(o.value)}
              className={`flex items-center gap-3 rounded-[14px] p-3.5 text-start transition-colors ${on ? 'border-2 border-primary bg-primary/5' : 'border border-border bg-card hover:border-primary/40'}`}
            >
              <span className={`h-[52px] w-[52px] shrink-0 rounded-xl bg-gradient-to-br ${o.tile}`} aria-hidden />
              <span>
                <b className="block text-base">{o.name}</b>
                <span className="text-[13px] text-muted-foreground">{o.text}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="max-w-xs space-y-2">
        <Label htmlFor="session-minutes">{t('products.coaching.minutes', 'אורך מפגש')}</Label>
        <Select value={String(minutes ?? 50)} onValueChange={(v) => onMinutesChange(Number(v))} dir={direction}>
          <SelectTrigger id="session-minutes" className={`h-11 ${rtl ? 'text-right' : 'text-left'}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent dir={direction}>
            {MINUTES.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {t('products.coaching.minutesN', '{n} דקות').replace('{n}', String(m))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
