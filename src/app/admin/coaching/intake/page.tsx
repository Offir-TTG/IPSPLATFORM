'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Save, Trash2, X } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import {
  api,
  Btn,
  ErrorBox,
  errText,
  Field,
  FieldError,
  inputCls,
  Loading,
  Note,
  PageHeader,
  Section,
  tf,
  UiSelect,
  type TFn,
} from '@/components/admin/coaching/shared';

type Kind = 'text' | 'long_text' | 'choice' | 'multi' | 'yes_no' | 'number' | 'date';
interface Question {
  id: string;
  label: string;
  kind: Kind;
  options?: string[];
  required?: boolean;
  help?: string;
}
interface Form {
  id: string;
  product_id: string | null;
  title: string;
  questions: Question[];
  is_active: boolean;
  updated_at: string;
}
interface Product {
  id: string;
  title: string;
}

const GENERAL = '__general';
const NEW = '__new';
const newId = () => 'q_' + Math.random().toString(36).slice(2, 10);
const hasOptions = (k: Kind) => k === 'choice' || k === 'multi';

type QErr = { label?: string; options?: string };

export default function IntakeEditorPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [forms, setForms] = useState<Form[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<string>(NEW);
  const [title, setTitle] = useState('');
  const [productId, setProductId] = useState<string>(GENERAL);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionDraft, setOptionDraft] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{ title?: string; questions?: string; q: Record<string, QErr> }>({ q: {} });
  const [saving, setSaving] = useState(false);
  const [retiring, setRetiring] = useState(false);

  const kinds: { value: Kind; label: string }[] = [
    { value: 'long_text', label: t('admin.coaching.intake.kindLongText', 'טקסט ארוך') },
    { value: 'text', label: t('admin.coaching.intake.kindText', 'טקסט קצר') },
    { value: 'choice', label: t('admin.coaching.intake.kindChoice', 'בחירה אחת') },
    { value: 'multi', label: t('admin.coaching.intake.kindMulti', 'כמה בחירות') },
    { value: 'yes_no', label: t('admin.coaching.intake.kindYesNo', 'כן / לא') },
    { value: 'number', label: t('admin.coaching.intake.kindNumber', 'מספר') },
    { value: 'date', label: t('admin.coaching.intake.kindDate', 'תאריך') },
  ];

  const openForm = (key: string, list: Form[] = forms) => {
    setSelected(key);
    setErrors({ q: {} });
    setOptionDraft({});
    const f = list.find((x) => x.id === key);
    if (f) {
      setTitle(f.title);
      setProductId(f.product_id ?? GENERAL);
      setQuestions((f.questions ?? []).map((q) => ({ ...q, options: q.options ? [...q.options] : undefined })));
    } else {
      setTitle(t('admin.coaching.intake.defaultTitle', 'שאלון פתיחה'));
      setProductId(GENERAL);
      setQuestions([{ id: newId(), label: '', kind: 'long_text', required: true }]);
    }
  };

  const load = async (keep?: string) => {
    setLoading(true);
    setError(null);
    try {
      const [f, c] = await Promise.all([
        api<{ forms: Form[] }>('/api/admin/coaching/intake-forms'),
        api<{ products: Product[] }>('/api/admin/coaching/choices'),
      ]);
      const list = f.forms ?? [];
      setForms(list);
      setProducts(c.products ?? []);
      const pick = keep && list.some((x) => x.id === keep) ? keep : list[0]?.id ?? NEW;
      openForm(pick, list);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const productName = (pid: string | null) =>
    pid ? products.find((p) => p.id === pid)?.title ?? t('admin.coaching.intake.unknownProduct', 'מוצר') : t('admin.coaching.intake.general', 'כל חבילות האימון (טופס כללי)');

  const setQ = (i: number, patch: Partial<Question>) => setQuestions((qs) => qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const move = (i: number, d: -1 | 1) =>
    setQuestions((qs) => {
      const j = i + d;
      if (j < 0 || j >= qs.length) return qs;
      const copy = [...qs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, j) => j !== i));
  const addQ = () => setQuestions((qs) => [...qs, { id: newId(), label: '', kind: 'long_text', required: false }]);
  const addOption = (i: number) => {
    const q = questions[i];
    const v = (optionDraft[q.id] ?? '').trim();
    if (!v) return;
    if ((q.options ?? []).includes(v)) return;
    setQ(i, { options: [...(q.options ?? []), v] });
    setOptionDraft((d) => ({ ...d, [q.id]: '' }));
  };

  // Another active form already covers the chosen product (it will be replaced).
  const clash = forms.find((f) => f.id !== selected && (f.product_id ?? GENERAL) === productId);

  const validate = () => {
    const e: { title?: string; questions?: string; q: Record<string, QErr> } = { q: {} };
    if (!title.trim()) e.title = t('admin.coaching.intake.errTitle', 'יש לתת שם לטופס.');
    if (questions.length === 0) e.questions = t('admin.coaching.intake.errNoQuestions', 'יש להוסיף לפחות שאלה אחת.');
    for (const q of questions) {
      const qe: QErr = {};
      if (!q.label.trim()) qe.label = t('admin.coaching.intake.errLabel', 'יש לכתוב את נוסח השאלה.');
      if (hasOptions(q.kind) && (q.options ?? []).filter((o) => o.trim()).length < 2)
        qe.options = t('admin.coaching.intake.errOptions', 'בשאלת בחירה צריך לפחות 2 אפשרויות.');
      if (qe.label || qe.options) e.q[q.id] = qe;
    }
    return e;
  };

  const save = async () => {
    const e = validate();
    setErrors(e);
    if (e.title || e.questions || Object.keys(e.q).length) {
      toast.error(t('admin.coaching.common.fixErrors', 'יש שדות שצריך להשלים. הסיבה מופיעה באדום ליד כל שדה.'));
      return;
    }
    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        product_id: productId === GENERAL ? null : productId,
        questions: questions.map((q) => ({
          id: q.id,
          label: q.label.trim(),
          kind: q.kind,
          ...(hasOptions(q.kind) ? { options: (q.options ?? []).map((o) => o.trim()).filter(Boolean) } : {}),
          required: !!q.required,
          ...(q.help?.trim() ? { help: q.help.trim() } : {}),
        })),
      };
      const res =
        selected === NEW
          ? await api<{ id: string }>('/api/admin/coaching/intake-forms', { method: 'POST', body })
          : await api<{ id: string }>(`/api/admin/coaching/intake-forms/${selected}`, { method: 'PUT', body });
      toast.success(t('admin.coaching.intake.saved', 'הטופס נשמר. הורים חדשים יקבלו את השאלות האלה.'));
      await load(res.id ?? selected);
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setSaving(false);
    }
  };

  const retire = async () => {
    if (selected === NEW) return;
    if (!confirm(t('admin.coaching.intake.retireConfirm', 'למחוק את הטופס? שאלונים שכבר נשלחו להורים לא ישתנו.'))) return;
    setRetiring(true);
    try {
      await api(`/api/admin/coaching/intake-forms/${selected}`, { method: 'DELETE' });
      toast.success(t('admin.coaching.intake.retired', 'הטופס נמחק'));
      await load();
    } catch (err) {
      toast.error(errText(err));
    } finally {
      setRetiring(false);
    }
  };

  const formOptions = [
    ...forms.map((f) => ({ value: f.id, label: `${f.title} · ${productName(f.product_id)}` })),
    { value: NEW, label: t('admin.coaching.intake.newForm', '+ טופס חדש') },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl p-6 space-y-6" dir={direction}>
        <CoachingTabs />
        <PageHeader
          title={t('admin.coaching.intake.title', 'טופס האינטייק')}
          description={t('admin.coaching.intake.subtitle', 'ההורה ממלא אותו אחרי שנפתחת חבילה, לפני המפגש הראשון. שינוי כאן לא משנה שאלונים שכבר מולאו.')}
          action={
            !loading && !error ? (
              <div className="flex flex-wrap gap-2">
                {selected !== NEW && (
                  <Button variant="outline" className="h-11 text-destructive hover:text-destructive" onClick={retire} disabled={retiring || saving}>
                    <Trash2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('admin.coaching.intake.retire', 'מחיקת הטופס')}
                  </Button>
                )}
                <Button className="h-11" onClick={save} disabled={saving || retiring}>
                  <Save className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t('admin.coaching.intake.save', 'שמירת הטופס')}
                </Button>
              </div>
            ) : undefined
          }
        />

        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox t={t} message={error} onRetry={() => load()} />
        ) : (
          <div className="max-w-4xl space-y-4">
            {forms.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <Field id="form-pick" label={t('admin.coaching.intake.pickForm', 'איזה טופס לערוך?')}>
                    <UiSelect id="form-pick" direction={direction} value={selected} onChange={(v) => openForm(v)} options={formOptions} />
                  </Field>
                </CardContent>
              </Card>
            )}

            <Section>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="form-title" className="sm:col-span-2" label={t('admin.coaching.intake.formName', 'שם הטופס')} error={errors.title}>
                  <Input id="form-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
                </Field>
                <Field id="form-product" label={t('admin.coaching.intake.forProduct', 'לאיזו חבילה')}>
                  <UiSelect
                    id="form-product"
                    direction={direction}
                    value={productId}
                    onChange={setProductId}
                    options={[
                      { value: GENERAL, label: t('admin.coaching.intake.general', 'כל חבילות האימון (טופס כללי)') },
                      ...products.map((p) => ({ value: p.id, label: p.title })),
                    ]}
                  />
                </Field>
              </div>
              {clash && (
                <div className="mt-4">
                  <Note tone="warn">
                    {tf(t, 'admin.coaching.intake.clash', 'לחבילה הזו כבר יש טופס ("{title}"). שמירה תחליף אותו בטופס הזה.', { title: clash.title })}
                  </Note>
                </div>
              )}
            </Section>

            {questions.map((q, i) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={i}
                count={questions.length}
                t={t}
                direction={direction}
                kinds={kinds}
                err={errors.q[q.id]}
                draft={optionDraft[q.id] ?? ''}
                onDraft={(v) => setOptionDraft((d) => ({ ...d, [q.id]: v }))}
                onAddOption={() => addOption(i)}
                onChange={(patch) => setQ(i, patch)}
                onMove={(d) => move(i, d)}
                onRemove={() => removeQ(i)}
              />
            ))}
            <FieldError>{errors.questions}</FieldError>

            <Btn className="w-full border-dashed" onClick={addQ}>
              <Plus className="h-4 w-4" />
              {t('admin.coaching.intake.addQuestion', 'הוספת שאלה')}
            </Btn>

            <div className="flex">
              <Btn tone="primary" busy={saving} disabled={retiring} onClick={save}>
                <Save className="h-4 w-4" />
                {t('admin.coaching.intake.save', 'שמירת הטופס')}
              </Btn>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function QuestionCard({
  q,
  index,
  count,
  t,
  direction,
  kinds,
  err,
  draft,
  onDraft,
  onAddOption,
  onChange,
  onMove,
  onRemove,
}: {
  q: Question;
  index: number;
  count: number;
  t: TFn;
  direction: 'ltr' | 'rtl';
  kinds: { value: Kind; label: string }[];
  err?: QErr;
  draft: string;
  onDraft: (v: string) => void;
  onAddOption: () => void;
  onChange: (patch: Partial<Question>) => void;
  onMove: (d: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <Card className={cn(err && 'border-destructive')}>
      <CardContent className="space-y-3 pt-6">
        <div className="flex flex-wrap items-start gap-3">
          <span className="pt-3 font-semibold text-muted-foreground">{index + 1}</span>
          <div className="min-w-[240px] flex-1 space-y-1">
            <Input
              className={cn(inputCls, 'font-semibold')}
              value={q.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder={t('admin.coaching.intake.labelPlaceholder', 'נוסח השאלה, למשל "במה תרצו עזרה?"')}
              aria-label={t('admin.coaching.intake.labelAria', 'נוסח השאלה')}
            />
            <FieldError>{err?.label}</FieldError>
          </div>
          <div className="w-[180px]">
            <UiSelect
              direction={direction}
              ariaLabel={t('admin.coaching.intake.kindAria', 'סוג התשובה')}
              value={q.kind}
              onChange={(v) => {
                const kind = v as Kind;
                onChange({ kind, options: hasOptions(kind) ? q.options ?? [] : undefined });
              }}
              options={kinds}
            />
          </div>
        </div>

        {hasOptions(q.kind) && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('admin.coaching.intake.options', 'אפשרויות:')}</span>
              {(q.options ?? []).map((o) => (
                <Badge key={o} variant="secondary" className="gap-1 py-1 ps-3 pe-1 text-sm font-normal">
                  {o}
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-background"
                    onClick={() => onChange({ options: (q.options ?? []).filter((x) => x !== o) })}
                    aria-label={tf(t, 'admin.coaching.intake.removeOption', 'מחיקת האפשרות {o}', { o })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              ))}
              {(q.options ?? []).length === 0 && (
                <span className="text-sm text-muted-foreground">{t('admin.coaching.intake.noOptions', 'עוד אין אפשרויות')}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                className={cn(inputCls, 'max-w-xs')}
                value={draft}
                onChange={(e) => onDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddOption();
                  }
                }}
                placeholder={t('admin.coaching.intake.optionPlaceholder', 'אפשרות חדשה')}
                aria-label={t('admin.coaching.intake.optionPlaceholder', 'אפשרות חדשה')}
              />
              <Btn onClick={onAddOption}>
                <Plus className="h-4 w-4" />
                {t('admin.coaching.intake.addOption', 'הוספת אפשרות')}
              </Btn>
            </div>
            <FieldError>{err?.options}</FieldError>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Label htmlFor={`req-${q.id}`} className="flex min-h-[44px] cursor-pointer items-center gap-2 font-normal">
            <Checkbox id={`req-${q.id}`} checked={!!q.required} onCheckedChange={(v) => onChange({ required: v === true })} />
            {t('admin.coaching.intake.required', 'חובה')}
          </Label>
          <Input
            className={cn(inputCls, 'min-w-[220px] flex-1')}
            value={q.help ?? ''}
            onChange={(e) => onChange({ help: e.target.value })}
            placeholder={t('admin.coaching.intake.helpPlaceholder', 'הסבר קצר מתחת לשאלה (לא חובה)')}
            aria-label={t('admin.coaching.intake.helpAria', 'הסבר לשאלה')}
          />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11"
              disabled={index === 0}
              onClick={() => onMove(-1)}
              aria-label={t('admin.coaching.intake.moveUp', 'הזזה למעלה')}
              title={t('admin.coaching.intake.moveUp', 'הזזה למעלה')}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
              aria-label={t('admin.coaching.intake.moveDown', 'הזזה למטה')}
              title={t('admin.coaching.intake.moveDown', 'הזזה למטה')}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Btn tone="danger" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
              {t('admin.coaching.intake.deleteQuestion', 'מחיקה')}
            </Btn>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
