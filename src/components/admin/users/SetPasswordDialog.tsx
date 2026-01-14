'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface User {
  user_id: string;
  users: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function SetPasswordDialog({
  open,
  onOpenChange,
  user,
}: SetPasswordDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSetPassword = async () => {
    if (!user) return;

    // Validation
    if (password.length < 8) {
      setPasswordError(t('admin.users.setPassword.minLength', 'Password must be at least 8 characters long'));
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError(t('admin.users.setPassword.mismatch', 'Passwords do not match'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/tenant/users/${user.user_id}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        // Show toast success message
        toast.success(t('admin.users.setPassword.successMessage', 'Password set successfully for {name}').replace('{name}', userName));

        // Close dialog immediately
        setPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        onOpenChange(false);
      } else {
        // Show error inline, not as toast
        setPasswordError(result.error || t('admin.users.setPassword.errorMessage', 'Failed to set password'));
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setPasswordError(t('admin.users.setPassword.errorMessage', 'Failed to set password'));
    } finally {
      setSaving(false);
    }
  };

  const userName = `${user?.users.first_name} ${user?.users.last_name}`;

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !showSuccess) {
      // Reset form when closing (but not during success animation)
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent dir={direction} className="sm:max-w-md">
        {showSuccess ? (
          // Success confirmation screen
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 mb-6 animate-in zoom-in duration-500">
              <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" strokeWidth={2.5} />
            </div>
            <AlertDialogHeader className="space-y-3">
              <AlertDialogTitle className="text-2xl font-bold text-green-600 dark:text-green-400 text-center">
                {t('admin.users.setPassword.successTitle', 'Password Updated')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-base">
                {t('admin.users.setPassword.successMessage', 'Password set successfully for {name}').replace('{name}', userName)}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
        ) : (
          <>
            <AlertDialogHeader className={isRtl ? 'text-right' : 'text-left'}>
              <AlertDialogTitle>
                {t('admin.users.setPassword.title', 'Set Password for {name}').replace('{name}', userName)}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('admin.users.setPassword.description', 'Manually set a new password for')}{' '}
                <strong>{user?.users.email}</strong>.
                <br />
                <br />
                {t('admin.users.setPassword.warning', 'The user will be able to login with this new password immediately. Make sure to communicate the password securely.')}
              </AlertDialogDescription>
            </AlertDialogHeader>

        {/* Password Inputs */}
        <div className="space-y-4 py-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className={isRtl ? 'text-right block' : ''}>
              {t('admin.users.setPassword.newPassword', 'New Password')} *
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder={t('admin.users.setPassword.passwordPlaceholder', 'Enter new password (min 8 characters)')}
                className={password && password.length > 0 && password.length < 8 ? 'border-destructive pr-10' : 'pr-10'}
                dir="ltr"
                disabled={saving}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={saving}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {/* Real-time validation: show error if password is too short */}
            {password && password.length > 0 && password.length < 8 && (
              <p className="text-xs text-destructive mt-1.5">
                {t('admin.users.setPassword.minLength', 'Password must be at least 8 characters long')}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={isRtl ? 'text-right block' : ''}>
              {t('admin.users.setPassword.confirmPassword', 'Confirm Password')} *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder={t('admin.users.setPassword.confirmPlaceholder', 'Re-enter password')}
                className={confirmPassword && password !== confirmPassword ? 'border-destructive pr-10' : 'pr-10'}
                dir="ltr"
                disabled={saving}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={saving}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            {/* Real-time validation: show error if passwords don't match */}
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive mt-1.5">
                {t('admin.users.setPassword.mismatch', 'Passwords do not match')}
              </p>
            )}
          </div>

          {/* API Error Message */}
          {passwordError && !password && !confirmPassword && (
            <div className="text-sm text-destructive">
              {passwordError}
            </div>
          )}
        </div>

        <AlertDialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
          <AlertDialogCancel disabled={saving}>
            {t('admin.users.setPassword.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSetPassword}
            disabled={saving || !password || !confirmPassword || password.length < 8 || password !== confirmPassword}
          >
            {saving && <Loader2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} animate-spin`} />}
            {t('admin.users.setPassword.confirm', 'Set Password')}
          </AlertDialogAction>
        </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
