'use client';

import { useState } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface TestTriggerDialogProps {
  open: boolean;
  onClose: () => void;
  onTest: (email: string) => Promise<void>;
  defaultEmail?: string;
  recipientEmail?: string; // The email that would receive it in production
}

export function TestTriggerDialog({
  open,
  onClose,
  onTest,
  defaultEmail = '',
  recipientEmail,
}: TestTriggerDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleTest = async () => {
    setError('');

    if (!email.trim()) {
      setError(t('triggers.test.emailRequired', 'Email address is required'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('triggers.test.emailInvalid', 'Please enter a valid email address'));
      return;
    }

    try {
      setLoading(true);
      await onTest(email);
      onClose();
      setEmail(defaultEmail); // Reset for next time
    } catch (err: any) {
      setError(err.message || t('triggers.test.failed', 'Failed to send test email'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail(defaultEmail);
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-[425px] ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader className={isRtl ? '[&>button]:left-4 [&>button]:right-auto' : ''}>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
            {t('triggers.test.title', 'Test Email Trigger')}
          </DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {t('triggers.test.description', 'Enter the email address where you want to receive the test email.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {recipientEmail && (
            <div className={`p-3 bg-blue-50 border border-blue-200 rounded-md ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-sm text-blue-800">
                <strong>{t('triggers.test.productionRecipient', 'Production recipient:')}</strong>{' '}
                {recipientEmail}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {t('triggers.test.productionNote', 'In production, this email would be sent to the address above. For testing, you can send it to any email.')}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="test-email" className={isRtl ? 'text-right block' : 'text-left block'}>
              {t('triggers.test.emailLabel', 'Test Email Address')}
            </Label>
            <Input
              id="test-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('triggers.test.emailPlaceholder', 'your.email@example.com')}
              className={isRtl ? 'text-right' : 'text-left'}
              disabled={loading}
              dir={isRtl ? 'rtl' : 'ltr'}
            />
            {error && (
              <p className={`text-sm text-red-600 ${isRtl ? 'text-right' : 'text-left'}`}>
                {error}
              </p>
            )}
            <p className={`text-xs text-gray-500 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t('triggers.test.emailHint', 'The test email will be sent to this address with a [TEST] prefix in the subject.')}
            </p>
          </div>
        </div>

        <DialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleTest}
            disabled={loading || !email.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('triggers.test.sending', 'Sending...')}
              </>
            ) : (
              t('triggers.test.send', 'Send Test Email')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
