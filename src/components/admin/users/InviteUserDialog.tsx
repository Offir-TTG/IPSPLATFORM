'use client';

import { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAdminLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Mail, CheckCircle2, XCircle } from 'lucide-react';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteUserDialog({ open, onOpenChange, onSuccess }: InviteUserDialogProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'student' as 'admin' | 'instructor' | 'student',
    password: '',
    language: 'en' as 'en' | 'he',
  });
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Check if email exists when user types
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || formData.email.length < 3) {
        setEmailExists(false);
        return;
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setEmailExists(false);
        return;
      }

      setCheckingEmail(true);
      try {
        // Add timestamp to prevent any caching
        const timestamp = Date.now();
        const response = await fetch(`/api/admin/users?email=${encodeURIComponent(formData.email)}&_t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (response.ok) {
          const data = await response.json();
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
  }, [formData.email]);

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    setFormData({ ...formData, password });
    toast.success(t('admin.users.password_generated', 'Password generated'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = t('admin.users.error_email_required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('admin.users.error_email_invalid', 'Invalid email address');
    }
    if (!formData.first_name.trim()) {
      newErrors.first_name = t('admin.users.error_first_name_required', 'First name is required');
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = t('admin.users.error_last_name_required', 'Last name is required');
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = t('admin.users.error_password_min', 'Password must be at least 8 characters');
    }
    if (emailExists) {
      newErrors.email = t('admin.users.error_email_exists', 'A user with this email already exists');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/tenant/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, send_email: sendEmail }),
      });

      const data = await response.json();

      if (data.success) {
        const successMessage = sendEmail
          ? t('admin.users.invite_success', 'User invited successfully')
          : t('admin.users.user_created_success', 'User created successfully');
        toast.success(successMessage);
        setFormData({
          email: '',
          first_name: '',
          last_name: '',
          phone: '',
          role: 'student',
          password: '',
          language: 'en',
        });
        setSendEmail(true);
        onOpenChange(false);
        onSuccess();
      } else {
        console.error('User creation error:', data);
        toast.error(data.error || t('admin.users.invite_error', 'Failed to invite user'));
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(t('admin.users.invite_error', 'Failed to invite user'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={direction}>
        <DialogHeader>
          <DialogTitle className={isRtl ? 'text-right' : 'text-left'}>
            {t('admin.users.invite_user', 'Invite User')}
          </DialogTitle>
          <DialogDescription className={isRtl ? 'text-right' : 'text-left'}>
            {t('admin.users.invite_user_description', 'Add a new user to your organization')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className={isRtl ? 'text-right block' : 'text-left block'}>
              {t('admin.users.email', 'Email')} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`${isRtl ? 'text-right pl-10' : 'text-left pr-10'} ${emailExists ? 'border-destructive' : ''}`}
                dir={direction}
                required
              />
              <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'}`}>
                {checkingEmail && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!checkingEmail && formData.email && formData.email.length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                  emailExists ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )
                )}
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            {emailExists && !errors.email && (
              <p className="text-sm text-destructive">
                {t('admin.users.error_email_exists', 'A user with this email already exists')}
              </p>
            )}
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="first_name" className={isRtl ? 'text-right block' : 'text-left block'}>
              {t('admin.users.first_name', 'First Name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className={isRtl ? 'text-right' : 'text-left'}
              dir={direction}
              required
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="last_name" className={isRtl ? 'text-right block' : 'text-left block'}>
              {t('admin.users.last_name', 'Last Name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className={isRtl ? 'text-right' : 'text-left'}
              dir={direction}
              required
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name}</p>
            )}
          </div>

          {/* Phone (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone" className={isRtl ? 'text-right block' : 'text-left block'}>
              {t('admin.users.phone', 'Phone')}
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={isRtl ? 'text-right' : 'text-left'}
              dir={direction}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role" className={isRtl ? 'text-right block' : 'text-left block'}>
              {t('admin.users.role', 'Role')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value: any) => setFormData({ ...formData, role: value })}
              dir={direction}
            >
              <SelectTrigger className={isRtl ? 'text-right' : 'text-left'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={direction}>
                <SelectItem value="student">{t('admin.users.role_student', 'Student')}</SelectItem>
                <SelectItem value="instructor">{t('admin.users.role_instructor', 'Instructor')}</SelectItem>
                <SelectItem value="admin">{t('admin.users.role_admin', 'Admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Email Language */}
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="language" className="text-sm font-medium" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                {t('admin.users.language', 'Email Language')} <span className="text-destructive">*</span>
              </Label>
            </div>
            <Select
              value={formData.language}
              onValueChange={(value: any) => setFormData({ ...formData, language: value })}
              dir={direction}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
                    {formData.language === 'he' ? (
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
            <p className="text-xs text-muted-foreground" style={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('admin.users.language_help', 'The welcome email will be sent in this language')}
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className={isRtl ? 'text-right' : 'text-left'}>
                {t('admin.users.password', 'Password')} <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generatePassword}
                className="h-auto py-1 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${isRtl ? 'ml-1' : 'mr-1'}`} />
                <span className="text-xs">{t('admin.users.generate_password', 'Generate')}</span>
              </Button>
            </div>
            <Input
              id="password"
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={isRtl ? 'text-right' : 'text-left'}
              dir={direction}
              required
              minLength={8}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {t('admin.users.password_hint', 'Minimum 8 characters')}
            </p>
          </div>

          {/* Send Email Toggle */}
          <div className={`flex items-center justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="space-y-0.5 flex-1">
              <Label
                htmlFor="send-email"
                className={`text-sm font-medium block ${isRtl ? 'text-right' : 'text-left'}`}
              >
                {t('admin.users.send_welcome_email', 'Send welcome email with login credentials')}
              </Label>
              <p className={`text-xs text-muted-foreground ${isRtl ? 'text-right' : 'text-left'}`}>
                {t('admin.users.send_welcome_email_desc', 'User will receive login credentials via email')}
              </p>
            </div>
            <Switch
              id="send-email"
              checked={sendEmail}
              onCheckedChange={(checked) => setSendEmail(checked as boolean)}
            />
          </div>

          <DialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('admin.users.invite_user', 'Invite User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
