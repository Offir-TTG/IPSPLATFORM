'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CATEGORY_HE, CATEGORY_ICON, FallbackIcon, PORTAL_TONE, PRIORITY_HE } from '@/components/admin/notifications/notificationStyle';
import type { NotificationCategory, NotificationPriority } from '@/types/notifications';

export type AlertItem = {
  id: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  href: string | null;
  actionLabel: string | null;
  createdAt: string;
  isRead: boolean;
};

type Tab = 'all' | 'unread' | 'read' | 'deleted';
const TZ = 'Asia/Jerusalem';
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);

function when(iso: string, now: number) {
  const d = new Date(iso);
  const min = Math.round((now - d.getTime()) / 60000);
  if (min < 1) return 'עכשיו';
  if (min < 60) return `לפני ${min} דק׳`;
  if (dayKey(d) === dayKey(new Date(now))) return min < 120 ? 'לפני שעה' : `לפני ${Math.round(min / 60)} שעות`;
  if (dayKey(d) === dayKey(new Date(now - 86400000))) return 'אתמול';
  return new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: 'numeric', month: 'long' }).format(d);
}

const toneOf = (p: string) => PORTAL_TONE[(p as NotificationPriority) in PORTAL_TONE ? (p as NotificationPriority) : 'medium'];
const loud = (p: string) => p === 'high' || p === 'urgent';
const fromApi = (n: any): AlertItem => ({
  id: n.id,
  category: n.category,
  priority: n.priority ?? 'medium',
  title: n.title,
  message: n.message ?? '',
  href: n.action_url || null,
  actionLabel: n.action_label || null,
  createdAt: n.created_at,
  isRead: true,
});

export function AlertsList({ initial, serverNow }: { initial: AlertItem[]; serverNow: number }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>('all');
  const [deleted, setDeleted] = useState<AlertItem[] | null>(null);
  const [deletedCount, setDeletedCount] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<AlertItem | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };
  const patch = (id: string, is_read: boolean) =>
    fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_read }) })
      .then(refresh)
      .catch(() => {});

  useEffect(() => {
    fetch('/api/notifications/deleted?limit=0')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setDeletedCount(Number(j?.total ?? 0)))
      .catch(() => {});
  }, []);

  const setRead = (id: string, isRead: boolean) => {
    const n = items.find((x) => x.id === id);
    if (!n || n.isRead === isRead) return;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, isRead } : x)));
    patch(id, isRead);
  };

  const readAll = () => {
    setItems((xs) => xs.map((x) => ({ ...x, isRead: true })));
    fetch('/api/notifications/mark-all-read', { method: 'POST' }).then(refresh).catch(() => {});
  };

  const remove = (n: AlertItem) => {
    setItems((xs) => xs.filter((x) => x.id !== n.id));
    setDeleted((d) => (d ? [{ ...n, isRead: true }, ...d] : d));
    setDeletedCount((c) => c + 1);
    fetch(`/api/notifications/${n.id}`, { method: 'DELETE' }).then(refresh).catch(() => {});
  };

  const pick = (t: Tab) => {
    setTab(t);
    if (t === 'deleted' && deleted === null) {
      fetch('/api/notifications/deleted')
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          const list = ((j?.notifications as any[]) ?? []).map(fromApi);
          setDeleted(list);
          setDeletedCount(Number(j?.total ?? list.length));
        })
        .catch(() => setDeleted([]));
    }
  };

  const unread = items.filter((n) => !n.isRead);
  const counts: Record<Tab, number> = { all: items.length, unread: unread.length, read: items.length - unread.length, deleted: deletedCount };
  const list = tab === 'deleted' ? deleted ?? [] : items.filter((n) => (tab === 'all' ? true : tab === 'unread' ? !n.isRead : n.isRead));
  const todayKey = dayKey(new Date(serverNow));
  const groups = [
    { label: 'היום', rows: list.filter((n) => dayKey(new Date(n.createdAt)) === todayKey) },
    { label: 'מוקדם יותר', rows: list.filter((n) => dayKey(new Date(n.createdAt)) !== todayKey) },
  ].filter((g) => g.rows.length);
  const TABS: [Tab, string][] = [
    ['all', 'הכול'],
    ['unread', 'לא נקראו'],
    ['read', 'נקראו'],
    ['deleted', 'נמחקו'],
  ];

  return (
    <div className="max-w-[980px] w-full mx-auto flex flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-[#221a2e] font-rubik font-bold text-[26px] lg:text-[30px]">התראות</h1>
          <p className="m-0 mt-1 text-[#73698a]">עדכונים מצוות בית הספר, על השיעורים והתשלומים שלכם.</p>
        </div>
        {unread.length > 0 && (
          <button type="button" onClick={readAll} className="rounded-full border border-[#e9e3f1] bg-white px-4 py-2 text-sm font-semibold text-[#5b3a8e] hover:bg-[#faf8fd]">
            ✓ סמנו הכול כנקרא
          </button>
        )}
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 pb-1" role="tablist" aria-label="סינון">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => pick(k)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${tab === k ? 'bg-[#5b3a8e] text-white font-semibold' : 'border border-[#e9e3f1] bg-white text-[#221a2e]'}`}
          >
            {label} · {counts[k]}
          </button>
        ))}
      </div>

      {groups.map((g) => (
        <section key={g.label} aria-label={g.label}>
          <p className="mt-6 mb-0 text-xs font-bold tracking-widest text-[#73698a]">{g.label}</p>
          <div className="mt-2 flex flex-col gap-3">
            {g.rows.map((n) => {
              const isDeleted = tab === 'deleted';
              const isUnread = !n.isRead && !isDeleted;
              // Read everyday ones go quiet; important and urgent keep their colour until read.
              const t = isUnread || !loud(n.priority) ? toneOf(n.priority) : PORTAL_TONE.low;
              const Icon = CATEGORY_ICON[n.category as NotificationCategory] ?? FallbackIcon;
              const label = [loud(n.priority) ? PRIORITY_HE[n.priority as NotificationPriority] : null, CATEGORY_HE[n.category as NotificationCategory]].filter(Boolean).join(' · ');
              return (
                <article key={n.id} className={`relative rounded-2xl border p-4 ${t.card} ${isUnread ? '' : 'opacity-90'}`}>
                  {isUnread && (
                    <span
                      className={`absolute top-4 left-4 h-2.5 w-2.5 rounded-full ${n.priority === 'urgent' ? 'bg-red-500' : n.priority === 'high' ? 'bg-amber-500' : 'bg-[#5b3a8e]'}`}
                      aria-label="לא נקרא"
                    />
                  )}
                  <div className="flex items-start gap-3">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${t.tile}`} aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 pe-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`m-0 text-base ${isUnread ? 'font-bold' : 'font-semibold'} ${t.title}`}>{n.title}</h3>
                        {label && <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-[#5f5675]">{label}</span>}
                      </div>
                      {n.message && n.message !== n.title && <p className={`m-0 mt-1 text-sm ${t.text}`}>{n.message}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {n.href && !isDeleted && (
                          <Link href={n.href} onClick={() => setRead(n.id, true)} className={`rounded-full px-4 py-1.5 text-sm font-semibold no-underline ${t.button}`}>
                            {n.actionLabel || 'לפרטים'}
                          </Link>
                        )}
                        <span className={`text-xs ${t.text} opacity-80`}>
                          {when(n.createdAt, serverNow)}
                          {!isUnread && !isDeleted ? ' · נקרא' : ''}
                        </span>
                        {!isDeleted && (
                          <span className={`ms-auto flex gap-1 text-sm ${t.text}`}>
                            {isUnread ? (
                              <button type="button" onClick={() => setRead(n.id, true)} className="rounded-full border-0 bg-transparent px-2 py-1 hover:bg-white">
                                ✓ נקרא
                              </button>
                            ) : (
                              <button type="button" onClick={() => setRead(n.id, false)} className="rounded-full border-0 bg-transparent px-2 py-1 hover:bg-white">
                                ↺ לא נקרא
                              </button>
                            )}
                            <button type="button" onClick={() => setConfirmDelete(n)} aria-label={`מחיקת ההתראה: ${n.title}`} className="rounded-full border-0 bg-transparent px-2 py-1 hover:bg-white">
                              🗑
                            </button>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      {tab === 'deleted' && deleted === null && <p className="mt-6 text-center text-sm text-[#73698a]">טוענים…</p>}
      {list.length === 0 && !(tab === 'deleted' && deleted === null) && (
        <div className="mt-6 bg-white rounded-2xl p-6 text-center text-[#73698a]">
          {tab === 'deleted' ? 'אין התראות שנמחקו.' : tab === 'unread' ? 'אין התראות שלא נקראו. הכול מעודכן.' : 'אין התראות כאן.'}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>למחוק את ההתראה?</AlertDialogTitle>
            <AlertDialogDescription>היא תעבור ללשונית ״נמחקו״.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) remove(confirmDelete);
                setConfirmDelete(null);
              }}
              className="bg-[#b3392f] hover:bg-[#9a2f27]"
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
