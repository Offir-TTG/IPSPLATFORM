'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Info, X, XCircle } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { useToast } from '@/components/ui/use-toast';
import type { Product } from '@/types/product';

/**
 * Deleting a product, as before: a confirmation, then the delete. When the
 * product still has enrollments it can't be deleted, and a second dialog
 * lists them. Used by the Products list drawer and the product wizard.
 */
export function useProductDelete({ onDeleted }: { onDeleted?: (product: Product) => void } = {}) {
  const { t, direction, language } = useAdminLanguage();
  const { toast } = useToast();
  const isRtl = direction === 'rtl';
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCannotDeleteDialog, setShowCannotDeleteDialog] = useState(false);
  const [deleteDependencies, setDeleteDependencies] = useState<{ enrollments: any[] }>({ enrollments: [] });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const askDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  // Handle delete product - called from confirmation dialog
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/products/${selectedProduct.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorJson: any = null;

        try {
          errorJson = JSON.parse(errorText);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }

        // Check if error contains dependency information
        console.log('Error response:', errorJson);
        if (errorJson?.dependencies?.enrollments?.length > 0) {
          console.log('Has dependencies, showing cannot delete dialog');
          setDeleteDependencies(errorJson.dependencies);
          setShowDeleteDialog(false);
          setShowCannotDeleteDialog(true);
          return;
        }
        console.log('No dependencies found in error response');

        // Show error toast for other errors
        const errorMessage = errorJson
          ? (language === 'he' && errorJson.error_he ? errorJson.error_he : errorJson.error)
          : t('admin.payments.products.deleteFailed', 'Failed to delete product');

        toast({
          title: t('common.error', 'Error'),
          description: errorMessage || t('admin.payments.products.deleteFailed', 'Failed to delete product'),
          variant: 'destructive',
        });
        return;
      }

      const result = await response.json();
      if (result.success) {
        toast({
          title: t('common.success', 'Success'),
          description: t('admin.payments.products.deleteSuccess', 'Product deleted successfully'),
        });
        setShowDeleteDialog(false);
        setSelectedProduct(null);
        onDeleted?.(selectedProduct);
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('admin.payments.products.deleteFailed', 'Failed to delete product'),
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const dialogs = (
    <>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        if (!open && !deleteLoading) {
          setShowDeleteDialog(false);
          setSelectedProduct(null);
        }
      }}>
        <AlertDialogContent
          className="max-w-[90vw] sm:max-w-[500px]"
          style={{ direction }}
          dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle className={isRtl ? 'text-right' : 'text-left'}>
              <span suppressHydrationWarning>
                {language === 'he' ? 'מחיקת מוצר' : 'Delete Product'}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className={isRtl ? 'text-right' : 'text-left'}>
              <span suppressHydrationWarning>
                {language === 'he'
                  ? `האם אתה בטוח שברצונך למחוק את "${selectedProduct?.title}"? פעולה זו אינה ניתנת לביטול.`
                  : `Are you sure you want to delete "${selectedProduct?.title}"? This action cannot be undone.`
                }
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedProduct(null);
              }}
              disabled={deleteLoading}
              className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <X className="h-4 w-4" />
              <span suppressHydrationWarning>
                {language === 'he' ? 'ביטול' : 'Cancel'}
              </span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deleteLoading}
              className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              {deleteLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span suppressHydrationWarning>
                    {language === 'he' ? 'מוחק...' : 'Deleting...'}
                  </span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span suppressHydrationWarning>
                    {language === 'he' ? 'מחק' : 'Delete'}
                  </span>
                </>
              )}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cannot Delete Dialog */}
      <AlertDialog open={showCannotDeleteDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCannotDeleteDialog(false);
          setDeleteDependencies({ enrollments: [] });
          setSelectedProduct(null);
        }
      }}>
        <AlertDialogContent
          className="max-w-[90vw] sm:max-w-[600px]"
          style={{ direction }}
          dir={direction}>
          <AlertDialogHeader>
            <AlertDialogTitle className={`${isRtl ? 'text-right' : 'text-left'} text-destructive`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <XCircle className="h-5 w-5" />
                <span suppressHydrationWarning>
                  {language === 'he' ? 'לא ניתן למחוק מוצר' : 'Cannot Delete Product'}
                </span>
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className={`${isRtl ? 'text-right' : 'text-left'} space-y-4`}>
                <p suppressHydrationWarning className="font-medium text-foreground">
                  {language === 'he'
                    ? `לא ניתן למחוק את "${selectedProduct?.title}" מכיוון שיש לו ${deleteDependencies.enrollments.length} רשומות רישום:`
                    : `Cannot delete "${selectedProduct?.title}" because it has ${deleteDependencies.enrollments.length} enrollment record(s):`
                  }
                </p>

                {deleteDependencies.enrollments.length > 0 && (
                  <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="font-semibold" suppressHydrationWarning>
                      {language === 'he' ? 'רשומות רישום (כולל מבוטלים):' : 'Enrollment Records (including cancelled):'}
                    </p>
                    <ul className={`list-disc space-y-1 ${isRtl ? 'pr-6 mr-0' : 'pl-6 ml-0'}`} dir={direction}>
                      {deleteDependencies.enrollments.map((enrollment: any) => (
                        <li key={enrollment.id} className="text-sm">
                          {enrollment.user
                            ? `${enrollment.user.first_name || ''} ${enrollment.user.last_name || ''} (${enrollment.user.email})`.trim()
                            : t('common.unknown', 'Unknown User')}
                          {enrollment.status && (
                            <Badge
                              variant={enrollment.status === 'cancelled' || enrollment.status === 'completed' ? 'secondary' : 'default'}
                              className={`${isRtl ? 'mr-2' : 'ml-2'}`}
                            >
                              {enrollment.status}
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                  {language === 'he'
                    ? 'רשומות אלה (כולל מבוטלות והושלמו) חייבות להימחק לצמיתות מהמערכת לפני מחיקת המוצר. פנה למנהל המערכת או מחק אותן ידנית מטבלת ה-enrollments.'
                    : 'These records (including cancelled and completed) must be permanently deleted from the system before the product can be deleted. Contact the system administrator or delete them manually from the enrollments table.'
                  }
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className={`flex gap-3 mt-6 pt-6 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Button
              variant="default"
              onClick={() => {
                setShowCannotDeleteDialog(false);
                setDeleteDependencies({ enrollments: [] });
                setSelectedProduct(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <Info className="h-4 w-4" />
              <span suppressHydrationWarning>
                {language === 'he' ? 'הבנתי' : 'OK'}
              </span>
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return { askDelete, dialogs };
}
