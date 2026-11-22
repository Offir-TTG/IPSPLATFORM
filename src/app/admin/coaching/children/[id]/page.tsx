'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Plus, UserX } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import { WhenDialog } from '@/components/admin/coaching/WhenDialog';
import {
  api,
  BackLink,
  Btn,
  childLabel,
  coachOptionLabel,
  Empty,
  ErrorBox,
  errText,
  Field,
  FieldError,
  fmtDate,
  fmtDateTime,
  Loading,
  Note,
  Pill,
  Section,
  tf,
  UiSelect,
  type Dir,
  type TFn,
} from '@/components/admin/coaching/shared';

interface Session {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  zoom_join_url: string | null;
  cancelled_at: string | null;
  needs_marking: boolean;
}
interface Question {
  id: string;
  label: string;
  kind: string;
  options?: string[];
  required?: boolean;
  help?: string;
}
interface PackDetail {
  enrollment_id: string;
  status: string;
  child: { id: string | null; name: string | null; age: number | null };
  waiting_for_parent_signup: boolean;
  parent: { id: string | null; name: string | null; email: string | null; phone: string | null };
  coach: { id: string; name: string } | null;
  product: { id: string; title: string; session_count: number | null; session_minutes: number | null } | null;
  sessions_used: number;
  sessions_booked: number;
  sessions: Session[];
  intake: { questions: Question[]; answers: Record<string, any>; submitted_at: string | null; updated_at: string | null; locked: boolean } | null;
  payments: { paid: number; total: number };
}
interface Coach {
  id: string;
  name: string;
  weekly_hours: number;
}

export default function ChildCoachingPage() {
  const { id } = useParams<{ id: string }>();
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [bookOpen, setBookOpen] = useState(false);
  const [moving, setMoving] = useState<Session | null>(null);
  const [cancelling, setCancelling] = useState<Session | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      setError(null);
      try {
        setPack(await api<PackDetail>(`/api/admin/coaching/packs/${id}`));
      } catch (e) {
        setError(errText(e));
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      await load(true);
      return true;
    } catch (e) {
      toast.error(errText(e));
      return false;
    } finally {
      setBusy(null);
    }
  };

  const mark = (s: Session, action: 'done' | 'no_show') =>
    run(
      s.id + action,
      () => api(`/api/admin/coaching/sessions/${s.id}`, { method: 'PATCH', body: { action } }),
      action === 'done' ? t('admin.coaching.child.markedDone', 'סומן שהמפגש התקיים') : t('admin.coaching.child.markedNoShow', 'סומן שלא הגיעו'),
    );

  // Number the sessions in time order, leaving out ones cancelled in time.
  const numbers = useMemo(() => {
    const m = new Map<string, number>();
    if (!pack) return m;
    [...pack.sessions]
      .filter((s) => s.status !== 'cancelled')
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .forEach((s, i) => m.set(s.id, i + 1));
    return m;
  }, [pack]);

  // Needs marking first, then upcoming (soonest first), then the past (latest first).
  const sorted = useMemo(() => {
    if (!pack) return [] as Session[];
    const now = Date.now();
    const rank = (s: Session) => (s.needs_marking ? 0 : s.status === 'booked' && Date.parse(s.starts_at) > now ? 1 : 2);
    return [...pack.sessions].sort((a, b) => {
      const r = rank(a) - rank(b);
      if (r) return r;
      return rank(a) === 1 ? a.starts_at.localeCompare(b.starts_at) : b.starts_at.localeCompare(a.starts_at);
    });
  }, [pack]);

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        <CoachingTabs />
        <BackLink href="/admin/coaching/children" isRtl={isRtl}>
          {t('admin.coaching.child.back', 'ילדים באימון')}
        </BackLink>

        {loading ? (
          <Loading />
        ) : error || !pack ? (
          <ErrorBox t={t} message={error || ''} onRetry={() => load()} />
        ) : (
          <>
            {pack.waiting_for_parent_signup && (
              <Note tone="warn">
                {t(
                  'admin.coaching.child.waitingSignup',
                  'ההורה עוד לא סיים את ההרשמה בקישור שנשלח אליו במייל. אחרי שיסיים, החשבון שלו ייפתח והילד יצורף אליו.',
                )}
              </Note>
            )}

            <Header pack={pack} t={t} onChangeCoach={() => setCoachOpen(true)} />

            <div className="grid items-start gap-6 lg:grid-cols-3">
              <Section
                className="lg:col-span-2"
                title={t('admin.coaching.child.sessions', 'מפגשים')}
                action={
                  <Btn tone="primaryOutline" disabled={!pack.coach} onClick={() => setBookOpen(true)}>
                    <Plus className="h-4 w-4" />
                    {t('admin.coaching.child.bookForParent', 'קביעת מפגש בשם ההורה')}
                  </Btn>
                }
                contentClassName="p-0"
              >
                {!pack.coach && (
                  <p className="px-6 pb-3 text-sm text-muted-foreground">
                    {t('admin.coaching.child.needCoach', 'כדי לקבוע מפגש צריך קודם לבחור מטפלת (למעלה, "החלפה").')}
                  </p>
                )}
                {sorted.length === 0 ? (
                  <Empty>{t('admin.coaching.child.noSessions', 'עוד לא נקבעו מפגשים. קובעים מפגש כאן, וההורה מקבל עדכון בפורטל.')}</Empty>
                ) : (
                  sorted.map((s) => {
                    const n = numbers.get(s.id);
                    const upcoming = s.status === 'booked' && !s.needs_marking;
                    return (
                      <div key={s.id} className="flex flex-wrap items-center gap-3 border-t px-6 py-3">
                        <span className={cn('flex-[1_1_200px] text-sm', !upcoming && !s.needs_marking && 'text-muted-foreground')}>
                          {n ? <strong className="text-foreground">{tf(t, 'admin.coaching.child.sessionN', 'מפגש {n}', { n })}</strong> : null}
                          {n ? ' · ' : ''}
                          {fmtDateTime(s.starts_at, language)}
                          {upcoming && s.zoom_join_url && (
                            <>
                              {' · '}
                              <a href={s.zoom_join_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                {t('admin.coaching.child.zoom', 'קישור לזום')}
                              </a>
                            </>
                          )}
                        </span>
                        <SessionPill s={s} t={t} />
                        {s.needs_marking && (
                          <>
                            <Btn busy={busy === s.id + 'done'} disabled={!!busy} onClick={() => mark(s, 'done')}>
                              <Check className="h-4 w-4" />
                              {t('admin.coaching.child.done', 'התקיים')}
                            </Btn>
                            <Btn busy={busy === s.id + 'no_show'} disabled={!!busy} onClick={() => mark(s, 'no_show')}>
                              <UserX className="h-4 w-4" />
                              {t('admin.coaching.child.noShow', 'לא הגיע')}
                            </Btn>
                          </>
                        )}
                        {upcoming && (
                          <>
                            <Btn disabled={!!busy} onClick={() => setMoving(s)}>
                              {t('admin.coaching.child.move', 'העברה')}
                            </Btn>
                            <Btn tone="danger" disabled={!!busy} onClick={() => setCancelling(s)}>
                              {t('admin.coaching.child.cancel', 'ביטול')}
                            </Btn>
                          </>
                        )}
                        {(s.status === 'done' || s.status === 'no_show') && (
                          <Btn tone="ghost" disabled={!!busy} className="text-xs text-muted-foreground" onClick={() => mark(s, s.status === 'done' ? 'no_show' : 'done')}>
                            {s.status === 'done'
                              ? t('admin.coaching.child.fixToNoShow', 'טעות? לסמן "לא הגיע"')
                              : t('admin.coaching.child.fixToDone', 'טעות? לסמן "התקיים"')}
                          </Btn>
                        )}
                      </div>
                    );
                  })
                )}
              </Section>

              <IntakePanel pack={pack} t={t} language={language} />
            </div>

            <WhenDialog
              open={bookOpen}
              onOpenChange={setBookOpen}
              t={t}
              direction={direction}
              title={t('admin.coaching.child.bookTitle', 'קביעת מפגש בשם ההורה')}
              description={tf(t, 'admin.coaching.child.bookDesc', 'אפשר לבחור כל שעה, גם מחוץ לשעות הקבועות של המטפלת. ההורה יקבל הודעה על המפגש.{minutes}', {
                minutes: pack.product?.session_minutes
                  ? ` ${tf(t, 'admin.coaching.child.lengthHint', 'אורך מפגש: {n} דקות.', { n: pack.product.session_minutes })}`
                  : '',
              })}
              confirmLabel={t('admin.coaching.child.bookConfirm', 'קביעת המפגש')}
              onConfirm={async (iso) => {
                const ok = await run(
                  'book',
                  () => api(`/api/admin/coaching/packs/${id}/sessions`, { method: 'POST', body: { starts_at: iso } }),
                  t('admin.coaching.child.booked', 'המפגש נקבע'),
                );
                if (ok) setBookOpen(false);
              }}
            />

            <WhenDialog
              open={!!moving}
              onOpenChange={(o) => !o && setMoving(null)}
              t={t}
              direction={direction}
              title={t('admin.coaching.child.moveTitle', 'העברת המפגש למועד אחר')}
              description={moving ? tf(t, 'admin.coaching.child.moveDesc', 'עכשיו: {when}. בוחרים את המועד החדש.', { when: fmtDateTime(moving.starts_at, language) }) : undefined}
              confirmLabel={t('admin.coaching.child.moveConfirm', 'העברת המפגש')}
              initialIso={moving?.starts_at}
              onConfirm={async (iso) => {
                if (!moving) return;
                const ok = await run(
                  'move',
                  () => api(`/api/admin/coaching/sessions/${moving.id}`, { method: 'PATCH', body: { action: 'move', starts_at: iso } }),
                  t('admin.coaching.child.moved', 'המפגש הועבר'),
                );
                if (ok) setMoving(null);
              }}
            />

            <CancelDialog
              session={cancelling}
              t={t}
              direction={direction}
              language={language}
              onClose={() => setCancelling(null)}
              onConfirm={async (counted) => {
                if (!cancelling) return;
                const ok = await run(
                  'cancel',
                  () => api(`/api/admin/coaching/sessions/${cancelling.id}?counted=${counted ? 1 : 0}`, { method: 'DELETE' }),
                  t('admin.coaching.child.cancelled', 'המפגש בוטל'),
                );
                if (ok) setCancelling(null);
              }}
            />

            <CoachDialog
              open={coachOpen}
              current={pack.coach?.id ?? null}
              t={t}
              direction={direction}
              onClose={() => setCoachOpen(false)}
              onSave={async (coachId) => {
                const ok = await run(
                  'coach',
                  () => api(`/api/admin/coaching/packs/${id}`, { method: 'PATCH', body: { coach_id: coachId } }),
                  t('admin.coaching.child.coachChanged', 'המטפלת הוחלפה'),
                );
                if (ok) setCoachOpen(false);
              }}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function Header({ pack, t, onChangeCoach }: { pack: PackDetail; t: TFn; onChangeCoach: () => void }) {
  const total = pack.product?.session_count ?? 0;
  const used = pack.sessions_used;
  const booked = pack.sessions_booked;
  const left = Math.max(0, total - used - booked);
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6">
        <div className="space-y-0.5">
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)' as any,
              color: 'hsl(var(--text-heading))',
            }}
          >
            {childLabel(t, pack.child.name, pack.child.age)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('admin.coaching.requests.parent', 'ההורה:')} {pack.parent.name || pack.parent.email || '—'}
            {pack.parent.phone ? ` · ${pack.parent.phone}` : ''}
          </p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{t('admin.coaching.child.pack', 'חבילה')}</p>
          <p className="text-sm font-semibold">{pack.product?.title || '—'}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">{t('admin.coaching.child.coach', 'מטפלת')}</p>
          <p className="flex items-center gap-1 text-sm font-semibold">
            {pack.coach?.name || t('admin.coaching.child.noCoach', 'לא נבחרה')}
            <Btn tone="ghost" className="px-2 font-normal text-primary" onClick={onChangeCoach}>
              {pack.coach ? t('admin.coaching.child.changeCoach', 'החלפה') : t('admin.coaching.child.chooseCoach', 'בחירה')}
            </Btn>
          </p>
        </div>
        <div className="min-w-[200px] flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {tf(t, 'admin.coaching.child.counts', 'מפגשים: {used} נוצלו · {booked} נקבעו · {left} נשארו', { used, booked, left })}
          </p>
          {total > 0 && <Progress value={Math.min(100, (used / total) * 100)} className="h-2" />}
        </div>
        {pack.payments.total > 0 ? (
          <Pill tone={pack.payments.paid >= pack.payments.total ? 'green' : 'amber'}>
            {tf(t, 'admin.coaching.child.paid', 'שולמו {paid} מתוך {total} תשלומים', pack.payments)}
          </Pill>
        ) : (
          <Pill>{t('admin.coaching.child.noPayments', 'ללא תשלום')}</Pill>
        )}
      </CardContent>
    </Card>
  );
}

function SessionPill({ s, t }: { s: Session; t: TFn }) {
  if (s.needs_marking) return <Pill tone="amber">{t('admin.coaching.child.needsMarking', 'עבר · צריך לסמן')}</Pill>;
  switch (s.status) {
    case 'booked':
      return <Pill tone="blue">{t('admin.coaching.child.statusBooked', 'נקבע')}</Pill>;
    case 'done':
      return <Pill tone="green">{t('admin.coaching.child.statusDone', 'התקיים')}</Pill>;
    case 'no_show':
      return <Pill tone="red">{t('admin.coaching.child.statusNoShow', 'לא הגיע (נספר)')}</Pill>;
    case 'late_cancelled':
      return <Pill>{t('admin.coaching.child.statusLateCancelled', 'בוטל פחות מ-24 שעות לפני (נספר)')}</Pill>;
    case 'cancelled':
      return <Pill>{t('admin.coaching.child.statusCancelled', 'בוטל (לא נספר)')}</Pill>;
    default:
      return <Pill>{s.status}</Pill>;
  }
}

function IntakePanel({ pack, t, language }: { pack: PackDetail; t: TFn; language: string }) {
  const intake = pack.intake;
  const filled = !!intake?.submitted_at;
  const show = (q: Question, v: any): string => {
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return t('admin.coaching.intake.noAnswer', 'לא נענה');
    if (q.kind === 'yes_no' || typeof v === 'boolean') {
      const yes = v === true || v === 'yes';
      return yes ? t('admin.coaching.common.yes', 'כן') : t('admin.coaching.common.no', 'לא');
    }
    if (Array.isArray(v)) return v.join(', ');
    if (q.kind === 'date' && typeof v === 'string') return fmtDate(v.length === 10 ? `${v}T12:00:00Z` : v, language) || v;
    return String(v);
  };
  const description = filled
    ? `${tf(t, 'admin.coaching.child.intakeFilled', 'מולא ע"י ההורה ב-{date}', { date: fmtDate(intake!.submitted_at, language) })} · ${
        intake!.locked ? t('admin.coaching.child.intakeLocked', 'נעול מאז המפגש הראשון') : t('admin.coaching.child.intakeOpen', 'ההורה עוד יכול לעדכן')
      }`
    : undefined;
  return (
    <Section title={t('admin.coaching.child.intakeTitle', 'שאלון פתיחה')} description={description} contentClassName="space-y-4">
      {!intake || !filled ? (
        <p className="text-sm text-muted-foreground">
          {t('admin.coaching.child.intakeNotFilled', 'ההורה עוד לא מילא את השאלון. הוא מופיע לו בפורטל אחרי פתיחת החבילה.')}
        </p>
      ) : (
        intake.questions.map((q) => (
          <div key={q.id} className="space-y-1">
            <p className="text-xs text-muted-foreground">{q.label}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed">{show(q, intake.answers?.[q.id])}</p>
          </div>
        ))
      )}
      <p className="border-t pt-3 text-xs text-muted-foreground">{t('admin.coaching.child.intakePrivacy', 'גלוי לצוות ולהורה בלבד.')}</p>
    </Section>
  );
}

function CancelDialog({
  session,
  t,
  direction,
  language,
  onClose,
  onConfirm,
}: {
  session: Session | null;
  t: TFn;
  direction: Dir;
  language: string;
  onClose: () => void;
  onConfirm: (counted: boolean) => Promise<void>;
}) {
  const isRtl = direction === 'rtl';
  const [busy, setBusy] = useState<'yes' | 'no' | null>(null);
  const late = session ? Date.parse(session.starts_at) - Date.now() < 24 * 3600 * 1000 : false;
  const go = async (counted: boolean) => {
    setBusy(counted ? 'yes' : 'no');
    try {
      await onConfirm(counted);
    } finally {
      setBusy(null);
    }
  };
  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>{t('admin.coaching.child.cancelTitle', 'ביטול המפגש')}</DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {session && fmtDateTime(session.starts_at, language)}
            {' · '}
            {t('admin.coaching.child.cancelQuestion', 'האם המפגש הזה נספר כמפגש שנוצל מהחבילה?')}
          </DialogDescription>
        </DialogHeader>
        {late && <Note tone="warn">{t('admin.coaching.child.cancelLateHint', 'נשארו פחות מ-24 שעות למפגש. לפי הכללים, ביטול מאוחר נספר.')}</Note>}
        <div className="flex flex-col gap-2">
          <Btn busy={busy === 'no'} disabled={!!busy} onClick={() => go(false)} className="justify-start whitespace-normal text-start">
            {t('admin.coaching.child.cancelNotCounted', 'לבטל בלי לספור (המפגש חוזר לחבילה)')}
          </Btn>
          <Btn busy={busy === 'yes'} disabled={!!busy} onClick={() => go(true)} className="justify-start whitespace-normal text-start">
            {t('admin.coaching.child.cancelCounted', 'לבטל ולספור כמפגש שנוצל')}
          </Btn>
        </div>
        <DialogFooter>
          <Btn tone="ghost" disabled={!!busy} onClick={onClose}>
            {t('admin.coaching.child.keepSession', 'לא לבטל')}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoachDialog({
  open,
  current,
  t,
  direction,
  onClose,
  onSave,
}: {
  open: boolean;
  current: string | null;
  t: TFn;
  direction: Dir;
  onClose: () => void;
  onSave: (coachId: string) => Promise<void>;
}) {
  const isRtl = direction === 'rtl';
  const [coaches, setCoaches] = useState<Coach[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue(current ?? '');
    setErr(undefined);
    setLoadErr(null);
    setCoaches(null);
    api<{ coaches: Coach[] }>('/api/admin/coaching/choices')
      .then((d) => setCoaches(d.coaches ?? []))
      .catch((e) => setLoadErr(errText(e)));
  }, [open, current]);

  const save = async () => {
    if (!value) return setErr(t('admin.coaching.newPack.errCoach', 'יש לבחור מטפלת.'));
    if (value === current) return onClose();
    setBusy(true);
    try {
      await onSave(value);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>{t('admin.coaching.child.coachTitle', 'בחירת מטפלת')}</DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {t('admin.coaching.child.coachDesc', 'אפשר להחליף מטפלת רק כשאין מפגשים קרובים שנקבעו. אם יש, קודם מבטלים או מעבירים אותם.')}
          </DialogDescription>
        </DialogHeader>
        {loadErr ? (
          <FieldError>{loadErr}</FieldError>
        ) : !coaches ? (
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Field id="coach-select" label={t('admin.coaching.child.coach', 'מטפלת')} error={err}>
            <UiSelect
              id="coach-select"
              direction={direction}
              value={value}
              onChange={(v) => {
                setValue(v);
                setErr(undefined);
              }}
              placeholder={t('admin.coaching.newPack.chooseCoach', 'בחירת מטפלת...')}
              options={coaches.map((c) => ({ value: c.id, label: coachOptionLabel(t, c) }))}
            />
          </Field>
        )}
        <DialogFooter className="gap-2">
          <Btn disabled={busy} onClick={onClose}>
            {t('admin.coaching.common.back', 'חזרה')}
          </Btn>
          <Btn tone="primary" busy={busy} disabled={!coaches} onClick={save}>
            {t('admin.coaching.child.coachSave', 'שמירת המטפלת')}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
