'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Mail, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useAdminLanguage } from '@/context/AppContext';
import { productTypeLook } from '@/components/admin/products/ProductDrawer';
import { BlockedNote, ChoiceCard, SaveBar, kitButton, saveBarText } from '@/components/admin/notifications/kit';
import type { ProductType } from '@/types/product';
import { ExistingEnrollmentNotice, readExistingEnrollment, type ExistingEnrollment } from './ExistingEnrollmentNotice';

const STEPS = ['who', 'product', 'payment', 'review'] as const;
type Step = (typeof STEPS)[number];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Student = { id: string; first_name?: string | null; last_name?: string | null; email: string };
type ProductOption = {
  id: string;
  title?: string;
  type: string;
  price?: number | null;
  currency?: string | null;
  payment_model?: string | null;
  payment_start_date?: string | null;
  metadata?: Record<string, any> | null;
};

const today = () => new Date().toISOString().split('T')[0];
const inAWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split('T')[0];
};

/**
 * A new enrollment, step by step (it used to be one long dialog): who,
 * which product, payment and access, then a summary where you choose to
 * send the link now or save a draft. Every field, default and check of the
 * old form is kept: existing student or a new person (with the live "email
 * already used" check), product, parent enrollment, payment start date
 * (filled from the product, not before today), waive payment, and the link
 * expiry (a week from today). The request is the same as before.
 */
export function NewEnrollmentWizard() {
  const { t, direction, language } = useAdminLanguage();
  const router = useRouter();
  const rtl = direction === 'rtl';
  const BackArrow = rtl ? ArrowRight : ArrowLeft;

  const [step, setStep] = useState<Step>('who');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [blocked, setBlocked] = useState<string | null>(null);
  // The client already has this product: shown instead of a second enrollment.
  const [existing, setExisting] = useState<ExistingEnrollment | null>(null);
  const [saving, setSaving] = useState(false);

  // Who
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [createNewUser, setCreateNewUser] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // What
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  // Payment and access
  const [waivePayment, setWaivePayment] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [paymentStartDate, setPaymentStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState(inAWeek());

  // Finish
  const [sendNow, setSendNow] = useState(true);
  const [sendLanguage, setSendLanguage] = useState(language === 'he' ? 'he' : 'en');

  // Students and active products, as the old dialog loaded them.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/users?role=student');
        const data = res.ok ? await res.json() : [];
        setStudents(Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : Array.isArray(data?.data) ? data.data : []);
      } catch {
        setStudents([]);
      } finally {
        setStudentsLoaded(true);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/products?is_active=true');
        const data = res.ok ? await res.json() : [];
        setProducts(data?.success && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : []);
      } catch {
        setProducts([]);
      } finally {
        setProductsLoaded(true);
      }
    })();
  }, []);

  // Is the new person's email already used? (half a second after typing, as before)
  useEffect(() => {
    if (!createNewUser || !email || email.length < 3 || !EMAIL_RE.test(email)) {
      setEmailExists(false);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await fetch(`/api/admin/users?email=${encodeURIComponent(email)}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.users || data.data || [];
          setEmailExists(list.length > 0);
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setCheckingEmail(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email, createNewUser]);

  // The payment start date comes from the product, as before.
  useEffect(() => {
    if (!selectedProduct) return;
    const p = products.find((x) => x.id === selectedProduct);
    setPaymentStartDate(p?.payment_start_date ? p.payment_start_date.split('T')[0] : '');
  }, [selectedProduct, products]);

  const productTitle = (p?: ProductOption) => (p ? p.metadata?.[`title_${rtl ? 'he' : 'en'}`] || p.title || '' : '');
  const typeLabel = (type: string) => t(`admin.enrollments.productType.${(type || '').toLowerCase()}`, type);
  const money = (amount?: number | null, currency?: string | null) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(Number(amount || 0));
    } catch {
      return `${amount ?? 0}`;
    }
  };
  const priceText = (p: ProductOption) =>
    p.payment_model === 'free' ? t('products.payment_model.free', 'Free') : money(p.price, p.currency);
  const longDate = (d: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(rtl ? 'he-IL' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
  const studentName = (s?: Student) => (s ? `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email : '');

  const matchingStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    const list = q ? students.filter((s) => `${studentName(s)} ${s.email}`.toLowerCase().includes(q)) : students;
    return list.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, studentQuery]);
  const matchingProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    return q ? products.filter((p) => `${productTitle(p)} ${typeLabel(p.type)}`.toLowerCase().includes(q)) : products;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, productQuery, rtl]);
  const chosenStudent = students.find((s) => s.id === selectedUser);
  const chosenProduct = products.find((p) => p.id === selectedProduct);

  /** What's missing on one step, with the reason by each field. */
  const check = (s: Step): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 'who') {
      if (createNewUser) {
        if (!firstName.trim()) e.firstName = t('admin.enrollments.wizard.errFirstName', 'Write a first name.');
        if (!lastName.trim()) e.lastName = t('admin.enrollments.wizard.errLastName', 'Write a last name.');
        if (!email.trim()) e.email = t('admin.enrollments.wizard.errEmail', 'Write an email address. The enrollment link goes there.');
        else if (!EMAIL_RE.test(email)) e.email = t('admin.enrollments.wizard.errEmailFormat', 'This email address isn\'t valid.');
        else if (emailExists)
          e.email = t('admin.enrollments.create.emailExists', 'A user with this email already exists. Please use the "Select User" option instead.');
        else if (checkingEmail) e.email = t('admin.enrollments.create.checkingEmail', 'Checking email...');
      } else if (!selectedUser) {
        e.user = t('admin.enrollments.wizard.errUser', 'Choose a client from the list, or switch to "New person".');
      }
    }
    if (s === 'product' && !selectedProduct) e.product = t('admin.enrollments.create.selectProductError', 'Please select a product');
    if (s === 'payment' && paymentStartDate && paymentStartDate < today())
      e.paymentStartDate = t('admin.enrollments.wizard.errStartPast', 'The payment start date can\'t be before today.');
    return e;
  };

  const go = (target: Step) => {
    const from = STEPS.indexOf(step);
    const to = STEPS.indexOf(target);
    setExisting(null);
    if (to <= from) {
      setStep(target);
      setErrors({});
      setBlocked(null);
      return;
    }
    // Moving forward checks every step on the way.
    for (const s of STEPS.slice(from, to)) {
      const e = check(s);
      if (Object.keys(e).length) {
        setStep(s);
        setErrors(e);
        setBlocked(t('admin.coaching.common.fixErrors', 'Some fields need attention. The reason is shown in red next to each one.'));
        return;
      }
    }
    setErrors({});
    setBlocked(null);
    setStep(target);
  };

  const submit = async () => {
    for (const s of STEPS) {
      const e = check(s);
      if (Object.keys(e).length) {
        setStep(s);
        setErrors(e);
        setBlocked(t('admin.coaching.common.fixErrors', 'Some fields need attention. The reason is shown in red next to each one.'));
        return;
      }
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        product_id: selectedProduct,
        status: 'draft', // Always starts as a draft; sending the link makes it pending.
        expires_at: expiryDate || null,
        waive_payment: waivePayment,
        is_parent: isParent,
        payment_start_date: paymentStartDate || null,
      };
      if (createNewUser) {
        payload.create_new_user = true;
        payload.new_user = { email, first_name: firstName, last_name: lastName, phone: phone || null };
      } else {
        payload.user_id = selectedUser;
      }
      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const found = readExistingEnrollment(response.status, error);
        if (found) {
          setExisting(found);
          setSaving(false);
          return;
        }
        throw new Error(error.error || 'Failed to create enrollment');
      }
      const created = await response.json().catch(() => null);
      toast.success(t('admin.enrollments.create.success', 'Enrollment created successfully'));

      if (sendNow && created?.id) {
        const sent = await fetch(`/api/admin/enrollments/${created.id}/send-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: sendLanguage }),
        });
        if (sent.ok) toast.success(t('admin.enrollments.sendLink.success', 'Enrollment link sent successfully'));
        else {
          const error = await sent.json().catch(() => ({}));
          toast.error(error.error || t('admin.enrollments.wizard.sendFailed', 'The enrollment was saved, but the link wasn\'t sent. You can send it from the enrollment.'));
        }
      }
      router.push(created?.id ? `/admin/enrollments?enrollment=${created.id}` : '/admin/enrollments');
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      toast.error(error.message || t('admin.enrollments.create.error', 'Failed to create enrollment'));
      setSaving(false);
    }
  };

  const index = STEPS.indexOf(step);
  const stepLabel = (s: Step) =>
    ({
      who: t('admin.enrollments.wizard.stepWho', 'Who'),
      product: t('admin.enrollments.wizard.stepProduct', 'Product'),
      payment: t('admin.enrollments.wizard.stepPayment', 'Payment and access'),
      review: t('admin.enrollments.wizard.stepReview', 'Summary'),
    })[s];
  const field = 'h-11 w-full rounded-lg border bg-card px-3 text-foreground outline-none focus:border-primary dark:[color-scheme:dark]';
  const fieldBorder = (key: string) => (errors[key] ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20' : 'border-border');

  return (
    <div className="space-y-4 pb-28" dir={direction}>
      <Link href="/admin/enrollments" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <BackArrow className="h-4 w-4" aria-hidden />
        {t('admin.enrollments.wizard.back', 'Back to enrollments')}
      </Link>
      <div>
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight [font-family:inherit] sm:text-3xl">{t('admin.enrollments.wizard.title', 'New enrollment')}</h1>
        <p className="mt-1.5 text-muted-foreground">
          {t('admin.enrollments.create.alert', 'This enrollment will be marked as admin-assigned and will bypass the normal purchase flow.')}
        </p>
      </div>

      {/* Steps */}
      <header className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-primary">
            {t('admin.notifications.wizard.stepOf', 'Step {n} of {total}').replace('{n}', String(index + 1)).replace('{total}', String(STEPS.length))}
          </span>
          <span className="text-xs text-muted-foreground">{t('admin.notifications.wizard.jumpHint', 'Click a step to jump to it')}</span>
        </div>
        <div className="mt-1.5 flex gap-[3px]" aria-hidden>
          {STEPS.map((s, i) => (
            <i key={s} className={`h-1.5 flex-1 rounded ${i <= index ? 'bg-primary' : 'bg-primary/15'}`} />
          ))}
        </div>
        <ol className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {STEPS.map((s, i) => (
            <li key={s} className="shrink-0">
              <button
                type="button"
                onClick={() => go(s)}
                aria-current={s === step ? 'step' : undefined}
                className={`inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-xs font-semibold ${
                  s === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : i < index
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                <span className="opacity-70">{i + 1}</span>
                {stepLabel(s)}
              </button>
            </li>
          ))}
        </ol>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {step === 'who' && (
          <>
            <StepTitle title={t('admin.enrollments.wizard.whoTitle', 'Who is the enrollment for?')} lead={t('admin.enrollments.wizard.whoLead', 'A client who already has an account, or a new person. A new person\'s account is created when they complete the enrollment.')} />
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                active={!createNewUser}
                onClick={() => {
                  setCreateNewUser(false);
                  setErrors({});
                }}
                title={t('admin.enrollments.wizard.existing', 'Existing client')}
                text={t('admin.enrollments.wizard.existingText', 'Search by name or email')}
              />
              <ChoiceCard
                active={createNewUser}
                onClick={() => {
                  setCreateNewUser(true);
                  setEmailExists(false);
                  setErrors({});
                }}
                title={t('admin.enrollments.wizard.newPerson', 'New person')}
                text={t('admin.enrollments.wizard.newPersonText', 'No account yet')}
              />
            </div>

            {!createNewUser ? (
              <div className="mt-5">
                <label className="flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-muted-foreground focus-within:border-primary">
                  <Search className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="sr-only">{t('admin.enrollments.wizard.searchStudent', 'Search clients')}</span>
                  <input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder={t('admin.enrollments.wizard.searchStudent', 'Search clients by name or email')}
                    className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
                  />
                </label>
                <ul className={`mt-2 overflow-hidden rounded-xl border ${errors.user ? 'border-red-500' : 'border-border'}`} role="radiogroup">
                  {!studentsLoaded ? (
                    <li className="flex items-center justify-center p-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </li>
                  ) : matchingStudents.length === 0 ? (
                    <li className="p-4 text-sm text-muted-foreground">{t('admin.enrollments.create.noUsers', 'No users found')}</li>
                  ) : (
                    matchingStudents.map((s) => {
                      const on = s.id === selectedUser;
                      return (
                        <li key={s.id} className="border-b border-border/70 last:border-b-0">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              setSelectedUser(s.id);
                              setErrors({});
                            }}
                            className={`flex min-h-[52px] w-full items-center gap-3 px-3.5 py-2 text-start ${on ? 'bg-primary/10' : 'hover:bg-muted/60'}`}
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden>
                              {(studentName(s)[0] || '?').toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <bdi className="block truncate font-semibold">{studentName(s)}</bdi>
                              <span dir="ltr" className="block truncate text-[13px] text-muted-foreground">
                                {s.email}
                              </span>
                            </span>
                            {on && <Check className="h-5 w-5 shrink-0 text-primary" aria-hidden />}
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
                <FieldError text={errors.user} />
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t('admin.enrollments.create.firstName', 'First Name')} required error={errors.firstName}>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`${field} ${fieldBorder('firstName')}`} />
                  </Field>
                  <Field label={t('admin.enrollments.create.lastName', 'Last Name')} required error={errors.lastName}>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${field} ${fieldBorder('lastName')}`} />
                  </Field>
                </div>
                <Field label={t('admin.enrollments.create.email', 'Email Address')} required error={errors.email}>
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${field} ${errors.email || emailExists ? 'border-red-500' : 'border-border'}`}
                  />
                  {!errors.email && checkingEmail && <p className="mt-1 text-[13px] text-muted-foreground">{t('admin.enrollments.create.checkingEmail', 'Checking email...')}</p>}
                  {!errors.email && emailExists && !checkingEmail && (
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      {t('admin.enrollments.wizard.emailUsed', 'This email is already registered. Choose "Existing client".')}
                    </p>
                  )}
                  {!errors.email && email.length > 5 && EMAIL_RE.test(email) && !emailExists && !checkingEmail && (
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-4 w-4" aria-hidden />
                      {t('admin.enrollments.create.emailAvailable', 'Email is available')}
                    </p>
                  )}
                </Field>
                <Field label={t('admin.enrollments.create.phone', 'Phone Number (Optional)')}>
                  <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${field} border-border`} />
                </Field>
                <p className="text-[13px] text-muted-foreground">
                  {t('admin.enrollments.create.newUserNote', 'A new user account will be created with these details. The user will receive an invitation email to complete registration.')}
                </p>
              </div>
            )}
          </>
        )}

        {step === 'product' && (
          <>
            <StepTitle title={t('admin.enrollments.wizard.productTitle', 'Which product?')} lead={t('admin.enrollments.create.productHelp', 'Products contain all program/course information including pricing and payment plans')} />
            <label className="mb-3 flex h-11 items-center gap-2 rounded-lg border border-border px-3 text-muted-foreground focus-within:border-primary">
              <Search className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="sr-only">{t('admin.enrollments.wizard.searchProduct', 'Search products')}</span>
              <input
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder={t('admin.enrollments.wizard.searchProduct', 'Search products')}
                className="min-w-0 flex-1 bg-transparent text-foreground outline-none"
              />
            </label>
            {!productsLoaded ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : matchingProducts.length === 0 ? (
              <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">{t('admin.enrollments.create.noProducts', 'No products found')}</p>
            ) : (
              <div className={`grid gap-2.5 sm:grid-cols-2 ${errors.product ? 'rounded-xl outline outline-1 outline-red-500 outline-offset-4' : ''}`} role="radiogroup">
                {matchingProducts.map((p) => {
                  const on = p.id === selectedProduct;
                  const look = productTypeLook((p.type || '').toLowerCase() as ProductType);
                  const Icon = look.icon;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        setSelectedProduct(p.id);
                        setErrors({});
                      }}
                      className={`relative flex items-start gap-3 rounded-[14px] border p-3.5 text-start transition-colors ${
                        on ? 'border-primary bg-primary/5 shadow-[inset_0_0_0_1px_hsl(var(--primary))]' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${look.tile}`} aria-hidden>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1 pe-6">
                        <bdi className="block font-bold">{productTitle(p)}</bdi>
                        <span className="block text-[13px] text-muted-foreground">
                          {typeLabel(p.type)}
                          {p.payment_model ? ` · ${t(`products.payment_model.${p.payment_model}`, p.payment_model)}` : ''}
                        </span>
                        <span className="mt-0.5 block font-extrabold tabular-nums">{priceText(p)}</span>
                      </span>
                      {on && (
                        <span className="absolute end-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                          <Check className="h-4 w-4" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <FieldError text={errors.product} />
          </>
        )}

        {step === 'payment' && (
          <>
            <StepTitle title={t('admin.enrollments.wizard.paymentTitle', 'Payment and access')} lead={t('admin.enrollments.wizard.paymentLead', 'The defaults come from the product. Change them only if needed.')} />
            <ToggleRow
              title={t('admin.enrollments.wizard.waive', 'Waive payment')}
              text={t('admin.enrollments.create.waivePayment', 'Waive payment requirement (scholarship, staff, or free enrollment)')}
              checked={waivePayment}
              onChange={setWaivePayment}
            />
            <ToggleRow
              title={t('admin.enrollments.create.isParent', 'Parent Enrollment')}
              text={t(
                'admin.enrollments.create.isParentHelp',
                'Check this if enrollment is for a parent (no dashboard access). User will only get dashboard access when they have at least one non-parent enrollment.',
              )}
              checked={isParent}
              onChange={setIsParent}
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label={t('admin.enrollments.wizard.paymentStart', 'Payment start date')} error={errors.paymentStartDate}>
                <input type="date" value={paymentStartDate} min={today()} onChange={(e) => setPaymentStartDate(e.target.value)} className={`${field} ${fieldBorder('paymentStartDate')}`} />
                {!errors.paymentStartDate && (
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {chosenProduct?.payment_start_date
                      ? t('admin.enrollments.wizard.paymentStartFromProduct', 'Filled in from the product. Not before today.')
                      : t('admin.enrollments.wizard.paymentStartDefault', 'Leave empty to use the product\'s default.')}
                  </p>
                )}
              </Field>
              <Field label={t('admin.enrollments.wizard.expiry', 'Link valid until')}>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={`${field} border-border`} />
                <p className="mt-1 text-[13px] text-muted-foreground">{t('admin.enrollments.wizard.expiryHint', 'A week from today by default. Leave empty for no expiry.')}</p>
              </Field>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <StepTitle title={t('admin.enrollments.wizard.reviewTitle', 'Last check')} lead={t('admin.enrollments.create.alert', 'This enrollment will be marked as admin-assigned and will bypass the normal purchase flow.')} />
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border text-sm">
              <SummaryLine
                label={t('admin.enrollments.wizard.stepWho', 'Who')}
                onChange={() => go('who')}
                changeLabel={t('admin.enrollments.wizard.change', 'Change')}
              >
                {createNewUser ? (
                  <>
                    <b>{`${firstName} ${lastName}`.trim() || '—'}</b> · {t('admin.enrollments.wizard.newPerson', 'New person')} · <span dir="ltr">{email}</span>
                  </>
                ) : (
                  <>
                    <b>{studentName(chosenStudent) || '—'}</b> · <span dir="ltr">{chosenStudent?.email}</span>
                  </>
                )}
              </SummaryLine>
              <SummaryLine label={t('admin.enrollments.wizard.stepProduct', 'Product')} onChange={() => go('product')} changeLabel={t('admin.enrollments.wizard.change', 'Change')}>
                <b>{productTitle(chosenProduct) || '—'}</b>
                {chosenProduct ? ` · ${priceText(chosenProduct)}` : ''}
              </SummaryLine>
              <SummaryLine label={t('admin.enrollments.wizard.stepPayment', 'Payment and access')} onChange={() => go('payment')} changeLabel={t('admin.enrollments.wizard.change', 'Change')}>
                {waivePayment ? t('admin.enrollments.wizard.waived', 'Payment waived') : t('admin.enrollments.wizard.paymentFrom', 'Payments from {date}').replace('{date}', paymentStartDate ? longDate(paymentStartDate) : t('admin.enrollments.wizard.productDefault', 'the product\'s default'))}
                {' · '}
                {t('admin.enrollments.create.isParent', 'Parent Enrollment')}: {isParent ? t('admin.coaching.common.yes', 'Yes') : t('admin.coaching.common.no', 'No')}
                {' · '}
                {t('admin.enrollments.wizard.expiry', 'Link valid until')}: {expiryDate ? longDate(expiryDate) : '—'}
              </SummaryLine>
            </div>

            <p className="mb-2 mt-5 font-bold">{t('admin.enrollments.wizard.whatNow', 'And now?')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ChoiceCard
                active={sendNow}
                onClick={() => setSendNow(true)}
                icon={<Mail className="h-4 w-4" aria-hidden />}
                title={t('admin.enrollments.wizard.sendNow', 'Send the link now')}
                text={t('admin.enrollments.wizard.sendNowText', 'By email, valid for 7 days. The enrollment becomes "waiting for the parent".')}
              />
              <ChoiceCard
                active={!sendNow}
                onClick={() => setSendNow(false)}
                title={t('admin.enrollments.wizard.saveDraft', 'Save as a draft')}
                text={t('admin.enrollments.wizard.saveDraftText', 'Send the link later, from the enrollment.')}
              />
            </div>
            {sendNow && (
              <label className="mt-3 flex max-w-xs flex-col gap-1 text-sm">
                <span className="font-semibold">{t('admin.enrollments.sendLink.language', 'Email Language')}</span>
                <select value={sendLanguage} onChange={(e) => setSendLanguage(e.target.value)} className={`${field} border-border`}>
                  <option value="he">עברית</option>
                  <option value="en">English</option>
                </select>
              </label>
            )}
          </>
        )}

        <div className="mt-6">
          <BlockedNote text={blocked} />
          {existing && <ExistingEnrollmentNotice existing={existing} language={sendLanguage} />}
        </div>

        {/* Back / Continue */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          {index > 0 ? (
            <button type="button" onClick={() => go(STEPS[index - 1])} className={kitButton.back}>
              {t('admin.notifications.wizard.back', 'Back')}
            </button>
          ) : (
            <span />
          )}
          {index < STEPS.length - 1 && (
            <button type="button" onClick={() => go(STEPS[index + 1])} className={kitButton.primary}>
              {t('admin.notifications.wizard.continueTo', 'Continue to {step}').replace('{step}', stepLabel(STEPS[index + 1]))}
            </button>
          )}
        </div>
      </section>

      {/* The one save bar: always here */}
      <SaveBar
        isNew
        dirty={false}
        saving={saving}
        onSave={() => void submit()}
        cancelHref="/admin/enrollments"
        saveLabel={sendNow ? t('admin.enrollments.wizard.createAndSend', 'Create and send') : t('admin.enrollments.wizard.createDraft', 'Save draft')}
        text={{ ...saveBarText(t).bar, newItem: t('admin.enrollments.wizard.notSaved', 'New enrollment, not saved yet') }}
      />
    </div>
  );
}

function StepTitle({ title, lead }: { title: string; lead: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-extrabold [font-family:inherit]">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
    </div>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      <FieldError text={error} />
    </label>
  );
}

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      {text}
    </p>
  );
}

function ToggleRow({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 py-3.5 last:border-b-0">
      <div className="min-w-0">
        <p className="m-0 font-bold">{title}</p>
        <p className="m-0 mt-0.5 text-[13.5px] text-muted-foreground">{text}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={title} className="mt-1 shrink-0" />
    </div>
  );
}

function SummaryLine({ label, onChange, changeLabel, children }: { label: string; onChange: () => void; changeLabel: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <span className="min-w-0 [overflow-wrap:anywhere]">
        <span className="text-muted-foreground">{label}: </span>
        {children}
      </span>
      <button type="button" onClick={onChange} className="min-h-9 text-[13px] font-semibold text-primary underline">
        {changeLabel}
      </button>
    </div>
  );
}
