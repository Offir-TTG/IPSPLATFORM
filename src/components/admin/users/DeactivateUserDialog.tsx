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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

interface User {
  user_id: string;
  status: string;
  users: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onUpdate: () => void;
}

export function DeactivateUserDialog({
  open,
  onOpenChange,
  user,
  onUpdate,
}: DeactivateUserDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [updating, setUpdating] = useState(false);
  const [reason, setReason] = useState('');

  const isActivating = user?.status !== 'active';
  const newStatus = isActivating ? 'active' : 'inactive';

  const handleStatusChange = async () => {
    if (!user) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/tenant/users/${user.user_id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const successMessage = isActivating
          ? t('admin.users.deactivate.successActivated', 'User activated successfully')
          : t('admin.users.deactivate.successDeactivated', 'User deactivated successfully');
        toast.success(result.message || successMessage);
        setReason('');
        onUpdate();
        onOpenChange(false);
      } else {
        toast.error(result.error || t('admin.users.deactivate.errorMessage', 'Failed to update user status'));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(t('admin.users.deactivate.errorMessage', 'Failed to update user status'));
    } finally {
      setUpdating(false);
    }
  };

  const userName = `${user?.users.first_name} ${user?.users.last_name}`;
  const title = isActivating
    ? t('admin.users.deactivate.activateTitle', 'Activate {name}?').replace('{name}', userName)
    : t('admin.users.deactivate.deactivateTitle', 'Deactivate {name}?').replace('{name}', userName);
  const placeholder = isActivating
    ? t('admin.users.deactivate.reasonPlaceholderActivate', 'Reason for activation...')
    : t('admin.users.deactivate.reasonPlaceholderDeactivate', 'Reason for deactivation...');
  const actionText = isActivating
    ? t('admin.users.deactivate.activate', 'Activate')
    : t('admin.users.deactivate.deactivate', 'Deactivate');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent dir={direction}>
        <AlertDialogHeader className={isRtl ? 'text-right' : 'text-left'}>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {isActivating ? (
                <p>{t('admin.users.deactivate.activateDescription', 'This user will regain access to the platform and all active courses.')}</p>
              ) : (
                <div>
                  <p className="mb-2">{t('admin.users.deactivate.deactivateWarning', 'This user will:')}</p>
                  <ul className={`list-disc space-y-1 text-sm ${isRtl ? 'list-inside mr-4' : 'list-inside ml-4'}`}>
                    <li>{t('admin.users.deactivate.loseAccess', 'Lose access to the platform')}</li>
                    <li>{t('admin.users.deactivate.removedFromCourses', 'Be removed from active courses')}</li>
                    <li>{t('admin.users.deactivate.keepData', 'Keep all historical data')}</li>
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">{t('admin.users.deactivate.reasonLabel', 'Reason (optional)')}</Label>
                <Textarea
                  id="reason"
                  placeholder={placeholder}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  dir="auto"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
          <AlertDialogCancel disabled={updating}>
            {t('admin.users.deactivate.cancel', 'Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleStatusChange}
            disabled={updating}
            className={!isActivating ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {updating && <Loader2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} animate-spin`} />}
            {actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
