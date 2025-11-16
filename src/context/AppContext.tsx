'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeTenantContext } from '@/lib/supabase/client';
import type { Tenant } from '@/lib/tenant/types';

// ============================================================================
// TYPES
// ============================================================================

type Direction = 'rtl' | 'ltr';
type Theme = 'light' | 'dark' | 'system';
type LanguageContext = 'admin' | 'user';

interface LanguageInfo {
  code: string;
  name: string;
  native_name: string;
  direction: Direction;
  is_active: boolean;
  is_default: boolean;
}

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  role: string | null;
}

interface AppContextType {
  // Language Management
  adminLanguage: string;
  userLanguage: string;
  adminDirection: Direction;
  userDirection: Direction;
  availableLanguages: LanguageInfo[];
  setAdminLanguage: (lang: string) => void;
  setUserLanguage: (lang: string) => void;
  t: (key: string, fallback?: string, context?: LanguageContext) => string;
  loading: boolean;

  // Theme Management
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;

  // Tenant Management
  tenant: TenantInfo | null;
  tenantLoading: boolean;
  setTenant: (tenant: TenantInfo | null) => void;
  isSuperAdmin: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Helper function to get initial language from localStorage
  const getInitialLanguage = (key: string, defaultLang: string = 'he'): string => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(key);
      if (value) return value;

      // Fallback: user_language → admin_language → default
      if (key === 'user_language') {
        const adminLang = localStorage.getItem('admin_language');
        if (adminLang) return adminLang;
      }
    }
    return defaultLang;
  };

  const getInitialDirection = (lang: string): Direction => {
    const rtlLanguages = ['he', 'ar', 'fa', 'ur', 'yi'];
    return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
  };

  // State initialization
  const [adminLanguage, setAdminLanguageState] = useState<string>(() => getInitialLanguage('admin_language'));
  const [userLanguage, setUserLanguageState] = useState<string>(() => getInitialLanguage('user_language'));
  const [adminDirection, setAdminDirection] = useState<Direction>(() => getInitialDirection(getInitialLanguage('admin_language')));
  const [userDirection, setUserDirection] = useState<Direction>(() => getInitialDirection(getInitialLanguage('user_language')));
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>([]);
  const [adminTranslations, setAdminTranslations] = useState<Record<string, string>>({});
  const [userTranslations, setUserTranslations] = useState<Record<string, string>>({});
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingAdminTranslations, setLoadingAdminTranslations] = useState(true);
  const [loadingUserTranslations, setLoadingUserTranslations] = useState(true);

  // Theme state
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme | null;
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        return saved;
      }
    }
    return 'system';
  });
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  // Tenant state
  const [tenant, setTenantState] = useState<TenantInfo | null>(() => {
    if (typeof window !== 'undefined') {
      const tenantId = localStorage.getItem('tenant_id');
      const tenantSlug = localStorage.getItem('tenant_slug');
      const tenantName = localStorage.getItem('tenant_name');
      const tenantRole = localStorage.getItem('tenant_role');

      if (tenantId && tenantSlug && tenantName) {
        return { id: tenantId, slug: tenantSlug, name: tenantName, role: tenantRole };
      }
    }
    return null;
  });
  const [tenantLoading, setTenantLoading] = useState(true); // Start as true, will be set to false after initialization
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // ============================================================================
  // TENANT MANAGEMENT
  // ============================================================================

  // Initialize tenant context on mount
  useEffect(() => {
    const initTenant = async () => {
      setTenantLoading(true);
      try {
        await initializeTenantContext();

        // After initialization, get tenant info from localStorage
        const tenantId = localStorage.getItem('tenant_id');
        const tenantSlug = localStorage.getItem('tenant_slug');
        const tenantName = localStorage.getItem('tenant_name');
        const tenantRole = localStorage.getItem('tenant_role');

        if (tenantId && tenantSlug) {
          setTenantState({
            id: tenantId,
            slug: tenantSlug,
            name: tenantName || tenantSlug,
            role: tenantRole,
          });
        }

        // Check if user is super admin - MUST complete before loading finishes
        try {
          const response = await fetch('/api/superadmin/stats');
          const data = await response.json();
          setIsSuperAdmin(data.success === true);
        } catch (error) {
          setIsSuperAdmin(false);
        }
      } catch (error) {
        console.error('Failed to initialize tenant context:', error);
        setIsSuperAdmin(false); // Ensure we set this even on error
      } finally {
        // CRITICAL: Add micro-delay to ensure state updates propagate
        // React state updates are asynchronous, so we wait for next tick
        await new Promise(resolve => setTimeout(resolve, 0));
        setTenantLoading(false);
      }
    };

    initTenant();
  }, []);

  const setTenant = (newTenant: TenantInfo | null) => {
    setTenantState(newTenant);

    if (newTenant) {
      localStorage.setItem('tenant_id', newTenant.id);
      localStorage.setItem('tenant_slug', newTenant.slug);
      localStorage.setItem('tenant_name', newTenant.name);
      if (newTenant.role) {
        localStorage.setItem('tenant_role', newTenant.role);
      }
    } else {
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('tenant_slug');
      localStorage.removeItem('tenant_name');
      localStorage.removeItem('tenant_role');
    }
  };

  // ============================================================================
  // THEME MANAGEMENT
  // ============================================================================

  useEffect(() => {
    const updateEffectiveTheme = () => {
      if (theme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setEffectiveTheme(systemPrefersDark ? 'dark' : 'light');
      } else {
        setEffectiveTheme(theme);
      }
    };

    updateEffectiveTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => updateEffectiveTheme();
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [effectiveTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    if (effectiveTheme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  // ============================================================================
  // LANGUAGE MANAGEMENT
  // ============================================================================

  // Load available languages on mount - ONLY ONCE
  // NOTE: This does NOT update document.dir - that's handled by:
  // 1. Inline script in layout.tsx (initial load)
  // 2. setAdminLanguage/setUserLanguage functions (user switches language)
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetch('/api/admin/languages');
        const data = await response.json();

        if (data.success && data.data) {
          setAvailableLanguages(data.data.filter((l: LanguageInfo) => l.is_active));
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
      } finally {
        setLoadingLanguages(false);
      }
    };

    loadLanguages();
  }, []);

  // Load admin translations when language changes
  useEffect(() => {
    if (!adminLanguage) return;

    const loadTranslations = async () => {
      setLoadingAdminTranslations(true);
      try {
        const response = await fetch(`/api/translations?language=${adminLanguage}&context=admin`);
        const data = await response.json();

        if (data.success && data.data) {
          setAdminTranslations(data.data);
        }
      } catch (error) {
        console.error('Failed to load admin translations:', error);
      } finally {
        setLoadingAdminTranslations(false);
      }
    };

    loadTranslations();
  }, [adminLanguage]);

  // Load user translations when language changes
  useEffect(() => {
    if (!userLanguage) return;

    const loadTranslations = async () => {
      setLoadingUserTranslations(true);
      try {
        const response = await fetch(`/api/translations?language=${userLanguage}&context=user`);
        const data = await response.json();

        if (data.success && data.data) {
          setUserTranslations(data.data);
        }
      } catch (error) {
        console.error('Failed to load user translations:', error);
      } finally {
        setLoadingUserTranslations(false);
      }
    };

    loadTranslations();
  }, [userLanguage]);

  // Set admin language
  const setAdminLanguage = (lang: string) => {
    const langInfo = availableLanguages.find((l) => l.code === lang);
    if (!langInfo) return;

    setAdminLanguageState(lang);
    setAdminDirection(langInfo.direction);
    localStorage.setItem('admin_language', lang);

    // Update document - this is the ONLY place we update on language change
    document.documentElement.lang = lang;
    document.documentElement.dir = langInfo.direction;
  };

  // Set user language
  const setUserLanguage = (lang: string) => {
    const langInfo = availableLanguages.find((l) => l.code === lang);
    if (!langInfo) return;

    setUserLanguageState(lang);
    setUserDirection(langInfo.direction);
    localStorage.setItem('user_language', lang);

    // Update document - this is the ONLY place we update on language change
    document.documentElement.lang = lang;
    document.documentElement.dir = langInfo.direction;
  };

  // Translation function
  const t = (key: string, fallback?: string, context: LanguageContext = 'user'): string => {
    const translations = context === 'admin' ? adminTranslations : userTranslations;
    return translations[key] || fallback || key;
  };

  const loading = loadingLanguages || loadingAdminTranslations || loadingUserTranslations;

  return (
    <AppContext.Provider
      value={{
        adminLanguage,
        userLanguage,
        adminDirection,
        userDirection,
        availableLanguages,
        setAdminLanguage,
        setUserLanguage,
        t,
        loading,
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
        tenant,
        tenantLoading,
        setTenant,
        isSuperAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useAdminLanguage() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAdminLanguage must be used within an AppProvider');
  }

  return {
    language: context.adminLanguage,
    direction: context.adminDirection,
    availableLanguages: context.availableLanguages,
    setLanguage: context.setAdminLanguage,
    t: (key: string, fallback?: string) => context.t(key, fallback, 'admin'),
    loading: context.loading,
  };
}

export function useUserLanguage() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useUserLanguage must be used within an AppProvider');
  }

  return {
    language: context.userLanguage,
    direction: context.userDirection,
    availableLanguages: context.availableLanguages,
    setLanguage: context.setUserLanguage,
    t: (key: string, fallback?: string) => context.t(key, fallback, 'user'),
    loading: context.loading,
  };
}

export function useTheme() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within an AppProvider');
  }

  return {
    theme: context.theme,
    effectiveTheme: context.effectiveTheme,
    setTheme: context.setTheme,
    toggleTheme: context.toggleTheme,
    isDark: context.effectiveTheme === 'dark',
    isLight: context.effectiveTheme === 'light',
  };
}

export function useLanguage() {
  return useUserLanguage();
}

export function useTenant() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within an AppProvider');
  }

  return {
    tenant: context.tenant,
    loading: context.tenantLoading,
    setTenant: context.setTenant,
    tenantId: context.tenant?.id || null,
    tenantSlug: context.tenant?.slug || null,
    tenantName: context.tenant?.name || null,
    tenantRole: context.tenant?.role || null,
    isAdmin: context.tenant?.role === 'admin' || context.tenant?.role === 'owner',
    isOwner: context.tenant?.role === 'owner',
    isInstructor: context.tenant?.role === 'instructor' || context.tenant?.role === 'admin' || context.tenant?.role === 'owner',
    isSuperAdmin: context.isSuperAdmin,
  };
}
