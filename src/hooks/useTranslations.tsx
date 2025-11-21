import { useApp } from '@/context/AppContext';

// Translation hook that uses the AppContext
export function useTranslations() {
  const { t, adminLanguage } = useApp();

  return {
    t: (key: string, fallback?: string) => t(key, fallback || key, 'admin'),
    language: adminLanguage
  };
}