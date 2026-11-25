'use client';

/**
 * The coaching package drawer (approved mockup "6 · מגירת חבילה"): where the
 * package is up to, the sessions held with their charges, and the actions:
 * a session took place (charged at once), add sessions, change coach, send
 * the link again, cancel the package. "Add sessions" opens its own panel
 * (mockup "8 · הוספת מפגשים").
 */
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { DrawerSection, DrawerShell, drawerButton, drawerPrimary } from '@/components/admin/drawer-kit';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import { api, Btn, errText, fmtDate, priceText, tf, UiSelect } from './shared';
import { KIND_MARK, kindName, perSession, statusName, statusStyle, type PackageRow } from './packageText';

interface PackageDetail extends Omit<PackageRow, 'pending_offer'> {
  parent_id: string | null;
  child_id: string | null;
  sent_at: string | null;
  needs_signature: boolean;
  signed: boolean;
  has_contract: boolean;
  card: { brand: string | null; last4: string | null; saved_at: string } | null;
  has_intake_form: boolean;
  intake_submitted_at: string | null;
  free: boolean;
  next_session_price: number | null;
  sessions: { id: string; number: number; held_at: string; status: string; coach_name: string | null; charge: { status: string; amount: number; error: string | null } | null }[];
  pending_offer: { id: string; sessions: number; session_amount: number; message: string | null; created_at: string } | null;
  offers: { id: string; sessions: number; session_amount: number; is_gift: boolean; status: string; created_at: string; decided_at: string | null }[];
}

const cardName = (c: PackageDetail['card']) => (c ? `${c.brand ? c.brand[0].toUpperCase() + c.brand.slice(1) : ''} ••${c.last4 ?? ''}`.trim() : '');

export function PackageDrawer({ enrollmentId, onClose, onChanged }: { enrollmentId: string | null; onClose: () => void; onChanged: () => void }) {
  const { t, language } = useAdminLanguage();
  const [pack, setPack] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmHeld, setConfirmHeld] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);

  const load = useCallback(async () => {
    if (!enrollmentId) return;
    setLoading(true);
    try {
      setPack(await api<PackageDetail>(`/api/admin/coaching/packages/${enrollmentId}`));
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setLoading(false);
    }
  }, [enrollmentId]);

  useEffect(() => {
    setPack(null);
    void load();
  }, [load]);

  const changed = async () => {
    await load();
    onChanged();
  };

  const money = (n: number) => priceText(n, pack?.currency ?? 'USD', language);
  const nextPrice = pack?.next_session_price ?? pack?.price_per_session ?? 0;

  const markHeld = async () => {
    if (!pack) return;
    setBusy('held');
    try {
      const res = await api<{ charge?: { ok: boolean; charged?: boolean; reason?: string; error?: string; amount?: number } }>(
        `/api/admin/coaching/packages/${pack.enrollment_id}`,
        { method: 'POST', body: { action: 'held' } },
      );
      const c = res.charge;
      if (c && c.ok === false) toast.error(tf(t, 'admin.coaching.drawer.heldChargeFailed', 'המפגש נרשם, אבל החיוב נכשל: {error}', { error: c.error ?? '' }));
      else if (c?.charged) toast.success(tf(t, 'admin.coaching.drawer.heldCharged', 'המפגש נרשם ונגבו {price}', { price: money(Number(c.amount ?? nextPrice)) }));
      else toast.success(t('admin.coaching.drawer.heldNoCharge', 'המפגש נרשם (ללא חיוב)'));
      setConfirmHeld(false);
      await changed();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const retry = async (sessionId: string) => {
    setBusy(`retry-${sessionId}`);
    try {
      await api(`/api/admin/coaching/sessions/${sessionId}`, { method: 'PATCH', body: { action: 'retry_charge' } });
      toast.success(t('admin.coaching.drawer.retryDone', 'החיוב עבר'));
      await changed();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const cancelOffer = async (offerId: string) => {
    setBusy('offer');
    try {
      await api(`/api/admin/coaching/offers/${offerId}`, { method: 'DELETE' });
      toast.success(t('admin.coaching.drawer.offerCancelled', 'ההצעה בוטלה'));
      await changed();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const resend = async () => {
    if (!pack) return;
    setBusy('resend');
    try {
      await api(`/api/admin/enrollments/${pack.enrollment_id}/send-link`, { method: 'POST', body: { language: 'he' } });
      toast.success(t('admin.coaching.drawer.linkSent', 'הקישור נשלח שוב'));
      await changed();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const cancelPackage = async () => {
    if (!pack) return;
    setBusy('cancel');
    try {
      await api(`/api/admin/coaching/packages/${pack.enrollment_id}`, { method: 'POST', body: { action: 'cancel' } });
      toast.success(t('admin.coaching.drawer.cancelled', 'החבילה בוטלה'));
      setConfirmCancel(false);
      await changed();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(null);
    }
  };

  const open = !!enrollmentId;
  const st = pack ? statusStyle(pack.status) : null;
  const name = pack ? (pack.kind === 'child' ? pack.child_name || t('admin.coaching.common.noChildName', 'ילד ללא שם') : pack.parent_name) : '';
  const title = pack ? (pack.kind === 'child' && pack.child_age != null ? tf(t, 'admin.coaching.drawer.nameAge', '{name} · גיל {age}', { name, age: pack.child_age }) : name) : '';
  const parentLine = pack
    ? [pack.kind === 'child' ? tf(t, 'admin.coaching.common.parentIs', 'הורה: {name}', { name: pack.parent_name }) : null, pack.parent_email].filter(Boolean).join(' · ')
    : '';
  const live = pack && pack.status !== 'cancelled' && pack.status !== 'ended';
  const canHold = pack && ['active', 'wait_intake'].includes(pack.status);

  return (
    <>
      <DrawerShell
        wide
        open={open}
        onClose={onClose}
        status={pack ? `${statusName(t, pack.status)} · ${kindName(t, pack.kind)}` : ''}
        statusDot={st?.dot ?? 'bg-muted'}
        lead={
          pack ? (
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-[12px] font-extrabold ${KIND_MARK[pack.kind].cls}`} aria-hidden>
              {t(KIND_MARK[pack.kind].key, KIND_MARK[pack.kind].fallback)}
            </span>
          ) : (
            <span />
          )
        }
        title={title || (loading ? t('admin.coaching.common.loading', 'טוען...') : '')}
        subtitle={parentLine ? <bdi dir="auto">{parentLine}</bdi> : undefined}
        description={t('admin.coaching.drawer.sr', 'פרטי חבילת הליווי')}
        stats={
          pack ? (
            <>
              <Stat label={t('admin.coaching.drawer.statSessions', 'מפגשים')} value={`${pack.sessions_used} / ${pack.sessions_total}`} />
              <Stat
                label={t('admin.coaching.drawer.statCharged', 'נגבה עד עכשיו')}
                value={pack.free ? t('admin.coaching.pay.free', 'ללא תשלום') : money(pack.charged_total)}
                sub={
                  pack.free
                    ? undefined
                    : [
                        pack.package_total > 0 ? tf(t, 'admin.coaching.drawer.packageTotal', 'סה״כ חבילה: {price}', { price: money(pack.package_total) }) : null,
                        perSession(t, pack.price_per_session, pack.currency, language),
                      ]
                        .filter(Boolean)
                        .join(' · ')
                }
              />
              <Stat label={t('admin.coaching.drawer.statCoach', 'מאמן/ת')} value={pack.coach_name ?? t('admin.coaching.common.noCoach', 'עדיין לא שובץ')} small />
            </>
          ) : null
        }
        footer={
          pack ? (
            <>
              {live && (
                <button type="button" className={drawerPrimary} onClick={() => setAddOpen(true)} disabled={!!busy}>
                  <Plus className="h-4 w-4" aria-hidden />
                  {t('admin.coaching.drawer.addSessions', 'הוספת מפגשים לחבילה')}
                </button>
              )}
              {live && (
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className={drawerButton} onClick={() => setCoachOpen(true)} disabled={!!busy}>
                    {t('admin.coaching.drawer.changeCoach', 'שינוי מאמן/ת')}
                  </button>
                  <button type="button" className={drawerButton} onClick={resend} disabled={!!busy}>
                    {busy === 'resend' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    {t('admin.coaching.drawer.resend', 'שליחת הקישור שוב')}
                  </button>
                </div>
              )}
              {live && (
                <button type="button" className={`${drawerButton} border-red-200 text-red-700 dark:border-red-900 dark:text-red-400`} onClick={() => setConfirmCancel(true)} disabled={!!busy}>
                  {t('admin.coaching.drawer.cancelPackage', 'ביטול החבילה')}
                </button>
              )}
            </>
          ) : null
        }
      >
        {!pack ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label={t('admin.coaching.common.loading', 'טוען...')} />
          </div>
        ) : (
          <>
            <DrawerSection title={t('admin.coaching.drawer.whereTitle', 'איפה זה עומד')}>
              <ol className="m-0 flex list-none flex-col gap-2.5 p-3.5 text-sm">
                <Step done={!!pack.sent_at}>
                  {pack.sent_at
                    ? tf(t, 'admin.coaching.drawer.sent', 'נשלח ל{who} · {date}', { who: pack.kind === 'child' ? t('admin.coaching.drawer.toParent', 'הורה') : t('admin.coaching.drawer.toClient', 'לקוח'), date: fmtDate(pack.sent_at, language) })
                    : t('admin.coaching.drawer.notSent', 'הקישור עוד לא נשלח')}
                </Step>
                {pack.needs_signature && (
                  <Step done={pack.signed}>
                    {pack.signed ? t('admin.coaching.drawer.signed', 'החוזה נחתם') : t('admin.coaching.drawer.waitSign', 'ממתין לחתימה על החוזה')}
                    {pack.has_contract && (
                      <>
                        {' · '}
                        <a href={`/api/admin/coaching/packages/${pack.enrollment_id}/contract`} target="_blank" rel="noreferrer" className="font-semibold text-primary no-underline hover:underline">
                          {t('admin.coaching.drawer.downloadContract', 'להורדת החוזה')}
                        </a>
                      </>
                    )}
                  </Step>
                )}
                {!pack.free && (
                  <Step done={!!pack.card || pack.status === 'active' || pack.status === 'wait_intake'}>
                    {pack.card
                      ? tf(t, 'admin.coaching.drawer.cardSaved', 'כרטיס נשמר ({card}) · {date}', { card: cardName(pack.card), date: fmtDate(pack.card.saved_at, language) })
                      : pack.status === 'active' || pack.status === 'wait_intake'
                        ? t('admin.coaching.drawer.cardSavedPlain', 'כרטיס נשמר')
                        : t('admin.coaching.drawer.waitCard', 'ממתין לשמירת כרטיס (לא נגבה כלום)')}
                  </Step>
                )}
                {pack.has_intake_form && (
                  <Step done={!!pack.intake_submitted_at}>
                    {pack.intake_submitted_at ? (
                      <>
                        {tf(t, 'admin.coaching.drawer.intakeDone', 'שאלון פתיחה מולא · {date}', { date: fmtDate(pack.intake_submitted_at, language) })}
                        {' · '}
                        <button type="button" onClick={() => setIntakeOpen(true)} className="font-semibold text-primary hover:underline">
                          {t('admin.coaching.drawer.intakeAnswers', 'לתשובות')}
                        </button>
                      </>
                    ) : (
                      t('admin.coaching.drawer.waitIntake', 'ממתין לשאלון פתיחה')
                    )}
                  </Step>
                )}
                {(pack.status === 'active' || pack.status === 'wait_intake') && (
                  <li className="flex items-center gap-2">
                    <span className="text-primary" aria-hidden>●</span>
                    <span>
                      <b>{t('admin.coaching.drawer.inCoaching', 'בליווי')}</b> · {tf(t, 'admin.coaching.drawer.ofSessions', '{used} מתוך {total} מפגשים', { used: pack.sessions_used, total: pack.sessions_total })}
                    </span>
                  </li>
                )}
                {/* Offers already answered: the client approved or declined, or a gift was added. */}
                {(pack.offers ?? [])
                  .filter((o) => o.status === 'approved' || o.status === 'declined')
                  .map((o) =>
                    o.status === 'approved' ? (
                      <Step key={o.id} done>
                        {o.is_gift
                          ? tf(t, 'admin.coaching.drawer.offerGift', 'נוספו {n} מפגשים במתנה · {date}', { n: o.sessions, date: fmtDate(o.decided_at ?? o.created_at, language) })
                          : tf(t, 'admin.coaching.drawer.offerApproved', 'ה{who} אישר/ה {n} מפגשים נוספים ({price} למפגש) · {date}', {
                              who: pack.kind === 'child' ? t('admin.coaching.drawer.parentWord', 'הורה') : t('admin.coaching.drawer.clientWord', 'לקוח'),
                              n: o.sessions,
                              price: money(o.session_amount),
                              date: fmtDate(o.decided_at ?? o.created_at, language),
                            })}
                      </Step>
                    ) : (
                      <li key={o.id} className="flex items-start gap-2 text-muted-foreground">
                        <span aria-hidden>✕</span>
                        <span className="min-w-0">
                          {tf(t, 'admin.coaching.drawer.offerDeclined', 'ה{who} לא אישר/ה את ההצעה ל-{n} מפגשים נוספים · {date}', {
                            who: pack.kind === 'child' ? t('admin.coaching.drawer.parentWord', 'הורה') : t('admin.coaching.drawer.clientWord', 'לקוח'),
                            n: o.sessions,
                            date: fmtDate(o.decided_at ?? o.created_at, language),
                          })}
                        </span>
                      </li>
                    ),
                  )}
                {pack.pending_offer && (
                  <li className="flex flex-wrap items-center gap-2 text-amber-800 dark:text-amber-300">
                    <span aria-hidden>◷</span>
                    <span>
                      {tf(t, 'admin.coaching.drawer.offerWaiting', 'הוצעו {n} מפגשים נוספים · ממתין לאישור ה{who}', {
                        n: pack.pending_offer.sessions,
                        who: pack.kind === 'child' ? t('admin.coaching.drawer.parentWord', 'הורה') : t('admin.coaching.drawer.clientWord', 'לקוח'),
                      })}
                      {' · '}
                      <button type="button" onClick={() => cancelOffer(pack.pending_offer!.id)} disabled={busy === 'offer'} className="font-semibold text-primary hover:underline">
                        {t('admin.coaching.drawer.cancelOffer', 'ביטול ההצעה')}
                      </button>
                    </span>
                  </li>
                )}
              </ol>
            </DrawerSection>

            <DrawerSection
              title={t('admin.coaching.drawer.heldTitle', 'מפגשים שהתקיימו')}
              action={
                canHold ? (
                  <button
                    type="button"
                    onClick={() => (pack.coach_id ? setConfirmHeld(true) : (toast.error(t('admin.coaching.drawer.needCoach', 'צריך לבחור מאמן/ת לחבילה לפני שמסמנים מפגש.')), setCoachOpen(true)))}
                    disabled={!!busy}
                    className="my-1 inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                    {pack.free || nextPrice === 0
                      ? t('admin.coaching.drawer.heldButtonFree', 'מפגש התקיים')
                      : tf(t, 'admin.coaching.drawer.heldButton', 'מפגש התקיים · גביית {price}', { price: money(nextPrice) })}
                  </button>
                ) : undefined
              }
            >
              {pack.sessions.length === 0 ? (
                <p className="m-0 px-3.5 py-3 text-sm text-muted-foreground">{t('admin.coaching.drawer.noneHeld', 'עוד לא התקיימו מפגשים.')}</p>
              ) : (
                <ul className="m-0 list-none px-3.5 text-sm">
                  {pack.sessions.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2.5 first:border-t-0">
                      <span>
                        {[tf(t, 'admin.coaching.drawer.sessionN', 'מפגש {n}', { n: s.number }), fmtDate(s.held_at, language), s.coach_name].filter(Boolean).join(' · ')}
                        {s.status !== 'done' && <span className="text-muted-foreground"> · {s.status === 'no_show' ? t('admin.coaching.drawer.noShow', 'לא הגיע') : t('admin.coaching.drawer.lateCancel', 'ביטול מאוחר')}</span>}
                      </span>
                      <ChargeCell t={t} s={s} money={money} busy={busy === `retry-${s.id}`} onRetry={() => retry(s.id)} free={pack.free} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="m-0 px-3.5 pb-3 pt-1 text-[12.5px] text-muted-foreground">
                {pack.free
                  ? t('admin.coaching.drawer.heldNoteFree', 'הזימונים מנוהלים מחוץ למערכת. החבילה ללא תשלום, ולכן מפגשים לא נגבים.')
                  : tf(t, 'admin.coaching.drawer.heldNote', 'הזימונים מנוהלים מחוץ למערכת. כשמסמנים שמפגש התקיים, הוא נגבה מיד מהכרטיס השמור{card}. חיוב שנכשל מסומן באדום, עם "נסו שוב".', {
                      card: pack.card ? ` (${cardName(pack.card)})` : '',
                    })}
              </p>
            </DrawerSection>
          </>
        )}
      </DrawerShell>

      {/* A session took place: confirm the charge first. */}
      <Dialog open={confirmHeld} onOpenChange={(v) => !v && setConfirmHeld(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.coaching.drawer.confirmHeldTitle', 'המפגש התקיים?')}</DialogTitle>
            <DialogDescription>
              {pack && (pack.free || nextPrice === 0)
                ? t('admin.coaching.drawer.confirmHeldFree', 'המפגש יירשם כהתקיים, בלי חיוב.')
                : tf(t, 'admin.coaching.drawer.confirmHeldText', 'המפגש יירשם כהתקיים היום, ויגבו {price} מהכרטיס השמור{card}.', {
                    price: money(nextPrice),
                    card: pack?.card ? ` (${cardName(pack.card)})` : '',
                  })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Btn tone="primary" busy={busy === 'held'} onClick={markHeld}>
              {pack && (pack.free || nextPrice === 0) ? t('admin.coaching.drawer.confirmHeldFreeBtn', 'כן, התקיים') : tf(t, 'admin.coaching.drawer.confirmHeldBtn', 'כן, לגבות {price}', { price: money(nextPrice) })}
            </Btn>
            <Btn disabled={busy === 'held'} onClick={() => setConfirmHeld(false)}>
              {t('admin.coaching.common.cancel', 'ביטול')}
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCancel} onOpenChange={(v) => !v && setConfirmCancel(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.coaching.drawer.confirmCancelTitle', 'לבטל את החבילה?')}</DialogTitle>
            <DialogDescription>{t('admin.coaching.drawer.confirmCancelText', 'לא יהיה אפשר לסמן בה מפגשים או להוסיף מפגשים. מפגשים שכבר נגבו נשארים כמו שהם.')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Btn tone="danger" busy={busy === 'cancel'} onClick={cancelPackage}>
              {t('admin.coaching.drawer.confirmCancelBtn', 'כן, לבטל')}
            </Btn>
            <Btn disabled={busy === 'cancel'} onClick={() => setConfirmCancel(false)}>
              {t('admin.coaching.drawer.keep', 'להשאיר')}
            </Btn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pack && <CoachDialog open={coachOpen} onClose={() => setCoachOpen(false)} enrollmentId={pack.enrollment_id} current={pack.coach_id} onSaved={changed} />}
      {pack && <IntakeDialog open={intakeOpen} onClose={() => setIntakeOpen(false)} enrollmentId={pack.enrollment_id} />}
      <AddSessionsSheet enrollmentId={addOpen && pack ? pack.enrollment_id : null} onClose={() => setAddOpen(false)} onDone={changed} />
    </>
  );
}

function Stat({ label, value, extra, sub, small }: { label: string; value: string; extra?: string; sub?: string; small?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className="truncate" title={`${value} ${extra ?? ''}`}>
        <b className={`font-extrabold tabular-nums ${small ? 'text-base' : 'text-xl'}`}>{value}</b>
        {extra && <span className="ms-1 text-[12px] text-muted-foreground">{extra}</span>}
      </div>
      {sub && <div className="text-[12px] leading-snug text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Step({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 ${done ? '' : 'text-amber-800 dark:text-amber-300'}`}>
      <span className={done ? 'text-green-700 dark:text-green-400' : ''} aria-hidden>
        {done ? '✓' : '◷'}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function ChargeCell({
  t,
  s,
  money,
  busy,
  onRetry,
  free,
}: {
  t: (k: string, f?: any) => string;
  s: PackageDetail['sessions'][number];
  money: (n: number) => string;
  busy: boolean;
  onRetry: () => void;
  free: boolean;
}) {
  if (free) return <span className="text-muted-foreground">{t('admin.coaching.pay.free', 'ללא תשלום')}</span>;
  if (!s.charge) return <span className="text-muted-foreground">{s.status === 'done' ? t('admin.coaching.drawer.notCharged', 'לא נגבה (מתנה)') : '—'}</span>;
  const { status, amount, error } = s.charge;
  if (status === 'paid')
    return (
      <b>
        {money(amount)} <span className="font-bold text-green-700 dark:text-green-400">{t('admin.coaching.drawer.charged', 'נגבה')}</span>
      </b>
    );
  if (status === 'failed' || status === 'overdue')
    return (
      <span className="flex items-center gap-2">
        <b className="text-red-700 dark:text-red-400" title={error ?? undefined}>
          {money(amount)} {t('admin.coaching.drawer.failed', 'נכשל')}
        </b>
        <button type="button" onClick={onRetry} disabled={busy} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-border px-2.5 text-[13px] font-semibold text-primary hover:bg-muted">
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {t('admin.coaching.drawer.retry', 'נסו שוב')}
        </button>
      </span>
    );
  return (
    <b>
      {money(amount)} <span className="font-semibold text-muted-foreground">{t('admin.coaching.drawer.processing', 'בתהליך')}</span>
    </b>
  );
}

function CoachDialog({ open, onClose, enrollmentId, current, onSaved }: { open: boolean; onClose: () => void; enrollmentId: string; current: string | null; onSaved: () => void }) {
  const { t, direction } = useAdminLanguage();
  const [coaches, setCoaches] = useState<{ id: string; name: string }[]>([]);
  const [coachId, setCoachId] = useState(current ?? '');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCoachId(current ?? '');
    void api<{ coaches: { id: string; name: string }[] }>('/api/admin/coaching/choices').then((d) => setCoaches(d.coaches ?? [])).catch((e) => toast.error(errText(e)));
  }, [open, current]);
  const save = async () => {
    if (!coachId) return;
    setSaving(true);
    try {
      await api(`/api/admin/coaching/packages/${enrollmentId}`, { method: 'POST', body: { action: 'coach', coach_id: coachId } });
      toast.success(t('admin.coaching.drawer.coachSaved', 'המאמן/ת עודכנ/ה'));
      onClose();
      onSaved();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir={direction}>
        <DialogHeader>
          <DialogTitle>{t('admin.coaching.drawer.changeCoach', 'שינוי מאמן/ת')}</DialogTitle>
          <DialogDescription>{t('admin.coaching.drawer.coachHelp', 'המאמן/ת שמלווה את החבילה. מפגשים שיסומנו מעכשיו יירשמו על שמו/ה.')}</DialogDescription>
        </DialogHeader>
        <UiSelect direction={direction} value={coachId} onChange={setCoachId} options={coaches.map((c) => ({ value: c.id, label: c.name }))} placeholder={t('admin.coaching.newPack.chooseCoach2', 'בחירת מאמן/ת...')} />
        <DialogFooter className="gap-2">
          <Btn tone="primary" busy={saving} disabled={!coachId} onClick={save}>
            {t('admin.coaching.common.save', 'שמירה')}
          </Btn>
          <Btn disabled={saving} onClick={onClose}>
            {t('admin.coaching.common.cancel', 'ביטול')}
          </Btn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntakeDialog({ open, onClose, enrollmentId }: { open: boolean; onClose: () => void; enrollmentId: string }) {
  const { t, direction, language } = useAdminLanguage();
  const [data, setData] = useState<{ questions: any[]; answers: Record<string, any>; submitted_at: string } | null>(null);
  useEffect(() => {
    if (!open) return;
    setData(null);
    void api<{ questions: any[]; answers: Record<string, any>; submitted_at: string }>(`/api/admin/coaching/packages/${enrollmentId}/intake`)
      .then(setData)
      .catch((e) => toast.error(errText(e)));
  }, [open, enrollmentId]);
  const show = (v: any) => (Array.isArray(v) ? v.join(', ') : v === true ? t('admin.coaching.common.yes', 'כן') : v === false ? t('admin.coaching.common.no', 'לא') : v == null || v === '' ? '—' : String(v));
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir={direction} className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin.coaching.drawer.intakeTitle', 'תשובות שאלון הפתיחה')}</DialogTitle>
          <DialogDescription>{data ? tf(t, 'admin.coaching.drawer.intakeWhen', 'מולא ב-{date}', { date: fmtDate(data.submitted_at, language) }) : t('admin.coaching.common.loading', 'טוען...')}</DialogDescription>
        </DialogHeader>
        {data && (
          <dl className="m-0 space-y-3 text-sm">
            {(data.questions ?? []).map((q: any, i: number) => (
              <div key={q.id ?? i}>
                <dt className="font-semibold">{q.label ?? q.question ?? q.text ?? ''}</dt>
                <dd className="m-0 whitespace-pre-line text-muted-foreground">{show(data.answers?.[q.id])}</dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Add sessions (mockup 8) ──────────────────────────────────────────

const COUNTS = [1, 2, 4, 8] as const;

export function AddSessionsSheet({
  enrollmentId,
  onClose,
  onDone,
  requestId,
  defaultSessions,
}: {
  enrollmentId: string | null;
  onClose: () => void;
  onDone: () => void;
  requestId?: string;
  defaultSessions?: number | null;
}) {
  const { t, direction, language } = useAdminLanguage();
  const rtl = direction === 'rtl';
  const [pack, setPack] = useState<PackageDetail | null>(null);
  const [count, setCount] = useState<number | 'other'>(4);
  const [other, setOther] = useState('');
  const [price, setPrice] = useState('');
  const [gift, setGift] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ count?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enrollmentId) return;
    setPack(null);
    const d = defaultSessions && defaultSessions > 0 ? defaultSessions : 4;
    setCount((COUNTS as readonly number[]).includes(d) ? d : 'other');
    setOther((COUNTS as readonly number[]).includes(d) ? '' : String(d));
    setGift(false);
    setMessage('');
    setErrors({});
    void api<PackageDetail>(`/api/admin/coaching/packages/${enrollmentId}`)
      .then((p) => {
        setPack(p);
        setPrice(String(p.price_per_session || ''));
      })
      .catch((e) => toast.error(errText(e)));
  }, [enrollmentId, defaultSessions]);

  const n = count === 'other' ? Number(other) : count;
  const validN = Number.isInteger(n) && n >= 1 && n <= 100;
  const after = pack ? pack.sessions_total + (validN ? n : 0) : 0;
  const money = (v: number) => priceText(v, pack?.currency ?? 'USD', language);
  const who = pack ? (pack.kind === 'child' ? pack.parent_name.split(' ')[0] : pack.parent_name.split(' ')[0]) : '';

  const send = async () => {
    const e: typeof errors = {};
    if (!validN) e.count = t('admin.coaching.add.errCount', 'כתבו כמה מפגשים להוסיף (1 עד 100).');
    if (!gift && !(Number(price) > 0)) e.price = t('admin.coaching.add.errPrice', 'כתבו מחיר למפגש.');
    setErrors(e);
    if (Object.keys(e).length || !pack) return;
    setSaving(true);
    try {
      await api(`/api/admin/coaching/packages/${pack.enrollment_id}/offers`, {
        method: 'POST',
        body: { sessions: n, session_amount: gift ? 0 : Number(price), is_gift: gift, message, request_id: requestId },
      });
      toast.success(gift ? tf(t, 'admin.coaching.add.giftDone', '{n} מפגשים נוספו במתנה', { n }) : t('admin.coaching.add.sent', 'ההצעה נשלחה לאישור'));
      onClose();
      onDone();
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setSaving(false);
    }
  };

  const packName = pack ? (pack.kind === 'child' ? pack.child_name ?? '' : pack.parent_name) : '';

  return (
    <Sheet open={!!enrollmentId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side={rtl ? 'left' : 'right'} dir={direction} className="flex w-full flex-col gap-0 p-0 sm:max-w-[480px] [&>[data-default-close]]:hidden">
        <div className="flex items-start gap-3 border-b border-border px-6 pb-4 pt-6">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-muted-foreground">
              {pack ? [packName, pack.product_title, tf(t, 'admin.coaching.drawer.ofSessions', '{used} מתוך {total} מפגשים', { used: pack.sessions_used, total: pack.sessions_total })].filter(Boolean).join(' · ') : ''}
            </p>
            <SheetTitle className="mt-0.5 text-[22px] font-extrabold [font-family:inherit]">{t('admin.coaching.add.title', 'הוספת מפגשים לחבילה')}</SheetTitle>
            <SheetDescription className="sr-only">{t('admin.coaching.add.sr', 'הצעת מפגשים נוספים לאישור הלקוח')}</SheetDescription>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close', 'Close')} className="grid h-10 w-10 place-items-center rounded-xl bg-muted hover:bg-muted/70">
            ✕
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-bold">{t('admin.coaching.add.howMany', 'כמה מפגשים להוסיף?')}</span>
            <div role="radiogroup" aria-label={t('admin.coaching.add.howMany', 'כמה מפגשים להוסיף?')} className={`${joinedBar} self-start`}>
              {COUNTS.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={count === c} onClick={() => setCount(c)} className={`${joinedSegment(count === c)} min-h-11 px-4`}>
                  {c}
                </button>
              ))}
              <button type="button" role="radio" aria-checked={count === 'other'} onClick={() => setCount('other')} className={`${joinedSegment(count === 'other')} min-h-11 px-4`}>
                {t('admin.coaching.add.other', 'אחר')}
              </button>
            </div>
            {count === 'other' && (
              <Input type="number" min={1} max={100} inputMode="numeric" value={other} onChange={(e) => setOther(e.target.value)} className="h-11 w-28" aria-label={t('admin.coaching.add.otherLabel', 'מספר מפגשים')} />
            )}
            {errors.count ? (
              <p className="text-sm font-medium text-destructive">{errors.count}</p>
            ) : (
              pack && (
                <span className="text-[13px] text-muted-foreground">
                  {tf(t, 'admin.coaching.add.grow', 'החבילה תגדל מ-{from} ל-{to} מפגשים.', { from: pack.sessions_total, to: after })}
                </span>
              )
            )}
          </div>

          {!gift && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">{t('admin.coaching.add.price', 'מחיר למפגש')}</span>
              <span className="flex flex-wrap items-center gap-2">
                <Input type="number" min={0.01} step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={`h-11 w-32 ${errors.price ? 'border-destructive' : ''}`} />
                <span className="text-sm text-muted-foreground">
                  {pack?.currency} · {t('admin.coaching.add.priceHelp', 'כמו בחבילה. נגבה אחרי כל מפגש שמתקיים.')}
                </span>
              </span>
              {errors.price && <span className="text-sm font-medium text-destructive">{errors.price}</span>}
            </label>
          )}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
            <span>
              <b className="block">{t('admin.coaching.add.gift', 'בלי חיוב (מתנה)')}</b>
              <span className="text-[13px] text-muted-foreground">{t('admin.coaching.add.giftHelp', 'המפגשים הנוספים לא ייגבו. נוסף מיד, בלי אישור.')}</span>
            </span>
            <Switch checked={gift} onCheckedChange={setGift} aria-label={t('admin.coaching.add.gift', 'בלי חיוב (מתנה)')} />
          </label>

          {!gift && (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">
                {tf(t, 'admin.coaching.add.message', 'הודעה ל{who}', { who: pack?.kind === 'child' ? t('admin.coaching.drawer.parentWord', 'הורה') : t('admin.coaching.drawer.clientWord', 'לקוח') })}{' '}
                <span className="font-medium text-muted-foreground">{t('admin.coaching.common.optional', '(לא חובה)')}</span>
              </span>
              <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
          )}

          <div className="flex flex-col gap-1 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            <b>{t('admin.coaching.add.whatHappens', 'מה יקרה')}</b>
            {gift ? (
              <>
                <span>{tf(t, 'admin.coaching.add.giftLine1', 'המפגשים נוספים לחבילה מיד: {to} מפגשים.', { to: after })}</span>
                <span>{t('admin.coaching.add.giftLine2', 'הם לא ייגבו כשיתקיימו.')}</span>
              </>
            ) : (
              <>
                <span>{tf(t, 'admin.coaching.add.line1', '{who} יקבל/תקבל בפורטל ובמייל בקשה לאישור. לא נגבה כלום באישור.', { who })}</span>
                <span>{t('admin.coaching.add.line2', 'אין חוזה חדש לחתימה: ההוספה נכנסת לחוזה הקיים.')}</span>
                <span>
                  {tf(t, 'admin.coaching.add.line3', 'אחרי האישור החבילה תעמוד על {to} מפגשים, וכל מפגש ייגבה {price} כשיתקיים.', {
                    to: after,
                    price: Number(price) > 0 ? money(Number(price)) : '—',
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 border-t border-border px-6 py-4">
          <Btn tone="primary" busy={saving} onClick={send} className="flex-1">
            {gift ? t('admin.coaching.add.addGift', 'הוספה במתנה') : tf(t, 'admin.coaching.add.send', 'שליחה לאישור ה{who}', { who: pack?.kind === 'child' ? t('admin.coaching.drawer.parentWord', 'הורה') : t('admin.coaching.drawer.clientWord', 'לקוח') })}
          </Btn>
          <Btn disabled={saving} onClick={onClose}>
            {t('admin.coaching.common.cancel', 'ביטול')}
          </Btn>
        </div>
      </SheetContent>
    </Sheet>
  );
}
