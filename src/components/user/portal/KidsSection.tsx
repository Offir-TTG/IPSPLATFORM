import Link from 'next/link';
import { ageLabel, type ChildView } from '@/lib/portal/familyTypes';

/** "הילדים שלי" on the home page: one card per child, and a way to add one. */
export function KidsSection({ kids }: { kids: ChildView[] }) {
  return (
    <section aria-label="הילדים שלי" className="flex flex-col gap-3 lg:gap-3.5">
      <div className="flex justify-between items-baseline gap-3">
        <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-[19px] lg:text-[22px]">הילדים שלי</h2>
        <Link href="/profile?tab=family" className="font-semibold text-sm no-underline text-[#5b3a8e] hover:text-[#3d2466]">
          ניהול הילדים
        </Link>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {kids.map((k) => {
          const c = k.coaching.find((x) => x.awaitingEnrollment) ?? k.coaching[0];
          const top = [k.firstName, ageLabel(k.age), c?.title].filter(Boolean).join(' · ');
          const headline = c?.awaitingEnrollment ? 'נשאר להשלים את ההרשמה' : c?.next ? `המפגש הבא: ${c.next.when}` : c ? 'המפגש הבא ייקבע בקרוב' : k.pendingRequest ? 'הבקשה לאימון התקבלה' : 'עוד אין אימון פעיל';
          const sub = c?.awaitingEnrollment
            ? 'השלמת ההרשמה והתשלום'
            : c
            ? [c.coach ? `עם ${c.coach.name}` : null, c.total ? `${c.used} מתוך ${c.total} מפגשים` : null].filter(Boolean).join(' · ')
            : k.pendingRequest
            ? 'הצוות יחזור אליך לתיאום'
            : 'אפשר לשלוח בקשה לאימון';
          return (
            <Link
              key={k.id}
              href={`/children/${k.id}`}
              className="no-underline text-[#221a2e] bg-white rounded-[20px] lg:rounded-3xl p-4 lg:p-[18px] shadow-[0_1px_0_#e9e3f1,0_12px_30px_-18px_rgba(60,30,110,.4)] grid grid-cols-[52px_1fr] lg:grid-cols-[64px_1fr_auto] gap-3 lg:gap-4 items-center hover:-translate-y-0.5 transition-transform"
            >
              <span
                className="w-[52px] h-[52px] lg:w-16 lg:h-16 rounded-full text-white font-rubik font-bold text-xl lg:text-2xl grid place-items-center"
                style={{ background: `radial-gradient(70% 90% at 90% 10%, rgba(255,255,255,.3), transparent 60%), ${k.color}` }}
                aria-hidden="true"
              >
                {k.firstName.charAt(0)}
              </span>
              <span className="flex flex-col gap-1 min-w-0">
                <span className="text-[#73698a] text-[12.5px]">{top}</span>
                <b className="font-rubik font-semibold text-base lg:text-lg">{headline}</b>
                <span className="text-[#73698a] text-[13px] lg:text-[13.5px]">{sub}</span>
              </span>
              <span className="hidden lg:inline font-semibold text-[13.5px]" style={{ color: k.color }}>
                לפרטים ←
              </span>
            </Link>
          );
        })}
        <Link
          href="/profile?tab=family"
          className="no-underline text-[#5b3a8e] rounded-[20px] lg:rounded-3xl border-2 border-dashed border-[#d3c6e6] p-4 lg:p-[18px] flex items-center justify-center gap-2.5 font-semibold text-[15px] hover:bg-white/60"
        >
          + הוספת ילד/ה או בקשה לאימון
        </Link>
      </div>
    </section>
  );
}
