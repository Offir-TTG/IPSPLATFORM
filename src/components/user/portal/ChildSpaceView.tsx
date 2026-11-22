'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ageLabel, type ChildView, type CoachingView } from '@/lib/portal/familyTypes';
import { SpaceHero, SpaceTab } from './SpaceHero';
import { SessionActions, SlotPicker } from './CoachingBooking';
import { IntakeForm } from './IntakeForm';
import { EmbeddedWizard, EnrollInline } from './EnrollInline';

type Tab = 'overview' | 'intake' | 'sessions' | 'package';
const JOIN_OPENS_MIN = 10;
const panel = 'bg-white rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col';
const h2 = 'm-0 text-[#221a2e] font-rubik font-semibold';
const STATUS: Record<string, [string, string]> = {
  upcoming: ['נקבע', 'bg-[#fbefd6] text-[#7a4f00]'],
  done: ['התקיים', 'bg-[#e1f4ea] text-[#1a7a50]'],
  cancelled: ['בוטל', 'bg-[#efeaf5] text-[#5f5675]'],
  late_cancelled: ['בוטל (נספר)', 'bg-[#fbefd6] text-[#7a4f00]'],
  no_show: ['לא התקיים', 'bg-[#fbeceb] text-[#b3392f]'],
};

/** A child's coaching: next session, the sessions, and the package and payments. Dates only, no session notes. */
export function ChildSpaceView({ child, coaching, serverNow, justEnrolled = false, continueEnroll = false }: { child: ChildView; coaching: CoachingView; serverNow: number; justEnrolled?: boolean; continueEnroll?: boolean }) {
  const [tab, setTab] = useState<Tab>(coaching.intakeStatus === 'missing' && !coaching.awaitingEnrollment ? 'intake' : 'overview');
  const [booking, setBooking] = useState(false);
  const [wizardUrl, setWizardUrl] = useState<string | null>(null);
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const c = child.color;
  const n = coaching.next;
  const joinOpen = !!n?.joinUrl && now >= +new Date(n.start) - JOIN_OPENS_MIN * 60_000 && now <= +new Date(n.end);
  const left = Math.max(0, coaching.total - coaching.used);

  return (
    <div className="flex flex-col gap-5">
      <SpaceHero
        color={c}
        kicker={['הילדים שלי', [child.firstName, ageLabel(child.age)].filter(Boolean).join(', ')].join(' · ')}
        title={coaching.coach ? `${coaching.title} עם ${coaching.coach.name}` : coaching.title}
        sub={coaching.total ? `חבילת ${coaching.total} מפגשים` : null}
        side={
          coaching.total ? (
            <span className="self-start lg:self-auto font-semibold text-[13px] bg-white text-[#2a1846] px-3.5 py-[7px] rounded-full whitespace-nowrap">
              {coaching.used} מתוך {coaching.total} מפגשים
            </span>
          ) : null
        }
        tabs={
          <>
            <SpaceTab on={tab === 'overview'} onClick={() => setTab('overview')}>סקירה</SpaceTab>
            {coaching.intakeStatus !== 'not_needed' && (
              <SpaceTab on={tab === 'intake'} onClick={() => setTab('intake')}>
                שאלון פתיחה{coaching.intakeStatus === 'missing' ? ' · למילוי' : ''}
              </SpaceTab>
            )}
            <SpaceTab on={tab === 'sessions'} onClick={() => setTab('sessions')}>מפגשים</SpaceTab>
            <SpaceTab on={tab === 'package'} onClick={() => setTab('package')}>חבילה ותשלום</SpaceTab>
          </>
        }
      />

      {justEnrolled && !coaching.awaitingEnrollment && (
        <div role="status" className="rounded-[18px] border border-[#cfe9db] bg-[#eef8f2] px-4 py-3.5 text-sm text-[#1a5a3a]">
          <b>ההרשמה הושלמה.</b> {coaching.intakeStatus === 'missing' ? 'נשאר רק למלא שאלון פתיחה קצר.' : 'הצוות יקבע את המפגש הראשון ויעדכן אותך.'}
        </div>
      )}

      {coaching.awaitingEnrollment &&
        (wizardUrl ? (
          <EmbeddedWizard src={wizardUrl} />
        ) : (
          <EnrollInline enrollmentUrl={coaching.enrollmentUrl} accent={c} onStart={setWizardUrl} autoContinue={continueEnroll} />
        ))}

      {coaching.intakeStatus === 'missing' && !coaching.awaitingEnrollment && tab !== 'intake' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3.5">
          <span className="flex-1 text-sm text-amber-950">
            <b>עוד שלב אחד לפני שקובעים מפגש:</b> שאלון פתיחה קצר על {child.firstName}.
          </span>
          <button type="button" onClick={() => setTab('intake')} className="self-start sm:self-auto border-0 text-white font-semibold text-sm px-4 py-2.5 rounded-[11px]" style={{ background: c }}>
            למילוי השאלון
          </button>
        </div>
      )}

      {tab === 'intake' && (
        <section className={`${panel} max-w-[760px]`}>
          <IntakeForm enrollmentId={coaching.enrollmentId} childName={child.firstName} accent={c} />
        </section>
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start">
          <section className="rounded-[22px] p-4 lg:p-[22px] shadow-[0_1px_0_#e9e3f1] flex flex-col gap-3" style={{ background: 'linear-gradient(135deg, #f4ebf6, #ffffff)' }}>
            <div className="flex justify-between items-baseline">
              <h2 className={`${h2} text-lg`}>המפגש הבא</h2>
              {n && <span className="font-semibold text-[12.5px] bg-[#fbefd6] text-[#7a4f00] px-2.5 py-[5px] rounded-full">נקבע</span>}
            </div>
            {n ? (
              <>
                <div className="font-rubik font-bold text-[22px] lg:text-[26px] leading-[1.15]">{n.when}</div>
                <div className="text-[#73698a]">{[n.title, n.where].filter(Boolean).join(' · ')}</div>
                {joinOpen && (
                  <a href={n.joinUrl!} target="_blank" rel="noopener noreferrer" className="text-white no-underline font-semibold text-sm px-[18px] py-3 rounded-xl" style={{ background: c }}>
                    הצטרפות למפגש
                  </a>
                )}
                {n.canChange ? (
                  <SessionActions enrollmentId={coaching.enrollmentId} session={n} accent={c} />
                ) : (
                  <span className="text-[13px] text-[#73698a]">המפגשים נקבעים על ידי הצוות. לשינוי מועד אפשר לפנות לצוות בית הספר.</span>
                )}
              </>
            ) : (
              <>
                <div className="text-[#73698a]">{coaching.canBook ? 'אפשר לקבוע את המפגש הבא במועד שנוח לכם.' : coaching.intakeStatus === 'missing' ? 'אחרי מילוי שאלון הפתיחה אפשר לקבוע מפגש.' : left ? 'המפגשים נקבעים על ידי הצוות. נעדכן כאן ובהתראות כשייקבע המפגש הבא.' : 'כל המפגשים בחבילה נוצלו.'}</div>
                {coaching.canBook &&
                  (booking ? (
                    <SlotPicker enrollmentId={coaching.enrollmentId} accent={c} onDone={() => setBooking(false)} onCancel={() => setBooking(false)} />
                  ) : (
                    <button type="button" onClick={() => setBooking(true)} className="self-start border-0 text-white font-semibold text-sm px-[18px] py-3 rounded-xl" style={{ background: c }}>
                      קביעת מפגש
                    </button>
                  ))}
              </>
            )}
          </section>
          <section className={`${panel} gap-3`}>
            <h2 className={`${h2} text-lg`}>החבילה</h2>
            {coaching.total > 0 && (
              <div className="flex gap-1.5" aria-hidden="true">
                {Array.from({ length: coaching.total }, (_, i) => (
                  <span key={i} className="flex-1 h-2.5 rounded-full" style={{ background: i < coaching.used ? c : i === coaching.used && n ? '#e9b44c' : '#ece4f1' }} />
                ))}
              </div>
            )}
            <span className="text-sm text-[#5f5675]">{coaching.total ? `${coaching.used} מפגשים נוצלו, נשארו ${left}.` : `${coaching.used} מפגשים התקיימו.`}</span>
            <button type="button" onClick={() => setTab('package')} className="self-start border-0 bg-transparent p-0 font-semibold text-sm" style={{ color: c }}>
              החבילה והתשלומים ←
            </button>
          </section>
        </div>
      )}

      {tab === 'sessions' && (
        <section className={`${panel} gap-2.5`}>
          <h2 className={`${h2} text-[17px] lg:text-[19px]`}>המפגשים</h2>
          {coaching.sessions.map((s) => {
            const [label, cls] = STATUS[s.status] ?? STATUS.upcoming;
            return (
              <div key={s.id} className="flex flex-col gap-2.5 px-3.5 py-[13px] rounded-[14px] bg-[#f8f3f9]">
                <div className="flex justify-between items-center gap-3">
                <span className="min-w-0">
                  <b className="block text-[15px]">{s.title}</b>
                  <span className="text-[13px] text-[#73698a]">{[s.when, s.where].filter(Boolean).join(' · ')}</span>
                </span>
                <span className={`font-semibold text-xs px-2.5 py-[5px] rounded-full whitespace-nowrap ${cls}`}>{label}</span>
                </div>
                {s.status === 'upcoming' && s.id !== n?.id && s.canChange && <SessionActions enrollmentId={coaching.enrollmentId} session={s} accent={c} />}
              </div>
            );
          })}
          {coaching.sessions.length === 0 && <span className="text-[#73698a] text-sm">המפגשים יופיעו כאן כשייקבעו.</span>}
        </section>
      )}

      {tab === 'package' && (
        <section className={`${panel} gap-2.5 max-w-[640px]`}>
          <h2 className={`${h2} text-[17px] lg:text-[19px] mb-1`}>חבילת המפגשים</h2>
          {coaching.payment && (
            <div className="flex justify-between text-[14.5px] py-2 border-b border-[#efe9f6]">
              <span>חבילה</span>
              <b>{coaching.payment.packageLabel}</b>
            </div>
          )}
          <div className="flex justify-between text-[14.5px] py-2 border-b border-[#efe9f6]">
            <span>נוצלו</span>
            <b>{coaching.total ? `${coaching.used} מתוך ${coaching.total}` : coaching.used}</b>
          </div>
          {coaching.payment && (
            <div className="flex justify-between text-[14.5px] py-2 border-b border-[#efe9f6]">
              <span>תשלומים</span>
              <b>{coaching.payment.paidLabel}</b>
            </div>
          )}
          {coaching.payment?.nextLabel && (
            <div className="flex justify-between text-[14.5px] py-2">
              <span>התשלום הבא</span>
              <b>{coaching.payment.nextLabel}</b>
            </div>
          )}
          <Link href="/billing" className="font-semibold text-sm no-underline" style={{ color: c }}>
            לכל התשלומים והקבלות ←
          </Link>
        </section>
      )}
    </div>
  );
}
