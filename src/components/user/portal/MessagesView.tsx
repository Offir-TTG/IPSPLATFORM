'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MessageView, ThreadView } from '@/lib/portal/messageTypes';

const TZ = 'Asia/Jerusalem';
const dayKey = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
function stamp(iso: string) {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat('he-IL', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  if (dayKey(d) === dayKey(new Date())) return `היום ${time}`;
  if (dayKey(d) === dayKey(new Date(Date.now() - 86400000))) return `אתמול ${time}`;
  return `${new Intl.DateTimeFormat('he-IL', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(d)} ${time}`;
}
const initials = (name: string) =>
  name
    .replace(/^ד״ר\s+|^ד"ר\s+/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 1)
    .map((w) => w[0])
    .join('');

function Avatar({ t, size = 42 }: { t: ThreadView; size?: number }) {
  return t.who.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={t.who.avatarUrl} alt="" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="shrink-0 rounded-full text-white font-rubik font-bold text-[15px] grid place-items-center" style={{ width: size, height: size, background: t.color }} aria-hidden="true">
      {initials(t.who.name)}
    </span>
  );
}

/** "הודעות": conversations with instructors, coaches and the school team. */
export function MessagesView({ threads: initial, initialKey }: { threads: ThreadView[]; initialKey: string | null }) {
  const [threads, setThreads] = useState(initial);
  const [cur, setCur] = useState<string | null>(initialKey);
  const [msgs, setMsgs] = useState<MessageView[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const t = threads.find((x) => x.key === cur) ?? null;

  // Open a conversation: load it and mark it read.
  useEffect(() => {
    setMsgs(null);
    setError(null);
    if (!t) return;
    if (!t.threadId) {
      setMsgs([]);
      return;
    }
    fetch(`/api/user/messages/${t.threadId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setMsgs((j?.messages as MessageView[]) ?? []))
      .catch(() => setMsgs([]));
    if (t.unread) setThreads((xs) => xs.map((x) => (x.key === t.key ? { ...x, unread: false } : x)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !t) return;
    setSending(true);
    setError(null);
    const res = await fetch('/api/user/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t.threadId ? { thread_id: t.threadId, body } : t.kind === 'general' ? { general: true, body } : { enrollment_id: t.enrollmentId, body }),
    }).catch(() => null);
    setSending(false);
    if (!res?.ok) return setError('ההודעה לא נשלחה. נסו שוב.');
    const j = await res.json();
    const m: MessageView = j.message ?? { id: String(Date.now()), body, at: new Date().toISOString(), fromMe: true };
    setDraft('');
    setMsgs((xs) => [...(xs ?? []), m]);
    setThreads((xs) =>
      xs
        .map((x) => (x.key === t.key ? { ...x, threadId: j.thread_id ?? x.threadId, last: { body, at: m.at, fromMe: true } } : x))
        .sort((a, b) => +new Date(b.last?.at ?? 0) - +new Date(a.last?.at ?? 0))
    );
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div className={cur ? 'hidden lg:block' : ''}>
        <h1 className="m-0 text-[#221a2e] font-rubik font-bold text-[26px] lg:text-[30px]">הודעות</h1>
        <div className="text-[#73698a] mt-1">שיחות עם המנחים והצוות, מכל המרחבים שלך</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] bg-white rounded-3xl shadow-[0_1px_0_#e9e3f1] overflow-hidden lg:min-h-[640px]">
        {/* Conversation list; on a phone it gives way to the open conversation. */}
        <div className={`lg:border-e border-[#efe9f6] flex flex-col ${cur ? 'hidden lg:flex' : ''}`}>
          {threads.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setCur(x.key)}
              aria-current={x.key === cur ? 'true' : undefined}
              className={`flex gap-3 items-center w-full border-0 border-b border-[#f3eef8] px-4 py-3.5 text-[#221a2e] text-start ${x.key === cur ? 'bg-[#f1ebf8]' : 'bg-white hover:bg-[#faf8fd]'}`}
            >
              <Avatar t={x} />
              <span className="flex-1 min-w-0">
                <b className="block text-[14.5px]">{x.who.name}</b>
                <span className="block text-[12.5px] text-[#8a809a]">{x.title}</span>
                <span className="block text-[13px] text-[#5f5675] truncate">{x.last ? `${x.last.fromMe ? 'אני: ' : ''}${x.last.body}` : 'עוד אין הודעות. אפשר לכתוב.'}</span>
              </span>
              {x.unread && <span className="w-2.5 h-2.5 rounded-full bg-[#5b3a8e] shrink-0" aria-label="לא נקרא" />}
            </button>
          ))}
          {threads.length === 0 && <div className="p-6 text-center text-[#73698a] text-sm">אין עדיין שיחות.</div>}
        </div>

        <div className={`flex flex-col min-h-[70vh] lg:min-h-0 ${cur ? '' : 'hidden lg:flex'}`}>
          {t ? (
            <>
              <div className="flex gap-3 items-center px-4 lg:px-5 py-4 border-b border-[#efe9f6]">
                <button type="button" onClick={() => setCur(null)} className="lg:hidden border-0 bg-transparent text-[#5b3a8e] font-semibold text-sm px-1" aria-label="חזרה לשיחות">
                  →
                </button>
                <Avatar t={t} />
                <span className="min-w-0">
                  <b className="block text-base">{t.who.name}</b>
                  <span className="text-[13px] text-[#73698a]">
                    {t.who.role} · {t.title}
                  </span>
                </span>
                {t.href && (
                  <Link href={t.href} className="ms-auto shrink-0 font-semibold text-[13.5px] no-underline px-3 py-2 rounded-[10px] bg-[#f1ebf8] text-[#5b3a8e]">
                    למרחב ←
                  </Link>
                )}
              </div>
              <div className="flex-1 p-4 lg:p-5 flex flex-col gap-2.5 bg-[#faf8fc] overflow-y-auto">
                {msgs === null && <span className="text-sm text-[#73698a]">טוענים…</span>}
                {msgs?.length === 0 && <span className="text-sm text-[#73698a]">כתבו את ההודעה הראשונה. {t.who.name} יקבל/תקבל אותה ויענה כאן.</span>}
                {msgs?.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] lg:max-w-[70%] px-3.5 py-[11px] rounded-2xl text-[14.5px] whitespace-pre-wrap ${
                      m.fromMe ? 'self-end bg-[#5b3a8e] text-white' : 'self-start bg-white shadow-[0_1px_0_#e9e3f1]'
                    }`}
                  >
                    {m.body}
                    <div className="text-xs opacity-65 mt-1">{stamp(m.at)}</div>
                  </div>
                ))}
                <div ref={end} />
              </div>
              <div className="flex flex-col gap-1.5 px-4 py-3.5 border-t border-[#efe9f6]">
                <div className="flex gap-2.5">
                  <label htmlFor="msg-in" className="sr-only">
                    כתיבת תשובה
                  </label>
                  <textarea
                    id="msg-in"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="כתיבת תשובה"
                    className="flex-1 min-h-[46px] max-h-40 resize-y rounded-xl border border-[#e3dcef] bg-[#f9f7fc] px-3.5 py-3 text-[15px] focus:outline-none focus:border-[#5b3a8e] focus:bg-white"
                  />
                  <button type="button" onClick={send} disabled={sending || !draft.trim()} className="border-0 bg-[#5b3a8e] hover:bg-[#4a2f75] disabled:opacity-60 text-white font-semibold text-[15px] px-[22px] rounded-xl">
                    {sending ? 'שולחים…' : 'שליחה'}
                  </button>
                </div>
                {error && (
                  <span className="text-sm text-[#b3392f]" role="status">
                    {error}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 grid place-items-center p-8 text-[#73698a] text-sm">בחרו שיחה מהרשימה</div>
          )}
        </div>
      </div>
    </div>
  );
}
