'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { CoachingTabs } from '@/components/admin/coaching/CoachingTabs';
import {
  api,
  BackLink,
  Btn,
  childLabel,
  ErrorBox,
  errText,
  Field,
  FieldError,
  inputCls,
  Loading,
  Note,
  PageHeader,
  priceText,
  Section,
  tf,
  UiSelect,
  coachOptionLabel,
} from '@/components/admin/coaching/shared';

interface Product {
  id: string;
  title: string;
  price: number | null;
  currency: string | null;
  session_count: number | null;
  session_minutes: number | null;
  payment_plan_id: string | null;
}
interface Coach {
  id: string;
  name: string;
  role: string;
  weekly_hours: number;
}
interface CoachingRequest {
  id: string;
  status: string;
  note: string | null;
  parent: { id: string; name: string; email: string; phone: string | null } | null;
  child: { id: string; name: string; age: number | null } | null;
}
interface FoundUser {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
}

type Errors = Partial<Record<'parent' | 'firstName' | 'lastName' | 'email' | 'childName' | 'childAge' | 'product' | 'coach', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function NewPackInner() {
  const { t, direction, language } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const router = useRouter();
  const requestId = useSearchParams().get('request');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [request, setRequest] = useState<CoachingRequest | null>(null);

  // who
  const [parentMode, setParentMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [parent, setParent] = useState<FoundUser | null>(null);
  const [newParent, setNewParent] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [child, setChild] = useState({ first_name: '', last_name: '', age: '' });

  // what
  const [productId, setProductId] = useState('');
  const [coachId, setCoachId] = useState('');
  const [payment, setPayment] = useState<'portal' | 'none'>('portal');

  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const choices = await api<{ products: Product[]; coaches: Coach[] }>('/api/admin/coaching/choices');
      setProducts(choices.products ?? []);
      setCoaches(choices.coaches ?? []);
      if ((choices.products ?? []).length === 1) setProductId(choices.products[0].id);
      if (requestId) {
        // There is no single-request endpoint: look through the three lists.
        let match: CoachingRequest | undefined;
        for (const status of ['new', 'in_progress', 'handled']) {
          const data = await api<{ requests: CoachingRequest[] }>(`/api/admin/coaching/requests?status=${status}`);
          match = (data.requests ?? []).find((r) => r.id === requestId);
          if (match) break;
        }
        if (!match) throw new Error(t('admin.coaching.newPack.requestNotFound', 'הבקשה לא נמצאה. אפשר לחזור לרשימה ולנסות שוב.'));
        setRequest(match);
      }
    } catch (e) {
      setLoadError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // parent search by email (3 letters or more)
  useEffect(() => {
    if (parentMode !== 'existing' || parent) return;
    const q = search.trim();
    if (q.length < 3) {
      setFound([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<{ users: FoundUser[] }>(`/api/admin/users/search?email=${encodeURIComponent(q)}`);
        setFound(data.users ?? []);
      } catch (e) {
        toast.error(errText(e));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, parentMode, parent]);

  const fromRequest = !!request?.parent;
  const needChildDetails = !(fromRequest && request?.child);
  const chosenProduct = products.find((p) => p.id === productId);
  const childFirst = request?.child?.name?.split(' ')[0] || child.first_name || t('admin.coaching.newPack.theChild', 'הילד');
  const clearErr = (k: keyof Errors) => setErrors((x) => ({ ...x, [k]: undefined }));

  const validate = (): Errors => {
    const e: Errors = {};
    if (!fromRequest) {
      if (parentMode === 'existing' && !parent) e.parent = t('admin.coaching.newPack.errParent', 'יש לבחור הורה מהרשימה, או לעבור ל"הורה חדש".');
      if (parentMode === 'new') {
        if (!newParent.first_name.trim()) e.firstName = t('admin.coaching.newPack.errFirstName', 'יש לכתוב שם פרטי.');
        if (!newParent.last_name.trim()) e.lastName = t('admin.coaching.newPack.errLastName', 'יש לכתוב שם משפחה.');
        if (!EMAIL_RE.test(newParent.email.trim()))
          e.email = t('admin.coaching.newPack.errEmail', 'יש לכתוב כתובת מייל תקינה. לשם יישלח הקישור להרשמה.');
      }
    }
    if (needChildDetails) {
      if (!child.first_name.trim()) e.childName = t('admin.coaching.newPack.errChildName', 'יש לכתוב את השם של הילד.');
      if (child.age.trim()) {
        const n = Number(child.age);
        if (!Number.isInteger(n) || n < 0 || n > 30) e.childAge = t('admin.coaching.newPack.errChildAge', 'הגיל צריך להיות מספר שלם בין 0 ל-30.');
      }
    }
    if (!productId) e.product = t('admin.coaching.newPack.errProduct', 'יש לבחור חבילה.');
    if (!coachId) e.coach = t('admin.coaching.newPack.errCoach', 'יש לבחור מטפלת.');
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error(t('admin.coaching.common.fixErrors', 'יש שדות שצריך להשלים. הסיבה מופיעה באדום ליד כל שדה.'));
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        product_id: productId,
        payment_plan_id: payment === 'none' ? null : chosenProduct?.payment_plan_id ?? null,
        waive_payment: payment === 'none',
        status: 'draft',
        coach_id: coachId,
      };
      if (fromRequest) body.user_id = request!.parent!.id;
      else if (parentMode === 'existing') body.user_id = parent!.id;
      else
        body.new_user = {
          email: newParent.email.trim().toLowerCase(),
          first_name: newParent.first_name.trim(),
          last_name: newParent.last_name.trim(),
          phone: newParent.phone.trim() || undefined,
        };
      if (fromRequest && request?.child) body.child_id = request.child.id;
      else
        body.child = {
          first_name: child.first_name.trim(),
          last_name: child.last_name.trim() || undefined,
          age: child.age.trim() ? Number(child.age) : undefined,
        };
      if (request) body.coaching_request_id = request.id;

      // The route answers with the new enrollment row itself (201).
      const created = await api<{ id: string }>('/api/admin/enrollments', { method: 'POST', body });
      try {
        await api(`/api/admin/enrollments/${created.id}/send-link`, { method: 'POST', body: { language: 'he' } });
        toast.success(t('admin.coaching.newPack.created', 'החבילה נפתחה והמייל נשלח להורה.'));
      } catch (err) {
        toast.warning(
          tf(t, 'admin.coaching.newPack.createdNoEmail', 'החבילה נפתחה, אבל המייל להורה לא נשלח: {error}. אפשר לשלוח שוב מעמוד ההרשמות.', {
            error: errText(err),
          }),
        );
      }
      router.push(`/admin/coaching/children/${created.id}`);
    } catch (err) {
      toast.error(errText(err));
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl p-6 space-y-6" dir={direction}>
      <CoachingTabs />
      <BackLink href="/admin/coaching" isRtl={isRtl}>
        {t('admin.coaching.newPack.back', 'חזרה לבקשות')}
      </BackLink>
      <PageHeader
        title={t('admin.coaching.newPack.title', 'פתיחת חבילת אימון')}
        description={t('admin.coaching.newPack.subtitle', 'אחרי השמירה ההורה מקבל במייל קישור להרשמה ולתשלום, ואחר כך ממלא שאלון פתיחה. הצוות קובע את המפגשים.')}
      />

      {loading ? (
        <Loading />
      ) : loadError ? (
        <ErrorBox t={t} message={loadError} onRetry={load} />
      ) : (
        <div className="max-w-3xl space-y-6">
          {/* Who */}
          {fromRequest ? (
            <Section title={t('admin.coaching.newPack.whoTitle', 'למי פותחים את החבילה?')}>
              <div className="flex flex-wrap gap-6">
                <Info label={t('admin.coaching.newPack.child', 'הילד')}>
                  <span className="font-semibold">
                    {request!.child ? childLabel(t, request!.child.name, request!.child.age) : t('admin.coaching.newPack.childBelow', 'יש למלא למטה')}
                  </span>
                </Info>
                <Info label={t('admin.coaching.newPack.parentPays', 'ההורה (משלם)')}>
                  <span className="font-semibold">{request!.parent!.name || request!.parent!.email}</span>
                </Info>
                <Info label={t('admin.coaching.newPack.whatAsked', 'מה ביקשו')} grow>
                  <span className="text-sm">{request!.note ? `"${request!.note}"` : t('admin.coaching.requests.noNote', 'ללא הערה')}</span>
                </Info>
              </div>
            </Section>
          ) : (
            <Section title={t('admin.coaching.newPack.whoTitle', 'למי פותחים את החבילה?')} contentClassName="space-y-4">
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {(['existing', 'new'] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={parentMode === m}
                    variant={parentMode === m ? 'default' : 'outline'}
                    className="h-11"
                    onClick={() => setParentMode(m)}
                  >
                    {m === 'existing'
                      ? t('admin.coaching.newPack.existingParent', 'הורה שכבר יש לו חשבון')
                      : t('admin.coaching.newPack.newParent', 'הורה חדש (בלי חשבון)')}
                  </Button>
                ))}
              </div>

              {parentMode === 'existing' ? (
                <div className="space-y-2">
                  {parent ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary bg-primary/5 p-3">
                      <span className="text-sm">
                        <strong>{parent.display_name}</strong> · {parent.email}
                        {parent.phone ? ` · ${parent.phone}` : ''}
                      </span>
                      <Btn onClick={() => setParent(null)}>{t('admin.coaching.newPack.changeParent', 'בחירת הורה אחר')}</Btn>
                    </div>
                  ) : (
                    <Field id="parent-search" label={t('admin.coaching.newPack.searchLabel', 'חיפוש לפי מייל של ההורה')}>
                      <Input
                        id="parent-search"
                        type="search"
                        className={inputCls}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('admin.coaching.newPack.searchPlaceholder', 'לפחות 3 אותיות מהמייל')}
                      />
                      {searching && <p className="text-sm text-muted-foreground">{t('admin.coaching.common.searching', 'מחפש...')}</p>}
                      {!searching && search.trim().length >= 3 && found.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          {t('admin.coaching.newPack.noUsers', 'לא נמצא הורה עם המייל הזה. אפשר לבחור "הורה חדש (בלי חשבון)".')}
                        </p>
                      )}
                      {found.length > 0 && (
                        <div className="overflow-hidden rounded-lg border">
                          {found.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setParent(u);
                                clearErr('parent');
                              }}
                              className="block min-h-[44px] w-full border-b px-3 py-2 text-start text-sm last:border-b-0 hover:bg-accent"
                            >
                              <strong>{u.display_name}</strong> · {u.email}
                            </button>
                          ))}
                        </div>
                      )}
                    </Field>
                  )}
                  <FieldError>{errors.parent}</FieldError>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field id="np-first" label={t('admin.coaching.newPack.firstName', 'שם פרטי של ההורה')} error={errors.firstName}>
                    <Input id="np-first" className={inputCls} value={newParent.first_name} onChange={(e) => setNewParent({ ...newParent, first_name: e.target.value })} />
                  </Field>
                  <Field id="np-last" label={t('admin.coaching.newPack.lastName', 'שם משפחה')} error={errors.lastName}>
                    <Input id="np-last" className={inputCls} value={newParent.last_name} onChange={(e) => setNewParent({ ...newParent, last_name: e.target.value })} />
                  </Field>
                  <Field id="np-email" label={t('admin.coaching.newPack.email', 'מייל')} error={errors.email}>
                    <Input id="np-email" type="email" dir="ltr" className={inputCls} value={newParent.email} onChange={(e) => setNewParent({ ...newParent, email: e.target.value })} />
                  </Field>
                  <Field id="np-phone" label={t('admin.coaching.newPack.phone', 'טלפון (לא חובה)')}>
                    <Input id="np-phone" type="tel" dir="ltr" className={inputCls} value={newParent.phone} onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })} />
                  </Field>
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    {t('admin.coaching.newPack.newParentHint', 'ההורה יקבל מייל עם קישור להרשמה. החשבון שלו בפורטל נוצר בסוף ההרשמה, והילד מצורף אליו אוטומטית.')}
                  </p>
                </div>
              )}
            </Section>
          )}

          {needChildDetails && (
            <Section title={t('admin.coaching.newPack.childTitle', 'פרטי הילד')}>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="c-first" label={t('admin.coaching.newPack.childFirst', 'שם פרטי')} error={errors.childName}>
                  <Input id="c-first" className={inputCls} value={child.first_name} onChange={(e) => setChild({ ...child, first_name: e.target.value })} />
                </Field>
                <Field id="c-last" label={t('admin.coaching.newPack.childLast', 'שם משפחה (לא חובה)')}>
                  <Input id="c-last" className={inputCls} value={child.last_name} onChange={(e) => setChild({ ...child, last_name: e.target.value })} />
                </Field>
                <Field id="c-age" label={t('admin.coaching.newPack.childAge', 'גיל (לא חובה)')} error={errors.childAge}>
                  <Input id="c-age" type="number" min={0} max={30} inputMode="numeric" className={inputCls} value={child.age} onChange={(e) => setChild({ ...child, age: e.target.value })} />
                </Field>
              </div>
            </Section>
          )}

          {/* What */}
          <Section title={t('admin.coaching.newPack.packTitle', 'החבילה')} contentClassName="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('admin.coaching.newPack.step1', '1. איזו חבילה?')}</Label>
              {products.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('admin.coaching.newPack.noProducts', 'עוד אין מוצר של חבילת מפגשים. צריך להגדיר מוצר כזה בעמוד המוצרים.')}
                </p>
              )}
              <RadioGroup
                dir={direction}
                value={productId}
                onValueChange={(v) => {
                  setProductId(v);
                  clearErr('product');
                }}
              >
                {products.map((p) => (
                  <Label
                    key={p.id}
                    htmlFor={`p-${p.id}`}
                    className={cn(
                      'flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border p-4 font-normal transition-colors hover:bg-accent',
                      productId === p.id && 'border-primary bg-primary/5',
                    )}
                  >
                    <RadioGroupItem id={`p-${p.id}`} value={p.id} />
                    <span className="flex-1 space-y-1">
                      <span className="block font-semibold">{p.title}</span>
                      <span className="block text-sm text-muted-foreground">
                        {[
                          p.session_count ? tf(t, 'admin.coaching.newPack.sessions', '{n} מפגשים', { n: p.session_count }) : null,
                          p.session_minutes ? tf(t, 'admin.coaching.newPack.minutesEach', '{n} דקות כל מפגש', { n: p.session_minutes }) : null,
                          priceText(p.price, p.currency, language) || null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              <FieldError>{errors.product}</FieldError>
            </div>

            <Field
              id="coach"
              label={<span className="text-base font-semibold">{t('admin.coaching.newPack.step2', '2. מי המטפלת?')}</span>}
              error={errors.coach}
              hint={t('admin.coaching.newPack.coachHint', 'המטפלת שתלווה את הילד. הצוות קובע איתה את המפגשים אחרי שההורה משלים את ההרשמה והתשלום.')}
            >
              <UiSelect
                id="coach"
                direction={direction}
                value={coachId}
                onChange={(v) => {
                  setCoachId(v);
                  clearErr('coach');
                }}
                placeholder={t('admin.coaching.newPack.chooseCoach', 'בחירת מטפלת...')}
                options={coaches.map((c) => ({ value: c.id, label: coachOptionLabel(t, c) }))}
              />
            </Field>

            <div className="space-y-3">
              <Label className="text-base font-semibold">{t('admin.coaching.newPack.step3', '3. תשלום')}</Label>
              <RadioGroup dir={direction} value={payment} onValueChange={(v) => setPayment(v as 'portal' | 'none')}>
                <Label htmlFor="pay-portal" className="flex min-h-[44px] cursor-pointer items-center gap-3 font-normal">
                  <RadioGroupItem id="pay-portal" value="portal" />
                  {t('admin.coaching.newPack.payPortal', 'ההורה משלם בפורטל (תשלום אחד או לפי תוכנית התשלום של החבילה)')}
                </Label>
                <Label htmlFor="pay-none" className="flex min-h-[44px] cursor-pointer items-center gap-3 font-normal">
                  <RadioGroupItem id="pay-none" value="none" />
                  {t('admin.coaching.newPack.payNone', 'ללא תשלום (פטור או שולם בדרך אחרת)')}
                </Label>
              </RadioGroup>
            </div>
          </Section>

          <Note tone="warn" title={t('admin.coaching.newPack.nextTitle', 'מה יקרה אחרי השמירה')}>
            <p>{tf(t, 'admin.coaching.newPack.next1', '1. ההורה מקבל מייל עם קישור, ורואה בפורטל את החבילה של {name}.', { name: childFirst })}</p>
            <p>
              {payment === 'portal'
                ? t('admin.coaching.newPack.next2pay', '2. משלם בפורטל וממלא את שאלון הפתיחה (טופס האינטייק של החבילה).')
                : t('admin.coaching.newPack.next2', '2. ממלא את שאלון הפתיחה (טופס האינטייק של החבילה).')}
            </p>
            <p>{t('admin.coaching.newPack.next3', '3. הצוות קובע את המפגש הראשון, וההורה מקבל עדכון בפורטל.')}</p>
            {request && <p>{t('admin.coaching.newPack.nextHandled', 'הבקשה מסומנת כטופלה.')}</p>}
          </Note>

          <div className="flex flex-wrap gap-2">
            <Btn tone="primary" busy={saving} onClick={submit}>
              {t('admin.coaching.newPack.submit', 'פתיחת החבילה')}
            </Btn>
            <Btn disabled={saving} onClick={() => router.push('/admin/coaching')}>
              {t('admin.coaching.common.cancel', 'ביטול')}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, children, grow }: { label: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-0.5', grow && 'flex-[1_1_240px]')}>
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export default function NewCoachingPackPage() {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <NewPackInner />
      </Suspense>
    </AdminLayout>
  );
}
