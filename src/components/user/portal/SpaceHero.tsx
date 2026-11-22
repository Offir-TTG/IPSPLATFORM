import Link from 'next/link';

/** The coloured header every space opens with: back link, title, a side slot and the tabs. */
export function SpaceHero({
  color,
  kicker,
  title,
  sub,
  side,
  tabs,
}: {
  color: string;
  kicker: string;
  title: string;
  sub?: string | null;
  side?: React.ReactNode;
  tabs?: React.ReactNode;
}) {
  return (
    <section
      className="relative overflow-hidden rounded-[24px] lg:rounded-[30px] px-[18px] pt-[18px] pb-4 lg:px-7 lg:pt-6 lg:pb-[18px] text-white flex flex-col gap-3.5"
      style={{
        background: `radial-gradient(60% 120% at 100% 0%, rgba(255,255,255,.22), transparent 60%), radial-gradient(50% 90% at 0% 100%, rgba(0,0,0,.3), transparent 60%), ${color}`,
      }}
    >
      <Link href="/dashboard" className="self-start text-white no-underline font-semibold text-[13px] px-[13px] py-[7px] rounded-full bg-white/[.18] hover:bg-white/25">
        → הבית שלי
      </Link>
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 lg:gap-5">
        <div className="min-w-0">
          <div className="text-[13px] opacity-85">{kicker}</div>
          <h1 className="m-0 mt-1 text-white font-rubik font-bold text-[28px] leading-[1.1] lg:text-[38px]">{title}</h1>
          {sub && <div className="opacity-85 mt-1.5">{sub}</div>}
        </div>
        {side}
      </div>
      {tabs && <nav className="flex gap-1.5 overflow-x-auto -mx-[18px] px-[18px] lg:mx-0 lg:px-0 pb-0.5">{tabs}</nav>}
    </section>
  );
}

export function SpaceTab({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`shrink-0 border-0 px-4 py-[9px] rounded-full font-semibold text-[14.5px] ${on ? 'bg-white text-[#2a1846]' : 'bg-white/[.14] text-white hover:bg-white/[.22]'}`}
    >
      {children}
    </button>
  );
}
