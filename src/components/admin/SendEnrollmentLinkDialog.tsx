'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminLanguage } from '@/context/AppContext';
import { Mail, Info, User, Package } from 'lucide-react';

interface Enrollment {
  id: string;
  user_name: string;
  user_email: string;
  product_name: string;
  status: string;
}

interface SendEnrollmentLinkDialogProps {
  open: boolean;
  enrollment: Enrollment | null;
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  onClose: () => void;
  onSend: () => void;
  sending: boolean;
}

export function SendEnrollmentLinkDialog({
  open,
  enrollment,
  selectedLanguage,
  onLanguageChange,
  onClose,
  onSend,
  sending
}: SendEnrollmentLinkDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRTL = direction === 'rtl';

  // Debug: Log direction
  console.log('SendEnrollmentLinkDialog - direction:', direction, 'isRTL:', isRTL);

  if (!enrollment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        dir={direction}
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col space-y-2 w-full">
          <DialogTitle className="text-xl" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {t('admin.enrollments.sendLink.title', 'Send Enrollment Link')}
          </DialogTitle>
          <DialogDescription className="text-sm w-full" style={{ textAlign: isRTL ? 'right' : 'left' }}>
            {t('admin.enrollments.sendLink.description',
              'Send enrollment invitation email to the user with a secure link')}
          </DialogDescription>
        </div>

        <div className="space-y-5 py-4">
          {/* User Info */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <User className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('admin.enrollments.sendLink.user', 'User')}
              </Label>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3.5 space-y-1" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div className="font-medium text-sm">{enrollment.user_name}</div>
              <div className="text-muted-foreground text-xs">{enrollment.user_email}</div>
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Package className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('admin.enrollments.sendLink.product', 'Product')}
              </Label>
            </div>
            <div className="rounded-lg border bg-muted/50 p-3.5" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div className="font-medium text-sm">{enrollment.product_name}</div>
            </div>
          </div>

          {/* Email Language Selector */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {t('admin.enrollments.sendLink.language', 'Email Language')}
              </Label>
            </div>
            <Select value={selectedLanguage} onValueChange={onLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    {selectedLanguage === 'he' ? (
                      <>
                        <span>🇮🇱</span>
                        <span>עברית</span>
                      </>
                    ) : (
                      <>
                        <span>🇬🇧</span>
                        <span>English</span>
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="en">
                  <div className="flex items-center gap-2">
                    <span>🇬🇧</span>
                    <span>English</span>
                  </div>
                </SelectItem>
                <SelectItem value="he">
                  <div className="flex items-center gap-2">
                    <span>🇮🇱</span>
                    <span>עברית</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {t('admin.enrollments.sendLink.languageHelp', 'The invitation email will be sent in this language')}
            </p>
          </div>

          {/* Info Alert - Custom RTL-aware alert */}
          <div
            className={`relative rounded-lg border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900 p-4 ${
              isRTL ? 'pr-11' : 'pl-11'
            }`}
          >
            <Info
              className={`absolute top-4 h-4 w-4 text-blue-600 dark:text-blue-400 ${
                isRTL ? 'right-4' : 'left-4'
              }`}
            />
            <div
              className="text-xs text-blue-900 dark:text-blue-100 leading-relaxed"
              style={{ textAlign: isRTL ? 'right' : 'left' }}
            >
              {t('admin.enrollments.sendLink.info',
                'The user will receive an email with a secure link valid for 7 days. The enrollment status will change to "pending".')}
            </div>
          </div>
        </div>

        <DialogFooter className={`gap-2 flex-col sm:flex-row ${
          isRTL ? 'sm:flex-row-reverse' : ''
        }`}>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={sending}
            className="w-full sm:w-auto"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={onSend}
            disabled={sending}
            className="w-full sm:w-auto"
          >
            {sending ? (
              <span className="animate-pulse">
                {t('admin.enrollments.sendLink.sending', 'Sending...')}
              </span>
            ) : (
              <span className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Mail className="h-4 w-4" />
                <span>{t('admin.enrollments.sendLink.send', 'Send Link')}</span>
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
