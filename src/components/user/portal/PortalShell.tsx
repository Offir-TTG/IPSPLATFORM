'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { NoticeBars, NoticeOverlays, usePortalNotices } from './PortalNotices';

export type PortalUser = { firstName: string; lastName: string; email: string; role: string };
export type PortalOrg = { name: string; logoUrl: string | null };

type NavKey = 'home' | 'calendar' | 'payments' | 'alerts' | 'profile';

// Top bar (desktop) and bottom tabs (phone), as in the design canvas.
const TOP_NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'home', label: 'בית', href: '/dashboard' },
  { key: 'calendar', label: 'יומן', href: '/calendar' },
  { key: 'payments', label: 'תשלומים ומנויים', href: '/billing' },
];
const TABS: { key: NavKey; label: string; href: string }[] = [
  { key: 'home', label: 'בית', href: '/dashboard' },
  { key: 'calendar', label: 'יומן', href: '/calendar' },
  { key: 'alerts', label: 'התראות', href: '/notifications' },
  { key: 'payments', label: 'תשלומים', href: '/billing' },
  { key: 'profile', label: 'פרופיל', href: '/profile' },
];

function activeKey(path: string): NavKey | null {
  if (path.startsWith('/dashboard') || path.startsWith('/courses') || path.startsWith('/programs')) return 'home';
  if (path.startsWith('/calendar')) return 'calendar';
  if (path.startsWith('/billing') || path.startsWith('/payments') || path.startsWith('/invoices')) return 'payments';
  if (path.startsWith('/notifications')) return 'alerts';
  if (path.startsWith('/profile')) return 'profile';
  return null;
}

/** The organisation's logo from the admin; a soft purple mark until one is uploaded. */
const OrgLogo = ({ org }: { org: PortalOrg }) =>
  org.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={org.logoUrl} alt="" className="block shrink-0 w-8 h-8 lg:w-9 lg:h-9 object-contain" />
  ) : (
    <span
      aria-hidden="true"
      className="block shrink-0 rounded-full w-8 h-8 lg:w-9 lg:h-9"
      style={{ background: 'conic-gradient(#8a3f86 0 30%, #6b4bb5 0 55%, #e9b44c 0 75%, #4f3a9c 0)' }}
    />
  );

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#221a2e" strokeWidth="1.8" aria-hidden="true">
    <path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

export function PortalShell({ user, org, staffRedirect = true, children }: { user: PortalUser; org: PortalOrg; staffRedirect?: boolean; children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const { unreadCount } = useUnreadCount();
  const { notices, loaded, markRead } = usePortalNotices();
  const active = activeKey(pathname);
  const initial = (user.firstName || user.email || '?').trim().charAt(0).toUpperCase();

  // Staff belong in the admin, unless they are previewing what a client sees.
  useEffect(() => {
    const isStaff = user.role === 'admin' || user.role === 'super_admin';
    if (staffRedirect && isStaff && new URLSearchParams(window.location.search).get('preview') !== '1') {
      router.replace('/admin/dashboard');
    }
  }, [user.role, router, staffRedirect]);

  // Shown inside a child's page (the enrollment wizard runs there in a frame):
  // enrollment pages show bare; any other portal page takes over the whole window.
  useEffect(() => {
    if (window.self === window.top) return;
    if (!pathname.startsWith('/enroll')) window.top!.location.href = window.location.href;
  }, [pathname]);

  const badge = unreadCount > 0 && (
    <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 rounded-full bg-[#c2413a] text-white text-[11px] leading-4 font-semibold text-center border-2 border-white px-1">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-[#f6f3fa] text-[#221a2e] [.ips-embedded_&]:min-h-0 [.ips-embedded_&]:bg-transparent">
      {/* Marks the page as framed before it paints, so the portal chrome never flashes inside the frame. */}
      <script dangerouslySetInnerHTML={{ __html: "if(window.self!==window.top)document.documentElement.classList.add('ips-embedded')" }} />
      <header className="sticky top-0 z-50 bg-white border-b border-[#e9e3f1] [.ips-embedded_&]:hidden">
        <NoticeBars notices={notices} onClose={markRead} />
        <div className="mx-auto max-w-7xl h-[72px] lg:h-[77px] flex items-center gap-2.5 lg:gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" aria-label={org.name || 'בית'} className="flex items-center gap-2.5 min-w-0 text-[#221a2e] no-underline">
            <OrgLogo org={org} />
            {org.name && (
              <span className="font-rubik font-bold text-[15px] leading-[1.2] max-w-[150px] truncate lg:max-w-[190px] lg:whitespace-normal lg:line-clamp-2">{org.name}</span>
            )}
          </Link>

          <nav aria-label="תפריט ראשי" className="hidden lg:flex gap-1 ms-4">
            {TOP_NAV.map((item) => {
              const on = item.key === active;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={on ? 'page' : undefined}
                  className={`px-3.5 py-2 rounded-[10px] text-[15px] no-underline whitespace-nowrap ${
                    on ? 'bg-[#f1ebf8] text-[#5b3a8e] font-semibold' : 'text-[#5f5675] hover:bg-[#f6f3fa]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <PortalSearch />

          <Link
            href="/notifications"
            aria-label={unreadCount ? `התראות, ${unreadCount} חדשות` : 'התראות'}
            className={`relative ms-auto lg:ms-0 w-11 h-11 rounded-xl border border-[#e9e3f1] bg-white grid place-items-center ${
              active === 'alerts' ? 'shadow-[0_0_0_2px_#5b3a8e]' : ''
            }`}
          >
            <BellIcon />
            {badge}
          </Link>
          <Link
            href="/profile"
            aria-label="פרופיל"
            className={`w-11 h-11 rounded-full bg-[#5b3a8e] text-white font-rubik font-bold text-[15px] leading-[44px] text-center no-underline ${
              active === 'profile' ? 'shadow-[0_0_0_3px_#e9b44c]' : ''
            }`}
          >
            {initial}
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 lg:pt-7 pb-28 lg:pb-9 [.ips-embedded_&]:p-0 [.ips-embedded_&]:max-w-none">{children}</main>

      <NoticeOverlays notices={notices} loaded={loaded} onClose={markRead} />

      <nav
        aria-label="תפריט"
        className="lg:hidden [.ips-embedded_&]:hidden fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 bg-white border-t border-[#e9e3f1] px-1 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        {TABS.map((tab) => {
          const on = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={on ? 'page' : undefined}
              className={`relative text-center text-[11.5px] py-1.5 no-underline ${on ? 'font-semibold text-[#5b3a8e]' : 'font-medium text-[#73698a]'}`}
            >
              {tab.label}
              {tab.key === 'alerts' && unreadCount > 0 && (
                <span className="absolute top-0.5 start-1/2 ms-5 w-2 h-2 rounded-full bg-[#c2413a]" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

type SearchHit = { result_type: string; result_id: string; result_title: string; result_description?: string; result_url: string };
const TYPE_LABEL: Record<string, string> = { courses: 'קורסים', lessons: 'שיעורים', files: 'קבצים', announcements: 'הודעות' };

function PortalSearch() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<Record<string, SearchHit[]>>({});
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setGroups({});
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/user/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = res.ok ? await res.json() : null;
        setGroups(json?.results ?? {});
      } catch {
        /* aborted or offline: keep the last results */
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const entries = Object.entries(groups).filter(([, hits]) => hits?.length);
  const showPanel = open && q.trim().length >= 2;

  return (
    <div ref={box} className="relative hidden lg:block ms-auto w-[240px] xl:w-[320px]">
      <label htmlFor="portal-q" className="flex items-center gap-2 min-h-[42px] px-3.5 rounded-xl bg-[#f6f3fa] border border-[#e9e3f1]">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#73698a" strokeWidth="1.8" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          id="portal-q"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          placeholder="חיפוש תוכנית, מועדון, הקלטה או קבלה"
          className="border-0 bg-transparent text-sm w-full outline-none text-[#221a2e] placeholder:text-[#73698a]"
        />
      </label>
      {showPanel && (
        <div className="absolute top-[calc(100%+8px)] inset-x-0 z-50 bg-white rounded-2xl border border-[#e9e3f1] shadow-[0_18px_40px_-18px_rgba(60,30,110,.45)] p-2 max-h-[420px] overflow-auto">
          {loading && !entries.length && <div className="p-3 text-sm text-[#73698a]">מחפשים…</div>}
          {!loading && !entries.length && <div className="p-3 text-sm text-[#73698a]">לא נמצאו תוצאות</div>}
          {entries.map(([group, hits]) => (
            <div key={group} className="py-1">
              <div className="px-3 py-1 text-xs font-semibold text-[#73698a]">{TYPE_LABEL[group] ?? group}</div>
              {hits.slice(0, 5).map((h) => (
                <Link
                  key={`${h.result_type}-${h.result_id}`}
                  href={h.result_url || '/dashboard'}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-xl text-[#221a2e] no-underline hover:bg-[#f6f3fa]"
                >
                  <span className="block text-sm font-semibold">{h.result_title}</span>
                  {h.result_description && <span className="block text-xs text-[#73698a] truncate">{h.result_description}</span>}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
