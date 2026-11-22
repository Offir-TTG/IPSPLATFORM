import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HomeHero } from '@/components/user/portal/HomeHero';
import { KidsSection } from '@/components/user/portal/KidsSection';
import { loadFamily } from '@/lib/portal/family';
import { loadHomeData, type HomeItem, type HomeSpace } from './homeData';

export const dynamic = 'force-dynamic';

const cover = (color: string) =>
  `radial-gradient(70% 90% at 90% 10%, rgba(255,255,255,.28), transparent 60%), radial-gradient(60% 80% at 0% 100%, rgba(0,0,0,.25), transparent 60%), ${color}`;

const CapIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
    <path d="M2 9l10-5 10 5-10 5z" />
    <path d="M6 11v5c3 2 9 2 12 0v-5" />
  </svg>
);
const SparkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />
  </svg>
);
const BookIcon = ({ color }: { color: string }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" aria-hidden="true">
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19V5" />
  </svg>
);
const MicIcon = ({ color }: { color: string }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" aria-hidden="true">
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

function SectionHead({ title, note, link }: { title: string; note?: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-[19px] lg:text-[22px]">{title}</h2>
      {note && <span className="hidden lg:inline text-[#73698a] text-sm">{note}</span>}
      {link && (
        <Link href={link.href} className="font-semibold text-sm no-underline text-[#5b3a8e] hover:text-[#3d2466]">
          {link.label}
        </Link>
      )}
    </div>
  );
}

function SpaceCard({ s }: { s: HomeSpace }) {
  return (
    <Link
      href={s.href}
      className={`group no-underline text-[#221a2e] rounded-[20px] lg:rounded-3xl overflow-hidden bg-white shadow-[0_1px_0_#e9e3f1] lg:shadow-[0_1px_0_#e9e3f1,0_12px_30px_-18px_rgba(60,30,110,.4)] flex flex-col transition-transform [transition-duration:250ms] ease-out hover:-translate-y-1`}
    >
      <div
        className="h-[74px] lg:h-[130px] lg:p-4 flex justify-between items-start text-white"
        style={{ background: cover(s.color) }}
      >
        <span className="hidden lg:grid w-[42px] h-[42px] rounded-[13px] bg-white/[.18] place-items-center">
          {s.kind === 'program' ? <CapIcon /> : <SparkIcon />}
        </span>
        {s.tag && (
          <span className="hidden lg:inline font-semibold text-xs px-2.5 py-[5px] rounded-full bg-white/[.16] border border-white/25">{s.tag}</span>
        )}
      </div>
      <div className="px-3 pt-2.5 pb-3 lg:px-4 lg:pt-3.5 lg:pb-[18px] flex flex-col gap-[3px] lg:gap-1.5">
        <span className="hidden lg:block text-[#73698a] text-[12.5px]">{s.kicker}</span>
        <b className="font-rubik font-semibold text-[14.5px] lg:text-lg leading-[1.25]">{s.title}</b>
        {s.progress !== null && (
          <span className="hidden lg:block h-[5px] rounded-full bg-[#f3edfa] overflow-hidden mt-1">
            <span className="block h-full rounded-[inherit]" style={{ width: `${s.progress}%`, background: s.color }} />
          </span>
        )}
        <span className="text-[#73698a] text-xs lg:text-[13.5px] flex gap-1.5 items-center">
          {s.kind === 'club' && <i className="hidden lg:inline-block w-[7px] h-[7px] rounded-full bg-[#e9b44c] shrink-0" />}
          {s.line}
        </span>
      </div>
    </Link>
  );
}

function ItemRow({ it, first }: { it: HomeItem; first: boolean }) {
  return (
    <Link
      href={it.href}
      className={`flex lg:grid lg:grid-cols-[48px_1fr_140px_auto] gap-3 lg:gap-4 items-center p-2.5 lg:p-3 rounded-2xl no-underline text-[#221a2e] hover:bg-[#faf8fd] ${
        first ? '' : 'border-t border-[#e9e3f1]'
      }`}
    >
      <span className="w-[42px] h-[42px] lg:w-12 lg:h-12 rounded-[13px] lg:rounded-[14px] bg-[#f3edfa] grid place-items-center shrink-0">
        {it.kind === 'lecture' ? <MicIcon color={it.color} /> : <BookIcon color={it.color} />}
      </span>
      <span className="flex-1 min-w-0">
        <b className="block text-[14.5px] lg:text-[15.5px]">{it.title}</b>
        <span className="text-[#73698a] text-[12.5px] lg:text-[13px]">
          <span className="lg:hidden">{it.short}</span>
          <span className="hidden lg:inline">{it.sub}</span>
        </span>
      </span>
      {it.progress !== null ? (
        <span className="hidden lg:flex flex-col gap-1 items-end text-[#73698a] text-[12.5px]">
          {it.progress}%
          <span className="w-full h-[5px] rounded-full bg-[#f3edfa] overflow-hidden">
            <span className="block h-full" style={{ width: `${it.progress}%`, background: it.color }} />
          </span>
        </span>
      ) : it.tag ? (
        <span className="hidden lg:block justify-self-end">
          <span className="font-semibold text-xs bg-[#fbefd6] text-[#7a4f00] px-[9px] py-1 rounded-full">{it.tag}</span>
        </span>
      ) : (
        <span className="hidden lg:block" />
      )}
      <span className="text-[#5b3a8e] font-semibold text-[13px] lg:text-sm whitespace-nowrap">
        {it.action}
        <span className="hidden lg:inline"> ←</span>
      </span>
    </Link>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: { enrollment?: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [data, kids] = await Promise.all([loadHomeData(user.id), loadFamily(user.id)]);
  const week = data.week.slice(0, 5);
  const nothingYet = !data.spaces.length && !data.items.length && !kids.length;

  return (
    <div className="flex flex-col gap-[22px] lg:gap-[30px]">
      {searchParams?.enrollment === 'complete' && (
        <div role="status" className="rounded-2xl bg-white border border-[#e9e3f1] px-4 py-3 text-[15px] font-semibold text-[#5b3a8e]">
          ההרשמה הושלמה. ברוכים הבאים, הכל מחכה לך כאן.
        </div>
      )}

      <HomeHero
        greeting={data.firstName ? `${data.greeting}, ${data.firstName}` : data.greeting}
        orgName={data.orgName}
        dateLabel={data.dateLabel}
        focus={data.focus}
        chips={data.chips}
        updatesCount={data.updatesCount}
        notice={data.notice}
        serverNow={Date.now()}
      />

      {data.spaces.length > 0 && (
        <section aria-label="ההורות שלי" className="flex flex-col gap-3 lg:gap-3.5">
          <SectionHead title="ההורות שלי" note="תוכניות ומועדונים להורים, כל אחד עם עולם משלו" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
            {data.spaces.map((s) => (
              <SpaceCard key={s.key} s={s} />
            ))}
          </div>
        </section>
      )}

      {kids.length > 0 && <KidsSection kids={kids} />}

      {data.items.length > 0 && (
        <section aria-label="קורסים והרצאות" className="flex flex-col gap-3 lg:gap-3.5">
          <SectionHead title="קורסים והרצאות" />
          <div className="bg-white rounded-[20px] lg:rounded-3xl p-1.5 lg:p-2 shadow-[0_1px_0_#e9e3f1] flex flex-col">
            {data.items.map((it, i) => (
              <ItemRow key={it.key} it={it} first={i === 0} />
            ))}
          </div>
        </section>
      )}

      {nothingYet && (
        <section className="bg-white rounded-3xl p-8 text-center shadow-[0_1px_0_#e9e3f1]">
          <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-xl">עוד אין כאן תוכניות</h2>
          <p className="mt-2 mb-0 text-[#73698a]">כשתירשמו לתוכנית, מועדון, קורס או הרצאה, הם יופיעו כאן.</p>
        </section>
      )}

      <section aria-label="השבוע" className="flex flex-col gap-2.5">
        <SectionHead title="השבוע שלי" link={{ href: '/calendar', label: 'ליומן' }} />
        {week.length === 0 ? (
          <p className="m-0 text-[#73698a] text-sm">אין מפגשים בשבוע הקרוב.</p>
        ) : (
          <>
            {/* Desktop: a horizontal timeline */}
            <div className="hidden lg:grid relative grid-cols-5 gap-3 pt-2">
              <div className="absolute top-[15px] inset-x-2 h-0.5 bg-[#e9e3f1]" />
              {week.map((w) => (
                <Link key={w.lessonId} href={`/courses/${w.courseId}`} className="relative pt-[22px] no-underline text-[#221a2e] hover:text-[#5b3a8e]">
                  <i
                    className="absolute top-0 start-0.5 w-3.5 h-3.5 rounded-full box-border"
                    style={
                      w.isToday
                        ? { background: '#e9b44c', boxShadow: '0 0 0 5px rgba(233,180,76,.25)' }
                        : { background: '#fff', border: `3px solid ${w.color}` }
                    }
                  />
                  <div className="text-[#73698a] text-[12.5px]">{w.dayLabel}</div>
                  <b className="text-sm">{w.title}</b>
                  <div className="text-[#73698a] text-[12.5px]">{w.sub}</div>
                </Link>
              ))}
            </div>
            {/* Phone: a vertical timeline */}
            <div className="lg:hidden flex flex-col border-s-2 border-[#e9e3f1] ps-4 ms-1.5">
              {week.map((w, i) => (
                <Link
                  key={w.lessonId}
                  href={`/courses/${w.courseId}`}
                  className={`relative no-underline text-[#221a2e] ${i < week.length - 1 ? 'pb-3.5' : ''}`}
                >
                  <i
                    className="absolute -start-6 top-0.5 w-3.5 h-3.5 rounded-full box-border"
                    style={w.isToday ? { background: '#e9b44c' } : { background: '#fff', border: `3px solid ${w.color}` }}
                  />
                  <div className="text-[12.5px] text-[#73698a]">{w.dayLabel}</div>
                  <b className="text-sm">{w.title} · {w.sub}</b>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
