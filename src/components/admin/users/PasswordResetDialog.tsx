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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface User {
  user_id: string;
  users: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface PasswordResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

export function PasswordResetDialog({
  open,
  onOpenChange,
  user,
}: PasswordResetDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [sending, setSending] = useState(false);
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'he'>('en');

  const handleReset = async () => {
    if (!user) return;

    setSending(true);
    try {
      const response = await fetch(`/api/admin/tenant/users/${user.user_id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailLanguage }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          t('admin.users.passwordReset.successMessage', 'Password reset email sent to {email}')
            .replace('{email}', user.users.email)
        );
        onOpenChange(false);
      } else {
        toast.error(result.error || t('admin.users.passwordReset.errorMessage', 'Failed to send password reset email'));
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error(t('admin.users.passwordReset.errorMessage', 'Failed to send password reset email'));
    } finally {
      setSending(false);
    }
  };

  const userName = `${user?.users.first_name} ${user?.users.last_name}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={direction}>
        <AlertDialogHeader className={isRtl ? 'text-right' : 'text-left'}>
          <AlertDialogTitle>
            {t('admin.users.passwordReset.title', 'Reset Password for {name}?').replace('{name}', userName)}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.users.passwordReset.description', 'This will send a password reset email to')}{' '}
            <strong>{user?.users.email}</strong>.
            <br />
            <br />
            {t('admin.users.passwordReset.warning', 'The user will receive a link to create a new password. This action cannot be undone.')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Email Language Selector */}
        <div className="space-y-2 py-2">
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
            <Mail className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.passwordReset.emailLanguage', 'Email Language')}
            </Label>
          </div>
          <Select value={emailLanguage} onValueChange={(value) => setEmailLanguage(value as 'en' | 'he')}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                  {emailLanguage === 'he' ? (
                    <>
                      <span>🇮🇱</span>
                      <span>{t('admin.users.passwordReset.hebrew', 'Hebrew')}</span>
                    </>
                  ) : (
                    <>
                      <span>🇬🇧</span>
                      <span>{t('admin.users.passwordReset.english', 'English')}</span>
                    </>
                  )}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent dir={direction}>
              <SelectItem value="en">
                <div className="flex items-center gap-2">
                  <span>🇬🇧</span>
                  <span>{t('admin.users.passwordReset.english', 'English')}</span>
                </div>
              </SelectItem>
              <SelectItem value="he">
                <div className="flex items-center gap-2">
                  <span>🇮🇱</span>
                  <span>{t('admin.users.passwordReset.hebrew', 'Hebrew')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
          <AlertDialogCancel disabled={sending}>
            {t('admin.users.passwordReset.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} disabled={sending}>
            {sending && <Loader2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} animate-spin`} />}
            {t('admin.users.passwordReset.sendEmail', 'Send Email')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
