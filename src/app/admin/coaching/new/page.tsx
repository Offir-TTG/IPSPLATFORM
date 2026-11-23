'use client';

export const dynamic = 'force-dynamic';

/**
 * Opening a coaching package, in three steps (approved mockups 3–5):
 * which service (parent or child coaching), for whom (an existing client or
 * a new one, and the child), and which package and coach. Sending creates the
 * enrollment and emails the link; an existing client also sees it in the
 * portal under "to complete". From a portal request, the service, client and
 * child are filled in and it opens on the last step.
 */
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Mail, Plus } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { joinedBar, joinedSegment } from '@/components/admin/notifications/kit';
import { api, Btn, errText, Field, FieldError, Loading, ErrorBox, priceText, tf, UiSelect } from '@/components/admin/coaching/shared';
import { kindName, type PackageKind } from '@/components/admin/coaching/packageText';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  session_count: number | null;
  payment_plan_id: string | null;
  kind: PackageKind | null;
  price_per_session: number;
  per_session: boolean;
  requires_signature: boolean;
  has_intake: boolean;
  crm_tag_slugs: string[];
}
interface CrmTag {
  slug: string;
  label_he?: string | null;
  label_en?: string | null;
  category?: { color?: string | null } | null;
}
interface Coach {
  id: string;
  name: string;
}
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}
interface ClientCoaching {
  in_parent_coaching: boolean;
  children: { id: string; name: string; age: number | null; coaching: { used: number; total: number } | null }[];
}
interface CoachingRequest {
  id: string;
  kind: 'child' | 'more_sessions';
  note: string | null;
  parent: Client | null;
  child: { id: string; name: string; age: number | null } | null;
}

type Step = 1 | 2 | 3;
type Errors = Partial<Record<'service' | 'client' | 'firstName' | 'lastName' | 'email' | 'child' | 'childName' | 'childAge' | 'product', string>>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NO_COACH = '__none__';
const PRODUCT_FORM = '__product__';
interface IntakeFormOption {
  id: string;
  product_id: string | null;
  title: string;
  questions: unknown[];
}

function NewPackageInner() {
  const { t, direction, language } = useAdminLanguage();
  const router = useRouter();
  const requestId = useSearchParams().get('request');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [request, setRequest] = useState<CoachingRequest | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<PackageKind>('parent');
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<Client[]>([]);
  const [searching, setSearching] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [clientInfo, setClientInfo] = useState<ClientCoaching | null>(null);
  const [newClient, setNewClient] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [childId, setChildId] = useState<string | 'new' | ''>('');
  const [newChild, setNewChild] = useState({ first_name: '', age: '' });
  const [productId, setProductId] = useState('');
  const [coachId, setCoachId] = useState(NO_COACH);
  const [forms, setForms] = useState<IntakeFormOption[]>([]);
  const [crmTags, setCrmTags] = useState<Map<string, CrmTag>>(new Map());
  // The intake form: the product's own (default), another form, or 'none'.
  const [intakeFormId, setIntakeFormId] = useState(PRODUCT_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const choices = await api<{ products: Product[]; coaches: Coach[] }>('/api/admin/coaching/choices');
      setProducts(choices.products ?? []);
      setCoaches(choices.coaches ?? []);
      const intake = await api<{ forms: IntakeFormOption[] }>('/api/admin/coaching/intake-forms').catch(() => ({ forms: [] as IntakeFormOption[] }));
      setForms(intake.forms ?? []);
      // Tag names and colours, to show each product's tags (read only).
      void fetch('/api/admin/crm/tags')
        .then((r) => r.json())
        .then((d) => d?.success && setCrmTags(new Map((d.tags ?? []).map((tag: CrmTag) => [tag.slug, tag]))))
        .catch(() => undefined);
      if (requestId) {
        let match: CoachingRequest | undefined;
        for (const status of ['new', 'in_progress', 'handled']) {
          const data = await api<{ requests: CoachingRequest[] }>(`/api/admin/coaching/requests?status=${status}`);
          match = (data.requests ?? []).find((r) => r.id === requestId);
          if (match) break;
        }
        if (!match) throw new Error(t('admin.coaching.newPack.requestNotFound', 'הבקשה לא נמצאה. אפשר לחזור לרשימה ולנסות שוב.'));
        setRequest(match);
        setService(match.child || match.kind === 'child' ? 'child' : 'parent');
        if (match.parent) setClient(match.parent);
        if (match.child) setChildId(match.child.id);
        setStep(match.parent ? 3 : 2);
      }
    } catch (e) {
      setLoadError(errText(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  // Search clients by name, email or phone (2 letters or more).
  useEffect(() => {
    if (clientMode !== 'existing' || client) return;
    const q = search.trim();
    if (q.length < 2) {
      setFound([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api<{ clients: Client[] }>(`/api/admin/coaching/clients?q=${encodeURIComponent(q)}`);
        setFound(data.clients ?? []);
      } catch (e) {
        toast.error(errText(e));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, clientMode, client]);

  // The chosen client's children and the coaching they already have.
  useEffect(() => {
    setClientInfo(null);
    if (!client) return;
    void api<ClientCoaching>(`/api/admin/coaching/clients/${client.id}`).then(setClientInfo).catch(() => undefined);
  }, [client]);

  // Coaching is pay as you go: only per-session products, of this service (or with no service set).
  const shownProducts = useMemo(() => products.filter((p) => p.per_session && (!p.kind || p.kind === service)), [products, service]);
  useEffect(() => {
    if (productId && !shownProducts.some((p) => p.id === productId)) setProductId('');
    if (!productId && shownProducts.length === 1) setProductId(shownProducts[0].id);
  }, [shownProducts, productId]);

  const product = products.find((p) => p.id === productId) ?? null;
  // The form the product uses by itself: its own, else the general one.
  const productForm = forms.find((f) => f.product_id === productId) ?? forms.find((f) => !f.product_id) ?? null;
  const isNewClient = clientMode === 'new' && !client;
  const clientName = client?.name || `${newClient.first_name} ${newClient.last_name}`.trim();
  const clientFirst = client?.name.split(' ')[0] || newClient.first_name;
  const chosenChild = clientInfo?.children.find((c) => c.id === childId) ?? (request?.child && request.child.id === childId ? request.child : null);
  const childFirst = childId === 'new' || isNewClient ? newChild.first_name : chosenChild?.name.split(' ')[0] ?? '';
  const clear = (k: keyof Errors) => setErrors((x) => ({ ...x, [k]: undefined }));

  const check = (s: Step): Errors => {
    const e: Errors = {};
    if (s === 2) {
      if (clientMode === 'existing' && !client) e.client = t('admin.coaching.newPack.errClient', 'בחרו לקוח מהרשימה, או עברו ל"לקוח חדש".');
      if (isNewClient) {
        if (!newClient.first_name.trim()) e.firstName = t('admin.coaching.newPack.errFirstName', 'יש לכתוב שם פרטי.');
        if (!newClient.last_name.trim()) e.lastName = t('admin.coaching.newPack.errLastName', 'יש לכתוב שם משפחה.');
        if (!EMAIL_RE.test(newClient.email.trim())) e.email = t('admin.coaching.newPack.errEmail', 'יש לכתוב כתובת מייל תקינה. לשם יישלח הקישור להרשמה.');
      }
      if (service === 'child') {
        const typing = isNewClient || childId === 'new';
        if (!typing && !childId) e.child = t('admin.coaching.newPack.errChoose', 'בחרו ילד, או הוסיפו ילד חדש.');
        if (typing) {
          if (!newChild.first_name.trim()) e.childName = t('admin.coaching.newPack.errChildName', 'יש לכתוב את השם של הילד.');
          if (newChild.age.trim()) {
            const n = Number(newChild.age);
            if (!Number.isInteger(n) || n < 0 || n > 30) e.childAge = t('admin.coaching.newPack.errChildAge', 'הגיל צריך להיות מספר שלם בין 0 ל-30.');
          }
        }
      }
    }
    if (s === 3 && !productId) e.product = t('admin.coaching.newPack.errProduct', 'יש לבחור חבילה.');
    return e;
  };

  /** Continue stops on a missing field; a later step is reached only through the ones before it. */
  const goTo = (target: Step) => {
    if (target <= step) return setStep(target);
    for (let s = step; s < target; s++) {
      const e = check(s as Step);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s as Step);
        return;
      }
    }
    setErrors({});
    setStep(target);
  };

  const submit = async () => {
    const all = { ...check(2), ...check(3) };
    if (Object.keys(all).length) {
      setErrors(all);
      setStep(Object.keys(check(2)).length ? 2 : 3);
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = { product_id: productId, payment_plan_id: product?.payment_plan_id ?? null, status: 'draft' };
      if (coachId !== NO_COACH) body.coach_id = coachId;
      if (client) body.user_id = client.id;
      else
        body.new_user = {
          email: newClient.email.trim().toLowerCase(),
          first_name: newClient.first_name.trim(),
          last_name: newClient.last_name.trim(),
          phone: newClient.phone.trim() || undefined,
        };
      if (service === 'child') {
        if (childId && childId !== 'new' && client) body.child_id = childId;
        else body.child = { first_name: newChild.first_name.trim(), age: newChild.age.trim() ? Number(newChild.age) : undefined };
      }
      if (request) body.coaching_request_id = request.id;
      const created = await api<{ id: string }>('/api/admin/enrollments', { method: 'POST', body });
      // Another intake form than the product's own (or none), before the link goes out.
      if (intakeFormId !== PRODUCT_FORM) {
        await api(`/api/admin/coaching/packages/${created.id}`, { method: 'POST', body: { action: 'intake', form_id: intakeFormId } }).catch((err) =>
          toast.warning(tf(t, 'admin.coaching.newPack.intakeNotSaved', 'החבילה נפתחה, אבל השאלון שנבחר לא נשמר: {error}', { error: errText(err) })),
        );
      }
      try {
        await api(`/api/admin/enrollments/${created.id}/send-link`, { method: 'POST', body: { language: 'he' } });
        toast.success(tf(t, 'admin.coaching.newPack.sentTo', 'החבילה נפתחה, והקישור נשלח ל{name}.', { name: clientFirst }));
      } catch (err) {
        toast.warning(tf(t, 'admin.coaching.newPack.createdNoEmail2', 'החבילה נפתחה, אבל המייל לא נשלח: {error}. אפשר לשלוח שוב מהמגירה.', { error: errText(err) }));
      }
      router.push(`/admin/coaching?package=${created.id}`);
    } catch (err) {
      toast.error(errText(err));
      setSaving(false);
    }
  };

  const titleBits = [
    t('admin.coaching.newPack.title2', 'פתיחת חבילת ליווי'),
    step > 1 ? kindName(t, service) : null,
    step > 2 ? (service === 'child' && childFirst ? `${childFirst} (${clientName})` : clientName) : null,
  ].filter(Boolean);

  const stepNames: Record<Step, string> = {
    1: t('admin.coaching.newPack.stepService', 'איזה שירות'),
    2: t('admin.coaching.newPack.stepWho', 'למי'),
    3: t('admin.coaching.newPack.stepPackage', 'חבילה ושליחה'),
  };
  const doneLabel = (s: Step) =>
    s === 1 ? kindName(t, service) : service === 'child' && childFirst ? `${childFirst} · ${clientName}` : clientName;
  const whoWord = service === 'child' ? t('admin.coaching.newPack.parentWord', 'ההורה') : t('admin.coaching.newPack.clientWord', 'הלקוח');
  const card = 'rounded-[18px] border border-border bg-card p-5 sm:p-[22px]';

  return (
    <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
      <div className="max-w-[980px] space-y-[18px]">
        <div>
          <Link href="/admin/coaching" className="text-[13.5px] font-semibold text-primary no-underline hover:underline">
            {direction === 'rtl' ? '→' : '←'} {t('admin.coaching.packages.title', 'ליווי')}
          </Link>
          <h1 className="mt-1 text-[26px] font-extrabold leading-tight [font-family:inherit]">{titleBits.join(' · ')}</h1>
        </div>

        {loading ? (
          <Loading />
        ) : loadError ? (
          <ErrorBox t={t} message={loadError} onRetry={load} />
        ) : (
          <>
            {/* Steps */}
            <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5">
              <div className="flex justify-between text-[13px] text-muted-foreground">
                <b className="text-primary">{tf(t, 'admin.coaching.newPack.stepOf', 'שלב {n} מתוך 3', { n: step })}</b>
                <span>{t('admin.notifications.wizard.jumpHint2', 'לחיצה על שלב מעבירה אליו')}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5" aria-hidden>
                {([1, 2, 3] as Step[]).map((s) => (
                  <span key={s} className={`h-1.5 rounded-md ${s <= step ? 'bg-primary' : 'bg-primary/15'}`} />
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {([1, 2, 3] as Step[]).map((s) =>
                  s < step ? (
                    <button key={s} type="button" onClick={() => goTo(s)} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary/10 px-3 text-[13px] font-semibold text-primary">
                      <Check className="h-3.5 w-3.5" aria-hidden /> {doneLabel(s)}
                    </button>
                  ) : s === step ? (
                    <span key={s} aria-current="step" className="inline-flex min-h-9 items-center rounded-full bg-primary px-3 text-[13px] font-semibold text-primary-foreground">
                      {s} {stepNames[s]}
                    </span>
                  ) : (
                    <button key={s} type="button" onClick={() => goTo(s)} className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-[13px] font-semibold text-muted-foreground hover:bg-muted">
                      {s} {stepNames[s]}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* 1 · Which service */}
            {step === 1 && (
              <div className={`${card} space-y-4`}>
                <div>
                  <h2 className="text-[21px] font-extrabold [font-family:inherit]">{t('admin.coaching.newPack.serviceTitle', 'איזה שירות פותחים?')}</h2>
                  <p className="mt-1 text-[14.5px] text-muted-foreground">{t('admin.coaching.newPack.serviceText', 'שני השירותים עובדים אותו דבר: חבילת מפגשים, חוזה לחתימה, שאלון פתיחה ותשלום.')}</p>
                </div>
                <div role="radiogroup" aria-label={t('admin.coaching.newPack.serviceLabel', 'שירות')} className="grid gap-3.5 sm:grid-cols-2">
                  {(['parent', 'child'] as PackageKind[]).map((k) => {
                    const on = service === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setService(k)}
                        className={`flex flex-col gap-3 rounded-[18px] p-[18px] text-start transition-colors ${on ? 'border-2 border-primary bg-primary/5' : 'border border-border bg-card hover:border-primary/40'}`}
                      >
                        <span className={`grid h-[120px] place-items-center rounded-[14px] bg-gradient-to-br ${k === 'parent' ? 'from-violet-600 to-violet-900' : 'from-teal-600 to-teal-800'}`}>
                          <ServiceIcon kind={k} />
                        </span>
                        <span className="flex items-center justify-between">
                          <b className="text-lg">{kindName(t, k)}</b>
                          <span className={`grid h-[22px] w-[22px] place-items-center rounded-full border-2 ${on ? 'border-primary' : 'border-border'}`} aria-hidden>
                            {on && <span className="h-[11px] w-[11px] rounded-full bg-primary" />}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {k === 'parent'
                            ? t('admin.coaching.newPack.parentText', 'ההורה עצמו בליווי. ההרשמה, המפגשים והתשלום על שמו.')
                            : t('admin.coaching.newPack.childText', 'ליווי לילד של ההורה. ההורה חותם ומשלם, והליווי מופיע אצלו תחת הילד.')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2 · For whom */}
            {step === 2 && (
              <>
                <div className={`${card} space-y-3.5`}>
                  <h2 className="text-[19px] font-extrabold [font-family:inherit]">{service === 'child' ? t('admin.coaching.newPack.theParent', 'ההורה') : t('admin.coaching.newPack.theClient', 'הלקוח')}</h2>
                  {!request && (
                    <div role="radiogroup" aria-label={t('admin.coaching.newPack.clientType', 'סוג לקוח')} className={`${joinedBar} self-start`}>
                      {(['existing', 'new'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={clientMode === m}
                          onClick={() => {
                            setClientMode(m);
                            if (m === 'new') setClient(null);
                            setErrors({});
                          }}
                          className={`${joinedSegment(clientMode === m)} min-h-11 px-[18px] text-[14.5px]`}
                        >
                          {m === 'existing' ? t('admin.coaching.newPack.existingClient', 'לקוח קיים') : t('admin.coaching.newPack.newClient', 'לקוח חדש (בלי חשבון)')}
                        </button>
                      ))}
                    </div>
                  )}

                  {clientMode === 'existing' || client ? (
                    client ? (
                      <div className="flex items-center gap-3 rounded-[14px] border-2 border-primary bg-primary/5 px-3.5 py-3">
                        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-primary/10 font-extrabold text-primary" aria-hidden>
                          {initials(client.name)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <b className="block">{client.name}</b>
                          <span className="text-[13px] text-muted-foreground">
                            <bdi dir="ltr">{client.email}</bdi>
                            {clientInfo?.in_parent_coaching ? ` · ${t('admin.coaching.newPack.inParent', 'בליווי הורי')}` : ''}
                            {clientInfo?.children.length
                              ? ` · ${t('admin.coaching.newPack.kids', 'ילדים:')} ${clientInfo.children.map((c) => (c.age != null ? `${c.name} (${c.age})` : c.name)).join(', ')}`
                              : ''}
                          </span>
                        </span>
                        {!request && (
                          <Btn
                            onClick={() => {
                              setClient(null);
                              setChildId('');
                            }}
                          >
                            {t('admin.coaching.newPack.swap', 'החלפה')}
                          </Btn>
                        )}
                      </div>
                    ) : (
                      <Field id="client-search" label={t('admin.coaching.newPack.searchAny', 'חיפוש לפי שם, מייל או טלפון')} error={errors.client}>
                        <Input id="client-search" type="search" className="h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
                        {searching && <p className="text-sm text-muted-foreground">{t('admin.coaching.common.searching', 'מחפש...')}</p>}
                        {!searching && search.trim().length >= 2 && found.length === 0 && (
                          <p className="text-sm text-muted-foreground">{t('admin.coaching.newPack.noClients', 'לא נמצא לקוח. אפשר לבחור "לקוח חדש (בלי חשבון)".')}</p>
                        )}
                        {found.length > 0 && (
                          <div className="overflow-hidden rounded-xl border border-border">
                            {found.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setClient(u);
                                  clear('client');
                                }}
                                className="flex min-h-[48px] w-full items-center gap-3 border-b border-border px-3 py-2 text-start text-sm last:border-b-0 hover:bg-muted"
                              >
                                <b>{u.name}</b>
                                <bdi dir="ltr" className="text-muted-foreground">
                                  {u.email}
                                </bdi>
                                {u.phone && <bdi dir="ltr" className="text-muted-foreground">{u.phone}</bdi>}
                              </button>
                            ))}
                          </div>
                        )}
                      </Field>
                    )
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field id="nc-first" label={t('admin.coaching.newPack.firstName2', 'שם פרטי')} error={errors.firstName}>
                        <Input id="nc-first" className="h-11" value={newClient.first_name} onChange={(e) => (setNewClient({ ...newClient, first_name: e.target.value }), clear('firstName'))} />
                      </Field>
                      <Field id="nc-last" label={t('admin.coaching.newPack.lastName', 'שם משפחה')} error={errors.lastName}>
                        <Input id="nc-last" className="h-11" value={newClient.last_name} onChange={(e) => (setNewClient({ ...newClient, last_name: e.target.value }), clear('lastName'))} />
                      </Field>
                      <Field id="nc-email" label={t('admin.coaching.newPack.email', 'מייל')} error={errors.email}>
                        <Input id="nc-email" type="email" dir="ltr" className="h-11" value={newClient.email} onChange={(e) => (setNewClient({ ...newClient, email: e.target.value }), clear('email'))} />
                      </Field>
                      <Field id="nc-phone" label={t('admin.coaching.newPack.phone', 'טלפון (לא חובה)')}>
                        <Input id="nc-phone" type="tel" dir="ltr" className="h-11" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
                      </Field>
                    </div>
                  )}
                  <p className="text-[13px] text-muted-foreground">{t('admin.coaching.newPack.newClientNote', 'בלקוח חדש: שם, מייל וטלפון. החשבון נפתח כשהוא משלים את ההרשמה מהקישור.')}</p>
                </div>

                {service === 'child' && (
                  <div className={`${card} space-y-3.5`}>
                    <div>
                      <h2 className="text-[19px] font-extrabold [font-family:inherit]">{t('admin.coaching.newPack.theChild2', 'הילד')}</h2>
                      <p className="mt-1 text-[13.5px] text-muted-foreground">{t('admin.coaching.newPack.childOnly', 'מופיע רק בליווי ילד.')}</p>
                    </div>
                    {!isNewClient && (
                      <div role="radiogroup" aria-label={t('admin.coaching.newPack.theChild2', 'הילד')} className="grid gap-2.5 sm:grid-cols-3">
                        {(clientInfo?.children ?? (request?.child ? [{ ...request.child, coaching: null }] : [])).map((c) => {
                          const on = childId === c.id;
                          const fromRequest = request?.child?.id === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              role="radio"
                              aria-checked={on}
                              onClick={() => (setChildId(c.id), clear('child'))}
                              className={`flex min-h-[92px] flex-col gap-1 rounded-[14px] p-3.5 text-start ${on ? 'border-2 border-primary bg-primary/5' : 'border border-border bg-card hover:border-primary/40'}`}
                            >
                              <b className="text-base">{c.name}</b>
                              <span className="text-[13px] text-muted-foreground">
                                {[
                                  c.age != null ? tf(t, 'admin.coaching.common.age', 'גיל {n}', { n: c.age }) : null,
                                  c.coaching ? tf(t, 'admin.coaching.newPack.alreadyIn', 'כבר בליווי ({used}/{total})', { used: c.coaching.used, total: c.coaching.total }) : null,
                                  fromRequest ? t('admin.coaching.newPack.fromRequest', 'מהבקשה מהפורטל') : null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          role="radio"
                          aria-checked={childId === 'new'}
                          onClick={() => (setChildId('new'), clear('child'))}
                          className={`grid min-h-[92px] place-items-center rounded-[14px] p-3.5 font-bold text-primary ${childId === 'new' ? 'border-2 border-primary bg-primary/5' : 'border-[1.5px] border-dashed border-primary/40 bg-card'}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Plus className="h-4 w-4" aria-hidden /> {t('admin.coaching.newPack.newChild', 'ילד חדש')}
                          </span>
                        </button>
                      </div>
                    )}
                    <FieldError>{errors.child}</FieldError>
                    {(isNewClient || childId === 'new') && (
                      <div className="grid gap-4 sm:grid-cols-3">
                        <Field id="ch-first" label={t('admin.coaching.newPack.childFirst', 'שם פרטי')} error={errors.childName}>
                          <Input id="ch-first" className="h-11" value={newChild.first_name} onChange={(e) => (setNewChild({ ...newChild, first_name: e.target.value }), clear('childName'))} />
                        </Field>
                        <Field id="ch-age" label={t('admin.coaching.newPack.childAge2', 'גיל')} error={errors.childAge}>
                          <Input id="ch-age" type="number" min={0} max={30} inputMode="numeric" className="h-11" value={newChild.age} onChange={(e) => (setNewChild({ ...newChild, age: e.target.value }), clear('childAge'))} />
                        </Field>
                      </div>
                    )}
                    <p className="text-[13px] text-muted-foreground">{t('admin.coaching.newPack.newChildNote', 'ילד חדש: שם פרטי וגיל. לרוב נשמר עם ההורה; בלקוח חדש נשמר עד שההורה משלים את ההרשמה.')}</p>
                  </div>
                )}
              </>
            )}

            {/* 3 · Package and send */}
            {step === 3 && (
              <>
                <div className={`${card} space-y-3.5`}>
                  <h2 className="text-[19px] font-extrabold [font-family:inherit]">{t('admin.coaching.newPack.whichPackage', 'איזו חבילה')}</h2>
                  <p className="-mt-2 text-[13.5px] text-muted-foreground">
                    {shownProducts.some((p) => !p.kind)
                      ? t('admin.coaching.newPack.someUntyped', 'חבילות שלא הוגדר להן שירות (ליווי הורי או ליווי ילד) מוצגות בשני השירותים. מגדירים את השירות במוצר.')
                      : service === 'child'
                        ? t('admin.coaching.newPack.onlyChild', 'מוצגות רק חבילות של ליווי ילד.')
                        : t('admin.coaching.newPack.onlyParent', 'מוצגות רק חבילות של ליווי הורי.')}
                  </p>
                  {shownProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('admin.coaching.newPack.noProducts2', 'עוד אין מוצר של חבילת מפגשים בתשלום לפי מפגש לשירות הזה. מגדירים אותו בעמוד המוצרים (סוג: חבילת מפגשים, תשלום: לפי מפגש).')}
                    </p>
                  ) : (
                    <div role="radiogroup" aria-label={t('admin.coaching.newPack.whichPackage', 'איזו חבילה')} className="grid gap-2.5 sm:grid-cols-3">
                      {shownProducts.map((p) => {
                        const on = productId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => (setProductId(p.id), clear('product'))}
                            className={`flex flex-col gap-1.5 rounded-[14px] p-3.5 text-start ${on ? 'border-2 border-primary bg-primary/5' : 'border border-border bg-card hover:border-primary/40'}`}
                          >
                            <b className="text-base">
                              {p.title}
                              {p.session_count ? ` · ${tf(t, 'admin.coaching.newPack.sessions', '{n} מפגשים', { n: p.session_count })}` : ''}
                            </b>
                            <span className="text-xl font-extrabold">
                              {priceText(p.price_per_session, p.currency, language)}{' '}
                              <span className="text-sm font-semibold text-muted-foreground">{t('admin.coaching.newPack.perSessionWord', 'למפגש')}</span>
                            </span>
                            <span className="text-[12.5px] text-muted-foreground">
                              {[
                                p.per_session ? t('admin.coaching.newPack.chargedAfter', 'נגבה אחרי כל מפגש') : t('admin.coaching.newPack.notPerSession', 'תשלום לפי תוכנית המוצר'),
                                p.requires_signature ? t('admin.coaching.newPack.contract', 'חוזה לחתימה') : null,
                                p.has_intake ? t('admin.coaching.newPack.intake', 'שאלון פתיחה') : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                            {p.crm_tag_slugs.length > 0 && (
                              <span className="mt-1 flex flex-wrap items-center gap-1" aria-label={t('admin.coaching.newPack.tagsLabel', 'תגיות שהלקוח יקבל')}>
                                {p.crm_tag_slugs.map((slug) => {
                                  const tag = crmTags.get(slug);
                                  const color = tag?.category?.color ?? null;
                                  return (
                                    <span
                                      key={slug}
                                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                                      style={{ backgroundColor: color ? `${color}22` : undefined, color: color ?? undefined, border: color ? `1px solid ${color}55` : '1px solid hsl(var(--border))' }}
                                    >
                                      {tag?.label_he?.trim() || tag?.label_en?.trim() || slug}
                                    </span>
                                  );
                                })}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <FieldError>{errors.product}</FieldError>

                  {/* Coach and intake form on one row (stacked on a phone). */}
                  <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    id="coach"
                    className="min-w-0"
                    label={
                      <>
                        {t('admin.coaching.newPack.coach', 'מאמן/ת')} <span className="font-medium text-muted-foreground">{t('admin.coaching.newPack.coachLater', '(אפשר גם אחר כך)')}</span>
                      </>
                    }
                  >
                    <UiSelect
                      id="coach"
                      direction={direction}
                      value={coachId}
                      onChange={setCoachId}
                      options={[...coaches.map((c) => ({ value: c.id, label: c.name })), { value: NO_COACH, label: t('admin.coaching.newPack.notYet', 'עדיין לא') }]}
                    />
                  </Field>

                  <Field id="intake-form" className="min-w-0" label={t('admin.coaching.newPack.intakeForm', 'שאלון פתיחה')} hint={t('admin.coaching.newPack.intakeFormHint', 'הלקוח ממלא אותו בסוף ההרשמה. עורכים שאלונים בלשונית "שאלוני פתיחה".')}>
                    <UiSelect
                      id="intake-form"
                      direction={direction}
                      value={intakeFormId}
                      onChange={setIntakeFormId}
                      options={[
                        {
                          value: PRODUCT_FORM,
                          label: productForm
                            ? tf(t, 'admin.coaching.newPack.intakeProduct', 'של המוצר: {title}', { title: productForm.title })
                            : t('admin.coaching.newPack.intakeProductNone', 'של המוצר (אין שאלון)'),
                        },
                        ...forms
                          .filter((f) => f.id !== productForm?.id)
                          .map((f) => ({ value: f.id, label: tf(t, 'admin.coaching.newPack.intakeOption', '{title} · {n} שאלות', { title: f.title, n: f.questions?.length ?? 0 }) })),
                        { value: 'none', label: t('admin.coaching.newPack.intakeNone', 'בלי שאלון') },
                      ]}
                    />
                  </Field>
                  </div>
                </div>

                <div className={`${card} space-y-3`}>
                  <h2 className="text-[19px] font-extrabold [font-family:inherit]">{tf(t, 'admin.coaching.newPack.whatGoes', 'מה {who} יעבור', { who: whoWord })}</h2>
                  <ol className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-4">
                    {[
                      { title: t('admin.coaching.newPack.wDetails', 'פרטים'), text: client ? t('admin.coaching.newPack.wDetailsFilled', 'כבר ממולאים') : t('admin.coaching.newPack.wDetailsFill', 'ממלא בקישור') },
                      product?.requires_signature !== false ? { title: t('admin.coaching.newPack.wContract', 'חוזה'), text: t('admin.coaching.newPack.wContractText', 'חתימה ב-DocuSign') } : null,
                      { title: t('admin.coaching.newPack.wCard', 'שמירת כרטיס'), text: t('admin.coaching.newPack.wCardText', 'לא נגבה כלום עכשיו') },
                      intakeFormId !== 'none' && (intakeFormId !== PRODUCT_FORM || productForm)
                        ? { title: t('admin.coaching.newPack.wIntake', 'שאלון פתיחה'), text: service === 'child' && childFirst ? tf(t, 'admin.coaching.newPack.wIntakeOn', 'על {name}', { name: childFirst }) : t('admin.coaching.newPack.wIntakeText', 'לפני המפגש הראשון') }
                        : null,
                    ]
                      .filter(Boolean)
                      .map((s, i) => (
                        <li key={i} className="rounded-xl bg-muted/50 p-3 text-sm">
                          <b className="block text-primary">
                            {i + 1} · {s!.title}
                          </b>
                          {s!.text}
                        </li>
                      ))}
                  </ol>
                  <div className="flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
                    <Mail className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span>
                      {client
                        ? tf(t, 'admin.coaching.newPack.noteExisting', '{name} יקבל/תקבל מייל עם קישור, וגם יראה את זה בפורטל תחת "להשלמה".', { name: clientFirst })
                        : tf(t, 'admin.coaching.newPack.noteNew', '{name} יקבל/תקבל מייל עם קישור להרשמה.', { name: clientFirst || whoWord })}
                      {product?.per_session
                        ? ' ' + tf(t, 'admin.coaching.newPack.noteCharge', 'כל מפגש ייגבה {price} מהכרטיס השמור כשתסמנו שהתקיים.', { price: priceText(product.price_per_session, product.currency, language) })
                        : ''}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              {step === 1 ? (
                <Link href="/admin/coaching" className="text-[14.5px] font-semibold text-primary no-underline hover:underline">
                  {t('admin.coaching.common.cancel', 'ביטול')}
                </Link>
              ) : (
                <button type="button" onClick={() => setStep((step - 1) as Step)} className="text-[14.5px] font-semibold text-primary hover:underline">
                  {direction === 'rtl' ? '→' : '←'} {t('admin.coaching.newPack.back2', 'חזרה')}
                </button>
              )}
              {step < 3 ? (
                <Btn tone="primary" onClick={() => goTo((step + 1) as Step)}>
                  {tf(t, 'admin.coaching.newPack.continueTo', 'המשך ל"{step}"', { step: stepNames[(step + 1) as Step] })} {direction === 'rtl' ? '←' : '→'}
                </Btn>
              ) : (
                <Btn tone="primary" busy={saving} onClick={submit}>
                  {tf(t, 'admin.coaching.newPack.openSend', 'פתיחה ושליחה ל{who}', { who: service === 'child' ? t('admin.coaching.drawer.parentWord', 'הורה') : t('admin.coaching.drawer.clientWord', 'לקוח') })}
                </Btn>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0][0]}״${parts[parts.length - 1][0]}` : (parts[0]?.[0] ?? '?');
}

function ServiceIcon({ kind }: { kind: PackageKind }) {
  return kind === 'parent' ? (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" aria-hidden>
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5" />
      <path d="M14.5 15.2c.6-.5 1.3-.7 2-.7 1.9 0 3.6 1.4 4 4" />
    </svg>
  ) : (
    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" aria-hidden>
      <circle cx="8" cy="7" r="3" />
      <circle cx="16" cy="11" r="2.2" />
      <path d="M3 19c.5-3 2.6-4.8 5-4.8s4.5 1.8 5 4.8" />
      <path d="M13.5 19c.3-2 1.4-3.3 2.5-3.3s2.2 1.3 2.5 3.3" />
    </svg>
  );
}

export default function NewCoachingPackagePage() {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <NewPackageInner />
      </Suspense>
    </AdminLayout>
  );
}
