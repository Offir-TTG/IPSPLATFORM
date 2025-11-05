'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ThemeConfig {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;

  // Typography
  fontFamily: string;
  headingFontFamily: string;
  fontSize: string;

  // Layout
  borderRadius: string;

  // Branding
  platformName: string;
  logoText: string;
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  accentColor: '#10b981',
  backgroundColor: '#ffffff',
  foregroundColor: '#0f172a',
  fontFamily: 'Inter',
  headingFontFamily: 'Inter',
  fontSize: '16px',
  borderRadius: '0.5rem',
  platformName: 'Parenting School',
  logoText: 'Parenting School',
};

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('platformTheme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeState(parsedTheme);
        applyTheme(parsedTheme);
      } catch (e) {
        console.error('Failed to parse saved theme:', e);
      }
    } else {
      // Fetch theme from API
      fetchTheme();
    }
  }, []);

  const fetchTheme = async () => {
    try {
      const response = await fetch('/api/admin/theme');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setThemeState(data.data);
          applyTheme(data.data);
          localStorage.setItem('platformTheme', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme:', error);
    }
  };

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('platformTheme', JSON.stringify(newTheme));
  };

  const resetTheme = () => {
    setThemeState(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.removeItem('platformTheme');
  };

  const applyTheme = (themeConfig: ThemeConfig) => {
    const root = document.documentElement;

    // Convert hex colors to HSL for CSS variables
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0 0% 0%';

      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0,
        s = 0,
        l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
            break;
          case g:
            h = ((b - r) / d + 2) / 6;
            break;
          case b:
            h = ((r - g) / d + 4) / 6;
            break;
        }
      }

      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);

      return `${h} ${s}% ${l}%`;
    };

    // Apply color variables
    root.style.setProperty('--primary', hexToHSL(themeConfig.primaryColor));
    root.style.setProperty('--secondary', hexToHSL(themeConfig.secondaryColor));
    root.style.setProperty('--accent', hexToHSL(themeConfig.accentColor));
    root.style.setProperty('--background', hexToHSL(themeConfig.backgroundColor));
    root.style.setProperty('--foreground', hexToHSL(themeConfig.foregroundColor));

    // Apply typography
    root.style.setProperty('--font-family', themeConfig.fontFamily);
    root.style.setProperty('--heading-font-family', themeConfig.headingFontFamily);
    root.style.setProperty('--font-size', themeConfig.fontSize);

    // Apply layout
    root.style.setProperty('--radius', themeConfig.borderRadius);

    // Update document title
    if (typeof document !== 'undefined') {
      document.title = themeConfig.platformName;
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
