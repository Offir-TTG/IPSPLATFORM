import { useQuery } from '@tanstack/react-query';

export interface TranslationsData {
  [key: string]: string;
}

async function fetchAuditTranslations(): Promise<TranslationsData> {
  const response = await fetch('/api/translations?language=he&context=admin', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch translations');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch translations');
  }

  return result.data || {};
}

/**
 * Hook to load and provide translations for the audit trail admin pages
 * Fetches Hebrew translations with admin context from the API
 *
 * @returns Object with translation function and loading state
 *
 * @example
 * const { t, isLoading } = useAuditTranslations();
 * const title = t('admin.audit.title', 'Audit Trail');
 */
export function useAuditTranslations() {
  const { data: translations, isLoading, error } = useQuery({
    queryKey: ['auditTranslations', 'he', 'admin'],
    queryFn: fetchAuditTranslations,
    staleTime: 10 * 60 * 1000, // 10 minutes - translations don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  /**
   * Translation function to get localized text
   * @param key - Translation key (e.g., 'admin.audit.title')
   * @param fallback - Fallback text if translation key not found
   * @returns Translated text or fallback
   */
  const t = (key: string, fallback: string): string => {
    if (!translations || isLoading) {
      return fallback;
    }
    return translations[key] || fallback;
  };

  return {
    t,
    isLoading,
    error,
    translations: translations || {},
  };
}
