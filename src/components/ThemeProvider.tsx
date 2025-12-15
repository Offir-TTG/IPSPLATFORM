'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/AppContext';

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

  // Sidebar colors - Light mode
  light_sidebar_background: string;
  light_sidebar_foreground: string;
  light_sidebar_border: string;
  light_sidebar_active: string;
  light_sidebar_active_foreground: string;

  // Sidebar colors - Dark mode
  dark_sidebar_background: string;
  dark_sidebar_foreground: string;
  dark_sidebar_border: string;
  dark_sidebar_active: string;
  dark_sidebar_active_foreground: string;

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { effectiveTheme } = useTheme();

  useEffect(() => {
    const loadTheme = async () => {
      try {
        console.log('[ThemeProvider] Loading theme from API...');
        const response = await fetch('/api/theme');
        const data = await response.json();

        console.log('[ThemeProvider] Theme API response:', data);

        if (data.success && data.data) {
          setTheme(data.data);
          applyTheme(data.data, effectiveTheme);

          // Cache theme in context-aware storage to prevent flash on reload
          // Wizard uses sessionStorage, Admin uses localStorage
          try {
            const storage = typeof window !== 'undefined' && window.location.pathname.includes('/enroll/wizard/')
              ? sessionStorage
              : localStorage;
            storage.setItem('cached_theme', JSON.stringify(data.data));
          } catch (e) {
            console.warn('[ThemeProvider] Failed to cache theme:', e);
          }

          console.log('[ThemeProvider] Theme applied successfully!');
        } else {
          console.warn('[ThemeProvider] No theme data returned');
        }
      } catch (error) {
        console.error('[ThemeProvider] Failed to load theme:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Re-apply theme when dark/light mode changes
  useEffect(() => {
    if (theme) {
      console.log('[ThemeProvider] Effective theme changed to:', effectiveTheme);
      applyTheme(theme, effectiveTheme);
    }
  }, [effectiveTheme, theme]);

  const applyTheme = (themeConfig: ThemeConfig, mode: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;

    console.log('[ThemeProvider] Applying theme:', {
      mode,
      primary: mode === 'light' ? themeConfig.light_primary : themeConfig.dark_primary,
      background: mode === 'light' ? themeConfig.light_background : themeConfig.dark_background,
      themeName: themeConfig.theme_name
    });

    const root = document.documentElement;

    // Apply colors based on current mode (light or dark)
    const colors = mode === 'light' ? {
      background: themeConfig.light_background,
      foreground: themeConfig.light_foreground,
      card: themeConfig.light_card,
      cardForeground: themeConfig.light_card_foreground,
      popover: themeConfig.light_popover,
      popoverForeground: themeConfig.light_popover_foreground,
      primary: themeConfig.light_primary,
      primaryForeground: themeConfig.light_primary_foreground,
      secondary: themeConfig.light_secondary,
      secondaryForeground: themeConfig.light_secondary_foreground,
      muted: themeConfig.light_muted,
      mutedForeground: themeConfig.light_muted_foreground,
      accent: themeConfig.light_accent,
      accentForeground: themeConfig.light_accent_foreground,
      destructive: themeConfig.light_destructive,
      destructiveForeground: themeConfig.light_destructive_foreground,
      success: themeConfig.light_success,
      successForeground: themeConfig.light_success_foreground,
      warning: themeConfig.light_warning,
      warningForeground: themeConfig.light_warning_foreground,
      info: themeConfig.light_info,
      infoForeground: themeConfig.light_info_foreground,
      border: themeConfig.light_border,
      input: themeConfig.light_input,
      ring: themeConfig.light_ring,
      textBody: themeConfig.light_text_body,
      textHeading: themeConfig.light_text_heading,
      textMuted: themeConfig.light_text_muted,
      textLink: themeConfig.light_text_link,
    } : {
      background: themeConfig.dark_background,
      foreground: themeConfig.dark_foreground,
      card: themeConfig.dark_card,
      cardForeground: themeConfig.dark_card_foreground,
      popover: themeConfig.dark_popover,
      popoverForeground: themeConfig.dark_popover_foreground,
      primary: themeConfig.dark_primary,
      primaryForeground: themeConfig.dark_primary_foreground,
      secondary: themeConfig.dark_secondary,
      secondaryForeground: themeConfig.dark_secondary_foreground,
      muted: themeConfig.dark_muted,
      mutedForeground: themeConfig.dark_muted_foreground,
      accent: themeConfig.dark_accent,
      accentForeground: themeConfig.dark_accent_foreground,
      destructive: themeConfig.dark_destructive,
      destructiveForeground: themeConfig.dark_destructive_foreground,
      success: themeConfig.dark_success,
      successForeground: themeConfig.dark_success_foreground,
      warning: themeConfig.dark_warning,
      warningForeground: themeConfig.dark_warning_foreground,
      info: themeConfig.dark_info,
      infoForeground: themeConfig.dark_info_foreground,
      border: themeConfig.dark_border,
      input: themeConfig.dark_input,
      ring: themeConfig.dark_ring,
      textBody: themeConfig.dark_text_body,
      textHeading: themeConfig.dark_text_heading,
      textMuted: themeConfig.dark_text_muted,
      textLink: themeConfig.dark_text_link,
    };

    // Apply color CSS variables
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--popover', colors.popover);
    root.style.setProperty('--popover-foreground', colors.popoverForeground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--destructive', colors.destructive);
    root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
    root.style.setProperty('--success', colors.success);
    root.style.setProperty('--success-foreground', colors.successForeground);
    root.style.setProperty('--warning', colors.warning);
    root.style.setProperty('--warning-foreground', colors.warningForeground);
    root.style.setProperty('--info', colors.info);
    root.style.setProperty('--info-foreground', colors.infoForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.input);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--radius', themeConfig.border_radius);

    // Apply typography variables
    root.style.setProperty('--font-family-primary', themeConfig.font_family_primary);
    root.style.setProperty('--font-family-heading', themeConfig.font_family_heading);
    root.style.setProperty('--font-family-mono', themeConfig.font_family_mono);
    root.style.setProperty('--font-size-base', themeConfig.font_size_base);
    root.style.setProperty('--font-size-xs', themeConfig.font_size_xs);
    root.style.setProperty('--font-size-sm', themeConfig.font_size_sm);
    root.style.setProperty('--font-size-md', themeConfig.font_size_md);
    root.style.setProperty('--font-size-lg', themeConfig.font_size_lg);
    root.style.setProperty('--font-size-xl', themeConfig.font_size_xl);
    root.style.setProperty('--font-size-2xl', themeConfig.font_size_2xl);
    root.style.setProperty('--font-size-3xl', themeConfig.font_size_3xl);
    root.style.setProperty('--font-size-4xl', themeConfig.font_size_4xl);
    root.style.setProperty('--font-weight-normal', themeConfig.font_weight_normal);
    root.style.setProperty('--font-weight-medium', themeConfig.font_weight_medium);
    root.style.setProperty('--font-weight-semibold', themeConfig.font_weight_semibold);
    root.style.setProperty('--font-weight-bold', themeConfig.font_weight_bold);
    root.style.setProperty('--line-height-tight', themeConfig.line_height_tight);
    root.style.setProperty('--line-height-normal', themeConfig.line_height_normal);
    root.style.setProperty('--line-height-relaxed', themeConfig.line_height_relaxed);
    root.style.setProperty('--letter-spacing-tight', themeConfig.letter_spacing_tight);
    root.style.setProperty('--letter-spacing-normal', themeConfig.letter_spacing_normal);
    root.style.setProperty('--letter-spacing-wide', themeConfig.letter_spacing_wide);

    // Apply text colors
    root.style.setProperty('--text-body', colors.textBody);
    root.style.setProperty('--text-heading', colors.textHeading);
    root.style.setProperty('--text-muted', colors.textMuted);
    root.style.setProperty('--text-link', colors.textLink);

    // Apply sidebar colors - inherit from main theme
    root.style.setProperty('--sidebar-background', colors.background);
    root.style.setProperty('--sidebar-foreground', colors.textBody);
    root.style.setProperty('--sidebar-border', colors.border);
    root.style.setProperty('--sidebar-active', colors.primary);
    root.style.setProperty('--sidebar-active-foreground', colors.primaryForeground);
  };

  // Show children even while loading to prevent layout shift
  return <>{children}</>;
}
