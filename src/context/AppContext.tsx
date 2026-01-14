'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeTenantContext } from '@/lib/supabase/client';
import type { Tenant } from '@/lib/tenant/types';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

// CACHE VERSION: Increment this number when you need to invalidate all translation caches
// This forces all clients to fetch fresh translations from the API
const TRANSLATION_CACHE_VERSION = 12;

// Maximum cache age in milliseconds (1 hour)
const MAX_CACHE_AGE = 60 * 60 * 1000;

type Direction = 'rtl' | 'ltr';
type Theme = 'light' | 'dark' | 'system';
type LanguageContext = 'admin' | 'user';

interface CachedTranslations {
  version: number;
  timestamp: number;
  data: Record<string, string>;
}

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
  t: (key: string, params?: Record<string, any> | string, context?: LanguageContext) => string;
  loading: boolean;
  clearTranslationCache: () => void;

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

export function AppProvider({ children }: { children: React.ReactNode}) {
  // Helper function to get initial language from localStorage with fallback hierarchy
  const getInitialLanguage = (key: string): string => {
    if (typeof window !== 'undefined') {
      // 1. Check localStorage (runtime selection)
      const value = localStorage.getItem(key);
      if (value) return value;

      // 2. Check user's preferred_language from localStorage cache (set during app init)
      const userPreferredLang = localStorage.getItem('user_preferred_language');
      if (userPreferredLang && userPreferredLang !== 'null') return userPreferredLang;

      // 3. Fallback: user_language → admin_language
      if (key === 'user_language') {
        const adminLang = localStorage.getItem('admin_language');
        if (adminLang) return adminLang;
      }

      // 4. Check tenant's default_language from localStorage cache (set during app init)
      const tenantDefaultLang = localStorage.getItem('tenant_default_language');
      if (tenantDefaultLang && tenantDefaultLang !== 'null') return tenantDefaultLang;
    }

    // 5. Final fallback to English (universal default)
    return 'en';
  };

  const getInitialDirection = (lang: string): Direction => {
    const rtlLanguages = ['he', 'ar', 'fa', 'ur', 'yi'];
    return rtlLanguages.includes(lang) ? 'rtl' : 'ltr';
  };

  // Helper to load cached translations synchronously with version and age validation
  const getInitialTranslations = (language: string, context: 'admin' | 'user'): Record<string, string> => {
    if (typeof window !== 'undefined') {
      const cacheKey = `translations_${context}_${language}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        try {
          const parsedCache: CachedTranslations = JSON.parse(cached);

          // Validate cache version
          if (parsedCache.version !== TRANSLATION_CACHE_VERSION) {
            console.log(`[Translations] Cache version mismatch (${parsedCache.version} vs ${TRANSLATION_CACHE_VERSION}), invalidating`);
            localStorage.removeItem(cacheKey);
            return {};
          }

          // Validate cache age
          const cacheAge = Date.now() - parsedCache.timestamp;
          if (cacheAge > MAX_CACHE_AGE) {
            console.log(`[Translations] Cache expired (${Math.round(cacheAge / 1000 / 60)} minutes old), invalidating`);
            localStorage.removeItem(cacheKey);
            return {};
          }

          // Cache is valid
          console.log(`[Translations] Using valid cache for ${context}/${language} (${Math.round(cacheAge / 1000 / 60)} minutes old)`);
          return parsedCache.data;
        } catch (e) {
          console.error(`Failed to parse cached ${context} translations:`, e);
          localStorage.removeItem(cacheKey);
        }
      }
    }
    return {};
  };

  // State initialization
  const [adminLanguage, setAdminLanguageState] = useState<string>(() => getInitialLanguage('admin_language'));
  const [userLanguage, setUserLanguageState] = useState<string>(() => getInitialLanguage('user_language'));
  const [adminDirection, setAdminDirection] = useState<Direction>(() => getInitialDirection(getInitialLanguage('admin_language')));
  const [userDirection, setUserDirection] = useState<Direction>(() => getInitialDirection(getInitialLanguage('user_language')));
  const [availableLanguages, setAvailableLanguages] = useState<LanguageInfo[]>([]);
  const [adminTranslations, setAdminTranslations] = useState<Record<string, string>>(() => {
    const cached = getInitialTranslations(getInitialLanguage('admin_language'), 'admin');
    return cached;
  });
  const [userTranslations, setUserTranslations] = useState<Record<string, string>>(() => {
    const cached = getInitialTranslations(getInitialLanguage('user_language'), 'user');
    return cached;
  });
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingAdminTranslations, setLoadingAdminTranslations] = useState(() => {
    // If we have cached translations, we're not loading
    const cached = getInitialTranslations(getInitialLanguage('admin_language'), 'admin');
    return Object.keys(cached).length === 0;
  });
  const [loadingUserTranslations, setLoadingUserTranslations] = useState(() => {
    // If we have cached translations, we're not loading
    const cached = getInitialTranslations(getInitialLanguage('user_language'), 'user');
    return Object.keys(cached).length === 0;
  });

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

        // After initialization, get tenant info from context-aware storage
        // Wizard uses sessionStorage, Admin uses localStorage
        const storage = typeof window !== 'undefined' && window.location.pathname.includes('/enroll/wizard/')
          ? sessionStorage
          : localStorage;

        const tenantId = storage.getItem('tenant_id');
        const tenantSlug = storage.getItem('tenant_slug');
        const tenantName = storage.getItem('tenant_name');
        const tenantRole = storage.getItem('tenant_role');

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

  // Fetch and cache language preferences (tenant default + user preference)
  useEffect(() => {
    const fetchLanguagePreferences = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Fetch tenant's default language
        const tenantResponse = await fetch('/api/admin/tenant');
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          if (tenantData.success && tenantData.data.default_language) {
            const newTenantDefaultLang = tenantData.data.default_language;
            const oldTenantDefaultLang = localStorage.getItem('tenant_default_language');

            // Update cached tenant default language
            localStorage.setItem('tenant_default_language', newTenantDefaultLang);

            // If tenant default language changed, we need to update the UI language for users with Auto preference
            if (oldTenantDefaultLang && oldTenantDefaultLang !== newTenantDefaultLang) {
              // Fetch user's preferred language to check if it's null (Auto)
              const userResponse = await fetch('/api/user/profile');
              if (userResponse.ok) {
                const userData = await userResponse.json();
                const userPreferredLang = userData.data.preferences?.regional?.language;

                // If user has Auto preference (null), update the language
                if (userPreferredLang === null) {
                  console.log('[Language] Tenant default changed and user has Auto preference, updating language to:', newTenantDefaultLang);
                  setUserLanguageState(newTenantDefaultLang);
                  const newDirection = getInitialDirection(newTenantDefaultLang);
                  setUserDirection(newDirection);
                  localStorage.removeItem('user_language'); // Clear runtime override to use new default

                  // Update document direction
                  if (typeof document !== 'undefined') {
                    document.documentElement.lang = newTenantDefaultLang;
                    document.documentElement.dir = newDirection;
                  }
                }
              }
            }
          }
        }

        // Fetch user's preferred language
        const userResponse = await fetch('/api/user/profile');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.data.preferences?.regional?.language !== undefined) {
            const userLang = userData.data.preferences.regional.language;
            localStorage.setItem('user_preferred_language', userLang || 'null');

            // If user has a specific preference, use it; if null, use tenant default
            if (userLang === null) {
              const tenantDefaultLang = localStorage.getItem('tenant_default_language');
              if (tenantDefaultLang && tenantDefaultLang !== 'null') {
                console.log('[Language] User has Auto preference, applying tenant default:', tenantDefaultLang);
                setUserLanguageState(tenantDefaultLang);
                const newDirection = getInitialDirection(tenantDefaultLang);
                setUserDirection(newDirection);

                // Update document direction
                if (typeof document !== 'undefined') {
                  document.documentElement.lang = tenantDefaultLang;
                  document.documentElement.dir = newDirection;
                }
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - we'll use defaults
        console.debug('Could not fetch language preferences:', error);
      }
    };

    // Only fetch after tenant is loaded
    if (!tenantLoading) {
      fetchLanguagePreferences();

      // Set up periodic check every 30 seconds to detect tenant default language changes
      const intervalId = setInterval(() => {
        fetchLanguagePreferences();
      }, 30000); // 30 seconds

      return () => clearInterval(intervalId);
    }
  }, [tenantLoading]);

  // Listen for localStorage changes from other tabs/browsers
  // This detects when wizard might interfere with admin
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Storage events only fire when localStorage is changed in ANOTHER tab/window
      // Check if tenant_id was changed
      if (e.key === 'tenant_id' && e.newValue !== e.oldValue) {
        console.warn('[AppContext] ⚠️ Tenant changed in another tab/browser!', {
          oldValue: e.oldValue,
          newValue: e.newValue,
          url: e.url
        });

        // DON'T auto-reload - just log the warning
        // The context-aware storage should prevent this from happening
        console.warn('[AppContext] This should not happen with sessionStorage isolation!');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setTenant = (newTenant: TenantInfo | null) => {
    setTenantState(newTenant);

    // Use context-aware storage to prevent cross-browser interference
    // Wizard uses sessionStorage (isolated), Admin uses localStorage (persistent)
    const storage = typeof window !== 'undefined' && window.location.pathname.includes('/enroll/wizard/')
      ? sessionStorage
      : localStorage;

    if (newTenant) {
      storage.setItem('tenant_id', newTenant.id);
      storage.setItem('tenant_slug', newTenant.slug);
      storage.setItem('tenant_name', newTenant.name);
      if (newTenant.role) {
        storage.setItem('tenant_role', newTenant.role);
      }
    } else {
      storage.removeItem('tenant_id');
      storage.removeItem('tenant_slug');
      storage.removeItem('tenant_name');
      storage.removeItem('tenant_role');
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
    // Use context-aware storage
    const storage = typeof window !== 'undefined' && window.location.pathname.includes('/enroll/wizard/')
      ? sessionStorage
      : localStorage;
    storage.setItem('theme', newTheme);
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
      const cacheKey = `translations_admin_${adminLanguage}`;

      // ALWAYS set loading to true when fetching, even if we have cache
      setLoadingAdminTranslations(true);

      // Fetch fresh translations from API
      try {
        const response = await fetch(`/api/translations?language=${adminLanguage}&context=admin`, {
          // Prevent browser caching - always get fresh from server
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        const data = await response.json();

        // ONLY update if we got actual translations (non-empty)
        if (data.success && data.data && Object.keys(data.data).length > 0) {
          setAdminTranslations(data.data);

          // Cache the translations with version and timestamp
          if (typeof window !== 'undefined') {
            const cacheData: CachedTranslations = {
              version: TRANSLATION_CACHE_VERSION,
              timestamp: Date.now(),
              data: data.data,
            };
            // Use context-aware storage
            const storage = window.location.pathname.includes('/enroll/wizard/')
              ? sessionStorage
              : localStorage;
            storage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log(`[Translations] Cached ${Object.keys(data.data).length} admin translations for ${adminLanguage}`);
          }
        } else if (data.success && data.data && Object.keys(data.data).length === 0) {
          // API returned empty - this is suspicious, log warning
          console.warn(`[Translations] API returned empty for ${adminLanguage}/admin - translations may be missing in database`);
          // Keep whatever translations we have (from cache or initial state)
        }
      } catch (error) {
        console.error('Failed to load admin translations:', error);
        // Keep cached translations on error
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
      const cacheKey = `translations_user_${userLanguage}`;

      // ALWAYS set loading to true when fetching, even if we have cache
      setLoadingUserTranslations(true);

      // Fetch fresh translations from API
      try {
        const response = await fetch(`/api/translations?language=${userLanguage}&context=user`, {
          // Prevent browser caching - always get fresh from server
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        const data = await response.json();

        // ONLY update if we got actual translations (non-empty)
        if (data.success && data.data && Object.keys(data.data).length > 0) {
          setUserTranslations(data.data);

          // Cache the translations with version and timestamp
          if (typeof window !== 'undefined') {
            const cacheData: CachedTranslations = {
              version: TRANSLATION_CACHE_VERSION,
              timestamp: Date.now(),
              data: data.data,
            };
            // Use context-aware storage
            const storage = window.location.pathname.includes('/enroll/wizard/')
              ? sessionStorage
              : localStorage;
            storage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log(`[Translations] Cached ${Object.keys(data.data).length} user translations for ${userLanguage}`);
          }
        } else if (data.success && data.data && Object.keys(data.data).length === 0) {
          // API returned empty - this is suspicious, log warning
          console.warn(`[Translations] API returned empty for ${userLanguage}/user - translations may be missing in database`);
          // Keep whatever translations we have (from cache or initial state)
        }
      } catch (error) {
        console.error('Failed to load user translations:', error);
        // Keep cached translations on error
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

    // Use context-aware storage
    const storage = typeof window !== 'undefined' && window.location.pathname.includes('/enroll/wizard/')
      ? sessionStorage
      : localStorage;
    storage.setItem('admin_language', lang);

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

    // Use context-aware storage
    const storage = typeof window !== 'undefined' && window.location.pathname.includes('/enroll/wizard/')
      ? sessionStorage
      : localStorage;
    storage.setItem('user_language', lang);

    // Update document - this is the ONLY place we update on language change
    document.documentElement.lang = lang;
    document.documentElement.dir = langInfo.direction;
  };

  // Translation function with parameter interpolation support
  const t = (key: string, params?: Record<string, any> | string, context?: LanguageContext): string => {
    // Handle legacy calls: t(key, fallback, context)
    let fallback: string | undefined;
    let actualParams: Record<string, any> | undefined;
    let actualContext: LanguageContext = context || 'user';

    if (typeof params === 'string') {
      // Legacy signature: t(key, fallback, context)
      fallback = params;
      actualContext = context || 'user';
    } else if (params && typeof params === 'object') {
      // New signature: t(key, params, context) - params is object (but not null)
      actualParams = params;
      actualContext = context || 'user';
    } else {
      // No params: t(key) or t(key, undefined, context) or t(key, null, context)
      actualContext = context || 'user';
    }

    const translations = actualContext === 'admin' ? adminTranslations : userTranslations;
    let translation = translations[key] || fallback || key;

    // Replace parameters in translation (e.g., {count} with actual value)
    if (actualParams) {
      Object.keys(actualParams).forEach(paramKey => {
        translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(actualParams[paramKey]));
      });
    }

    return translation;
  };

  // Utility function to manually clear translation caches
  const clearTranslationCache = () => {
    if (typeof window === 'undefined') return;

    console.log('[Translations] Manually clearing all translation caches');

    // Clear all translation cache keys from localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('translations_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Translations] Removed ${keysToRemove.length} cache entries`);

    // Force reload translations by setting loading state and re-fetching
    setLoadingAdminTranslations(true);
    setLoadingUserTranslations(true);

    // Trigger re-fetch by toggling language state
    setAdminLanguageState(prev => {
      // Temporarily change then change back to trigger useEffect
      setTimeout(() => setAdminLanguageState(prev), 0);
      return prev;
    });
    setUserLanguageState(prev => {
      setTimeout(() => setUserLanguageState(prev), 0);
      return prev;
    });
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
        clearTranslationCache,
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
    t: (key: string, paramsOrFallback?: Record<string, any> | string) => {
      // Always use context.t with 'admin' context
      return context.t(key, paramsOrFallback, 'admin');
    },
    loading: context.loading,
    clearTranslationCache: context.clearTranslationCache,
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
