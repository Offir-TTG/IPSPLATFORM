'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Loader2,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { toast } from 'sonner';
import type { NotificationCategory } from '@/types/notifications';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

interface NotificationPreferences {
  id?: string;
  user_id: string;
  tenant_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  category_preferences: CategoryPreferences;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
  digest_mode: boolean;
  digest_frequency: 'daily' | 'weekly';
  digest_time: string;
  phone_number: string | null;
  push_subscription: any;
}

interface CategoryPreferences {
  lesson: ChannelPreferences;
  assignment: ChannelPreferences;
  payment: ChannelPreferences;
  enrollment: ChannelPreferences;
  attendance: ChannelPreferences;
  achievement: ChannelPreferences;
  announcement: ChannelPreferences;
  system: ChannelPreferences;
}

interface ChannelPreferences {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
}

const DEFAULT_CATEGORY_PREFS: CategoryPreferences = {
  lesson: { in_app: true, email: true, sms: false, push: true },
  assignment: { in_app: true, email: true, sms: false, push: true },
  payment: { in_app: true, email: true, sms: true, push: true },
  enrollment: { in_app: true, email: true, sms: false, push: true },
  attendance: { in_app: true, email: false, sms: false, push: false },
  achievement: { in_app: true, email: true, sms: false, push: true },
  announcement: { in_app: true, email: true, sms: false, push: true },
  system: { in_app: true, email: false, sms: false, push: false },
};

export function NotificationPreferences() {
  const { t } = useUserLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error(t('user.notifications.preferences.fetchError', 'Failed to load preferences'));
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    // Clear phone error
    setPhoneError(null);

    try {
      // Validate phone number if SMS is enabled and phone number is provided
      if (preferences.sms_enabled && preferences.phone_number) {
        if (!isValidPhoneNumber(preferences.phone_number)) {
          setPhoneError(t('user.notifications.preferences.phoneInvalid', 'Please enter a valid phone number with country code'));
          toast.error(t('user.notifications.preferences.phoneInvalid', 'Please enter a valid phone number with country code'));
          return;
        }
      }

      // Validate phone number is required if SMS is enabled
      if (preferences.sms_enabled && !preferences.phone_number) {
        setPhoneError(t('user.notifications.preferences.phoneRequired', 'Phone number is required for SMS notifications'));
        toast.error(t('user.notifications.preferences.phoneRequired', 'Phone number is required for SMS notifications'));
        return;
      }

      setSaving(true);
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success(t('user.notifications.preferences.saveSuccess', 'Preferences saved successfully'));
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error(t('user.notifications.preferences.saveError', 'Failed to save preferences'));
    } finally {
      setSaving(false);
    }
  };

  const updateMasterChannel = (channel: 'email_enabled' | 'sms_enabled' | 'push_enabled', enabled: boolean) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [channel]: enabled });
  };

  const updateCategoryChannel = (category: NotificationCategory, channel: keyof ChannelPreferences, enabled: boolean) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      category_preferences: {
        ...preferences.category_preferences,
        [category]: {
          ...preferences.category_preferences[category],
          [channel]: enabled,
        },
      },
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{t('user.notifications.preferences.loadError', 'Failed to load preferences')}</p>
        </div>
      </Card>
    );
  }

  const categories: { key: NotificationCategory; labelKey: string; descKey: string }[] = [
    { key: 'lesson', labelKey: 'user.notifications.categories.lesson', descKey: 'user.notifications.categories.lesson_desc' },
    { key: 'assignment', labelKey: 'user.notifications.categories.assignment', descKey: 'user.notifications.categories.assignment_desc' },
    { key: 'payment', labelKey: 'user.notifications.categories.payment', descKey: 'user.notifications.categories.payment_desc' },
    { key: 'enrollment', labelKey: 'user.notifications.categories.enrollment', descKey: 'user.notifications.categories.enrollment_desc' },
    { key: 'attendance', labelKey: 'user.notifications.categories.attendance', descKey: 'user.notifications.categories.attendance_desc' },
    { key: 'achievement', labelKey: 'user.notifications.categories.achievement', descKey: 'user.notifications.categories.achievement_desc' },
    { key: 'announcement', labelKey: 'user.notifications.categories.announcement', descKey: 'user.notifications.categories.announcement_desc' },
    { key: 'system', labelKey: 'user.notifications.categories.system', descKey: 'user.notifications.categories.system_desc' },
  ];

  return (
    <div className="space-y-6">
      {/* Master Channel Toggles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t('user.notifications.preferences.masterChannels', 'Delivery Channels')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('user.notifications.preferences.masterChannelsDesc', 'Control which channels you want to receive notifications through')}
        </p>

        <div className="space-y-4">
          {/* In-App (always on) */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 opacity-60">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <div>
                <p className="font-medium">{t('user.notifications.preferences.inApp', 'In-App Notifications')}</p>
                <p className="text-sm text-muted-foreground">{t('user.notifications.preferences.inAppDesc', 'Notifications within the platform')}</p>
              </div>
            </div>
            <Switch checked={true} disabled />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5" />
              <div>
                <p className="font-medium">{t('user.notifications.preferences.email', 'Email Notifications')}</p>
                <p className="text-sm text-muted-foreground">{t('user.notifications.preferences.emailDesc', 'Receive notifications via email')}</p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => updateMasterChannel('email_enabled', checked)}
            />
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5" />
              <div>
                <p className="font-medium">{t('user.notifications.preferences.sms', 'SMS/WhatsApp Notifications')}</p>
                <p className="text-sm text-muted-foreground">{t('user.notifications.preferences.smsDesc', 'Receive urgent notifications via SMS')}</p>
              </div>
            </div>
            <Switch
              checked={preferences.sms_enabled}
              onCheckedChange={(checked) => updateMasterChannel('sms_enabled', checked)}
            />
          </div>

          {/* Phone Number for SMS */}
          {preferences.sms_enabled && (
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
                {t('user.notifications.preferences.phoneNumber', 'Phone Number for SMS')}
              </Label>
              <div dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
                <PhoneInput
                  international
                  defaultCountry="US"
                  value={preferences.phone_number || ''}
                  onChange={(value) => {
                    // Limit to 17 characters (max for international phone numbers)
                    const maxLength = 17;
                    if (value && value.length > maxLength) {
                      setPhoneError(t('user.notifications.preferences.phoneTooLong', `Phone number is too long (max ${maxLength} characters)`));
                      return;
                    }

                    setPreferences({ ...preferences, phone_number: value || '' });

                    // Real-time validation
                    if (value && value.length > 5) {
                      if (!isValidPhoneNumber(value)) {
                        setPhoneError(t('user.notifications.preferences.phoneInvalidSimple', 'Please enter a valid phone number'));
                      } else {
                        setPhoneError(null);
                      }
                    } else if (!value) {
                      setPhoneError(null);
                    }
                  }}
                  placeholder="+1 234 567 8900"
                  className="phone-input-preferences"
                  smartCaret={true}
                  numberInputProps={{
                    maxLength: 17
                  }}
                />
              </div>
              <style jsx global>{`
                .phone-input-preferences {
                  width: 100%;
                  padding: 0.625rem 0.75rem;
                  border: 1px solid hsl(var(--border));
                  border-radius: calc(var(--radius) - 2px);
                  font-size: 0.875rem;
                  background-color: hsl(var(--background));
                  color: hsl(var(--foreground));
                  transition: all 0.2s ease;
                  display: flex;
                  align-items: center;
                  direction: ltr !important;
                  text-align: left !important;
                }
                .phone-input-preferences .PhoneInputInput {
                  padding: 0;
                  border: none;
                  outline: none;
                  font-size: 0.875rem;
                  background-color: transparent;
                  color: hsl(var(--foreground));
                  direction: ltr !important;
                  text-align: left !important;
                }
                .phone-input-preferences .PhoneInputInput:focus {
                  outline: none;
                }
                .phone-input-preferences .PhoneInputCountry {
                  padding-right: 0.5rem;
                  direction: ltr !important;
                }
              `}</style>
              {phoneError && (
                <p className="text-xs text-destructive mt-1.5">
                  {phoneError}
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Category Preferences */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t('user.notifications.preferences.categorySettings', 'Notification Categories')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('user.notifications.preferences.categorySettingsDesc', 'Choose which channels to use for each type of notification')}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-start p-3 font-medium">{t('user.notifications.preferences.category', 'Category')}</th>
                <th className="text-center p-3 font-medium w-24">
                  <Bell className="h-4 w-4 mx-auto" />
                  <span className="text-xs mt-1 block">{t('user.notifications.preferences.inAppShort', 'In-App')}</span>
                </th>
                <th className="text-center p-3 font-medium w-24">
                  <Mail className="h-4 w-4 mx-auto" />
                  <span className="text-xs mt-1 block">{t('user.notifications.preferences.emailShort', 'Email')}</span>
                </th>
                <th className="text-center p-3 font-medium w-24">
                  <Smartphone className="h-4 w-4 mx-auto" />
                  <span className="text-xs mt-1 block">{t('user.notifications.preferences.smsShort', 'SMS')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.key} className="border-b hover:bg-muted/30">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{t(category.labelKey, category.key)}</p>
                      <p className="text-xs text-muted-foreground">{t(category.descKey, '')}</p>
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <Switch
                      checked={preferences.category_preferences[category.key]?.in_app ?? true}
                      disabled
                      className="mx-auto opacity-50"
                    />
                  </td>
                  <td className="text-center p-3">
                    <Switch
                      checked={preferences.category_preferences[category.key]?.email ?? true}
                      onCheckedChange={(checked) => updateCategoryChannel(category.key, 'email', checked)}
                      disabled={!preferences.email_enabled}
                      className="mx-auto"
                    />
                  </td>
                  <td className="text-center p-3">
                    <Switch
                      checked={preferences.category_preferences[category.key]?.sms ?? false}
                      onCheckedChange={(checked) => updateCategoryChannel(category.key, 'sms', checked)}
                      disabled={!preferences.sms_enabled}
                      className="mx-auto"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('user.notifications.preferences.quietHours', 'Quiet Hours')}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t('user.notifications.preferences.quietHoursDesc', 'No external notifications (email, SMS) during these hours')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quiet-start">{t('user.notifications.preferences.quietStart', 'Start Time')}</Label>
            <Input
              id="quiet-start"
              type="time"
              value={preferences.quiet_hours_start || '22:00'}
              onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="quiet-end">{t('user.notifications.preferences.quietEnd', 'End Time')}</Label>
            <Input
              id="quiet-end"
              type="time"
              value={preferences.quiet_hours_end || '08:00'}
              onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="timezone">{t('user.notifications.preferences.timezone', 'Timezone')}</Label>
            <Input
              id="timezone"
              type="text"
              value={preferences.quiet_hours_timezone || 'UTC'}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('user.notifications.preferences.saving', 'Saving...')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('user.notifications.preferences.save', 'Save Preferences')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
