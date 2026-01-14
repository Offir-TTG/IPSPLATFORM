'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useUserLanguage, useTheme } from '@/context/AppContext';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Type,
  Moon,
  Sun,
  Keyboard,
  Languages,
  Contrast,
  ZoomIn,
  ZoomOut,
  MonitorSpeaker,
  ListChecks
} from 'lucide-react';

export default function AccessibilityPage() {
  const { t, direction, language, setLanguage } = useUserLanguage();
  const { effectiveTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get current font size from localStorage or default
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
      const size = parseInt(savedFontSize);
      setFontSize(size);
      document.documentElement.style.fontSize = `${size}%`;
    }

    // Get high contrast preference
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';
    setHighContrast(savedHighContrast);
    if (savedHighContrast) {
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  const increaseFontSize = () => {
    if (fontSize < 150) {
      const newSize = fontSize + 10;
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const decreaseFontSize = () => {
    if (fontSize > 80) {
      const newSize = fontSize - 10;
      setFontSize(newSize);
      document.documentElement.style.fontSize = `${newSize}%`;
      localStorage.setItem('fontSize', newSize.toString());
    }
  };

  const resetFontSize = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = '100%';
    localStorage.removeItem('fontSize');
  };

  const toggleHighContrast = () => {
    const newHighContrast = !highContrast;
    setHighContrast(newHighContrast);

    if (newHighContrast) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('highContrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('highContrast', 'false');
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'he' : 'en';
    setLanguage(newLang);
  };

  const keyboardShortcuts = [
    { key: 'Tab', description: t('accessibility.shortcuts.tab', 'Navigate through interactive elements') },
    { key: 'Enter', description: t('accessibility.shortcuts.enter', 'Activate buttons and links') },
    { key: 'Esc', description: t('accessibility.shortcuts.esc', 'Close dialogs and modals') },
    { key: 'Ctrl + F', description: t('accessibility.shortcuts.search', 'Search within page') },
    { key: 'Ctrl + +', description: t('accessibility.shortcuts.zoomIn', 'Zoom in (browser level)') },
    { key: 'Ctrl + -', description: t('accessibility.shortcuts.zoomOut', 'Zoom out (browser level)') },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <PublicHeader />

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl">
            {/* Hero */}
            <div className="mb-12 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="mb-4 text-4xl font-bold text-foreground">
                {t('accessibility.title', 'Accessibility Features')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('accessibility.subtitle', 'Customize your experience for better accessibility')}
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-6 md:grid-cols-2">

              {/* Font Size Controls */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Type className="h-6 w-6 text-primary" />
                    <div className="space-y-1">
                      <CardTitle>{t('accessibility.fontSize.title', 'Text Size')}</CardTitle>
                      <CardDescription>
                        {t('accessibility.fontSize.description', 'Adjust the text size for better readability')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('accessibility.fontSize.current', 'Current size')}: {fontSize}%
                    </span>
                    <Badge variant="outline">{fontSize === 100 ? t('accessibility.default', 'Default') : t('accessibility.custom', 'Custom')}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseFontSize}
                      disabled={fontSize <= 80}
                    >
                      <ZoomOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('accessibility.fontSize.decrease', 'Smaller')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFontSize}
                      disabled={fontSize === 100}
                    >
                      {t('accessibility.fontSize.reset', 'Reset')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseFontSize}
                      disabled={fontSize >= 150}
                    >
                      <ZoomIn className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('accessibility.fontSize.increase', 'Larger')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Theme Toggle */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    {effectiveTheme === 'dark' ? (
                      <Moon className="h-6 w-6 text-primary" />
                    ) : (
                      <Sun className="h-6 w-6 text-primary" />
                    )}
                    <div className="space-y-1">
                      <CardTitle>{t('accessibility.theme.title', 'Theme')}</CardTitle>
                      <CardDescription>
                        {t('accessibility.theme.description', 'Switch between light and dark mode')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('accessibility.theme.current', 'Current theme')}:
                    </span>
                    <Badge variant="outline">
                      {effectiveTheme === 'dark' ? t('accessibility.theme.dark', 'Dark') : t('accessibility.theme.light', 'Light')}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="w-full"
                  >
                    {effectiveTheme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('accessibility.theme.switchToLight', 'Switch to Light Mode')}
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('accessibility.theme.switchToDark', 'Switch to Dark Mode')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* High Contrast */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Contrast className="h-6 w-6 text-primary" />
                    <div className="space-y-1">
                      <CardTitle>{t('accessibility.contrast.title', 'High Contrast')}</CardTitle>
                      <CardDescription>
                        {t('accessibility.contrast.description', 'Increase contrast for better visibility')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('accessibility.contrast.status', 'Status')}:
                    </span>
                    <Badge variant={highContrast ? 'default' : 'outline'}>
                      {highContrast ? t('accessibility.enabled', 'Enabled') : t('accessibility.disabled', 'Disabled')}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleHighContrast}
                    className="w-full"
                  >
                    {highContrast ? t('accessibility.contrast.disable', 'Disable High Contrast') : t('accessibility.contrast.enable', 'Enable High Contrast')}
                  </Button>
                </CardContent>
              </Card>

              {/* Language */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Languages className="h-6 w-6 text-primary" />
                    <div className="space-y-1">
                      <CardTitle>{t('accessibility.language.title', 'Language & Direction')}</CardTitle>
                      <CardDescription>
                        {t('accessibility.language.description', 'Switch between languages and text direction')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('accessibility.language.current', 'Current language')}:
                    </span>
                    <Badge variant="outline">
                      {language === 'en' ? 'English (LTR)' : 'עברית (RTL)'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleLanguage}
                    className="w-full"
                  >
                    {language === 'en' ? (
                      <span className="flex items-center justify-center gap-2">
                        <span>Switch to Hebrew</span>
                        <span>←</span>
                        <span>עברית</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>Switch to English</span>
                        <span>→</span>
                      </span>
                    )}
                  </Button>
                </CardContent>
              </Card>

            </div>

            {/* Keyboard Shortcuts */}
            <Card className="mt-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Keyboard className="h-6 w-6 text-primary" />
                  <div className="space-y-1">
                    <CardTitle>{t('accessibility.shortcuts.title', 'Keyboard Shortcuts')}</CardTitle>
                    <CardDescription>
                      {t('accessibility.shortcuts.description', 'Navigate the platform using keyboard shortcuts')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="grid gap-3 md:grid-cols-2">
                  {keyboardShortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                      <Badge variant="secondary" className="font-mono">
                        {shortcut.key}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Screen Reader Support */}
            <Card className="mt-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <MonitorSpeaker className="h-6 w-6 text-primary" />
                  <div className="space-y-1">
                    <CardTitle>{t('accessibility.screenReader.title', 'Screen Reader Support')}</CardTitle>
                    <CardDescription>
                      {t('accessibility.screenReader.description', 'This platform is compatible with screen readers')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-6 pb-6">
                <p className="text-sm text-muted-foreground">
                  {t('accessibility.screenReader.info', 'Our platform is designed to work with popular screen readers including:')}
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    NVDA (Windows)
                  </li>
                  <li className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    JAWS (Windows)
                  </li>
                  <li className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    VoiceOver (macOS, iOS)
                  </li>
                  <li className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-primary" />
                    TalkBack (Android)
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="mt-6 border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {t('accessibility.feedback.message', 'We are committed to making our platform accessible to everyone. If you encounter any accessibility issues or have suggestions for improvement, please contact us at')}{' '}
                  <a href="mailto:support@tenafly-tg.com" className="text-primary hover:underline">
                    support@tenafly-tg.com
                  </a>
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
