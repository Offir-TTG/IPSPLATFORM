'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Grid3x3,
  GraduationCap,
  Link2,
  Package,
  Pencil,
  Sparkles,
  Trash2,
  Users,
  Video,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAdminLanguage } from '@/context/AppContext';
import { useCrmTagNames } from '@/hooks/useCrmTagNames';
import { useToast } from '@/components/ui/use-toast';
import { DrawerQuickEdit, saveDrawerEdit, type DrawerEditValues } from '@/components/admin/drawer-kit';
import { usePlanFormat, type PaymentPlan } from '@/components/admin/plans/planFormat';
import { SubscriptionPriceSection } from './SubscriptionPriceSection';
import type { Product, ProductType } from '@/types/product';

/** Each kind of product: its icon and a colour, so lists and the drawer are easy to scan. */
export function productTypeLook(type: ProductType): { icon: LucideIcon; tile: string } {
  switch (type) {
    case 'program':
      return { icon: GraduationCap, tile: 'bg-primary/10 text-primary' };
    case 'course':
      return { icon: BookOpen, tile: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' };
    case 'lecture':
    case 'webinar':
      return { icon: Video, tile: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' };
    case 'workshop':
      return { icon: Users, tile: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300' };
    case 'session':
      return { icon: Calendar, tile: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-300' };
    case 'session_pack':
      return { icon: Package, tile: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300' };
    case 'bundle':
      return { icon: Grid3x3, tile: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300' };
    default:
      return { icon: Sparkles, tile: 'bg-muted text-foreground/70' };
  }
}

const footerButton =
  'inline-flex min-h-[44px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border bg-card px-3 text-sm font-semibold transition-colors';

/**
 * A short look at one product, in the admin template's drawer: a pinned top
 * with type and status, the name, and three numbers (price, how it's paid,
 * status), then Details and Description sections, and Edit / Copy
 * enrollment link / Delete at the bottom. Edit opens the product wizard
 * page; the Description section's own Edit changes the name, picture and
 * description in place.
 */
export function ProductDrawer({
  product,
  plans,
  onClose,
  onCopyLink,
  onDelete,
  onUpdated,
}: {
  product: Product | null;
  /** Names of the payment plans the product offers, if it uses plans. */
  plans: PaymentPlan[];
  onClose: () => void;
  onCopyLink: (product: Product) => void;
  onDelete: (product: Product) => void;
  /** The name, picture or description was saved: the list shows the change. */
  onUpdated?: (product: Product) => void;
}) {
  const { t, direction } = useAdminLanguage();
  const { label: crmTagLabel } = useCrmTagNames();
  const { toast } = useToast();
  const planFormat = usePlanFormat();
  const rtl = direction === 'rtl';
  const p = product;

  const saveEdit = async (values: DrawerEditValues) => {
    if (!product) return false;
    try {
      const saved = await saveDrawerEdit({
        values,
        currentImageUrl: product.metadata?.image_url,
        // The same upload the product editor's picture field uses.
        uploadUrl: '/api/lms/courses/upload-image',
        uploadIdField: 'courseId',
        itemId: `product-${product.id}`,
        patchUrl: `/api/admin/products/${product.id}`,
        nameField: 'title',
      });
      const metadata = { ...(product.metadata || {}) };
      if (saved.image_url) metadata.image_url = saved.image_url;
      else delete metadata.image_url;
      onUpdated?.({ ...product, title: saved.name, description: saved.description ?? undefined, metadata });
      toast({ title: t('common.success', 'Success'), description: t('admin.payments.products.updateSuccess', 'Product updated successfully') });
      return true;
    } catch (error) {
      const reason = error instanceof Error ? ` (${error.message})` : '';
      toast({ title: t('common.error', 'Error'), description: `${t('admin.courses.drawer.saveError', 'The change was not saved. Try again.')}${reason}`, variant: 'destructive' });
      return false;
    }
  };

  const money = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat(rtl ? 'he-IL' : 'en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${amount} ${currency ?? ''}`.trim();
    }
  };

  const typeLabel = p ? t(`products.type.${p.type}`, p.type) : '';
  // How the client pays. A product that uses payment plans is paid the way
  // its plans say (its stored payment_model is only a placeholder then), so
  // the plans' types are shown, e.g. "Installments". Otherwise the product's
  // own model (one-time, subscription…).
  const planTypes = Array.from(new Set(plans.map((plan) => plan.plan_type)));
  const howPaid = p
    ? planTypes.length > 0
      ? planTypes.map((type) => planFormat.typeLabel(type)).join(' · ')
      : t(`products.payment_model.${p.payment_model}`, p.payment_model)
    : '';
  const statusText = p ? (p.is_active ? t('admin.payments.products.active', 'Active') : t('admin.payments.products.inactive', 'Inactive')) : '';

  const rows: { label: string; value: ReactNode }[] = p
    ? [
        { label: t('admin.payments.products.productType', 'Product Type'), value: typeLabel },
        { label: t('admin.payments.products.paymentModel', 'Payment Model'), value: howPaid },
        ...(plans.length > 0
          ? [
              {
                label: t('admin.payments.paymentPlans', 'Payment Plans'),
                // Each plan the client can choose, and how it charges.
                value: (
                  <ul className="m-0 list-none space-y-1 p-0 text-end">
                    {plans.map((plan) => (
                      <li key={plan.id}>
                        <bdi className="font-semibold">{plan.plan_name}</bdi>
                        <span className="block text-[13px] font-normal text-muted-foreground">{planFormat.details(plan)}</span>
                      </li>
                    ))}
                  </ul>
                ),
              },
            ]
          : []),
        ...(p.program ? [{ label: t('products.type.program', 'Program'), value: p.program.name }] : []),
        ...(p.course ? [{ label: t('products.type.course', 'Course'), value: p.course.title }] : []),
        ...(p.contains_courses && p.contains_courses.length > 0
          ? [{ label: t('products.type.bundle', 'Bundle'), value: `${p.contains_courses.length} ${t('products.courses', 'courses')}` }]
          : []),
        ...(p.session_count ? [{ label: t('products.type.session_pack', 'Personal guidance'), value: `${p.session_count} ${t('products.sessions', 'sessions')}` }] : []),
        ...(p.access_duration ? [{ label: t('admin.products.drawer.access', 'Access'), value: p.access_duration }] : []),
        {
          label: t('products.requires_signature', 'Signature Required'),
          value: p.requires_signature ? t('admin.products.drawer.yes', 'Yes') : t('admin.products.drawer.no', 'No'),
        },
        ...(p.crm_tag_slugs && p.crm_tag_slugs.length > 0
          ? [
              {
                label: t('admin.products.drawer.crmTags', 'CRM tags'),
                value: (
                  <span className="flex flex-wrap justify-end gap-1.5">
                    {p.crm_tag_slugs.map((slug) => (
                      <span key={slug} title={slug} className="rounded-full border border-border px-2 py-0.5 text-xs font-medium">
                        <bdi>{crmTagLabel(slug)}</bdi>
                      </span>
                    ))}
                  </span>
                ),
              },
            ]
          : []),
      ]
    : [];

  const look = p ? productTypeLook(p.type) : null;
  const TypeIcon = look?.icon;

  return (
    <Sheet open={!!p} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={rtl ? 'left' : 'right'}
        dir={direction}
        className="flex w-full flex-col gap-0 border-0 p-0 shadow-2xl outline-none focus:outline-none focus-visible:outline-none dark:[color-scheme:dark] sm:max-w-[480px] [&>[data-default-close]]:hidden"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        {p && look && TypeIcon && (
          <>
            {/* Pinned top: what it is, the name, the three numbers that matter */}
            <header className="shrink-0 border-b border-border bg-primary/[0.04] px-6 pb-5 pt-6">
              <p className="inline-flex items-center gap-2 pe-10 text-[13.5px] font-semibold text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-slate-400'}`} aria-hidden />
                {typeLabel} · {statusText}
              </p>
              <div className="mt-1.5 flex items-center gap-3 pe-10">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${look.tile}`} aria-hidden>
                  <TypeIcon className="h-5 w-5" />
                </span>
                <SheetTitle className="min-w-0 text-[23px] font-extrabold leading-tight tracking-tight [font-family:inherit] [overflow-wrap:anywhere]">
                  <bdi>{p.title}</bdi>
                </SheetTitle>
              </div>
              <SheetDescription className="sr-only">{t('admin.products.drawer.description', 'Product summary')}</SheetDescription>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat
                  label={t('admin.products.list.price', 'Price')}
                  value={p.payment_model === 'free' ? t('products.payment_model.free', 'Free') : money(Number(p.price || 0), p.currency)}
                />
                <Stat label={t('admin.payments.products.paymentModel', 'Payment Model')} value={howPaid} small />
                <Stat
                  label={t('admin.payments.products.status', 'Status')}
                  value={statusText}
                  small
                  className={p.is_active ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-6 py-5">
              <Section title={t('admin.notifications.drawer.details', 'Details')}>
                <dl className="m-0 divide-y divide-border px-3.5 text-sm">
                  {rows.map((row) => (
                    <div key={row.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="m-0 min-w-0 font-medium [overflow-wrap:anywhere]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Section>

              {/* Memberships: the price and scheduled price changes */}
              <SubscriptionPriceSection key={p.id} productId={p.id} />

              {/* The whole description (Show more / Show less), and Edit for the
                  name, picture and description, as in the program and course drawers. */}
              <DrawerQuickEdit
                key={p.id}
                title={t('admin.products.drawer.about', 'Description')}
                nameLabel={t('products.title', 'Product name')}
                name={p.title}
                imageUrl={p.metadata?.image_url}
                html={p.description ?? ''}
                maxImageBytes={20 * 1024 * 1024}
                onSave={saveEdit}
              />
            </div>

            {/* Pinned bottom: the product's own actions */}
            <footer className="grid shrink-0 gap-2 border-t border-border bg-card px-6 py-4">
              <Link
                href={`/admin/payments/products/${p.id}`}
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                {t('admin.products.drawer.edit', 'Edit product')}
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onCopyLink(p)} className={`${footerButton} border-border text-primary hover:bg-muted`}>
                  <Link2 className="h-4 w-4" aria-hidden />
                  {t('admin.products.copyEnrollLink', 'Copy enrollment link')}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(p)}
                  className={`${footerButton} border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  {t('admin.products.wizard.delete', 'Delete')}
                </button>
              </div>
            </footer>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, small, className = '' }: { label: string; value: string; small?: boolean; className?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="truncate text-[12.5px] text-muted-foreground">{label}</div>
      <div className={`truncate font-extrabold tabular-nums ${small ? 'text-base' : 'text-xl'} ${className}`} title={value}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[14px] border border-border">
      <h3 className="bg-primary/[0.06] px-3.5 py-2.5 text-sm font-bold text-primary [font-family:inherit]">{title}</h3>
      {children}
    </section>
  );
}
