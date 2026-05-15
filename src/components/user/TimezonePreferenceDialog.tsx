'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Clock, Check, Loader2, Search } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import moment from 'moment-timezone';

interface TimezonePreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTimezone: string | null;
  tenantTimezone?: string | null;
  onTimezoneChanged?: () => void;
}

// Curated short-list shown first; all other IANA zones are reachable via
// the search box below.
const FEATURED = [
  'Asia/Jerusalem',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

interface ZoneOption {
  value: string;
  label: string;
  offset: number;
}

function buildZones(): ZoneOption[] {
  return moment.tz
    .names()
    .map((tz) => ({
      value: tz,
      label: `${tz} (UTC${moment.tz(tz).format('Z')})`,
      offset: moment.tz(tz).utcOffset(),
    }))
    .sort((a, b) => a.offset - b.offset);
}

export function TimezonePreferenceDialog({
  open,
  onOpenChange,
  currentTimezone,
  tenantTimezone,
  onTimezoneChanged,
}: TimezonePreferenceDialogProps) {
  const { t, direction } = useUserLanguage();
  const [selected, setSelected] = useState<string | null>(currentTimezone);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(currentTimezone);
      setSearch('');
    }
  }, [open, currentTimezone]);

  const allZones = useMemo(() => buildZones(), []);

  const filteredZones = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      // No search: featured first, then everything else by UTC offset.
      const featuredSet = new Set(FEATURED);
      const featured = allZones.filter((z) => featuredSet.has(z.value));
      const featuredOrdered = FEATURED.map((tz) => featured.find((z) => z.value === tz)).filter(
        Boolean
      ) as ZoneOption[];
      const rest = allZones.filter((z) => !featuredSet.has(z.value));
      return [...featuredOrdered, ...rest];
    }
    return allZones.filter((z) => z.label.toLowerCase().includes(q));
  }, [allZones, search]);

  const handleSave = async () => {
    try {
      setSaving(true);
      // `selected === null` → persist NULL so the fallback chain
      // (datetime/timezone.ts) resolves to tenant / lesson timezone.
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: selected }),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.error || 'Failed to update timezone');
      }
      toast.success(t('user.profile.preferences.timezoneUpdated', 'אזור הזמן עודכן בהצלחה'));
      onOpenChange(false);
      if (onTimezoneChanged) onTimezoneChanged();
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast.error(t('user.profile.preferences.timezoneUpdateError', 'עדכון אזור הזמן נכשל'));
    } finally {
      setSaving(false);
    }
  };

  const isAuto = selected === null;
  const autoLabel = tenantTimezone
    ? `${t('user.profile.preferences.timezoneAuto', 'אוטומטי (ברירת המחדל של הארגון)')} — ${tenantTimezone}`
    : t('user.profile.preferences.timezoneAuto', 'אוטומטי (ברירת המחדל של הארגון)');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] flex flex-col max-h-[85vh]"
        dir={direction}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t('user.profile.preferences.selectTimezone', 'בחירת אזור זמן')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'user.profile.preferences.timezoneDescription',
              'אזור הזמן ישפיע על תצוגת תאריכים ושעות בכל הפלטפורמה.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('user.profile.preferences.timezoneSearch', 'חיפוש אזור זמן…')}
            className="ps-9"
          />
        </div>

        {/* Auto (always visible at the top) */}
        <button
          type="button"
          onClick={() => setSelected(null)}
          className={cn(
            'w-full text-start p-4 rounded-lg border-2 transition-all',
            isAuto
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-border hover:border-primary/50 hover:bg-accent/50'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={cn('font-semibold', isAuto && 'text-primary')}>{autoLabel}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  'user.profile.preferences.timezoneAutoHelp',
                  'נשתמש באזור הזמן של הארגון או של השיעור.'
                )}
              </p>
            </div>
            {isAuto && <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
          </div>
        </button>

        <Label className="text-sm font-semibold mt-2">
          {t('user.profile.preferences.availableTimezones', 'אזורי זמן זמינים')}
        </Label>

        <div className="flex-1 overflow-y-auto space-y-1.5 pe-1 min-h-0">
          {filteredZones.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">
              {t('user.profile.preferences.timezoneNoResults', 'לא נמצאו אזורי זמן תואמים.')}
            </p>
          ) : (
            filteredZones.map((tz) => {
              const isSelected = selected === tz.value;
              return (
                <button
                  key={tz.value}
                  type="button"
                  onClick={() => setSelected(tz.value)}
                  className={cn(
                    'w-full text-start px-3 py-2 rounded-md border transition-all flex items-center justify-between gap-2',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-accent/50'
                  )}
                >
                  <div className="min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        isSelected && 'text-primary'
                      )}
                    >
                      {tz.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{tz.label.match(/\(.*?\)/)?.[0]}</p>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('common.cancel', 'ביטול')}
          </Button>
          <Button onClick={handleSave} disabled={saving || selected === currentTimezone}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {saving
              ? t('common.saving', 'שומר…')
              : t('common.save', 'שמירה')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
