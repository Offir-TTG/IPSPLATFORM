'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Link2, Loader2, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LoadingState } from '@/components/admin/LoadingState';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import { useHelp } from '@/hooks/useHelp';
import { kitButton } from '@/components/admin/notifications/kit';
import type { Product, ProductFormData } from '@/types/product';
import { ProductWizard } from '@/components/admin/products/ProductWizard';
import { useProductDelete } from '@/components/admin/products/useProductDelete';

/** Public address of a product, as the list's copy-link button always built it. */
export function productPublicPath(product: Pick<Product, 'id' | 'type'>) {
  return product.type === 'program' ? `/program/${product.id}` : `/course/${product.id}`;
}

/**
 * The page around the product wizard: back to the list, the product's name,
 * and Copy link and Delete at the top (Delete stays visible, as in the
 * other wizards). Without an id it creates a new product.
 */
export function ProductWizardPage({ productId }: { productId?: string }) {
  useHelp('payments-products');
  const { t, direction, loading: translationsLoading } = useAdminLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const rtl = direction === 'rtl';
  const BackArrow = rtl ? ArrowRight : ArrowLeft;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(!!productId);
  const [notFound, setNotFound] = useState(false);

  const { askDelete, dialogs } = useProductDelete({ onDeleted: () => router.push('/admin/payments/products') });

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/products/${productId}`);
        if (!res.ok) throw new Error('not found');
        const data = (await res.json()) as Product;
        if (!cancelled) setProduct(data);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const save = async (data: ProductFormData): Promise<boolean> => {
    // A future membership price chosen in the wizard is scheduled after the product exists.
    const { __future_price: futurePrice, ...productData } = data as ProductFormData & { __future_price?: Record<string, unknown> };
    try {
      const response = await fetch(productId ? `/api/admin/products/${productId}` : '/api/admin/products', {
        method: productId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || t('admin.payments.products.saveFailed', 'Failed to save product'));
      }
      const result = await response.json();
      toast({
        title: t('common.success', 'Success'),
        description: productId
          ? t('admin.payments.products.updateSuccess', 'Product updated successfully')
          : t('admin.payments.products.createSuccess', 'Product created successfully'),
      });
      if (!productId) {
        const created = (result.success ? result.data : result) as Product | undefined;
        if (created?.id && futurePrice) {
          const scheduled = await fetch(`/api/admin/products/${created.id}/price-changes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(futurePrice),
          })
            .then((r) => r.ok)
            .catch(() => false);
          if (!scheduled) {
            toast({
              title: t('common.error', 'Error'),
              description: t('admin.priceChange.futureNotScheduled', 'The product was created, but the future price was not scheduled. Add it from the product with "Change price".'),
              variant: 'destructive',
            });
          }
        }
        router.replace(created?.id ? `/admin/payments/products/${created.id}` : '/admin/payments/products');
      }
      return true;
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.products.saveFailed', 'Failed to save product'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const copyLink = async () => {
    if (!product) return;
    const url = `${window.location.origin}${productPublicPath(product)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: t('admin.payments.products.linkCopied', 'Link copied'), description: url });
    } catch {
      toast({ title: t('admin.payments.products.linkCopyFailed', 'Failed to copy link'), variant: 'destructive' });
    }
  };

  if (translationsLoading) return <LoadingState variant="page" withLayout={true} />;

  const heading = productId
    ? product?.title || t('admin.payments.products.form.editTitle', 'Edit Product')
    : t('admin.payments.products.form.createTitle', 'Create Product');

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-4 p-4 md:p-6" dir={direction}>
        <Link href="/admin/payments/products" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <BackArrow className="h-4 w-4" aria-hidden />
          {t('admin.products.wizard.backToList', 'Back to products')}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
              <bdi>{heading}</bdi>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {productId
                ? t('admin.payments.products.form.editDescription', 'Update product details and pricing')
                : t('admin.payments.products.form.createDescription', 'Create a new billable product in the system')}
            </p>
          </div>
          {product && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className={kitButton.secondary}>
                <Link2 className="h-4 w-4" aria-hidden />
                {t('admin.payments.products.copyLink', 'Copy product link')}
              </button>
              <button
                type="button"
                onClick={() => askDelete(product)}
                className="inline-flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-lg border border-red-200 bg-card px-4 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                {t('admin.products.wizard.delete', 'Delete')}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : notFound ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            {t('admin.products.wizard.notFound', 'This product was not found. It may have been deleted.')}
          </p>
        ) : (
          <ProductWizard product={product} onSave={save} t={t} />
        )}
      </div>
      {dialogs}
    </AdminLayout>
  );
}
