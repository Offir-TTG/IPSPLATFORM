'use client';

import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Check, Loader2 } from 'lucide-react';
import { useUserLanguage } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LanguageOption {
  code: string | null;
  name: string;
  nativeName: string;
  description: string;
}

interface LanguagePreferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLanguage: string | null;
  onLanguageChanged?: () => void;
}

export function LanguagePreferenceDialog({
  open,
  onOpenChange,
  currentLanguage,
  onLanguageChanged,
}: LanguagePreferenceDialogProps) {
  const { t, setLanguage, availableLanguages, direction } = useUserLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(currentLanguage);
  const [saving, setSaving] = useState(false);

  // Sync selected language when dialog opens or currentLanguage changes
  useEffect(() => {
    if (open) {
      setSelectedLanguage(currentLanguage);
    }
  }, [open, currentLanguage]);

  // Build language options from available languages
  const languageOptions: LanguageOption[] = useMemo(() => {
    const options: LanguageOption[] = [
      {
        code: null,
        name: 'Auto (Use Organization Default)',
        nativeName: t('user.profile.preferences.languageAuto', 'Auto'),
        description: t('user.profile.preferences.languageAutoDescription', 'Use your organization\'s default language setting'),
      },
    ];

    // Add all active languages from the system
    availableLanguages
      .filter(lang => lang.is_active)
      .forEach(lang => {
        options.push({
          code: lang.code,
          name: lang.name,
          nativeName: lang.native_name,
          description: t(`user.profile.preferences.languageDescription.${lang.code}`, `Display interface in ${lang.name}`),
        });
      });

    return options;
  }, [availableLanguages, t]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update language preference in database
      const response = await fetch('/api/user/preferences/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferred_language: selectedLanguage,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update language preference');
      }

      // Update the runtime language immediately
      if (selectedLanguage) {
        // User selected a specific language
        setLanguage(selectedLanguage);
      } else {
        // User selected "Auto" - fetch and apply tenant default
        const tenantResponse = await fetch('/api/admin/tenant');
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          if (tenantData.success && tenantData.data.default_language) {
            setLanguage(tenantData.data.default_language);
          }
        }
        // Clear user's runtime language override to use tenant default
        localStorage.removeItem('user_language');
        localStorage.setItem('user_preferred_language', 'null');
      }

      toast.success(t('user.profile.preferences.languageUpdated', 'Language preference updated successfully'));

      onOpenChange(false);

      // Trigger callback to refresh profile data
      if (onLanguageChanged) {
        onLanguageChanged();
      }

      // Always reload page to apply language changes throughout the app
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error updating language preference:', error);
      toast.error(t('user.profile.preferences.languageUpdateError', 'Failed to update language preference'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" dir={direction}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            {t('user.profile.preferences.selectLanguage', 'Select Your Preferred Language')}
          </DialogTitle>
          <DialogDescription>
            {t('user.profile.preferences.languageDescription', 'Choose the language you want to use for the interface. This will override the organization default.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Label className="text-sm font-semibold">
            {t('user.profile.preferences.availableLanguages', 'Available Languages')}
          </Label>
          <div className="space-y-2">
            {languageOptions.map((option) => (
              <button
                key={option.code || 'auto'}
                className={cn(
                  'w-full text-left p-4 rounded-lg border-2 transition-all',
                  selectedLanguage === option.code
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
                onClick={() => setSelectedLanguage(option.code)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'font-semibold',
                        selectedLanguage === option.code ? 'text-primary' : 'text-foreground'
                      )}>
                        {option.nativeName}
                      </span>
                      {option.code !== null && (
                        <span className="text-xs text-muted-foreground">
                          ({option.name})
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  {selectedLanguage === option.code && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || selectedLanguage === currentLanguage}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving
              ? t('common.saving', 'Saving...')
              : t('common.save', 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
