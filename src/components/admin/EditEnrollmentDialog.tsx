'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';

interface Enrollment {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  product_id: string;
  product_name: string;
  payment_plan_id: string;
  status: string;
  expires_at?: string | null;
}

interface EditEnrollmentDialogProps {
  open: boolean;
  enrollment: Enrollment | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditEnrollmentDialog({
  open,
  enrollment,
  onClose,
  onSuccess,
}: EditEnrollmentDialogProps) {
  const { t, direction } = useAdminLanguage();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (open && enrollment) {
      setSelectedProduct(enrollment.product_id);
      // Load existing expires_at value if it exists, otherwise empty string
      if (enrollment.expires_at) {
        // Convert ISO timestamp to date input format (YYYY-MM-DD)
        const date = new Date(enrollment.expires_at);
        const dateStr = date.toISOString().split('T')[0];
        setExpiryDate(dateStr);
      } else {
        setExpiryDate('');
      }
      fetchProducts();
    }
  }, [open, enrollment]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products?is_active=true');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollment || !selectedProduct || selectedProduct.startsWith('__no_')) {
      toast.error(t('admin.enrollments.edit.validationError', 'Please select a product'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        product_id: selectedProduct,
        expires_at: expiryDate || null
      };

      const response = await fetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update enrollment');
      }

      toast.success(t('admin.enrollments.edit.success', 'Enrollment updated successfully'));
      onSuccess();
    } catch (error: any) {
      console.error('Error updating enrollment:', error);
      toast.error(error.message || t('admin.enrollments.edit.error', 'Failed to update enrollment'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to format product type
  const formatProductType = (type: string): string => {
    if (!type) return '';
    const typeKey = `admin.enrollments.productType.${type.toLowerCase()}`;
    return t(typeKey, type);
  };

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction} className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t('admin.enrollments.edit.title', 'Edit Enrollment')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t('admin.enrollments.edit.description', 'Update enrollment details (only available for draft enrollments)')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4">
          {/* User Info (Read-only) */}
          <div>
            <Label>{t('admin.enrollments.edit.user', 'User')}</Label>
            <div className="mt-1 p-2 bg-muted rounded text-sm">
              {enrollment.user_name} ({enrollment.user_email})
            </div>
          </div>

          {/* Select Product */}
          <div>
            <Label>{t('admin.enrollments.edit.selectProduct', 'Select Product')} *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct} required dir={direction}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.enrollments.edit.selectProductPlaceholder', 'Choose a product...')} />
              </SelectTrigger>
              <SelectContent dir={direction}>
                {Array.isArray(products) && products.length > 0 ? (
                  products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title} ({formatProductType(product.type)})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no_products__" disabled>
                    {t('admin.enrollments.edit.noProducts', 'No products found')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date */}
          <div>
            <Label>{t('admin.enrollments.edit.expiryDate', 'Expiry Date (Optional)')}</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? t('common.loading', 'Updating...') : t('admin.enrollments.edit.submit', 'Update Enrollment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
