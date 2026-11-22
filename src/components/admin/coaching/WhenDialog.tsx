'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Btn, Field, inputCls, isoToLocal, localToIso, type Dir, type TFn } from './shared';

/**
 * Asks for a date and a time (Israel time) and hands back a UTC ISO string.
 * Used to book a session for the parent and to move a session.
 */
export function WhenDialog({
  open,
  onOpenChange,
  t,
  direction,
  title,
  description,
  confirmLabel,
  initialIso,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  t: TFn;
  direction: Dir;
  title: string;
  description?: string;
  confirmLabel: string;
  initialIso?: string | null;
  onConfirm: (iso: string) => Promise<void>;
}) {
  const isRtl = direction === 'rtl';
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialIso) {
      const l = isoToLocal(initialIso);
      setDate(l.date);
      setTime(l.time);
    } else {
      setDate('');
      setTime('');
    }
    setErrors({});
  }, [open, initialIso]);

  const confirm = async () => {
    const e: { date?: string; time?: string } = {};
    if (!date) e.date = t('admin.coaching.when.errDate', 'יש לבחור תאריך.');
    if (!time) e.time = t('admin.coaching.when.errTime', 'יש לבחור שעה.');
    setErrors(e);
    if (e.date || e.time) return;
    setBusy(true);
    try {
      await onConfirm(localToIso(date, time));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>{title}</DialogTitle>
          {description && <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="when-date" label={t('admin.coaching.when.date', 'תאריך')} error={errors.date}>
            <Input id="when-date" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field id="when-time" label={t('admin.coaching.when.time', 'שעה (שעון ישראל)')} error={errors.time}>
            <Input id="when-time" type="time" step={300} className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Btn disabled={busy} onClick={() => onOpenChange(false)}>
            {t('admin.coaching.common.back', 'חזרה')}
          </Btn>
          <Btn tone="primary" busy={busy} onClick={confirm}>
            {confirmLabel}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
