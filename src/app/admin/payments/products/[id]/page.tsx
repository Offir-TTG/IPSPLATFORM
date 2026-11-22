'use client';

export const dynamic = 'force-dynamic';

import { useParams } from 'next/navigation';
import { ProductWizardPage } from '@/components/admin/products/ProductWizardPage';

/** One product, edited step by step (it used to be a dialog on the list). */
export default function EditProductPage() {
  const params = useParams();
  return <ProductWizardPage productId={params.id as string} />;
}
