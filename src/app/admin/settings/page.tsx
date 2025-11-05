'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Save, Palette, Type, Layout } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';

// Default theme configuration
const defaultTheme = {
  // Colors
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  foregroundColor: '#0f172a',

  // Typography
  fontFamily: 'Inter',
  headingFontFamily: 'Inter',
  fontSize: '16px',

  // Layout
  borderRadius: '0.5rem',

  // Branding
  platformName: 'Parenting School',
  logoText: 'Parenting School',
};

export default function AdminSettingsPage() {
  const { t } = useAdminLanguage();
  const [theme, setTheme] = useState(defaultTheme);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'branding'>('colors');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    // In a real app, this would save to the database
    try {
      const response = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);

        // Apply theme immediately by updating CSS variables
        Object.entries(theme).forEach(([key, value]) => {
          if (key.includes('Color')) {
            const cssVarName = key.replace(/([A-Z])/g, '-$1').toLowerCase().replace('color', '');
            document.documentElement.style.setProperty(`--${cssVarName}`, value);
          }
        });
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const handleReset = () => {
    setTheme(defaultTheme);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin.settings.title', 'Platform Settings')}</h1>
            <p className="text-muted-foreground">
              {t('admin.settings.subtitle', 'Customize your platform\'s appearance and branding')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              {t('admin.theme.resetToDefault', 'Reset to Default')}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saved ? t('admin.theme.saved', 'Saved!') : t('admin.theme.saveChanges', 'Save Changes')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('colors')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                activeTab === 'colors'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-primary'
              }`}
            >
              <Palette className="h-4 w-4 inline me-2" />
              {t('admin.theme.tab.colors', 'Colors')}
            </button>
            <button
              onClick={() => setActiveTab('typography')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                activeTab === 'typography'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-primary'
              }`}
            >
              <Type className="h-4 w-4 inline me-2" />
              {t('admin.theme.tab.typography', 'Typography')}
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`pb-4 px-2 border-b-2 transition-colors ${
                activeTab === 'branding'
                  ? 'border-primary text-primary'
                  : 'border-transparent hover:text-primary'
              }`}
            >
              <Layout className="h-4 w-4 inline me-2" />
              {t('admin.theme.tab.branding', 'Branding')}
            </button>
          </nav>
        </div>

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{t('admin.theme.colors.primaryColors', 'Primary Colors')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.colors.primary', 'Primary Color')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) =>
                          setTheme({ ...theme, primaryColor: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.primaryColor}
                        onChange={(e) =>
                          setTheme({ ...theme, primaryColor: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.colors.secondary', 'Secondary Color')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={theme.secondaryColor}
                        onChange={(e) =>
                          setTheme({ ...theme, secondaryColor: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.secondaryColor}
                        onChange={(e) =>
                          setTheme({ ...theme, secondaryColor: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.colors.accent', 'Accent Color')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) =>
                          setTheme({ ...theme, accentColor: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.accentColor}
                        onChange={(e) =>
                          setTheme({ ...theme, accentColor: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{t('admin.theme.colors.backgroundColors', 'Background Colors')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.colors.background', 'Background Color')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={theme.backgroundColor}
                        onChange={(e) =>
                          setTheme({ ...theme, backgroundColor: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.backgroundColor}
                        onChange={(e) =>
                          setTheme({ ...theme, backgroundColor: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.colors.foreground', 'Foreground Color (Text)')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={theme.foregroundColor}
                        onChange={(e) =>
                          setTheme({ ...theme, foregroundColor: e.target.value })
                        }
                        className="h-10 w-20 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={theme.foregroundColor}
                        onChange={(e) =>
                          setTheme({ ...theme, foregroundColor: e.target.value })
                        }
                        className="flex-1 px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.theme.preview.title', 'Preview')}</h3>
              <div className="space-y-4">
                <div
                  style={{ backgroundColor: theme.backgroundColor }}
                  className="p-6 border rounded-lg"
                >
                  <h4
                    style={{ color: theme.foregroundColor }}
                    className="text-xl font-bold mb-2"
                  >
                    {t('admin.theme.preview.sampleHeading', 'Sample Heading')}
                  </h4>
                  <p style={{ color: theme.foregroundColor }} className="mb-4 opacity-70">
                    {t('admin.theme.preview.sampleText', 'This is how your text will look with the selected colors.')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      style={{ backgroundColor: theme.primaryColor, color: 'white' }}
                      className="px-4 py-2 rounded-md"
                    >
                      {t('admin.theme.preview.primaryButton', 'Primary Button')}
                    </button>
                    <button
                      style={{ backgroundColor: theme.secondaryColor, color: 'white' }}
                      className="px-4 py-2 rounded-md"
                    >
                      {t('admin.theme.preview.secondaryButton', 'Secondary Button')}
                    </button>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>{t('admin.theme.preview.note', 'Note')}:</strong> {t('admin.theme.preview.noteText', 'Changes will be applied globally across all pages after saving.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{t('admin.theme.typography.fontSettings', 'Font Settings')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.typography.bodyFont', 'Body Font Family')}
                    </label>
                    <select
                      value={theme.fontFamily}
                      onChange={(e) =>
                        setTheme({ ...theme, fontFamily: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.typography.headingFont', 'Heading Font Family')}
                    </label>
                    <select
                      value={theme.headingFontFamily}
                      onChange={(e) =>
                        setTheme({ ...theme, headingFontFamily: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.typography.baseFontSize', 'Base Font Size')}
                    </label>
                    <select
                      value={theme.fontSize}
                      onChange={(e) =>
                        setTheme({ ...theme, fontSize: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="14px">{t('admin.theme.typography.size.small', '14px (Small)')}</option>
                      <option value="16px">{t('admin.theme.typography.size.medium', '16px (Medium)')}</option>
                      <option value="18px">{t('admin.theme.typography.size.large', '18px (Large)')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t('admin.theme.typography.borderRadius', 'Border Radius')}
                    </label>
                    <select
                      value={theme.borderRadius}
                      onChange={(e) =>
                        setTheme({ ...theme, borderRadius: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="0">{t('admin.theme.typography.radius.none', 'None (0px)')}</option>
                      <option value="0.25rem">{t('admin.theme.typography.radius.small', 'Small (4px)')}</option>
                      <option value="0.5rem">{t('admin.theme.typography.radius.medium', 'Medium (8px)')}</option>
                      <option value="0.75rem">{t('admin.theme.typography.radius.large', 'Large (12px)')}</option>
                      <option value="1rem">{t('admin.theme.typography.radius.xlarge', 'Extra Large (16px)')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.theme.typography.preview', 'Typography Preview')}</h3>
              <div
                style={{
                  fontFamily: theme.fontFamily,
                  fontSize: theme.fontSize,
                }}
                className="space-y-4"
              >
                <h1
                  style={{ fontFamily: theme.headingFontFamily }}
                  className="text-4xl font-bold"
                >
                  {t('admin.theme.typography.heading1', 'Heading 1')}
                </h1>
                <h2
                  style={{ fontFamily: theme.headingFontFamily }}
                  className="text-3xl font-bold"
                >
                  {t('admin.theme.typography.heading2', 'Heading 2')}
                </h2>
                <h3
                  style={{ fontFamily: theme.headingFontFamily }}
                  className="text-2xl font-bold"
                >
                  {t('admin.theme.typography.heading3', 'Heading 3')}
                </h3>
                <p>
                  {t('admin.theme.typography.sampleText', 'This is a paragraph of body text. It demonstrates how your content will appear with the selected font settings. The quick brown fox jumps over the lazy dog.')}
                </p>
                <button
                  style={{ borderRadius: theme.borderRadius }}
                  className="px-4 py-2 bg-primary text-white"
                >
                  {t('admin.theme.typography.buttonExample', 'Button Example')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.theme.branding.title', 'Platform Branding')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.theme.branding.platformName', 'Platform Name')}
                  </label>
                  <input
                    type="text"
                    value={theme.platformName}
                    onChange={(e) =>
                      setTheme({ ...theme, platformName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={t('admin.theme.branding.platformNamePlaceholder', 'Your Platform Name')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('admin.theme.branding.platformNameHint', 'This will appear in the browser title and meta tags')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('admin.theme.branding.logoText', 'Logo Text')}
                  </label>
                  <input
                    type="text"
                    value={theme.logoText}
                    onChange={(e) =>
                      setTheme({ ...theme, logoText: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder={t('admin.theme.branding.logoTextPlaceholder', 'Logo Text')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('admin.theme.branding.logoTextHint', 'Text displayed next to your logo icon')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">{t('admin.theme.branding.preview', 'Preview')}</h3>
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    style={{ backgroundColor: theme.primaryColor }}
                    className="h-10 w-10 rounded flex items-center justify-center text-white font-bold"
                  >
                    {theme.logoText.charAt(0)}
                  </div>
                  <span className="text-xl font-bold">{theme.logoText}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('admin.theme.branding.browserTitle', 'Browser title')}: {theme.platformName}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
