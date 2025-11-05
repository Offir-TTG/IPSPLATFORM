'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Search,
  Edit2,
  Save,
  X,
  Loader2,
  Filter,
  Globe,
  Check,
  AlertCircle,
  Languages,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Translation {
  id?: string;
  language_code: string;
  translation_key: string;
  translation_value: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

interface TranslationGroup {
  key: string;
  category: string;
  translations: Record<string, string>; // languageCode -> value
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function TranslationsPage() {
  const { t, availableLanguages } = useAdminLanguage();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [groupedTranslations, setGroupedTranslations] = useState<TranslationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Smart debounce: immediate for empty/short, delayed for longer searches
  useEffect(() => {
    // If empty or very short (1-2 chars), update immediately
    if (searchTerm.length === 0 || searchTerm.length <= 2) {
      setDebouncedSearchTerm(searchTerm);
      return;
    }

    // For longer searches, debounce to avoid too many API calls
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Shorter delay (300ms) for better responsiveness

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    loadTranslations();
  }, [currentPage, selectedCategory, debouncedSearchTerm]);

  const loadTranslations = async () => {
    try {
      // Only show full-page loading on initial load
      if (initialLoad) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }

      const response = await fetch(`/api/admin/translations?${params}`);
      const result = await response.json();

      if (result.success) {
        setTranslations(result.data);
        groupTranslations(result.data);
        extractCategories(result.data);
        if (result.pagination) {
          setPagination(result.pagination);
        }
      } else {
        setError(result.error || 'Failed to load translations');
      }
    } catch (err) {
      console.error('Load translations error:', err);
      setError('Failed to load translations');
    } finally {
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
    }
  };

  const extractCategories = (data: Translation[]) => {
    const cats = new Set<string>();
    data.forEach(t => {
      if (t.category) cats.add(t.category);
    });
    setCategories(Array.from(cats).sort());
  };

  const groupTranslations = (data: Translation[]) => {
    const grouped = new Map<string, TranslationGroup>();

    data.forEach(t => {
      if (!grouped.has(t.translation_key)) {
        grouped.set(t.translation_key, {
          key: t.translation_key,
          category: t.category,
          translations: {},
        });
      }

      const group = grouped.get(t.translation_key)!;
      group.translations[t.language_code] = t.translation_value;
    });

    setGroupedTranslations(Array.from(grouped.values()));
  };

  const [editCategory, setEditCategory] = useState('');

  const handleEdit = (key: string, currentTranslations: Record<string, string>, category: string) => {
    setEditingKey(key);
    setEditValues({ ...currentTranslations });
    setEditCategory(category);
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditValues({});
    setEditCategory('');
    setError('');
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(true);
      setError('');

      // Save each language translation
      const promises = Object.entries(editValues).map(([langCode, value]) =>
        fetch('/api/admin/translations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language_code: langCode,
            translation_key: key,
            translation_value: value,
            category: editCategory || key.split('.')[0],
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(r => r.ok);

      if (allSuccess) {
        setSuccess('Translations saved successfully');
        setEditingKey(null);
        setEditValues({});
        await loadTranslations();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save some translations');
      }
    } catch (err) {
      console.error('Save translations error:', err);
      setError('Failed to save translations');
    } finally {
      setSaving(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  if (loading && initialLoad) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 style={{
            fontSize: 'var(--font-size-3xl)',
            fontFamily: 'var(--font-family-heading)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'hsl(var(--text-heading))',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Languages className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
            {t('admin.translations.title', 'Translation Management')}
          </h1>
          <p style={{
            color: 'hsl(var(--text-muted))',
            marginTop: '0.5rem',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {t('admin.translations.subtitle', 'Edit translations for all languages')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              fontFamily: 'var(--font-family-heading)'
            }}>{pagination.total}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.translations.totalKeys', 'Translation Keys')}
            </div>
          </div>
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              fontFamily: 'var(--font-family-heading)'
            }}>{availableLanguages.length}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.translations.languages', 'Languages')}
            </div>
          </div>
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              fontFamily: 'var(--font-family-heading)'
            }}>{categories.length}</div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.translations.modules', 'Modules')}
            </div>
          </div>
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            padding: '1rem',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))'
          }}>
            <div style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))',
              fontFamily: 'var(--font-family-heading)'
            }}>
              {translations.length}
            </div>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.translations.totalTranslations', 'Total Translations')}
            </div>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive))',
            color: 'hsl(var(--destructive))',
            padding: '0.75rem 1rem',
            borderRadius: 'calc(var(--radius) * 1.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'hsl(var(--success) / 0.1)',
            border: '1px solid hsl(var(--success))',
            color: 'hsl(var(--success-foreground))',
            padding: '0.75rem 1rem',
            borderRadius: 'calc(var(--radius) * 1.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            <Check className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Filters */}
        <div style={{
          backgroundColor: 'hsl(var(--card))',
          padding: '1rem',
          borderRadius: 'calc(var(--radius) * 2)',
          border: '1px solid hsl(var(--border))'
        }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
              <input
                type="text"
                placeholder={t('admin.translations.search', 'Search keys and values...')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingInlineStart: '2.5rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }}
                className="focus:outline-none focus:ring-2"
                onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
              />
            </div>

            {/* Module/Category filter */}
            <div className="relative">
              <Filter className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingInlineStart: '2.5rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }}
                className="focus:outline-none focus:ring-2"
                onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
              >
                <option value="all">{t('admin.translations.allModules', 'All Modules (Admin, User, etc.)')}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Language filter */}
            <div className="relative">
              <Globe className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{
                  width: '100%',
                  paddingInlineStart: '2.5rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }}
                className="focus:outline-none focus:ring-2"
                onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
              >
                <option value="all">{t('admin.translations.allLanguages', 'All Languages')}</option>
                {availableLanguages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'hsl(var(--text-muted))',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {t('admin.translations.showing', 'Showing')} {groupedTranslations.length} {t('admin.translations.of', 'of')} {pagination.total} {t('admin.translations.keys', 'keys')}
            {pagination.totalPages > 1 && ` (${t('admin.translations.page', 'Page')} ${currentPage}/${pagination.totalPages})`}
          </div>
        </div>

        {/* Translations Table */}
        <div style={{
          backgroundColor: 'hsl(var(--card))',
          borderRadius: 'calc(var(--radius) * 2)',
          border: '1px solid hsl(var(--border))',
          overflow: 'hidden'
        }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{
                backgroundColor: 'hsl(var(--muted) / 0.5)',
                borderBottom: '1px solid hsl(var(--border))'
              }}>
                <tr>
                  <th style={{
                    textAlign: 'start',
                    padding: '0.75rem 1rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))'
                  }}>
                    {t('admin.translations.key', 'Key')}
                  </th>
                  <th style={{
                    textAlign: 'start',
                    padding: '0.75rem 1rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))'
                  }}>
                    {t('admin.translations.module', 'Module')}
                  </th>
                  {/* English baseline - always show first */}
                  {(selectedLanguage === 'all' || selectedLanguage === 'en') && (
                    <th style={{
                      textAlign: 'start',
                      padding: '0.75rem 1rem',
                      fontWeight: 'var(--font-weight-bold)',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--primary) / 0.1)'
                    }}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        English (Baseline)
                      </div>
                    </th>
                  )}
                  {/* Other languages */}
                  {availableLanguages
                    .filter(lang => lang.code !== 'en')
                    .filter(lang => selectedLanguage === 'all' || selectedLanguage === lang.code)
                    .map(lang => (
                    <th key={lang.code} style={{
                      textAlign: 'start',
                      padding: '0.75rem 1rem',
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-heading))'
                    }}>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {lang.native_name}
                      </div>
                    </th>
                  ))}
                  <th style={{
                    textAlign: 'end',
                    padding: '0.75rem 1rem',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))'
                  }}>
                    {t('admin.translations.actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedTranslations.map((group, idx) => {
                  const isEditing = editingKey === group.key;

                  return (
                    <tr
                      key={group.key}
                      style={{
                        borderBottom: '1px solid hsl(var(--border))',
                        backgroundColor: idx % 2 === 0 ? 'hsl(var(--background))' : 'hsl(var(--muted) / 0.2)',
                        ...(isEditing && {
                          outline: '2px solid hsl(var(--primary))',
                          outlineOffset: '-2px'
                        })
                      }}
                    >
                      <td style={{
                        padding: '0.75rem 1rem',
                        fontFamily: 'var(--font-family-mono)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'hsl(var(--text-body))'
                      }}>
                        {group.key}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.25rem 0.5rem',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 'var(--radius)',
                              fontSize: 'var(--font-size-sm)',
                              fontFamily: 'var(--font-family-primary)',
                              backgroundColor: 'hsl(var(--background))',
                              color: 'hsl(var(--foreground))'
                            }}
                            className="focus:outline-none focus:ring-2"
                            onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
                            placeholder="Category"
                          />
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'hsl(var(--primary) / 0.1)',
                            color: 'hsl(var(--primary))',
                            borderRadius: 'var(--radius)',
                            fontSize: 'var(--font-size-xs)',
                            fontFamily: 'var(--font-family-primary)'
                          }}>
                            {group.category}
                          </span>
                        )}
                      </td>
                      {/* English baseline - always first */}
                      {(selectedLanguage === 'all' || selectedLanguage === 'en') && (() => {
                        const lang = availableLanguages.find(l => l.code === 'en');
                        if (!lang) return null;
                        const value = isEditing
                          ? editValues['en'] || ''
                          : group.translations['en'] || '';

                        return (
                          <td key="en" style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: 'hsl(var(--primary) / 0.05)'
                          }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValues['en'] || ''}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    en: e.target.value,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  padding: '0.25rem 0.5rem',
                                  border: '1px solid hsl(var(--primary))',
                                  borderRadius: 'var(--radius)',
                                  fontSize: 'var(--font-size-sm)',
                                  fontFamily: 'var(--font-family-primary)',
                                  backgroundColor: 'hsl(var(--background))',
                                  color: 'hsl(var(--foreground))',
                                  fontWeight: 'var(--font-weight-medium)'
                                }}
                                className="focus:outline-none focus:ring-2"
                                onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
                                dir={lang.direction}
                                placeholder="English baseline"
                              />
                            ) : (
                              <div
                                style={{
                                  fontSize: 'var(--font-size-sm)',
                                  fontFamily: 'var(--font-family-primary)',
                                  color: 'hsl(var(--text-body))',
                                  fontWeight: 'var(--font-weight-medium)'
                                }}
                                dir={lang.direction}
                              >
                                {value || (
                                  <span style={{
                                    color: 'hsl(var(--text-muted))',
                                    fontStyle: 'italic'
                                  }}>
                                    Not set
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })()}
                      {/* Other languages */}
                      {availableLanguages
                        .filter(lang => lang.code !== 'en')
                        .filter(lang => selectedLanguage === 'all' || selectedLanguage === lang.code)
                        .map(lang => {
                        const value = isEditing
                          ? editValues[lang.code] || ''
                          : group.translations[lang.code] || '';

                        return (
                          <td key={lang.code} style={{ padding: '0.75rem 1rem' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValues[lang.code] || ''}
                                onChange={(e) =>
                                  setEditValues({
                                    ...editValues,
                                    [lang.code]: e.target.value,
                                  })
                                }
                                style={{
                                  width: '100%',
                                  padding: '0.25rem 0.5rem',
                                  border: '1px solid hsl(var(--border))',
                                  borderRadius: 'var(--radius)',
                                  fontSize: 'var(--font-size-sm)',
                                  fontFamily: 'var(--font-family-primary)',
                                  backgroundColor: 'hsl(var(--background))',
                                  color: 'hsl(var(--foreground))'
                                }}
                                className="focus:outline-none focus:ring-2"
                                onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
                                dir={lang.direction}
                              />
                            ) : (
                              <div
                                style={{
                                  fontSize: 'var(--font-size-sm)',
                                  fontFamily: 'var(--font-family-primary)',
                                  color: 'hsl(var(--text-body))'
                                }}
                                dir={lang.direction}
                              >
                                {value || (
                                  <span style={{
                                    color: 'hsl(var(--text-muted))',
                                    fontStyle: 'italic'
                                  }}>
                                    {t('admin.translations.missing', 'Missing')}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'end' }}>
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSave(group.key)}
                              disabled={saving}
                              style={{
                                padding: '0.5rem',
                                color: 'hsl(var(--success-foreground))',
                                backgroundColor: 'transparent',
                                borderRadius: 'var(--radius)',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.5 : 1,
                                border: 'none'
                              }}
                              className="hover:bg-accent transition-colors"
                              title={t('common.save', 'Save')}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              disabled={saving}
                              style={{
                                padding: '0.5rem',
                                color: 'hsl(var(--text-muted))',
                                backgroundColor: 'transparent',
                                borderRadius: 'var(--radius)',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                opacity: saving ? 0.5 : 1,
                                border: 'none'
                              }}
                              className="hover:bg-accent transition-colors"
                              title={t('common.cancel', 'Cancel')}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(group.key, group.translations, group.category)}
                            style={{
                              padding: '0.5rem',
                              color: 'hsl(var(--primary))',
                              backgroundColor: 'transparent',
                              borderRadius: 'var(--radius)',
                              cursor: 'pointer',
                              border: 'none'
                            }}
                            className="hover:bg-accent transition-colors"
                            title={t('common.edit', 'Edit')}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {groupedTranslations.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
              color: 'hsl(var(--text-muted))'
            }}>
              <Languages className="h-12 w-12 mx-auto mb-4" style={{ opacity: 0.5 }} />
              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)'
              }}>
                {t('admin.translations.noResults', 'No translations found')}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem',
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) * 2)'
          }}>
            <div style={{
              fontSize: 'var(--font-size-sm)',
              color: 'hsl(var(--text-muted))',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.translations.page', 'Page')} {currentPage} {t('admin.translations.of', 'of')} {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'hsl(var(--secondary))',
                  color: 'hsl(var(--secondary-foreground))',
                  borderRadius: 'var(--radius)',
                  cursor: currentPage === 1 || loading ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 || loading ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: 'none'
                }}
                className="hover:opacity-90 transition-opacity"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('common.previous', 'Previous')}
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages || loading}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'var(--radius)',
                  cursor: currentPage === pagination.totalPages || loading ? 'not-allowed' : 'pointer',
                  opacity: currentPage === pagination.totalPages || loading ? 0.5 : 1,
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  border: 'none'
                }}
                className="hover:opacity-90 transition-opacity"
              >
                {t('common.next', 'Next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div style={{
          backgroundColor: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--text-body))',
          padding: '0.75rem 1rem',
          borderRadius: 'calc(var(--radius) * 1.5)',
          fontSize: 'var(--font-size-sm)',
          fontFamily: 'var(--font-family-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertCircle className="h-5 w-5" style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'hsl(var(--text-heading))' }}>{t('admin.translations.info.title', 'Note')}:</strong>{' '}
            {t('admin.translations.info.message', 'Changes take effect immediately. Translations are cached for 5 minutes for performance.')}
          </span>
        </div>
      </div>
    </AdminLayout>
  );
}
