import { redirect } from 'next/navigation';

/**
 * Old product address. A product link now opens the enrollment directly
 * (see /enroll/product/[id]), so links already shared keep working and skip
 * the product page.
 */
export default function OldProductLink({ params }: { params: { id: string } }) {
  redirect(`/enroll/product/${encodeURIComponent(params.id)}`);
}
