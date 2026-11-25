'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ChildView } from '@/lib/portal/familyTypes';
import { FamilyTab } from './FamilyTab';

type CategoryPref = { in_app?: boolean; email?: boolean; push?: boolean };

export type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isWhatsapp: boolean;
  contactEmail: string;
  bio: string;
  location: string;
  timezone: string | null;
  website: string;
  linkedin: string;
  facebook: string;
  instagram: string;
  avatarUrl: string | null;
  belongs: string;
  prefs: {
    email: boolean;
    categories: Record<string, CategoryPref>;
    quietStart: string | null;
    quietEnd: string | null;
    digest: boolean;
  } | null;
  sessions: { id: string; device: string; place: string; lastActive: string }[];
};

type Tab = 'details' | 'family' | 'notify' | 'security';
const TABS: [Tab, string][] = [
  ['details', 'הפרטים שלי'],
  ['family', 'הילדים שלי'],
  ['notify', 'עדכונים'],
  ['security', 'אבטחה וכניסה'],
];

// What each kind of update means to a client, and the defaults the system uses when nothing is saved.
// `inc`: which automatic reminders each kind includes.
const PREF_ROWS: { key: string; label: string; sub: string; inc?: string; def: CategoryPref }[] = [
  { key: 'lesson', label: 'מפגשים והקלטות', sub: 'תזכורת לפני מפגש חי, שינויים, והקלטה שעלתה לצפייה', inc: 'כולל מפגשי ליווי: תזכורת לפני, ושינוי מועד', def: { email: true } },
  { key: 'announcement', label: 'הודעות מהצוות', sub: 'עדכונים מהמנחים ומצוות בית הספר', def: { email: true } },
  { key: 'assignment', label: 'מטלות ומועדי הגשה', sub: 'בכל המרחבים שלך', inc: 'כולל תזכורת לפני מועד הגשה, ומשוב שפורסם', def: { email: true } },
  { key: 'payment', label: 'תשלומים וקבלות', sub: 'לפני חיוב ואחריו', inc: 'כולל תזכורות כשתשלום לא עבר או כרטיס עומד לפוג', def: { email: true } },
  { key: 'enrollment', label: 'הרשמה', sub: 'אישור הרשמה וסיום קורס', inc: 'כולל תזכורות להשלמת הרשמה, חוזה ושאלון', def: { email: true } },
  { key: 'achievement', label: 'הישגים ותעודות', sub: 'כשמסיימים קורס או מגיעים לאבן דרך', inc: 'כולל הודעה כשהתעודה מוכנה', def: { email: true } },
];

const input = 'min-h-11 rounded-xl border border-[#e3dcef] bg-[#f9f7fc] px-3 text-[15px] text-[#221a2e] focus:outline-none focus:border-[#5b3a8e] focus:bg-white';
const label = 'flex flex-col gap-1.5 text-[13.5px] font-medium';
const h1 = 'm-0 text-[#221a2e] font-rubik font-bold text-[22px] lg:text-2xl';
const row = 'flex justify-between items-center gap-3 p-3.5 rounded-[14px] bg-[#f6f2fb]';
const softBtn = 'shrink-0 border border-[#e3dcef] bg-white font-semibold text-sm px-3.5 py-[9px] rounded-[10px] hover:bg-[#faf8fd]';
const mainBtn = 'border-0 bg-[#5b3a8e] hover:bg-[#4a2f75] disabled:opacity-60 text-white font-semibold text-[15px] px-[22px] py-3 rounded-xl';

function Switch({ on, onChange, label: aria }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={aria}
      onClick={onChange}
      className={`relative inline-block w-11 h-[26px] rounded-full border-0 p-0 align-middle ${on ? 'bg-[#5b3a8e]' : 'bg-[#d9d1e6]'}`}
    >
      <span className={`absolute top-[3px] w-5 h-5 rounded-full bg-white transition-[left] ${on ? 'left-[3px]' : 'left-[21px]'}`} />
    </button>
  );
}

export function ProfileView({ data, kids, initialTab }: { data: ProfileData; kids: ChildView[]; initialTab: Tab }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const initial = (data.firstName || data.email || '?').charAt(0).toUpperCase();

  // Photo
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(data.avatarUrl);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const uploadPhoto = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) return setPhotoMsg('התמונה גדולה מ-2MB');
    const fd = new FormData();
    fd.append('file', file);
    setPhotoMsg('מעלים…');
    const res = await fetch('/api/user/profile/upload-avatar', { method: 'POST', body: fd });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.url) {
      setAvatar(json.url);
      setPhotoMsg(null);
    } else setPhotoMsg('ההעלאה נכשלה');
  };
  const removePhoto = async () => {
    const res = await fetch('/api/user/profile/remove-avatar', { method: 'DELETE' });
    if (res.ok) setAvatar(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-5 items-start">
      <aside className="bg-white rounded-[22px] p-4 lg:p-5 shadow-[0_1px_0_#e9e3f1] flex flex-col gap-3.5">
        <div className="flex gap-3 items-center">
          <span className="relative shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <span className="block w-14 h-14 rounded-full bg-[#5b3a8e] text-white font-rubik font-bold text-[22px] leading-[56px] text-center">{initial}</span>
            )}
          </span>
          <span className="min-w-0">
            <b className="block font-rubik font-semibold text-[17px]">{[data.firstName, data.lastName].filter(Boolean).join(' ') || data.email}</b>
            {data.belongs && <span className="text-[#73698a] text-[13px]">{data.belongs}</span>}
          </span>
        </div>
        <div className="flex gap-3 text-[13px]">
          <button type="button" onClick={() => fileRef.current?.click()} className="border-0 bg-transparent p-0 font-semibold text-[#5b3a8e]">
            {avatar ? 'החלפת תמונה' : 'הוספת תמונה'}
          </button>
          {avatar && (
            <button type="button" onClick={removePhoto} className="border-0 bg-transparent p-0 font-semibold text-[#73698a]">
              הסרה
            </button>
          )}
          {photoMsg && <span className="text-[#73698a]">{photoMsg}</span>}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadPhoto(f);
              e.target.value = '';
            }}
          />
        </div>
        <nav aria-label="הגדרות" className="flex lg:flex-col gap-1 overflow-x-auto -mx-1 px-1">
          {TABS.map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-current={tab === k ? 'page' : undefined}
              onClick={() => setTab(k)}
              className={`shrink-0 text-start border-0 px-3 py-[11px] rounded-xl text-[14.5px] ${
                tab === k ? 'bg-[#f1ebf8] text-[#5b3a8e] font-semibold' : 'bg-transparent text-[#3b3349] hover:bg-[#faf8fd]'
              }`}
            >
              {l}
            </button>
          ))}
        </nav>
        <Link href="/billing" className="block text-center p-2.5 rounded-xl bg-[#f1ebf8] font-semibold text-sm no-underline text-[#5b3a8e]">
          תשלומים ומנויים ←
        </Link>
      </aside>

      <section className="bg-white rounded-[22px] p-4 lg:p-6 shadow-[0_1px_0_#e9e3f1] flex flex-col gap-4 lg:min-h-[600px]">
        {tab === 'details' && <Details data={data} onSaved={() => router.refresh()} />}
        {tab === 'family' && <FamilyTab kids={kids} />}
        {tab === 'notify' && <Notify prefs={data.prefs} />}
        {tab === 'security' && <Security sessions={data.sessions} />}
      </section>
    </div>
  );
}

function Details({ data, onSaved }: { data: ProfileData; onSaved: () => void }) {
  const [f, setF] = useState({
    first_name: data.firstName,
    last_name: data.lastName,
    phone: data.phone,
    is_whatsapp: data.isWhatsapp,
    contact_email: data.contactEmail,
    location: data.location,
    bio: data.bio,
    timezone: data.timezone ?? '',
    website: data.website,
    linkedin_url: data.linkedin,
    facebook_url: data.facebook,
    instagram_url: data.instagram,
  });
  const [moreOpen, setMoreOpen] = useState(!!(data.website || data.linkedin || data.facebook || data.instagram || data.bio));
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [missing, setMissing] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    setState('idle');
  };
  const zones = (() => {
    try {
      return (Intl as any).supportedValuesOf('timeZone') as string[];
    } catch {
      return ['Asia/Jerusalem', 'Europe/London', 'America/New_York', 'America/Los_Angeles'];
    }
  })();

  const save = async () => {
    if (!f.first_name.trim()) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setState('saving');
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...f, timezone: f.timezone || null }),
    });
    setState(res.ok ? 'saved' : 'error');
    if (res.ok) onSaved();
  };

  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <h1 className={h1}>הפרטים שלי</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <label className={label}>
          שם פרטי
          <input value={f.first_name} onChange={set('first_name')} className={`${input} ${missing ? 'border-[#b3392f]' : ''}`} aria-invalid={missing} />
          {missing && <span className="text-[#b3392f] text-[12.5px]">צריך למלא שם פרטי</span>}
        </label>
        <label className={label}>
          שם משפחה
          <input value={f.last_name} onChange={set('last_name')} className={input} />
        </label>
        <label className={label}>
          אימייל לכניסה
          <input value={data.email} readOnly type="email" className={`${input} text-[#73698a]`} aria-describedby="email-note" />
          <span id="email-note" className="text-[#8a809a] text-xs">לשינוי האימייל פנו לצוות</span>
        </label>
        <label className={label}>
          טלפון
          <input value={f.phone} onChange={set('phone')} type="tel" className={input} />
          <span className="flex items-center gap-2 text-[13px] font-normal">
            <input
              type="checkbox"
              checked={f.is_whatsapp}
              onChange={(e) => {
                setF((x) => ({ ...x, is_whatsapp: e.target.checked }));
                setState('idle');
              }}
              className="accent-[#5b3a8e] w-4 h-4"
            />
            זה גם המספר בוואטסאפ
          </span>
        </label>
        <label className={label}>
          אימייל ליצירת קשר
          <input value={f.contact_email} onChange={set('contact_email')} type="email" placeholder="אם שונה מאימייל הכניסה" className={input} />
        </label>
        <label className={label}>
          עיר
          <input value={f.location} onChange={set('location')} className={input} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          אזור זמן
          <select value={f.timezone} onChange={set('timezone')} className={input}>
            <option value="">אוטומטי (ברירת המחדל של בית הספר)</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button type="button" onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen} className="self-start border-0 bg-transparent p-0 font-semibold text-sm text-[#5b3a8e]">
        {moreOpen ? 'פחות פרטים' : 'עוד פרטים: קצת עליי וקישורים'}
      </button>
      {moreOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <label className={`${label} sm:col-span-2`}>
            קצת עליי
            <textarea value={f.bio} onChange={set('bio')} rows={3} className={`${input} py-2.5`} />
          </label>
          {(
            [
              ['website', 'אתר'],
              ['linkedin_url', 'לינקדאין'],
              ['facebook_url', 'פייסבוק'],
              ['instagram_url', 'אינסטגרם'],
            ] as const
          ).map(([k, l]) => (
            <label key={k} className={label}>
              {l}
              <input value={f[k]} onChange={set(k)} type="url" placeholder="https://" className={input} />
            </label>
          ))}
        </div>
      )}

      <div className="flex gap-3 items-center">
        <button type="button" onClick={save} disabled={state === 'saving'} className={mainBtn}>
          {state === 'saving' ? 'שומרים…' : 'שמירה'}
        </button>
        {state === 'saved' && <span className="text-[#1a7a50] font-semibold text-sm" role="status">נשמר</span>}
        {state === 'error' && <span className="text-[#b3392f] font-semibold text-sm" role="status">השמירה נכשלה. נסו שוב.</span>}
      </div>
    </div>
  );
}

function Notify({ prefs }: { prefs: ProfileData['prefs'] }) {
  const [p, setP] = useState(
    prefs ?? { email: true, categories: {} as Record<string, CategoryPref>, quietStart: null as string | null, quietEnd: null as string | null, digest: false }
  );
  const [err, setErr] = useState(false);
  const save = (body: Record<string, unknown>) =>
    fetch('/api/notifications/preferences', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then((r) => setErr(!r.ok))
      .catch(() => setErr(true));

  const value = (key: string, ch: 'email') => {
    const row = PREF_ROWS.find((r) => r.key === key)!;
    return p.categories[key]?.[ch] ?? row.def[ch] ?? false;
  };
  const toggle = (key: string, ch: 'email') => {
    const next = { ...p.categories, [key]: { in_app: true, ...p.categories[key], [ch]: !value(key, ch) } };
    // Turning a channel on for one kind turns the channel itself on.
    const extra = !value(key, ch) ? { [`${ch}_enabled`]: true } : {};
    setP((x) => ({ ...x, categories: next, ...(extra.email_enabled ? { email: true } : {}) }));
    save({ category_preferences: next, ...extra });
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-[760px]">
      <h1 className={`${h1} mb-1`}>עדכונים</h1>
      <p className="m-0 text-[#73698a] text-sm">ההתראות תמיד מופיעות גם בפעמון בפורטל. כאן בוחרים מה יגיע גם באימייל.</p>
      <div className="grid grid-cols-[1fr_64px] lg:grid-cols-[1fr_90px] gap-2 text-[#73698a] text-[13px] font-semibold px-3 mt-1">
        <span>מה</span>
        <span className="text-center">אימייל</span>
      </div>
      {PREF_ROWS.map((r) => (
        <div key={r.key} className="grid grid-cols-[1fr_64px] lg:grid-cols-[1fr_90px] gap-2 items-center p-3 rounded-[14px] bg-[#f6f2fb]">
          <span className="min-w-0">
            <b className="block text-[14.5px]">{r.label}</b>
            <span className="text-[#73698a] text-[12.5px]">{r.sub}</span>
            {r.inc && <span className="mt-1 inline-block rounded-lg bg-[#fff3df] px-2 py-0.5 text-[12.5px] font-semibold text-[#8a5300]">{r.inc}</span>}
          </span>
          <span className="text-center">
            <Switch on={p.email && value(r.key, 'email')} onChange={() => toggle(r.key, 'email')} label={`${r.label} באימייל`} />
          </span>
        </div>
      ))}

      <div className={`${row} mt-2 flex-col sm:flex-row sm:items-center items-start`}>
        <span>
          <b className="block text-[14.5px]">שעות שקטות</b>
          <span className="text-[#73698a] text-[12.5px]">בלי אימיילים בשעות האלה</span>
        </span>
        <span className="flex items-center gap-2 text-sm" style={{ direction: 'ltr' }}>
          <input
            type="time"
            aria-label="תחילת השעות השקטות"
            value={p.quietStart?.slice(0, 5) ?? ''}
            onChange={(e) => {
              setP((x) => ({ ...x, quietStart: e.target.value || null }));
              save({ quiet_hours_start: e.target.value || null, quiet_hours_timezone: browserZone() });
            }}
            className={`${input} min-h-10 bg-white`}
            style={{ direction: 'ltr' }}
          />
          –
          <input
            type="time"
            aria-label="סוף השעות השקטות"
            value={p.quietEnd?.slice(0, 5) ?? ''}
            onChange={(e) => {
              setP((x) => ({ ...x, quietEnd: e.target.value || null }));
              save({ quiet_hours_end: e.target.value || null, quiet_hours_timezone: browserZone() });
            }}
            className={`${input} min-h-10 bg-white`}
            style={{ direction: 'ltr' }}
          />
        </span>
      </div>
      <div className={row}>
        <span>
          <b className="block text-[14.5px]">סיכום אחד ביום</b>
          <span className="text-[#73698a] text-[12.5px]">אימייל אחד עם כל העדכונים, במקום הודעה על כל דבר</span>
        </span>
        <Switch
          on={p.digest}
          onChange={() => {
            setP((x) => ({ ...x, digest: !x.digest }));
            save({ digest_mode: !p.digest });
          }}
          label="סיכום אחד ביום"
        />
      </div>
      <p className="m-0 mt-1 text-[#73698a] text-[13px] leading-relaxed">הזמנה לפורטל, קישור הרשמה ואיפוס סיסמה תמיד נשלחים באימייל, כי ביקשת אותם.</p>
      {err && <span className="text-[#b3392f] text-sm" role="status">השינוי לא נשמר. נסו שוב.</span>}
    </div>
  );
}

/** The client's own time zone, so quiet hours mean their night, not the server's. */
function browserZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

function Security({ sessions }: { sessions: ProfileData['sessions'] }) {
  const router = useRouter();
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const changePassword = async () => {
    if (!pw.current || !pw.next || !pw.confirm) return setPwMsg({ ok: false, text: 'צריך למלא את שלושת השדות' });
    if (pw.next.length < 8) return setPwMsg({ ok: false, text: 'הסיסמה החדשה צריכה לפחות 8 תווים' });
    if (pw.next !== pw.confirm) return setPwMsg({ ok: false, text: 'הסיסמאות החדשות לא זהות' });
    setBusy(true);
    const res = await fetch('/api/user/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    });
    setBusy(false);
    if (res.ok) {
      setPw({ current: '', next: '', confirm: '' });
      setPwOpen(false);
      setPwMsg({ ok: true, text: 'הסיסמה שונתה' });
    } else setPwMsg({ ok: false, text: 'הסיסמה הנוכחית לא נכונה, או שהשינוי נכשל' });
  };

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.replace('/login');
  };

  const deactivate = async () => {
    setBusy(true);
    const res = await fetch('/api/user/profile/deactivate', { method: 'POST' });
    setBusy(false);
    if (res.ok) signOut();
  };

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso));

  return (
    <div className="flex flex-col gap-3.5 max-w-[560px]">
      <h1 className={h1}>אבטחה וכניסה</h1>
      <div className={`${row} flex-col items-stretch`}>
        <div className="flex justify-between items-center gap-3">
          <span>
            <b className="block">סיסמה</b>
            <span className="text-[#73698a] text-[13px]">לפחות 8 תווים</span>
          </span>
          <button type="button" onClick={() => setPwOpen((o) => !o)} aria-expanded={pwOpen} className={softBtn}>
            {pwOpen ? 'ביטול' : 'שינוי סיסמה'}
          </button>
        </div>
        {pwOpen && (
          <div className="flex flex-col gap-3 pt-3">
            {(
              [
                ['current', 'הסיסמה הנוכחית', 'current-password'],
                ['next', 'סיסמה חדשה', 'new-password'],
                ['confirm', 'הסיסמה החדשה שוב', 'new-password'],
              ] as const
            ).map(([k, l, ac]) => (
              <label key={k} className={label}>
                {l}
                <input type="password" autoComplete={ac} value={pw[k]} onChange={(e) => setPw((x) => ({ ...x, [k]: e.target.value }))} className={`${input} bg-white`} style={{ direction: 'ltr' }} />
              </label>
            ))}
            <button type="button" onClick={changePassword} disabled={busy} className={`${mainBtn} self-start text-sm py-2.5`}>
              {busy ? 'שומרים…' : 'שמירת הסיסמה'}
            </button>
          </div>
        )}
      </div>
      {pwMsg && (
        <span className={`text-sm font-semibold ${pwMsg.ok ? 'text-[#1a7a50]' : 'text-[#b3392f]'}`} role="status">
          {pwMsg.text}
        </span>
      )}

      {sessions.length > 0 && (
        <div className={`${row} flex-col items-stretch`}>
          <b>מחוברים כעת</b>
          {sessions.map((s) => (
            <div key={s.id} className="flex justify-between text-[13.5px] text-[#5f5675]">
              <span>
                {s.device}
                {s.place ? ` · ${s.place}` : ''}
              </span>
              {s.lastActive && <span>{fmt(s.lastActive)}</span>}
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={signOut} className="self-start border-0 bg-transparent text-[#5b3a8e] font-semibold text-sm py-1.5 px-0">
        יציאה מהחשבון
      </button>

      <div className="mt-4 pt-4 border-t border-[#efe9f6] flex flex-col gap-2">
        {!confirmDeactivate ? (
          <button type="button" onClick={() => setConfirmDeactivate(true)} className="self-start border-0 bg-transparent text-[#b3392f] font-semibold text-sm p-0">
            סגירת החשבון
          </button>
        ) : (
          <div className="rounded-[14px] border border-[#f0d3cf] bg-[#fdf5f4] p-3.5 flex flex-col gap-2.5">
            <b className="font-rubik font-semibold">לסגור את החשבון?</b>
            <span className="text-sm text-[#5f5675]">לא תוכלו להיכנס יותר לפורטל. כדי לפתוח אותו שוב צריך לפנות לצוות בית הספר.</span>
            <div className="flex gap-2">
              <button type="button" onClick={deactivate} disabled={busy} className="border-0 bg-[#b3392f] text-white font-semibold text-sm px-4 py-2.5 rounded-[11px] disabled:opacity-60">
                {busy ? 'סוגרים…' : 'סגירת החשבון'}
              </button>
              <button type="button" onClick={() => setConfirmDeactivate(false)} className="border-0 bg-transparent text-[#5b3a8e] font-semibold text-sm px-2.5">
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
