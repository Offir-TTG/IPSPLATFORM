'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';

interface CreateEnrollmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateEnrollmentDialog({
  open,
  onClose,
  onSuccess,
}: CreateEnrollmentDialogProps) {
  const { t, direction } = useAdminLanguage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [waivePayment, setWaivePayment] = useState(false);
  const [isParent, setIsParent] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');
  const [paymentStartDate, setPaymentStartDate] = useState('');

  // New user creation fields
  const [createNewUser, setCreateNewUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');

  // Email validation
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset all form fields first
      setSelectedUser('');
      setSelectedProduct('');
      setWaivePayment(false);
      setIsParent(false);
      setPaymentStartDate('');
      setCreateNewUser(false);
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserPhone('');
      setEmailExists(false);
      setCheckingEmail(false);

      // Then fetch data and set defaults
      fetchUsers();
      fetchProducts();

      // Set default expiry date to today + 7 days
      const defaultExpiryDate = new Date();
      defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 7);
      const formattedDate = defaultExpiryDate.toISOString().split('T')[0];
      setExpiryDate(formattedDate);
    }
  }, [open]);

  // Check if email exists when user types
  useEffect(() => {
    const checkEmail = async () => {
      if (!createNewUser || !newUserEmail || newUserEmail.length < 3) {
        setEmailExists(false);
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserEmail)) {
        setEmailExists(false);
        return;
      }

      setCheckingEmail(true);
      try {
        // Add timestamp to prevent any caching
        const timestamp = Date.now();
        const response = await fetch(`/api/admin/users?email=${encodeURIComponent(newUserEmail)}&_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Email check response for', newUserEmail, ':', data);
          // Check if any users were returned
          const usersList = Array.isArray(data) ? data : (data.users || data.data || []);
          setEmailExists(usersList.length > 0);
        }
      } catch (error) {
        console.error('Error checking email:', error);
      } finally {
        setCheckingEmail(false);
      }
    };

    // Debounce the email check
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [newUserEmail, createNewUser]);

  // Update payment_start_date when product is selected
  useEffect(() => {
    if (selectedProduct && !selectedProduct.startsWith('__no_')) {
      const product = products.find(p => p.id === selectedProduct);
      if (product?.payment_start_date) {
        // Convert ISO 8601 to YYYY-MM-DD for date input
        const dateOnly = product.payment_start_date.split('T')[0];
        setPaymentStartDate(dateOnly);
      } else {
        setPaymentStartDate('');
      }
    }
  }, [selectedProduct, products]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=student');
      if (response.ok) {
        const data = await response.json();
        // API returns array directly
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else if (data && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          console.log('Unexpected users response format:', data);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products?is_active=true');
      if (response.ok) {
        const data = await response.json();
        // API returns { success: true, data: products }
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        } else if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          console.log('Unexpected products response format:', data);
          setProducts([]);
        }
      } else {
        console.error('Failed to fetch products:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  // Helper to format product type
  const formatProductType = (type: string): string => {
    if (!type) return '';
    const typeKey = `productType.${type.toLowerCase()}`;
    return t(typeKey, type);
  };

  // Helper to get translated product title
  const getProductTitle = (product: any): string => {
    if (!product) return '';

    // Check if product has translated titles in metadata
    const currentLang = direction === 'rtl' ? 'he' : 'en';
    const translatedTitle = product.metadata?.[`title_${currentLang}`];

    if (translatedTitle) {
      return translatedTitle;
    }

    // Fall back to default title
    return product.title || '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on mode
    if (createNewUser) {
      // Validate new user fields
      if (!newUserEmail || !newUserFirstName || !newUserLastName) {
        toast.error(t('admin.enrollments.create.newUserValidation', 'Please fill in all required user fields'));
        return;
      }
      // Check if email already exists
      if (emailExists) {
        toast.error(t('admin.enrollments.create.emailExists', 'A user with this email already exists. Please use the "Select User" option instead.'));
        return;
      }
      if (!selectedProduct || selectedProduct.startsWith('__no_')) {
        toast.error(t('admin.enrollments.create.selectProductError', 'Please select a product'));
        return;
      }
    } else {
      // Validate existing user selection
      if (!selectedUser || selectedUser.startsWith('__no_') ||
          !selectedProduct || selectedProduct.startsWith('__no_')) {
        toast.error(t('admin.enrollments.create.validationError', 'Please select both user and product'));
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        product_id: selectedProduct,
        status: 'draft', // Always start as draft, will change to pending when email is sent
        expires_at: expiryDate || null,
        waive_payment: waivePayment, // Admin override to waive payment requirement
        is_parent: isParent, // Indicates if this is a parent enrollment (no dashboard access)
        payment_start_date: paymentStartDate || null // Admin override for payment schedule start date
      };

      // Add user info based on mode
      if (createNewUser) {
        payload.create_new_user = true;
        payload.new_user = {
          email: newUserEmail,
          first_name: newUserFirstName,
          last_name: newUserLastName,
          phone: newUserPhone || null
        };
      } else {
        payload.user_id = selectedUser;
      }

      const response = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create enrollment');
      }

      toast.success(t('admin.enrollments.create.success', 'Enrollment created successfully'));

      // Close dialog and trigger success callback (form will be reset by useEffect)
      onSuccess();
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      toast.error(error.message || t('admin.enrollments.create.error', 'Failed to create enrollment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent dir={direction} className="max-w-2xl max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">{t('admin.enrollments.create.title', 'Create Manual Enrollment')}</DialogTitle>
          <DialogDescription className="text-sm">
            {t('admin.enrollments.create.description', 'Manually enroll a user in a product')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-4">
          {/* Toggle: Existing User vs New User */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <input
              type="checkbox"
              id="createNewUser"
              checked={createNewUser}
              onChange={(e) => {
                setCreateNewUser(e.target.checked);
                // Reset email validation when toggling
                setEmailExists(false);
                setCheckingEmail(false);
              }}
              className="h-4 w-4"
            />
            <Label htmlFor="createNewUser" className="text-sm font-medium cursor-pointer">
              {t('admin.enrollments.create.createNewUser', 'Create new user (not yet registered)')}
            </Label>
          </div>

          {/* Existing User Selection */}
          {!createNewUser && (
            <div>
              <Label>{t('admin.enrollments.create.user', 'Select User')} *</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser} required={!createNewUser}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.enrollments.create.selectUser', 'Choose a user...')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(users) && users.length > 0 ? (
                    users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no_users__" disabled>
                      {t('admin.enrollments.create.noUsers', 'No users found')}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* New User Creation Fields */}
          {createNewUser && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                {t('admin.enrollments.create.newUserSection', 'New User Details')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t('admin.enrollments.create.firstName', 'First Name')} *</Label>
                  <Input
                    type="text"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    required={createNewUser}
                    placeholder={t('admin.enrollments.create.firstNamePlaceholder', 'John')}
                  />
                </div>

                <div>
                  <Label>{t('admin.enrollments.create.lastName', 'Last Name')} *</Label>
                  <Input
                    type="text"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    required={createNewUser}
                    placeholder={t('admin.enrollments.create.lastNamePlaceholder', 'Doe')}
                  />
                </div>
              </div>

              <div>
                <Label>{t('admin.enrollments.create.email', 'Email Address')} *</Label>
                <Input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required={createNewUser}
                  placeholder={t('admin.enrollments.create.emailPlaceholder', 'john.doe@example.com')}
                  className={emailExists ? 'border-red-500 focus:border-red-500' : ''}
                />
                {checkingEmail && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('admin.enrollments.create.checkingEmail', 'Checking email...')}
                  </p>
                )}
                {emailExists && !checkingEmail && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    ⚠️ {t('admin.enrollments.create.emailExistsWarning', 'This email is already registered. Please select the existing user from the dropdown instead.')}
                  </p>
                )}
                {newUserEmail && !emailExists && !checkingEmail && newUserEmail.length > 5 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    ✓ {t('admin.enrollments.create.emailAvailable', 'Email is available')}
                  </p>
                )}
              </div>

              <div>
                <Label>{t('admin.enrollments.create.phone', 'Phone Number (Optional)')}</Label>
                <Input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder={t('admin.enrollments.create.phonePlaceholder', '+1234567890')}
                />
              </div>

              <p className="text-xs text-blue-700 dark:text-blue-300">
                {t('admin.enrollments.create.newUserNote', 'A new user account will be created with these details. The user will receive an invitation email to complete registration.')}
              </p>
            </div>
          )}

          {/* Select Product */}
          <div>
            <Label>{t('admin.enrollments.create.selectProduct', 'Select Product')} *</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct} required dir={direction}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.enrollments.create.selectProductPlaceholder', 'Choose a product...')} />
              </SelectTrigger>
              <SelectContent dir={direction}>
                {Array.isArray(products) && products.length > 0 ? (
                  products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {getProductTitle(product)} ({formatProductType(product.type)})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="__no_products__" disabled>
                    {t('admin.enrollments.create.noProducts', 'No products found')}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.enrollments.create.productHelp', 'Products contain all program/course information including pricing and payment plans')}
            </p>
          </div>

          {/* Parent Enrollment Checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
            <input
              type="checkbox"
              id="isParent"
              checked={isParent}
              onChange={(e) => setIsParent(e.target.checked)}
              className="h-4 w-4 mt-0.5 flex-shrink-0"
            />
            <div className="flex-1">
              <Label htmlFor="isParent" className="text-sm font-medium cursor-pointer">
                {t('admin.enrollments.create.isParent', 'Parent Enrollment')} *
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t(
                  'admin.enrollments.create.isParentHelp',
                  'Check this if enrollment is for a parent (no dashboard access). User will only get dashboard access when they have at least one non-parent enrollment.'
                )}
              </p>
            </div>
          </div>

          {/* Payment Start Date Override */}
          <div>
            <Label htmlFor="paymentStartDate">
              {t('admin.enrollments.create.paymentStartDate', 'Payment Start Date (Optional Override)')}
            </Label>
            <Input
              type="date"
              id="paymentStartDate"
              value={paymentStartDate}
              onChange={(e) => setPaymentStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t(
                'admin.enrollments.create.paymentStartDateHelp',
                paymentStartDate
                  ? 'Override payment schedule start date for this enrollment. Default from product will be used if not specified.'
                  : 'Default from product will be used. Set a different date if this student needs a custom payment schedule.'
              )}
            </p>
          </div>

          {/* Waive Payment */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="waivePayment"
              checked={waivePayment}
              onChange={(e) => setWaivePayment(e.target.checked)}
              className="mt-1"
            />
            <Label htmlFor="waivePayment" className="text-sm">
              {t('admin.enrollments.create.waivePayment', 'Waive payment requirement (scholarship, staff, or free enrollment)')}
            </Label>
          </div>

          {/* Expiry Date */}
          <div>
            <Label>{t('admin.enrollments.create.expiryDate', 'Expiry Date (Optional)')}</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <Alert>
            <AlertDescription>
              {t('admin.enrollments.create.alert', 'This enrollment will be marked as admin-assigned and will bypass the normal purchase flow.')}
            </AlertDescription>
          </Alert>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="w-full sm:w-auto">
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? t('common.loading', 'Creating...') : t('admin.enrollments.create.submit', 'Create Enrollment')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
