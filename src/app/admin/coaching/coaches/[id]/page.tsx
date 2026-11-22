'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import {
  api,
  BackLink,
  Btn,
  ErrorBox,
  errText,
  Field,
  FieldError,
  fmtDate,
  fmtTime,
  inputCls,
  isoToLocal,
  Loading,
  localToIso,
  Note,
  PageHeader,
  Section,
  tf,
  type Dir,
  type TFn,
} from '@/components/admin/coaching/shared';

interface Range {
  weekday: number;
  start_time: string;
  end_time: string;
}
interface TimeOff {
  id: string;
  starts_at: string;
  ends_at: string;
  note: string | null;
  booked_sessions: number;
}
interface Hours {
  coach: { id: string; name: string };
  timezone: string;
  weekly: Range[];
  time_off: TimeOff[];
}

const hhmm = (s: string) => (s || '').slice(0, 5);

export default function CoachHoursPage() {
  const { id } = useParams<{ id: string }>();
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [data, setData] = useState<Hours | null>(null);
  const [weekly, setWeekly] = useState<Range[]>([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [offOpen, setOffOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const apply = (h: Hours, resetWeekly: boolean) => {
    setData(h);
    if (resetWeekly) {
      setWeekly((h.weekly ?? []).map((r) => ({ ...r, start_time: hhmm(r.start_time), end_time: hhmm(r.end_time) })));
      setDirty(false);
      setShowErrors(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      apply(await api<Hours>(`/api/admin/coaching/coaches/${id}/hours`), true);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const days = [
    t('admin.coaching.hours.day0', 'ראשון'),
    t('admin.coaching.hours.day1', 'שני'),
    t('admin.coaching.hours.day2', 'שלישי'),
    t('admin.coaching.hours.day3', 'רביעי'),
    t('admin.coaching.hours.day4', 'חמישי'),
    t('admin.coaching.hours.day5', 'שישי'),
    t('admin.coaching.hours.day6', 'שבת'),
  ];

  const rangeError = (i: number): string | undefined => {
    const r = weekly[i];
    if (!r.start_time || !r.end_time) return t('admin.coaching.hours.errEmpty', 'יש למלא שעת התחלה ושעת סיום.');
    if (r.start_time >= r.end_time) return t('admin.coaching.hours.errOrder', 'שעת הסיום צריכה להיות אחרי שעת ההתחלה.');
    const overlap = weekly.some(
      (o, j) => j !== i && o.weekday === r.weekday && o.start_time && o.end_time && o.start_time < r.end_time && r.start_time < o.end_time,
    );
    if (overlap) return t('admin.coaching.hours.errOverlap', 'הטווח הזה חופף לטווח אחר באותו יום.');
    return undefined;
  };

  const update = (i: number, patch: Partial<Range>) => {
    setWeekly((w) => w.map((r, j) => (j === i ? { ...r, ...patch } : r)));
    setDirty(true);
  };
  const remove = (i: number) => {
    setWeekly((w) => w.filter((_, j) => j !== i));
    setDirty(true);
  };
  const add = (weekday: number) => {
    const sameDay = weekly.filter((r) => r.weekday === weekday).sort((a, b) => a.end_time.localeCompare(b.end_time));
    const last = sameDay[sameDay.length - 1];
    const start = last?.end_time || '16:00';
    const [h, m] = start.split(':').map(Number);
    const end = h + 2 > 23 ? '23:59' : `${String(h + 2).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setWeekly((w) => [...w, { weekday, start_time: start, end_time: end }]);
    setDirty(true);
  };

  const save = async () => {
    if (weekly.some((_, i) => rangeError(i))) {
      setShowErrors(true);
      toast.error(t('admin.coaching.common.fixErrors', 'יש שדות שצריך להשלים. הסיבה מופיעה באדום ליד כל שדה.'));
      return;
    }
    setSaving(true);
    try {
      apply(await api<Hours>(`/api/admin/coaching/coaches/${id}/hours`, { method: 'PUT', body: { weekly } }), true);
      toast.success(t('admin.coaching.hours.saved', 'השעות נשמרו.'));
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  const deleteOff = async (off: TimeOff) => {
    if (!confirm(t('admin.coaching.hours.deleteOffConfirm', 'למחוק את החסימה? הימים האלה יחזרו להיות ימי עבודה של המטפלת.'))) return;
    setDeleting(off.id);
    try {
      apply(await api<Hours>(`/api/admin/coaching/coaches/${id}/time-off/${off.id}`, { method: 'DELETE' }), false);
      toast.success(t('admin.coaching.hours.offDeleted', 'החסימה נמחקה'));
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setDeleting(null);
    }
  };

  const offLabel = (o: TimeOff) => {
    const s = isoToLocal(o.starts_at);
    const e = isoToLocal(o.ends_at);
    if (s.time === '00:00' && e.time === '00:00') {
      const a = fmtDate(o.starts_at, language);
      const b = fmtDate(new Date(Date.parse(o.ends_at) - 1).toISOString(), language);
      return a === b ? a : `${a} – ${b}`;
    }
    const a = `${fmtDate(o.starts_at, language)} ${fmtTime(o.starts_at, language)}`;
    const b = s.date === e.date ? fmtTime(o.ends_at, language) : `${fmtDate(o.ends_at, language)} ${fmtTime(o.ends_at, language)}`;
    return `${a} – ${b}`;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        <CoachingTabs />
        <BackLink href="/admin/coaching/coaches" isRtl={isRtl}>
          {t('admin.coaching.hours.back', 'מטפלות')}
        </BackLink>
        {loading ? (
          <Loading />
        ) : error || !data ? (
          <ErrorBox t={t} message={error || ''} onRetry={load} />
        ) : (
          <>
            <PageHeader
              title={tf(t, 'admin.coaching.hours.title', '{name} · שעות פנויות', { name: data.coach.name })}
              description={t('admin.coaching.hours.subtitle', 'שעות העבודה של המטפלת (שעון ישראל), לעזרת הצוות בקביעת מפגשים. מפגש שכבר נקבע לא זז כשמשנים שעות.')}
              action={
                <Button onClick={save} disabled={saving} className="h-11">
                  <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('admin.coaching.hours.save', 'שמירת השעות')}
                </Button>
              }
            />
            {dirty && <Note tone="warn">{t('admin.coaching.hours.unsaved', 'יש שינויים בשעות שעוד לא נשמרו. לוחצים "שמירת השעות".')}</Note>}

            <div className="grid items-start gap-6 lg:grid-cols-3">
              <Section className="lg:col-span-2" title={t('admin.coaching.hours.weeklyTitle', 'שעות קבועות בכל שבוע')} contentClassName="p-0">
                {days.map((dayName, weekday) => {
                  const idx = weekly.map((r, i) => (r.weekday === weekday ? i : -1)).filter((i) => i >= 0);
                  return (
                    <div key={weekday} className="flex flex-wrap items-start gap-4 border-t px-6 py-3">
                      <span className="w-[70px] pt-3 text-sm font-semibold">{dayName}</span>
                      <div className="flex flex-1 flex-wrap items-start gap-2">
                        {idx.length === 0 && <span className="pt-3 text-sm text-muted-foreground">{t('admin.coaching.hours.notWorking', 'לא עובדת')}</span>}
                        {idx.map((i) => {
                          const err = showErrors ? rangeError(i) : undefined;
                          return (
                            <div key={i} className="space-y-1">
                              <div className={cn('flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-1.5', err && 'border-destructive')}>
                                <Label className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                                  {t('admin.coaching.hours.from', 'מ-')}
                                  <Input
                                    type="time"
                                    step={300}
                                    value={weekly[i].start_time}
                                    onChange={(e) => update(i, { start_time: e.target.value })}
                                    aria-label={tf(t, 'admin.coaching.hours.fromAria', '{day}, משעה', { day: dayName })}
                                    className={cn(inputCls, 'w-[120px]')}
                                  />
                                </Label>
                                <Label className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                                  {t('admin.coaching.hours.to', 'עד')}
                                  <Input
                                    type="time"
                                    step={300}
                                    value={weekly[i].end_time}
                                    onChange={(e) => update(i, { end_time: e.target.value })}
                                    aria-label={tf(t, 'admin.coaching.hours.toAria', '{day}, עד שעה', { day: dayName })}
                                    className={cn(inputCls, 'w-[120px]')}
                                  />
                                </Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-11 w-11"
                                  onClick={() => remove(i)}
                                  aria-label={t('admin.coaching.hours.removeRange', 'מחיקת טווח השעות')}
                                  title={t('admin.coaching.hours.removeRange', 'מחיקת טווח השעות')}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <FieldError>{err}</FieldError>
                            </div>
                          );
                        })}
                        <Btn className="border-dashed" onClick={() => add(weekday)}>
                          <Plus className="h-4 w-4" />
                          {idx.length === 0 ? t('admin.coaching.hours.addHours', 'הוספת שעות') : t('admin.coaching.hours.addRange', 'טווח נוסף')}
                        </Btn>
                      </div>
                    </div>
                  );
                })}
              </Section>

              <Section
                title={t('admin.coaching.hours.offTitle', 'חופשות וימים חסומים')}
                description={t('admin.coaching.hours.offSavedHint', 'חסימת תאריכים נשמרת מיד, בלי כפתור השמירה.')}
                contentClassName="space-y-3"
              >
                {data.time_off.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t('admin.coaching.hours.noOff', 'אין חסימות. המטפלת עובדת בכל השעות הקבועות.')}</p>
                )}
                {data.time_off.map((o) => (
                  <div key={o.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold">{offLabel(o)}</div>
                        {o.note && <div className="text-xs text-muted-foreground">{o.note}</div>}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        disabled={deleting === o.id}
                        onClick={() => deleteOff(o)}
                        aria-label={t('admin.coaching.hours.deleteOff', 'מחיקת החסימה')}
                        title={t('admin.coaching.hours.deleteOff', 'מחיקת החסימה')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {o.booked_sessions > 0 && (
                      <Note tone="warn">
                        {o.booked_sessions === 1
                          ? t('admin.coaching.hours.bookedOne', 'יש מפגש אחד שנקבע בימים האלה. יש להעביר או לבטל אותו בנפרד, בעמוד של הילד.')
                          : tf(t, 'admin.coaching.hours.bookedMany', 'יש {n} מפגשים שנקבעו בימים האלה. יש להעביר או לבטל אותם בנפרד, בעמוד של כל ילד.', {
                              n: o.booked_sessions,
                            })}
                      </Note>
                    )}
                  </div>
                ))}
                <Btn className="w-full border-dashed" onClick={() => setOffOpen(true)}>
                  <Plus className="h-4 w-4" />
                  {t('admin.coaching.hours.addOff', 'חסימת תאריכים')}
                </Btn>
              </Section>
            </div>

            <div className="flex">
              <Btn tone="primary" busy={saving} onClick={save}>
                <Save className="h-4 w-4" />
                {t('admin.coaching.hours.save', 'שמירת השעות')}
              </Btn>
            </div>

            <TimeOffDialog
              open={offOpen}
              t={t}
              direction={direction}
              onClose={() => setOffOpen(false)}
              onSave={async (body) => {
                try {
                  apply(await api<Hours>(`/api/admin/coaching/coaches/${id}/time-off`, { method: 'POST', body }), false);
                  toast.success(t('admin.coaching.hours.offAdded', 'התאריכים נחסמו.'));
                  setOffOpen(false);
                } catch (e) {
                  toast.error(errText(e));
                }
              }}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function nextDay(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function TimeOffDialog({
  open,
  t,
  direction,
  onClose,
  onSave,
}: {
  open: boolean;
  t: TFn;
  direction: Dir;
  onClose: () => void;
  onSave: (body: { starts_at: string; ends_at: string; note?: string }) => Promise<void>;
}) {
  const isRtl = direction === 'rtl';
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [fromTime, setFromTime] = useState('09:00');
  const [toTime, setToTime] = useState('17:00');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setFrom('');
      setTo('');
      setAllDay(true);
      setFromTime('09:00');
      setToTime('17:00');
      setNote('');
      setErrors({});
    }
  }, [open]);

  const save = async () => {
    const e: { from?: string; to?: string } = {};
    const end = to || from;
    if (!from) e.from = t('admin.coaching.hours.errFrom', 'יש לבחור את היום הראשון.');
    let starts_at = '';
    let ends_at = '';
    if (from) {
      starts_at = localToIso(from, allDay ? '00:00' : fromTime);
      ends_at = allDay ? localToIso(nextDay(end), '00:00') : localToIso(end, toTime);
      if (Date.parse(ends_at) <= Date.parse(starts_at)) e.to = t('admin.coaching.hours.errTo', 'הסיום צריך להיות אחרי ההתחלה.');
    }
    setErrors(e);
    if (e.from || e.to) return;
    setBusy(true);
    try {
      await onSave({ starts_at, ends_at, note: note.trim() || undefined });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>{t('admin.coaching.hours.offDialogTitle', 'חסימת תאריכים')}</DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {t('admin.coaching.hours.offDialogDesc', 'בימים האלה המטפלת לא זמינה למפגשים. מפגשים שכבר נקבעו לא מתבטלים לבד.')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="off-from" label={t('admin.coaching.hours.offFrom', 'מתאריך')} error={errors.from}>
            <Input id="off-from" type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field id="off-to" label={t('admin.coaching.hours.offTo', 'עד תאריך (כולל)')} error={errors.to}>
            <Input id="off-to" type="date" className={inputCls} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Label htmlFor="off-allday" className="flex min-h-[44px] cursor-pointer items-center gap-3 font-normal sm:col-span-2">
            <Checkbox id="off-allday" checked={allDay} onCheckedChange={(v) => setAllDay(v === true)} />
            {t('admin.coaching.hours.allDay', 'ימים שלמים')}
          </Label>
          {!allDay && (
            <>
              <Field id="off-from-time" label={t('admin.coaching.hours.offFromTime', 'משעה')}>
                <Input id="off-from-time" type="time" step={300} className={inputCls} value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
              </Field>
              <Field id="off-to-time" label={t('admin.coaching.hours.offToTime', 'עד שעה')}>
                <Input id="off-to-time" type="time" step={300} className={inputCls} value={toTime} onChange={(e) => setToTime(e.target.value)} />
              </Field>
            </>
          )}
          <Field id="off-note" className="sm:col-span-2" label={t('admin.coaching.hours.offNote', 'הערה (לא חובה), למשל "חופשה"')}>
            <Input id="off-note" className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        <DialogFooter className="gap-2">
          <Btn disabled={busy} onClick={onClose}>
            {t('admin.coaching.common.back', 'חזרה')}
          </Btn>
          <Btn tone="primary" busy={busy} onClick={save}>
            {t('admin.coaching.hours.offSave', 'חסימת התאריכים')}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
