'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { Palette, Save, RefreshCw, Moon, Sun, Type, Plus, Minus, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ThemeConfig {
  id: string;
  theme_name: string;
  is_active: boolean;

  // Light mode
  light_background: string;
  light_foreground: string;
  light_card: string;
  light_card_foreground: string;
  light_popover: string;
  light_popover_foreground: string;
  light_primary: string;
  light_primary_foreground: string;
  light_secondary: string;
  light_secondary_foreground: string;
  light_muted: string;
  light_muted_foreground: string;
  light_accent: string;
  light_accent_foreground: string;
  light_destructive: string;
  light_destructive_foreground: string;
  light_success: string;
  light_success_foreground: string;
  light_warning: string;
  light_warning_foreground: string;
  light_info: string;
  light_info_foreground: string;
  light_border: string;
  light_input: string;
  light_ring: string;

  // Dark mode
  dark_background: string;
  dark_foreground: string;
  dark_card: string;
  dark_card_foreground: string;
  dark_popover: string;
  dark_popover_foreground: string;
  dark_primary: string;
  dark_primary_foreground: string;
  dark_secondary: string;
  dark_secondary_foreground: string;
  dark_muted: string;
  dark_muted_foreground: string;
  dark_accent: string;
  dark_accent_foreground: string;
  dark_destructive: string;
  dark_destructive_foreground: string;
  dark_success: string;
  dark_success_foreground: string;
  dark_warning: string;
  dark_warning_foreground: string;
  dark_info: string;
  dark_info_foreground: string;
  dark_border: string;
  dark_input: string;
  dark_ring: string;

  border_radius: string;

  // Text colors - Light mode
  light_text_body: string;
  light_text_heading: string;
  light_text_muted: string;
  light_text_link: string;

  // Text colors - Dark mode
  dark_text_body: string;
  dark_text_heading: string;
  dark_text_muted: string;
  dark_text_link: string;

  // Typography
  font_family_primary: string;
  font_family_heading: string;
  font_family_mono: string;
  font_size_base: string;
  font_size_xs: string;
  font_size_sm: string;
  font_size_md: string;
  font_size_lg: string;
  font_size_xl: string;
  font_size_2xl: string;
  font_size_3xl: string;
  font_size_4xl: string;
  font_weight_normal: string;
  font_weight_medium: string;
  font_weight_semibold: string;
  font_weight_bold: string;
  line_height_tight: string;
  line_height_normal: string;
  line_height_relaxed: string;
  letter_spacing_tight: string;
  letter_spacing_normal: string;
  letter_spacing_wide: string;
}

interface UITextEntry {
  key: string;
  category: string;
  translations: {
    language_code: string;
    value: string;
  }[];
}

// Helper: Convert HSL string to HEX
function hslToHex(hsl: string): string {
  if (!hsl || typeof hsl !== 'string') {
    return '#000000'; // Default to black if invalid
  }
  const [h, s, l] = hsl.split(' ').map(v => parseFloat(v.replace('%', '')));
  const hDecimal = h / 360;
  const sDecimal = s / 100;
  const lDecimal = l / 100;

  let r, g, b;
  if (sDecimal === 0) {
    r = g = b = lDecimal;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lDecimal < 0.5 ? lDecimal * (1 + sDecimal) : lDecimal + sDecimal - lDecimal * sDecimal;
    const p = 2 * lDecimal - q;
    r = hue2rgb(p, q, hDecimal + 1 / 3);
    g = hue2rgb(p, q, hDecimal);
    b = hue2rgb(p, q, hDecimal - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Helper: Convert HEX to HSL string
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Font options
const FONT_OPTIONS = {
  system: {
    label: 'System Fonts',
    fonts: [
      { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', label: 'System Default' },
      { value: 'Arial, sans-serif', label: 'Arial' },
      { value: 'Helvetica, sans-serif', label: 'Helvetica' },
      { value: 'Georgia, serif', label: 'Georgia' },
      { value: 'Times New Roman, serif', label: 'Times New Roman' },
    ]
  },
  hebrew: {
    label: 'Hebrew Fonts',
    fonts: [
      { value: 'Heebo, sans-serif', label: 'Heebo' },
      { value: 'Rubik, sans-serif', label: 'Rubik' },
      { value: 'Assistant, sans-serif', label: 'Assistant' },
      { value: 'Alef, sans-serif', label: 'Alef' },
      { value: 'Varela Round, sans-serif', label: 'Varela Round' },
      { value: 'Frank Ruhl Libre, serif', label: 'Frank Ruhl Libre' },
      { value: 'David Libre, serif', label: 'David Libre' },
    ]
  },
  google: {
    label: 'Google Fonts',
    fonts: [
      { value: 'Inter, sans-serif', label: 'Inter' },
      { value: 'Roboto, sans-serif', label: 'Roboto' },
      { value: 'Open Sans, sans-serif', label: 'Open Sans' },
      { value: 'Lato, sans-serif', label: 'Lato' },
      { value: 'Montserrat, sans-serif', label: 'Montserrat' },
      { value: 'Poppins, sans-serif', label: 'Poppins' },
      { value: 'Playfair Display, serif', label: 'Playfair Display' },
      { value: 'Merriweather, serif', label: 'Merriweather' },
    ]
  },
  monospace: {
    label: 'Monospace Fonts',
    fonts: [
      { value: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace', label: 'SF Mono' },
      { value: '"Fira Code", monospace', label: 'Fira Code' },
      { value: '"Source Code Pro", monospace', label: 'Source Code Pro' },
      { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono' },
      { value: 'Monaco, Consolas, monospace', label: 'Monaco' },
      { value: 'Consolas, monospace', label: 'Consolas' },
    ]
  }
};

// Helper: Parse numeric value from size string
const parseNumericValue = (value: string): number => {
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

// Helper: Get unit from size string
const getUnit = (value: string): string => {
  const match = value.match(/[a-z%]+$/i);
  return match ? match[0] : 'rem';
};

// Helper: Increment/decrement value
const adjustValue = (value: string, increment: number, step?: number): string => {
  const num = parseNumericValue(value);
  const unit = getUnit(value);
  // Auto-determine step based on unit if not provided
  const actualStep = step !== undefined ? step : (unit === 'px' ? 1 : 0.1);
  const newValue = Math.max(0, num + (increment * actualStep));
  return `${newValue.toFixed(unit === 'px' ? 0 : 3).replace(/\.?0+$/, '')}${unit}`;
};

export default function ThemeSettingsPage() {
  const { t, availableLanguages, language: adminLang } = useAdminLanguage();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'colors' | 'typography'>('colors');

  // Get preview text based on admin language
  const isHebrew = adminLang === 'he';
  const previewText = {
    body: isHebrew ? 'זהו טקסט גוף רגיל' : 'This is body text',
    heading: isHebrew ? 'כותרת לדוגמה' : 'Sample Heading',
    code: isHebrew ? '// קוד לדוגמה' : '// Sample code'
  };

  useEffect(() => {
    loadTheme();
    // Restore active tab from localStorage
    const savedTab = localStorage.getItem('themeActiveTab') as 'colors' | 'typography';
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage when it changes
  const handleTabChange = (tab: 'colors' | 'typography') => {
    setActiveTab(tab);
    localStorage.setItem('themeActiveTab', tab);
  };

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/theme');
      const data = await response.json();

      if (data.success && data.data) {
        // Add default values for text and sidebar colors if they don't exist (migration not run yet)
        const themeData = {
          ...data.data,
          light_text_body: data.data.light_text_body || '222.2 84% 4.9%',
          light_text_heading: data.data.light_text_heading || '222.2 84% 4.9%',
          light_text_muted: data.data.light_text_muted || '215.4 16.3% 46.9%',
          light_text_link: data.data.light_text_link || '221.2 83.2% 53.3%',
          dark_text_body: data.data.dark_text_body || '210 40% 98%',
          dark_text_heading: data.data.dark_text_heading || '210 40% 98%',
          dark_text_muted: data.data.dark_text_muted || '215 20.2% 65.1%',
          dark_text_link: data.data.dark_text_link || '217.2 91.2% 59.8%',
          light_sidebar_background: data.data.light_sidebar_background || '0 0% 100%',
          light_sidebar_foreground: data.data.light_sidebar_foreground || '222.2 84% 4.9%',
          light_sidebar_border: data.data.light_sidebar_border || '214.3 31.8% 91.4%',
          light_sidebar_active: data.data.light_sidebar_active || '221.2 83.2% 53.3%',
          light_sidebar_active_foreground: data.data.light_sidebar_active_foreground || '210 40% 98%',
          dark_sidebar_background: data.data.dark_sidebar_background || '217.2 32.6% 12%',
          dark_sidebar_foreground: data.data.dark_sidebar_foreground || '210 40% 98%',
          dark_sidebar_border: data.data.dark_sidebar_border || '217.2 32.6% 17.5%',
          dark_sidebar_active: data.data.dark_sidebar_active || '217.2 91.2% 59.8%',
          dark_sidebar_active_foreground: data.data.dark_sidebar_active_foreground || '222.2 47.4% 11.2%',
        };
        setTheme(themeData);
      } else {
        setMessage({ type: 'error', text: t('admin.theme.errorNoTheme', 'No active theme found') });
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.theme.errorLoadFailed', 'Failed to load theme') });
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (field: keyof ThemeConfig, hexValue: string) => {
    if (!theme) return;
    const hslValue = hexToHsl(hexValue);
    setTheme({ ...theme, [field]: hslValue });
  };

  const handleSave = async () => {
    if (!theme) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme)
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: t('admin.theme.successSaved', 'Theme saved successfully! Refreshing page...') });
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || t('admin.theme.errorSaveFailed', 'Failed to save theme') });
        // Auto-hide error messages after 5 seconds
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: t('admin.theme.errorSaveFailed', 'Failed to save theme') });
      // Auto-hide error messages after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!theme) {
    return (
      <AdminLayout>
        <div className="max-w-6xl">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{t('admin.theme.errorNoConfig', 'No theme configuration found. Please run the database migration.')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const prefix = mode === 'light' ? 'light_' : 'dark_';

  const colorGroups = [
    {
      title: t('admin.theme.categoryBrand', 'Brand Colors'),
      colors: [
        { key: 'primary', label: t('admin.theme.primary', 'Primary'), fgKey: 'primary_foreground' },
        { key: 'secondary', label: t('admin.theme.secondary', 'Secondary'), fgKey: 'secondary_foreground' }
      ]
    },
    {
      title: t('admin.theme.categoryFeedback', 'Feedback Colors'),
      colors: [
        { key: 'success', label: t('admin.theme.success', 'Success'), fgKey: 'success_foreground' },
        { key: 'destructive', label: t('admin.theme.error', 'Destructive'), fgKey: 'destructive_foreground' },
        { key: 'warning', label: t('admin.theme.warning', 'Warning'), fgKey: 'warning_foreground' },
        { key: 'info', label: t('admin.theme.info', 'Info'), fgKey: 'info_foreground' }
      ]
    },
    {
      title: t('admin.theme.categoryNeutral', 'Neutral Colors'),
      colors: [
        { key: 'background', label: t('admin.theme.background', 'Background'), fgKey: 'foreground' },
        { key: 'card', label: t('admin.theme.card', 'Card'), fgKey: 'card_foreground' },
        { key: 'popover', label: t('admin.theme.popover', 'Popover'), fgKey: 'popover_foreground' },
        { key: 'muted', label: t('admin.theme.muted', 'Muted'), fgKey: 'muted_foreground' },
        { key: 'accent', label: t('admin.theme.accent', 'Accent'), fgKey: 'accent_foreground' }
      ]
    },
    {
      title: t('admin.theme.categoryBorders', 'Borders & Inputs'),
      colors: [
        { key: 'border', label: t('admin.theme.border', 'Border') },
        { key: 'input', label: t('admin.theme.input', 'Input') },
        { key: 'ring', label: t('admin.theme.ring', 'Ring') }
      ]
    }
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" />
              {t('admin.theme.title', 'Theme & Design')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('admin.theme.subtitle', 'Customize colors and visual appearance')}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? t('admin.theme.saving', 'Saving...') : t('admin.theme.save', 'Save Changes')}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`rounded-lg p-4 ${message.type === 'success' ? 'bg-success/10 border border-success/20 text-success' : 'bg-destructive/10 border border-destructive/20 text-destructive'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-card border border-border rounded-lg p-1 flex gap-1">
          <button
            onClick={() => handleTabChange('colors')}
            className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'colors'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Palette className="h-4 w-4" />
            {t('admin.theme.colorsTab', 'Colors')}
          </button>
          <button
            onClick={() => handleTabChange('typography')}
            className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === 'typography'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Type className="h-4 w-4" />
            {t('admin.theme.typographyTab', 'Typography')}
          </button>
        </div>

        {/* Colors Tab Content */}
        {activeTab === 'colors' && (
          <>
            {/* Mode Toggle - Modern Design */}
            <div className="bg-gradient-to-br from-card to-muted/20 border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold mb-1">{t('admin.theme.editMode', 'Edit Mode')}</h3>
                  <p className="text-xs text-muted-foreground">{t('admin.theme.editModeHelp', 'Choose which color scheme to customize')}</p>
                </div>
                <div className="flex gap-2 bg-background rounded-lg p-1 shadow-inner">
                  <button
                    onClick={() => setMode('light')}
                    className={`px-4 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                      mode === 'light'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    {t('admin.theme.lightMode', 'Light')}
                  </button>
                  <button
                    onClick={() => setMode('dark')}
                    className={`px-4 py-2.5 rounded-md flex items-center gap-2 text-sm font-medium transition-all ${
                      mode === 'dark'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    {t('admin.theme.darkMode', 'Dark')}
                  </button>
                </div>
              </div>
            </div>

            {/* Color Editor - Modern Card Design */}
        <div className="space-y-6">
          {colorGroups.map((group) => (
            <div key={group.title} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                {group.title}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {group.colors.map((color) => {
                  const bgKey = `${prefix}${color.key}` as keyof ThemeConfig;
                  const fgKey = color.fgKey ? `${prefix}${color.fgKey}` as keyof ThemeConfig : null;
                  const bgValue = theme[bgKey] as string;
                  const fgValue = fgKey ? theme[fgKey] as string : null;

                  return (
                    <div key={color.key} className="space-y-3">
                      {/* Label */}
                      <label className="text-sm font-semibold text-foreground">{color.label}</label>

                      {/* Color Inputs */}
                      <div className="space-y-2">
                        {/* Background Color */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors group">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                            <input
                              type="color"
                              value={hslToHex(bgValue)}
                              onChange={(e) => handleColorChange(bgKey, e.target.value)}
                              className="relative w-16 h-16 rounded-xl border-4 border-background cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105"
                              style={{
                                boxShadow: `0 0 0 1px hsl(var(--border)), 0 4px 12px rgba(0,0,0,0.1)`,
                              }}
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-3 border-background shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                              <Palette className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wide">{t('admin.theme.colorBackground', 'Background')}</div>
                            <input
                              type="text"
                              value={bgValue}
                              onChange={(e) => setTheme({ ...theme, [bgKey]: e.target.value })}
                              className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                              placeholder="HSL"
                            />
                          </div>
                        </div>

                        {/* Foreground Color */}
                        {fgKey && fgValue && (
                          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors group">
                            <div className="relative">
                              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                              <input
                                type="color"
                                value={hslToHex(fgValue)}
                                onChange={(e) => handleColorChange(fgKey, e.target.value)}
                                className="relative w-16 h-16 rounded-xl border-4 border-background cursor-pointer shadow-lg hover:shadow-xl transition-all hover:scale-105"
                                style={{
                                  boxShadow: `0 0 0 1px hsl(var(--border)), 0 4px 12px rgba(0,0,0,0.1)`,
                                }}
                              />
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full border-3 border-background shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-0 group-hover:scale-100">
                                <Palette className="h-3 w-3 text-primary-foreground" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="text-xs text-muted-foreground mb-1.5 font-semibold uppercase tracking-wide">{t('admin.theme.colorForeground', 'Foreground')}</div>
                              <input
                                type="text"
                                value={fgValue}
                                onChange={(e) => setTheme({ ...theme, [fgKey]: e.target.value })}
                                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                placeholder={t('admin.theme.colorForegroundPlaceholder', 'Foreground HSL')}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Preview Card */}
                      <div
                        className="h-20 rounded-xl flex items-center justify-center text-sm font-semibold shadow-sm border-2 border-background relative overflow-hidden group"
                        style={{
                          background: `hsl(${bgValue})`,
                          color: fgValue ? `hsl(${fgValue})` : undefined
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="relative z-10">{t('admin.theme.preview', 'Preview')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Border Radius - Modern Card */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary"></div>
              {t('admin.theme.borderRadius', 'Border Radius')}
            </h2>
            <div className="max-w-md space-y-3">
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex-1">
                  <input
                    type="text"
                    value={theme.border_radius}
                    onChange={(e) => setTheme({ ...theme, border_radius: e.target.value })}
                    className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="0.5rem"
                  />
                </div>
                <div
                  className="w-16 h-16 bg-primary/20 border-2 border-primary flex items-center justify-center text-xs font-mono text-primary"
                  style={{ borderRadius: theme.border_radius }}
                >
                  {t('admin.theme.preview', 'Preview')}
                </div>
              </div>
              <p className="text-xs text-muted-foreground px-1">
                {t('admin.theme.borderRadiusHelp', 'Controls corner rounding (e.g., 0.5rem, 8px)')}
              </p>
            </div>
          </div>
        </div>

            {/* Save Button (Bottom) */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? t('admin.theme.saving', 'Saving...') : t('admin.theme.saveChanges', 'Save Changes')}
              </button>
            </div>
          </>
        )}

        {/* Typography Tab Content */}
        {activeTab === 'typography' && theme && (
          <div className="space-y-6">
            {/* Font Families - Modern Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                {t('admin.theme.fontFamilies', 'Font Families')}
              </h2>
              <div className="space-y-6">
                {/* Primary Font */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    {t('admin.theme.fontPrimary', 'Primary Font (Body Text)')}
                  </label>
                  <div className="relative">
                    <select
                      value={theme.font_family_primary}
                      onChange={(e) => setTheme({ ...theme, font_family_primary: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-10"
                    >
                      {Object.entries(FONT_OPTIONS).map(([groupKey, group]) => (
                        groupKey !== 'monospace' && (
                          <optgroup key={groupKey} label={group.label}>
                            {group.fonts.map((font) => (
                              <option key={font.value} value={font.value}>
                                {font.label}
                              </option>
                            ))}
                          </optgroup>
                        )
                      ))}
                      <option value={theme.font_family_primary}>Custom...</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    value={theme.font_family_primary}
                    onChange={(e) => setTheme({ ...theme, font_family_primary: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
                    placeholder="-apple-system, sans-serif"
                  />
                  <p className="text-xs text-muted-foreground px-1 mt-2">
                    {t('admin.theme.fontPrimaryHelp', 'Used for all body text and paragraphs')}
                  </p>
                  <div className="mt-3 p-3 bg-background rounded-md border border-border" style={{ fontFamily: theme.font_family_primary }}>
                    <p className="text-sm">{previewText.body}</p>
                  </div>
                </div>

                {/* Heading Font */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    {t('admin.theme.fontHeading', 'Heading Font')}
                  </label>
                  <div className="relative">
                    <select
                      value={theme.font_family_heading}
                      onChange={(e) => setTheme({ ...theme, font_family_heading: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-10"
                    >
                      {Object.entries(FONT_OPTIONS).map(([groupKey, group]) => (
                        groupKey !== 'monospace' && (
                          <optgroup key={groupKey} label={group.label}>
                            {group.fonts.map((font) => (
                              <option key={font.value} value={font.value}>
                                {font.label}
                              </option>
                            ))}
                          </optgroup>
                        )
                      ))}
                      <option value={theme.font_family_heading}>Custom...</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    value={theme.font_family_heading}
                    onChange={(e) => setTheme({ ...theme, font_family_heading: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
                    placeholder="-apple-system, sans-serif"
                  />
                  <p className="text-xs text-muted-foreground px-1 mt-2">
                    {t('admin.theme.fontHeadingHelp', 'Used for headings and titles')}
                  </p>
                  <div className="mt-3 p-3 bg-background rounded-md border border-border" style={{ fontFamily: theme.font_family_heading }}>
                    <h3 className="text-lg font-bold">{previewText.heading}</h3>
                  </div>
                </div>

                {/* Monospace Font */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                  <label className="text-sm font-semibold mb-3 block flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    {t('admin.theme.fontMono', 'Monospace Font (Code)')}
                  </label>
                  <div className="relative">
                    <select
                      value={theme.font_family_mono}
                      onChange={(e) => setTheme({ ...theme, font_family_mono: e.target.value })}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all pr-10"
                    >
                      {FONT_OPTIONS.monospace.fonts.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                      <option value={theme.font_family_mono}>Custom...</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <input
                    type="text"
                    value={theme.font_family_mono}
                    onChange={(e) => setTheme({ ...theme, font_family_mono: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mt-2"
                    placeholder="Monaco, Consolas, monospace"
                  />
                  <p className="text-xs text-muted-foreground px-1 mt-2">
                    {t('admin.theme.fontMonoHelp', 'Used for code blocks and technical text')}
                  </p>
                  <div className="mt-3 p-3 bg-background rounded-md border border-border" style={{ fontFamily: theme.font_family_mono }}>
                    <code className="text-sm">const example = "code"; {previewText.code}</code>
                  </div>
                </div>
              </div>
            </div>

            {/* Font Sizes */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                {t('admin.theme.fontSizes', 'Font Sizes')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'base', field: 'font_size_base', value: theme.font_size_base, placeholder: '16px' },
                  { key: 'xs', field: 'font_size_xs', value: theme.font_size_xs, placeholder: '0.75rem' },
                  { key: 'sm', field: 'font_size_sm', value: theme.font_size_sm, placeholder: '0.875rem' },
                  { key: 'md', field: 'font_size_md', value: theme.font_size_md, placeholder: '1rem' },
                  { key: 'lg', field: 'font_size_lg', value: theme.font_size_lg, placeholder: '1.125rem' },
                  { key: 'xl', field: 'font_size_xl', value: theme.font_size_xl, placeholder: '1.25rem' },
                  { key: '2xl', field: 'font_size_2xl', value: theme.font_size_2xl, placeholder: '1.5rem' },
                  { key: '3xl', field: 'font_size_3xl', value: theme.font_size_3xl, placeholder: '1.875rem' },
                  { key: '4xl', field: 'font_size_4xl', value: theme.font_size_4xl, placeholder: '2.25rem' },
                ].map(({ key, field, value, placeholder }) => (
                  <div key={key} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <label className="text-xs font-semibold mb-2 block text-muted-foreground uppercase">{key}</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTheme({ ...theme, [field]: adjustValue(value, -1) })}
                        className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        title="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                        className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={placeholder}
                      />
                      <button
                        onClick={() => setTheme({ ...theme, [field]: adjustValue(value, 1) })}
                        className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        title="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-2 text-center py-1" style={{ fontSize: value }}>
                      <span className="text-muted-foreground">Aa</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Font Weights */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                {t('admin.theme.fontWeights', 'Font Weights')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'normal', field: 'font_weight_normal', labelKey: 'admin.theme.weightNormal', label: 'Normal', value: theme.font_weight_normal, placeholder: '400', step: 100 },
                  { key: 'medium', field: 'font_weight_medium', labelKey: 'admin.theme.weightMedium', label: 'Medium', value: theme.font_weight_medium, placeholder: '500', step: 100 },
                  { key: 'semibold', field: 'font_weight_semibold', labelKey: 'admin.theme.weightSemibold', label: 'Semibold', value: theme.font_weight_semibold, placeholder: '600', step: 100 },
                  { key: 'bold', field: 'font_weight_bold', labelKey: 'admin.theme.weightBold', label: 'Bold', value: theme.font_weight_bold, placeholder: '700', step: 100 },
                ].map(({ key, field, labelKey, label, value, placeholder, step }) => (
                  <div key={key} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                    <label className="text-xs font-semibold mb-2 block text-muted-foreground">{t(labelKey, label)}</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setTheme({ ...theme, [field]: Math.max(100, parseInt(value) - step).toString() })}
                        className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        title="Decrease"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                        className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder={placeholder}
                      />
                      <button
                        onClick={() => setTheme({ ...theme, [field]: Math.min(900, parseInt(value) + step).toString() })}
                        className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                        title="Increase"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-2 text-center" style={{ fontWeight: value }}>
                      <span className="text-muted-foreground">Aa</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Line Heights & Letter Spacing */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Line Heights */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary"></div>
                  {t('admin.theme.lineHeights', 'Line Heights')}
                </h2>
                <div className="space-y-4">
                  {[
                    { key: 'tight', field: 'line_height_tight', labelKey: 'admin.theme.lineHeightTight', label: 'Tight', value: theme.line_height_tight, placeholder: '1.25' },
                    { key: 'normal', field: 'line_height_normal', labelKey: 'admin.theme.lineHeightNormal', label: 'Normal', value: theme.line_height_normal, placeholder: '1.5' },
                    { key: 'relaxed', field: 'line_height_relaxed', labelKey: 'admin.theme.lineHeightRelaxed', label: 'Relaxed', value: theme.line_height_relaxed, placeholder: '1.75' },
                  ].map(({ key, field, labelKey, label, value, placeholder }) => (
                    <div key={key} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <label className="text-xs font-semibold mb-2 block text-muted-foreground">{t(labelKey, label)}</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTheme({ ...theme, [field]: Math.max(0.5, parseFloat(value) - 0.1).toFixed(2) })}
                          className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          title="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                          className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder={placeholder}
                        />
                        <button
                          onClick={() => setTheme({ ...theme, [field]: (parseFloat(value) + 0.1).toFixed(2) })}
                          className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          title="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Letter Spacing */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary"></div>
                  {t('admin.theme.letterSpacing', 'Letter Spacing')}
                </h2>
                <div className="space-y-4">
                  {[
                    { key: 'tight', field: 'letter_spacing_tight', labelKey: 'admin.theme.letterSpacingTight', label: 'Tight', value: theme.letter_spacing_tight, placeholder: '-0.025em' },
                    { key: 'normal', field: 'letter_spacing_normal', labelKey: 'admin.theme.letterSpacingNormal', label: 'Normal', value: theme.letter_spacing_normal, placeholder: '0' },
                    { key: 'wide', field: 'letter_spacing_wide', labelKey: 'admin.theme.letterSpacingWide', label: 'Wide', value: theme.letter_spacing_wide, placeholder: '0.025em' },
                  ].map(({ key, field, labelKey, label, value, placeholder }) => (
                    <div key={key} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                      <label className="text-xs font-semibold mb-2 block text-muted-foreground">{t(labelKey, label)}</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setTheme({ ...theme, [field]: adjustValue(value, -1, 0.005) })}
                          className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          title="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                          className="flex-1 px-2 py-2 bg-background border border-border rounded-lg text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder={placeholder}
                        />
                        <button
                          onClick={() => setTheme({ ...theme, [field]: adjustValue(value, 1, 0.005) })}
                          className="p-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          title="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Text Colors */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-primary"></div>
                {t('admin.theme.textColors', 'Text Colors')}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Light Mode Text Colors */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Sun className="h-4 w-4" />
                    {t('admin.theme.lightMode', 'Light Mode')}
                  </h3>

                  {[
                    { key: 'body', field: 'light_text_body', labelKey: 'admin.theme.textBody', label: 'Body Text' },
                    { key: 'heading', field: 'light_text_heading', labelKey: 'admin.theme.textHeading', label: 'Heading Text' },
                    { key: 'muted', field: 'light_text_muted', labelKey: 'admin.theme.textMuted', label: 'Muted Text' },
                    { key: 'link', field: 'light_text_link', labelKey: 'admin.theme.textLink', label: 'Link Text' },
                  ].map(({ key, field, labelKey, label }) => (
                    <div key={key} className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:border-primary/30 transition-all group">
                      <label className="text-xs font-semibold mb-2 block text-muted-foreground group-hover:text-foreground transition-colors">
                        {t(labelKey, label)}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="color"
                            value={hslToHex(theme[field as keyof ThemeConfig] as string)}
                            onChange={(e) => setTheme({ ...theme, [field]: hexToHsl(e.target.value) })}
                            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, hsl(${theme[field as keyof ThemeConfig]}) 0%, hsl(${theme[field as keyof ThemeConfig]}) 100%)`,
                            }}
                          />
                          <Palette className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md" />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme[field as keyof ThemeConfig] as string}
                            onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="222.2 84% 4.9%"
                          />
                          <div className="mt-2 px-2 py-1 bg-background rounded border border-border">
                            <span style={{ color: `hsl(${theme[field as keyof ThemeConfig]})` }} className="text-sm">
                              {key === 'body' ? previewText.body : key === 'heading' ? previewText.heading : key === 'muted' ? t('admin.theme.textMutedPreview', 'Secondary text') : t('admin.theme.textLinkPreview', 'Link text')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dark Mode Text Colors */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                    <Moon className="h-4 w-4" />
                    {t('admin.theme.darkMode', 'Dark Mode')}
                  </h3>

                  {[
                    { key: 'body', field: 'dark_text_body', labelKey: 'admin.theme.textBody', label: 'Body Text' },
                    { key: 'heading', field: 'dark_text_heading', labelKey: 'admin.theme.textHeading', label: 'Heading Text' },
                    { key: 'muted', field: 'dark_text_muted', labelKey: 'admin.theme.textMuted', label: 'Muted Text' },
                    { key: 'link', field: 'dark_text_link', labelKey: 'admin.theme.textLink', label: 'Link Text' },
                  ].map(({ key, field, labelKey, label }) => (
                    <div key={key} className="p-4 bg-muted/20 rounded-lg border border-border/50 hover:border-primary/30 transition-all group">
                      <label className="text-xs font-semibold mb-2 block text-muted-foreground group-hover:text-foreground transition-colors">
                        {t(labelKey, label)}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <input
                            type="color"
                            value={hslToHex(theme[field as keyof ThemeConfig] as string)}
                            onChange={(e) => setTheme({ ...theme, [field]: hexToHsl(e.target.value) })}
                            className="w-16 h-16 rounded-lg cursor-pointer border-2 border-border hover:border-primary/50 transition-all shadow-sm hover:shadow-lg hover:scale-105"
                            style={{
                              background: `linear-gradient(135deg, hsl(${theme[field as keyof ThemeConfig]}) 0%, hsl(${theme[field as keyof ThemeConfig]}) 100%)`,
                            }}
                          />
                          <Palette className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md" />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={theme[field as keyof ThemeConfig] as string}
                            onChange={(e) => setTheme({ ...theme, [field]: e.target.value })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="210 40% 98%"
                          />
                          <div className="mt-2 px-2 py-1 bg-background rounded border border-border">
                            <span style={{ color: `hsl(${theme[field as keyof ThemeConfig]})` }} className="text-sm">
                              {key === 'body' ? previewText.body : key === 'heading' ? previewText.heading : key === 'muted' ? t('admin.theme.textMutedPreview', 'Secondary text') : t('admin.theme.textLinkPreview', 'Link text')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? t('admin.theme.saving', 'Saving...') : t('admin.theme.saveChanges', 'Save Changes')}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
