'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { CATEGORY_ICON, FallbackIcon, PORTAL_TONE } from '@/components/admin/notifications/notificationStyle';
import type { NotificationCategory, NotificationPriority } from '@/types/notifications';

/**
 * How notifications appear across the portal, by the style the admin chose:
 *   top_bar  a coloured bar above the header on every page, until closed
 *   modal    a window in the middle of the screen, the first unread one, until closed
 *   toast    a small card in the bottom corner, once per visit
 *   home_card  shown by the home page itself
 *   list     nothing extra; important and urgent ones that arrive while the
 *            portal is open pop up briefly (5 s / 10 s), as before
 * Every notification is also in the Notifications page and the bell count.
 * Closing any of these marks it read; hiding by itself does not.
 */

type Notice = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  action_url: string | null;
  action_label: string | null;
  display_style: string;
  is_read: boolean;
};

const SEEN_KEY = 'portal-toasts-seen';
const readSeen = (): string[] => {
  try {
    return JSON.parse(sessionStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
};
const addSeen = (id: string) => {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...readSeen(), id])]));
  } catch {
    /* private mode: it may show again next page, which is harmless */
  }
};
const tone = (p: string) => PORTAL_TONE[(p as NotificationPriority) in PORTAL_TONE ? (p as NotificationPriority) : 'medium'];
const iconOf = (c: string) => CATEGORY_ICON[c as NotificationCategory] ?? FallbackIcon;

/** The signed-in user's unread notifications, refreshed when something new arrives. */
export function usePortalNotices() {
  const queryClient = useQueryClient();
  const query = useQuery<Notice[]>({
    queryKey: ['notifications', 'portal-unread'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?unread_only=true&limit=50');
      if (!res.ok) return [];
      const json = await res.json();
      return ((json?.notifications as Notice[]) ?? []).filter((n) => !n.is_read);
    },
    refetchInterval: 60_000,
    staleTime: 15_000,
  });

  // Something was inserted: ask the server again for this user's own list.
  // The event's contents are never shown, since it may belong to someone else.
  useEffect(() => {
    const channel = supabase
      .channel(`portal-notices-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const markRead = (id: string) => {
    queryClient.setQueryData<Notice[]>(['notifications', 'portal-unread'], (xs) => (xs ?? []).filter((x) => x.id !== id));
    return fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_read: true }) })
      .catch(() => {})
      .finally(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      });
  };

  return { notices: query.data ?? [], loaded: query.isFetched, markRead };
}

/** Coloured bars above the header. */
export function NoticeBars({ notices, onClose }: { notices: Notice[]; onClose: (id: string) => void }) {
  const bars = notices.filter((n) => n.display_style === 'top_bar');
  if (!bars.length) return null;
  return (
    <div>
      {bars.map((n) => {
        const t = tone(n.priority);
        const Icon = iconOf(n.category);
        return (
          <div key={n.id} role="status" className={`border-b ${t.card}`}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-sm">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${t.tile}`} aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span className={`min-w-0 flex-1 ${t.title}`}>
                <b>{n.title}</b>
                {n.message && n.message !== n.title && <span className={`hidden sm:inline ${t.text}`}> · {n.message}</span>}
              </span>
              {n.action_url && (
                <Link href={n.action_url} onClick={() => onClose(n.id)} className={`shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold no-underline ${t.button}`}>
                  {n.action_label || 'לפרטים'}
                </Link>
              )}
              <button type="button" onClick={() => onClose(n.id)} aria-label="סגירה" className={`shrink-0 grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent hover:bg-white/70 ${t.text}`}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The window and the corner cards. */
export function NoticeOverlays({ notices, loaded, onClose }: { notices: Notice[]; loaded: boolean; onClose: (id: string) => void }) {
  const known = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<{ n: Notice; ms: number }[]>([]);

  useEffect(() => {
    if (!loaded) return;
    const seen = new Set(readSeen());
    const fresh: { n: Notice; ms: number }[] = [];
    // Toast style: once per visit.
    for (const n of notices) {
      if (n.display_style === 'toast' && !seen.has(n.id)) {
        fresh.push({ n, ms: 10_000 });
        addSeen(n.id);
      }
    }
    // Everyday style: important and urgent ones that arrive while the portal is open.
    if (known.current) {
      for (const n of notices) {
        if (!known.current.has(n.id) && n.display_style === 'list' && (n.priority === 'high' || n.priority === 'urgent')) {
          fresh.push({ n, ms: n.priority === 'urgent' ? 10_000 : 5_000 });
        }
      }
    }
    known.current = new Set(notices.map((n) => n.id));
    if (fresh.length) setToasts((ts) => [...ts.filter((t) => !fresh.some((f) => f.n.id === t.n.id)), ...fresh]);
    // A notice read elsewhere leaves the corner too.
    setToasts((ts) => ts.filter((t) => notices.some((n) => n.id === t.n.id)));
  }, [notices, loaded]);

  // Hiding by itself doesn't mark it read.
  const hide = (id: string) => setToasts((ts) => ts.filter((t) => t.n.id !== id));
  const close = (id: string) => {
    hide(id);
    onClose(id);
  };

  const modal = notices.find((n) => n.display_style === 'modal');

  return (
    <>
      {toasts.length > 0 && (
        <div className="[.ips-embedded_&]:hidden fixed bottom-24 lg:bottom-5 left-4 lg:left-5 z-[60] flex flex-col gap-3 w-[min(360px,calc(100%-2rem))]" aria-live="polite">
          {toasts.map(({ n, ms }) => (
            <Toast key={n.id} n={n} ms={ms} onHide={() => hide(n.id)} onClose={() => close(n.id)} />
          ))}
        </div>
      )}
      {modal && <NoticeModal n={modal} onClose={() => onClose(modal.id)} />}
    </>
  );
}

function Toast({ n, ms, onHide, onClose }: { n: Notice; ms: number; onHide: () => void; onClose: () => void }) {
  const hideRef = useRef(onHide);
  hideRef.current = onHide;
  useEffect(() => {
    const t = setTimeout(() => hideRef.current(), ms);
    return () => clearTimeout(t);
  }, [ms]);
  const t = tone(n.priority);
  const Icon = iconOf(n.category);
  return (
    <div role="status" className={`rounded-2xl border p-4 shadow-xl ${t.card}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${t.tile}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`m-0 font-bold ${t.title}`}>{n.title}</p>
          {n.message && n.message !== n.title && <p className={`m-0 mt-0.5 text-sm ${t.text}`}>{n.message}</p>}
          {n.action_url && (
            <Link href={n.action_url} onClick={onClose} className={`mt-2 inline-block text-sm font-semibold underline ${t.title}`}>
              {n.action_label || 'לפרטים'}
            </Link>
          )}
        </div>
        <button type="button" onClick={onClose} aria-label="סגירה" className={`shrink-0 border-0 bg-transparent p-1 ${t.text}`}>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NoticeModal({ n, onClose }: { n: Notice; onClose: () => void }) {
  const t = tone(n.priority);
  const Icon = iconOf(n.category);
  const closeBtn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="[.ips-embedded_&]:hidden fixed inset-0 z-[70] grid place-items-center bg-[#1e1230]/50 p-4" role="dialog" aria-modal="true" aria-labelledby={`notice-${n.id}`}>
      <div className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl ${t.card}`}>
        <div className="flex items-start gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${t.tile}`} aria-hidden="true">
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`notice-${n.id}`} className={`m-0 font-rubik font-bold text-xl ${t.title}`}>
              {n.title}
            </h2>
            {n.message && n.message !== n.title && <p className={`m-0 mt-2 ${t.text}`}>{n.message}</p>}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          {n.action_url && (
            <Link href={n.action_url} onClick={onClose} className={`rounded-xl px-4 py-2.5 text-sm font-semibold no-underline ${t.button}`}>
              {n.action_label || 'לפרטים'}
            </Link>
          )}
          <button ref={closeBtn} type="button" onClick={onClose} className="rounded-xl border border-[#e3dcef] bg-white px-4 py-2.5 text-sm font-semibold text-[#221a2e]">
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}
