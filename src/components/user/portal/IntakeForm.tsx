'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IntakeQuestion, IntakeView } from '@/lib/family/intake';

const input = 'min-h-11 rounded-xl border bg-[#f9f7fc] px-3 text-[15px] text-[#221a2e] focus:outline-none focus:border-[#5b3a8e] focus:bg-white';
const isEmpty = (v: unknown) => v == null || v === '' || (Array.isArray(v) && v.length === 0);

/**
 * The intake form the team set for this coaching. The parent fills it in
 * after the pack is set up, and can change it until the first session.
 */
export function IntakeForm({ enrollmentId, childName, accent }: { enrollmentId: string; childName: string; accent: string }) {
  const router = useRouter();
  const [view, setView] = useState<IntakeView | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<'idle' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    fetch(`/api/user/coaching/${enrollmentId}/intake`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: IntakeView | null) => {
        setView(j);
        setAnswers(j?.answers ?? {});
      })
      .catch(() => setView(null));
  }, [enrollmentId]);

  if (!view) return <span className="text-sm text-[#73698a]">טוענים את השאלון…</span>;
  if (view.status === 'not_needed') return null;
  const readOnly = !view.can_edit;

  const set = (id: string, v: unknown) => {
    setAnswers((a) => ({ ...a, [id]: v }));
    setErrors((e) => {
      const { [id]: _, ...rest } = e;
      return rest;
    });
    setState('idle');
  };

  const save = async () => {
    // Required questions first, with the reason by each field.
    const missing: Record<string, string> = {};
    for (const q of view.questions) if (q.required && isEmpty(answers[q.id])) missing[q.id] = 'צריך לענות על השאלה הזו';
    if (Object.keys(missing).length) {
      setErrors(missing);
      document.getElementById(`q-${Object.keys(missing)[0]}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/user/coaching/${enrollmentId}/intake`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    }).catch(() => null);
    setBusy(false);
    const j = await res?.json().catch(() => ({}));
    if (res?.ok) {
      setView(j);
      setState('saved');
      router.refresh();
      return;
    }
    if (res?.status === 400 && j?.question_id) {
      setErrors({ [j.question_id]: 'צריך לתקן את התשובה הזו' });
      document.getElementById(`q-${j.question_id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setState('failed');
  };

  const field = (q: IntakeQuestion) => {
    const v = answers[q.id];
    const err = errors[q.id];
    const border = err ? 'border-[#b3392f]' : 'border-[#e3dcef]';
    switch (q.kind) {
      case 'long_text':
        return <textarea disabled={readOnly} value={(v as string) ?? ''} onChange={(e) => set(q.id, e.target.value)} rows={4} className={`${input} ${border} py-2.5`} aria-invalid={!!err} />;
      case 'number':
        return <input disabled={readOnly} inputMode="decimal" value={v == null ? '' : String(v)} onChange={(e) => set(q.id, e.target.value === '' ? null : Number(e.target.value.replace(/[^\d.]/g, '')))} className={`${input} ${border} max-w-[160px]`} aria-invalid={!!err} />;
      case 'date':
        return <input disabled={readOnly} type="date" value={(v as string) ?? ''} onChange={(e) => set(q.id, e.target.value)} className={`${input} ${border} max-w-[200px]`} style={{ direction: 'ltr' }} aria-invalid={!!err} />;
      case 'yes_no':
        return (
          <div className="flex gap-2" role="radiogroup">
            {[
              [true, 'כן'],
              [false, 'לא'],
            ].map(([val, label]) => {
              const on = v === val || (val === true && v === 'yes') || (val === false && v === 'no');
              return (
                <button key={String(val)} type="button" role="radio" aria-checked={on} disabled={readOnly} onClick={() => set(q.id, val)} className={`border rounded-xl px-5 py-2 font-semibold text-sm ${on ? 'text-white border-transparent' : `bg-white ${border}`}`} style={on ? { background: accent } : undefined}>
                  {label as string}
                </button>
              );
            })}
          </div>
        );
      case 'choice':
      case 'multi': {
        const multi = q.kind === 'multi';
        const chosen = multi ? ((v as string[]) ?? []) : v;
        return (
          <div className="flex flex-wrap gap-2" role={multi ? 'group' : 'radiogroup'}>
            {(q.options ?? []).map((o) => {
              const on = multi ? (chosen as string[]).includes(o) : chosen === o;
              return (
                <button
                  key={o}
                  type="button"
                  role={multi ? 'checkbox' : 'radio'}
                  aria-checked={on}
                  disabled={readOnly}
                  onClick={() => set(q.id, multi ? (on ? (chosen as string[]).filter((x) => x !== o) : [...(chosen as string[]), o]) : o)}
                  className={`border rounded-xl px-3.5 py-2 text-sm ${on ? 'text-white border-transparent font-semibold' : `bg-white ${border}`}`}
                  style={on ? { background: accent } : undefined}
                >
                  {multi && on ? '✓ ' : ''}
                  {o}
                </button>
              );
            })}
          </div>
        );
      }
      default:
        return <input disabled={readOnly} value={(v as string) ?? ''} onChange={(e) => set(q.id, e.target.value)} className={`${input} ${border}`} aria-invalid={!!err} />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="m-0 text-[#221a2e] font-rubik font-semibold text-lg">{view.title || `שאלון פתיחה: ${childName}`}</h2>
        <p className="m-0 mt-1 text-sm text-[#73698a]">
          {readOnly
            ? 'השאלון נשלח. אחרי המפגש הראשון כבר אי אפשר לשנות אותו.'
            : view.status === 'submitted'
            ? 'השאלון נשלח. אפשר לעדכן אותו עד המפגש הראשון.'
            : 'כמה שאלות שיעזרו למטפלת להכיר את ' + childName + ' לפני המפגש הראשון. אחרי השליחה אפשר לקבוע מפגש.'}
        </p>
      </div>
      {view.questions.map((q) => (
        <div key={q.id} id={`q-${q.id}`} className="flex flex-col gap-1.5">
          <span className="text-[14.5px] font-semibold">
            {q.label}
            {q.required && <span className="text-[#b3392f]"> *</span>}
          </span>
          {q.help && <span className="text-[12.5px] text-[#73698a]">{q.help}</span>}
          {field(q)}
          {errors[q.id] && <span className="text-[#b3392f] text-[12.5px]">{errors[q.id]}</span>}
        </div>
      ))}
      {!readOnly && (
        <div className="flex items-center gap-3">
          <button type="button" disabled={busy} onClick={save} className="border-0 text-white font-semibold text-[15px] px-[22px] py-3 rounded-xl disabled:opacity-60" style={{ background: accent }}>
            {busy ? 'שולחים…' : view.status === 'submitted' ? 'שמירת השינויים' : 'שליחת השאלון'}
          </button>
          {state === 'saved' && <span className="text-[#1a7a50] font-semibold text-sm" role="status">נשמר, תודה</span>}
          {state === 'failed' && <span className="text-[#b3392f] font-semibold text-sm" role="status">השמירה נכשלה. נסו שוב.</span>}
        </div>
      )}
    </div>
  );
}
