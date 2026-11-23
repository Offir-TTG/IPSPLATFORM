'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  CheckCircle2,
  Gift,
  Package,
  PauseCircle,
  RefreshCw,
  Search,
  WifiOff,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LoadingState } from '@/components/admin/LoadingState';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { useHelp } from '@/hooks/useHelp';
import type { PaymentModel, Product, ProductType } from '@/types/product';
import {
  ClearFilters,
  FilterSelect,
  IconButton,
  KpiItem,
  KpiStrip,
  ListCell,
  ListFooter,
  ListPanel,
  ListRow,
  ListRowMain,
  ListSearch,
  ListSkeleton,
  ListState,
  NewButton,
  PageTitle,
  QuickPills,
  StatusDot,
  kitButton,
  usePagedList,
} from '@/components/admin/notifications/kit';
import { ProductDrawer, productTypeLook } from '@/components/admin/products/ProductDrawer';
import { useProductDelete } from '@/components/admin/products/useProductDelete';
import { productPublicPath } from '@/components/admin/products/ProductWizardPage';

const TYPES: ProductType[] = ['program', 'course', 'bundle', 'session_pack', 'lecture', 'workshop'];
const MODELS: PaymentModel[] = ['one_time', 'deposit_then_plan', 'subscription', 'per_session', 'free'];
type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Billable products, in the admin list template: the numbers strip (each
 * number filters the list), then one card with search, type and payment
 * model, status pills, the products and paging. A row opens a short summary
 * in a drawer; editing and creating happen on the wizard page. Search, the
 * three filters, copy link and delete all work as before.
 */
export default function ProductsPage() {
  useHelp('payments-products');
  const { t, direction, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const rtl = direction === 'rtl';

  const [products, setProducts] = useState<Product[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all');
  const [modelFilter, setModelFilter] = useState<'all' | PaymentModel>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  // The open product lives in the address (?product=), like the user drawer.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const openId = searchParams.get('product');
  const setOpenId = (id: string | null) => {
    const qs = new URLSearchParams(searchParams.toString());
    if (id) qs.set('product', id);
    else qs.delete('product');
    const query = qs.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const load = async () => {
    setLoading(true);
    try {
      const [productsRes, plansRes] = await Promise.all([fetch('/api/admin/products'), fetch('/api/admin/payments/plans')]);
      if (!productsRes.ok) throw new Error('Failed to fetch products');
      const result = await productsRes.json();
      setProducts((result.success ? result.data : result) || []);
      if (plansRes.ok) setPaymentPlans((await plansRes.json()) || []);
      setLoadError(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoadError(true);
      toast({
        title: t('common.error', 'Error'),
        description: t('admin.payments.products.loadFailed', 'Failed to load products'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { askDelete, dialogs } = useProductDelete({
    onDeleted: (deleted) => {
      if (openId === deleted.id) setOpenId(null);
      void load();
    },
  });

  const copyLink = async (product: Product) => {
    const url = `${window.location.origin}${productPublicPath(product)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('admin.payments.products.linkCopied', 'Link copied'), description: url });
    } catch {
      toast({ title: t('admin.payments.products.linkCopyFailed', 'Failed to copy link'), variant: 'destructive' });
    }
  };

  /** Plan names a product offers, as the old badges showed them. */
  const planNames = (product: Product): string[] => {
    const ids = product.alternative_payment_plan_ids?.length
      ? product.alternative_payment_plan_ids
      : product.default_payment_plan_id
        ? [product.default_payment_plan_id]
        : [];
    return ids.map((id) => paymentPlans.find((plan) => plan.id === id)?.plan_name).filter(Boolean) as string[];
  };

  const counts = useMemo(
    () => ({
      all: products.length,
      active: products.filter((p) => p.is_active).length,
      inactive: products.filter((p) => !p.is_active).length,
      free: products.filter((p) => p.payment_model === 'free').length,
    }),
    [products],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        (typeFilter === 'all' || p.type === typeFilter) &&
        (modelFilter === 'all' || p.payment_model === modelFilter) &&
        (status === 'all' || (status === 'active' ? p.is_active : !p.is_active)) &&
        (!q || p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)),
    );
  }, [products, search, typeFilter, modelFilter, status]);

  const paged = usePagedList(shown, `${search}|${typeFilter}|${modelFilter}|${status}`);
  const openProduct = products.find((p) => p.id === openId) ?? null;
  const filtersOn = !!search || typeFilter !== 'all' || modelFilter !== 'all' || status !== 'all';
  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setModelFilter('all');
    setStatus('all');
  };
  const toggleStatus = (s: StatusFilter) => setStatus((cur) => (cur === s ? 'all' : s));
  const filteredNow = t('admin.list.filteredNow', 'Filtered now');
  const num = (n: number) => n.toLocaleString();
  const money = (amount: number, currency?: string) => {
    try {
      return new Intl.NumberFormat(rtl ? 'he-IL' : 'en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${amount} ${currency ?? ''}`.trim();
    }
  };
  const contentLine = (p: Product) =>
    p.program?.name ||
    p.course?.title ||
    (p.contains_courses?.length ? `${p.contains_courses.length} ${t('products.courses', 'courses')}` : '') ||
    (p.session_count ? `${p.session_count} ${t('products.sessions', 'sessions')}` : '');
  const COLS = 'minmax(0,1fr) 150px 180px 110px';
  const createButton = <NewButton href="/admin/payments/products/new">{t('admin.payments.products.createProduct', 'Create Product')}</NewButton>;

  if (translationsLoading) return <LoadingState variant="page" withLayout={true} />;

  // Loading, nothing yet, no results, or could not load: shown in place of the rows.
  let state: ReactNode = undefined;
  if (!loaded || (loading && products.length === 0)) state = <ListSkeleton />;
  else if (loadError && products.length === 0)
    state = (
      <ListState
        icon={WifiOff}
        tone="red"
        title={t('admin.list.loadError', "We couldn't load the list")}
        text={t('admin.list.loadErrorText', 'The internet connection may have dropped. Nothing was deleted.')}
        action={
          <button type="button" onClick={() => void load()} className={kitButton.primary}>
            {t('admin.list.retry', 'Try again')}
          </button>
        }
      />
    );
  else if (products.length === 0)
    state = (
      <ListState
        icon={Package}
        title={t('admin.payments.products.noProductsCreated', 'No products created')}
        text={t('admin.payments.products.createFirst', 'Create your first product to start accepting payments')}
        action={createButton}
      />
    );
  else if (shown.length === 0)
    state = (
      <ListState
        icon={Search}
        tone="grey"
        title={t('admin.payments.products.noProductsFound', 'No products found')}
        text={t('admin.list.noMatchText', 'Clear the search and filters to see the whole list.')}
        action={
          <button type="button" onClick={clearFilters} className={kitButton.secondary}>
            {t('admin.users.filters.clear', 'Clear Filters')}
          </button>
        }
      />
    );

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-5 p-4 md:p-6" dir={direction}>
        <PageTitle
          icon={Package}
          title={t('admin.payments.products.title', 'Products')}
          badge={loaded ? num(counts.all) : undefined}
          description={t('admin.payments.products.description', 'Manage billable products and their pricing')}
          actions={createButton}
        />

        <KpiStrip label={t('admin.list.numbers', 'Numbers')}>
          <KpiItem
            icon={<Package />}
            label={t('admin.products.list.kpiAll', 'All products')}
            value={loaded ? num(counts.all) : '—'}
            onClick={() => {
              setStatus('all');
              setModelFilter('all');
            }}
          />
          <KpiItem
            icon={<CheckCircle2 />}
            tone="green"
            label={t('admin.payments.products.active', 'Active')}
            value={loaded ? num(counts.active) : '—'}
            onClick={() => toggleStatus('active')}
            active={status === 'active'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<PauseCircle />}
            tone="grey"
            label={t('admin.payments.products.inactive', 'Inactive')}
            value={loaded ? num(counts.inactive) : '—'}
            onClick={() => toggleStatus('inactive')}
            active={status === 'inactive'}
            activeNote={filteredNow}
          />
          <KpiItem
            icon={<Gift />}
            tone="blue"
            label={t('products.payment_model.free', 'Free')}
            value={loaded ? num(counts.free) : '—'}
            onClick={() => setModelFilter((cur) => (cur === 'free' ? 'all' : 'free'))}
            active={modelFilter === 'free'}
            activeNote={filteredNow}
          />
        </KpiStrip>

        <ListPanel
          label={t('admin.payments.products.title', 'Products')}
          toolbar={
            <>
              <ListSearch
                value={search}
                onChange={setSearch}
                placeholder={t('admin.payments.products.searchPlaceholder', 'Search products...')}
                clearLabel={t('admin.users.list.clearSearch', 'Clear search')}
              />
              <FilterSelect<'all' | ProductType>
                label={t('admin.payments.products.productType', 'Product Type')}
                value={typeFilter}
                onChange={setTypeFilter}
                dir={direction}
                options={[
                  { value: 'all', label: t('admin.payments.products.allTypes', 'All Types') },
                  ...TYPES.map((type) => ({ value: type, label: t(`products.type.${type}`, type) })),
                ]}
              />
              <FilterSelect<'all' | PaymentModel>
                label={t('admin.payments.products.paymentModel', 'Payment Model')}
                value={modelFilter}
                onChange={setModelFilter}
                dir={direction}
                options={[
                  { value: 'all', label: t('admin.payments.products.allModels', 'All Models') },
                  ...MODELS.map((model) => ({ value: model, label: t(`products.payment_model.${model}`, model) })),
                ]}
              />
              <IconButton label={t('common.refresh', 'Refresh')} onClick={() => void load()} disabled={loading}>
                <RefreshCw className={`h-[18px] w-[18px] ${loading ? 'animate-spin' : ''}`} aria-hidden />
              </IconButton>
            </>
          }
          pills={
            <>
              <QuickPills<StatusFilter>
                label={t('admin.payments.products.status', 'Status')}
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: t('admin.payments.products.all', 'All'), count: counts.all },
                  {
                    value: 'active',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                        {t('admin.payments.products.active', 'Active')}
                      </span>
                    ),
                    count: counts.active,
                  },
                  {
                    value: 'inactive',
                    label: (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-slate-400" aria-hidden />
                        {t('admin.payments.products.inactive', 'Inactive')}
                      </span>
                    ),
                    count: counts.inactive,
                  },
                ]}
              />
              <span className="shrink-0">
                <ClearFilters show={filtersOn} label={t('admin.users.filters.clear', 'Clear Filters')} onClear={clearFilters} />
              </span>
            </>
          }
          columns={COLS}
          head={[
            t('admin.products.list.product', 'Product'),
            t('admin.payments.products.productType', 'Product Type'),
            t('admin.products.list.price', 'Price'),
            t('admin.payments.products.status', 'Status'),
          ]}
          state={state}
          footer={
            loaded && shown.length > 0 ? (
              <ListFooter
                showingText={t('admin.users.list.showingRange', 'Showing {from}–{to} of {total}')
                  .replace('{from}', num(paged.start + 1))
                  .replace('{to}', num(paged.start + paged.pageItems.length))
                  .replace('{total}', num(shown.length))}
                pageText={t('admin.users.list.pageOf', 'Page {page} of {pages}')
                  .replace('{page}', String(paged.page))
                  .replace('{pages}', String(paged.totalPages))}
                page={paged.page}
                totalPages={paged.totalPages}
                onPage={paged.setPage}
                prevLabel={t('admin.users.list.prevPage', 'Previous page')}
                nextLabel={t('admin.users.list.nextPage', 'Next page')}
                rtl={rtl}
              />
            ) : undefined
          }
        >
          {paged.pageItems.map((p) => {
            const plans = planNames(p);
            const look = productTypeLook(p.type);
            const Icon = look.icon;
            return (
              <ListRow key={p.id} columns={COLS} onOpen={() => setOpenId(p.id)} label={p.title} selected={openId === p.id} rtl={rtl}>
                <ListRowMain
                  lead={
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${look.tile}`}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                  }
                  title={<bdi className="font-semibold">{p.title}</bdi>}
                  sub={contentLine(p) || undefined}
                />
                <ListCell label={t('admin.payments.products.productType', 'Product Type')}>{t(`products.type.${p.type}`, p.type)}</ListCell>
                <ListCell label={t('admin.products.list.price', 'Price')}>
                  <span className="block font-semibold tabular-nums">
                    {p.payment_model === 'free' ? t('products.payment_model.free', 'Free') : money(Number(p.price || 0), p.currency)}
                  </span>
                  {p.payment_model !== 'free' && (
                    <span className="block text-[13px] text-muted-foreground">
                      {plans.length > 0 ? plans.join(' · ') : t(`products.payment_model.${p.payment_model}`, p.payment_model)}
                    </span>
                  )}
                </ListCell>
                <ListCell label={t('admin.payments.products.status', 'Status')}>
                  <StatusDot tone={p.is_active ? 'green' : 'grey'}>
                    {p.is_active ? t('admin.payments.products.active', 'Active') : t('admin.payments.products.inactive', 'Inactive')}
                  </StatusDot>
                </ListCell>
              </ListRow>
            );
          })}
        </ListPanel>
      </div>

      <ProductDrawer
        product={openProduct}
        planNames={openProduct ? planNames(openProduct) : []}
        onClose={() => setOpenId(null)}
        onCopyLink={copyLink}
        onDelete={askDelete}
      />
      {dialogs}
    </AdminLayout>
  );
}
