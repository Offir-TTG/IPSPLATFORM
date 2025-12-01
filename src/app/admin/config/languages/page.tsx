'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import { CURRENCIES } from '@/lib/utils/currency';
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  Check,
  X,
  Loader2,
  Star,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Language {
  id?: string;
  code: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  is_active: boolean;
  is_default: boolean;
  currency_code?: string;
  currency_symbol?: string;
  currency_position?: 'before' | 'after';
  created_at?: string;
  updated_at?: string;
}

interface CommonLanguage {
  id: string;
  code: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  currency_code?: string;
  currency_symbol?: string;
  currency_position?: 'before' | 'after';
  timezone?: string;
  is_popular: boolean;
}

export default function LanguagesPage() {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [languages, setLanguages] = useState<Language[]>([]);
  const [commonLanguages, setCommonLanguages] = useState<CommonLanguage[]>([]);
  const [languageSearch, setLanguageSearch] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [formData, setFormData] = useState<Language>({
    code: '',
    name: '',
    native_name: '',
    direction: 'ltr',
    is_active: true,
    is_default: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;
  const isTablet = windowWidth > 640 && windowWidth <= 768;
  const isDesktop = windowWidth > 768;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadLanguages();
    loadCommonLanguages();
  }, []);

  const loadLanguages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/languages');
      const data = await response.json();

      if (data.success) {
        setLanguages(data.data || []);
        setError('');
      } else {
        setError(data.error || 'Failed to load languages');
      }
    } catch (err) {
      setError('Failed to load languages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCommonLanguages = async () => {
    try {
      const response = await fetch('/api/admin/common-languages');
      const data = await response.json();

      if (data.success) {
        setCommonLanguages(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load common languages:', err);
    }
  };

  const handleCreate = () => {
    setEditingLanguage(null);
    setFormData({
      code: '',
      name: '',
      native_name: '',
      direction: 'ltr',
      is_active: true,
      is_default: false,
      currency_code: 'USD',
      currency_symbol: '$',
      currency_position: 'before',
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleCommonLanguageSelect = (languageCode: string) => {
    if (!languageCode) {
      // Reset to empty form
      setFormData({
        code: '',
        name: '',
        native_name: '',
        direction: 'ltr',
        is_active: true,
        is_default: false,
        currency_code: 'USD',
        currency_symbol: '$',
        currency_position: 'before',
      });
      return;
    }

    const commonLang = commonLanguages.find(l => l.code === languageCode);
    if (commonLang) {
      setFormData({
        code: commonLang.code,
        name: commonLang.name,
        native_name: commonLang.native_name,
        direction: commonLang.direction,
        is_active: true,
        is_default: false,
        currency_code: commonLang.currency_code || 'USD',
        currency_symbol: commonLang.currency_symbol || '$',
        currency_position: commonLang.currency_position || 'before',
      });
    }
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData({...language});
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.code || !formData.name || !formData.native_name) {
      setError(t('admin.languages.error.required', 'All fields are required'));
      return;
    }

    if (formData.code.length !== 2) {
      setError(t('admin.languages.error.codeLength', 'Language code must be 2 characters (ISO 639-1)'));
      return;
    }

    setSaving(true);
    setError('');

    try {
      const url = '/api/admin/languages';
      const method = editingLanguage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(editingLanguage ? 'Language updated successfully' : 'Language created successfully');
        await loadLanguages();
        setShowModal(false);
        // Clear translation cache
        await fetch('/api/translations', { method: 'POST' });

        // Clear success after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to save language');
      }
    } catch (err) {
      setError('Failed to save language');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (language: Language) => {
    setDeletingLanguage(language);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLanguage) return;

    try {
      const response = await fetch(`/api/admin/languages?code=${deletingLanguage.code}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Language deleted successfully');
        await loadLanguages();
        setDeletingLanguage(null);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to delete language');
        setDeletingLanguage(null);
      }
    } catch (err) {
      setError('Failed to delete language');
      setDeletingLanguage(null);
      console.error(err);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingLanguage(null);
  };

  const handleToggleActive = async (language: Language) => {
    try {
      const response = await fetch('/api/admin/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: language.code,
          is_active: !language.is_active,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Language ${!language.is_active ? 'activated' : 'deactivated'} successfully`);
        await loadLanguages();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to update language');
      }
    } catch (err) {
      setError('Failed to update language');
      console.error(err);
    }
  };

  const handleSetDefault = async (language: Language) => {
    try {
      const response = await fetch('/api/admin/languages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: language.code,
          is_default: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Default language updated successfully');
        await loadLanguages();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to set default language');
      }
    } catch (err) {
      setError('Failed to set default language');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{
              fontSize: 'var(--font-size-3xl)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'hsl(var(--text-heading))'
            }} suppressHydrationWarning>
              {t('admin.languages.title', 'Languages')}
            </h1>
            <p style={{
              color: 'hsl(var(--text-muted))',
              marginTop: '0.25rem',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)'
            }} suppressHydrationWarning>
              {t('admin.languages.subtitle', 'Manage platform languages and translations')}
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              paddingInlineStart: '1rem',
              paddingInlineEnd: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: 'calc(var(--radius) * 1.5)',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'opacity 0.2s',
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}
            className="hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
            <span suppressHydrationWarning>{t('admin.languages.add', 'Add Language')}</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div style={{
            backgroundColor: 'hsl(var(--destructive) / 0.1)',
            border: '1px solid hsl(var(--destructive))',
            color: 'hsl(var(--destructive))',
            padding: '0.75rem 1rem',
            borderRadius: 'calc(var(--radius) * 1.5)',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'hsl(var(--success) / 0.15)',
            border: '1px solid hsl(var(--success))',
            color: 'hsl(var(--success))',
            padding: '0.75rem 1rem',
            borderRadius: 'calc(var(--radius) * 1.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: 'var(--font-size-sm)',
            fontFamily: 'var(--font-family-primary)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            <Check className="h-5 w-5" />
            {success}
          </div>
        )}

        {/* Languages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {languages.map((language) => (
            <div
              key={language.code}
              style={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'calc(var(--radius) * 2)',
                padding: '1.5rem',
                position: 'relative',
                transition: 'box-shadow 0.2s'
              }}
              className="hover:shadow-lg"
            >
              {/* Badges */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                insetInlineEnd: '1rem',
                display: 'flex',
                gap: '0.5rem'
              }}>
                {language.is_default && (
                  <div style={{
                    padding: '0.375rem',
                    backgroundColor: 'hsl(var(--warning) / 0.1)',
                    borderRadius: '9999px'
                  }} title={t('admin.languages.default', 'Default')}>
                    <Star className="h-4 w-4" style={{
                      color: 'hsl(var(--warning))',
                      fill: 'hsl(var(--warning))'
                    }} />
                  </div>
                )}
                {language.is_active ? (
                  <div style={{
                    padding: '0.375rem',
                    backgroundColor: 'hsl(var(--success) / 0.1)',
                    borderRadius: '9999px'
                  }} title={t('admin.languages.active', 'Active')}>
                    <Eye className="h-4 w-4" style={{ color: 'hsl(var(--success))' }} />
                  </div>
                ) : (
                  <div style={{
                    padding: '0.375rem',
                    backgroundColor: 'hsl(var(--muted))',
                    borderRadius: '9999px'
                  }} title={t('admin.languages.inactive', 'Inactive')}>
                    <EyeOff className="h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
                  </div>
                )}
              </div>

              {/* Language Info */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    height: '3rem',
                    width: '3rem',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Globe className="h-6 w-6" style={{ color: 'hsl(var(--primary))' }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontWeight: 'var(--font-weight-bold)',
                      fontSize: 'var(--font-size-lg)',
                      fontFamily: 'var(--font-family-heading)',
                      color: 'hsl(var(--text-heading))'
                    }}>{language.native_name}</h3>
                    <p style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'hsl(var(--text-muted))',
                      fontFamily: 'var(--font-family-primary)'
                    }}>{language.name}</p>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-muted))' }} suppressHydrationWarning>
                      {t('admin.languages.code', 'Code')}:
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-body))'
                    }}>{language.code.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-muted))' }} suppressHydrationWarning>
                      {t('admin.languages.direction', 'Direction')}:
                    </span>
                    <span style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'hsl(var(--text-body))'
                    }} suppressHydrationWarning>
                      {language.direction === 'rtl'
                        ? t('admin.languages.directionRtl', 'RTL ←')
                        : t('admin.languages.directionLtr', 'LTR →')}
                    </span>
                  </div>
                  {language.currency_code && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'hsl(var(--text-muted))' }} suppressHydrationWarning>
                        {t('admin.languages.currency', 'Currency')}:
                      </span>
                      <span style={{
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'hsl(var(--text-body))'
                      }}>
                        {language.currency_symbol} {language.currency_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid hsl(var(--border))'
              }}>
                {!language.is_default && (
                  <button
                    onClick={() => handleSetDefault(language)}
                    style={{
                      flex: 1,
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: 'transparent',
                      color: 'hsl(var(--text-body))',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    className="hover:bg-accent"
                    title={t('admin.languages.setDefaultTitle', 'Set as default')}
                  >
                    <Star className="h-4 w-4" style={{
                      display: 'inline',
                      marginInlineEnd: '0.25rem',
                      verticalAlign: 'middle'
                    }} />
                    <span suppressHydrationWarning>{t('admin.languages.setDefault', 'Default')}</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleActive(language)}
                  style={{
                    flex: 1,
                    paddingInlineStart: '0.75rem',
                    paddingInlineEnd: '0.75rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                  title={t('admin.languages.toggleActive', 'Toggle status')}
                >
                  {language.is_active ? (
                    <>
                      <EyeOff className="h-4 w-4" style={{
                        display: 'inline',
                        marginInlineEnd: '0.25rem',
                        verticalAlign: 'middle'
                      }} />
                      <span suppressHydrationWarning>{t('admin.languages.hide', 'Hide')}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" style={{
                        display: 'inline',
                        marginInlineEnd: '0.25rem',
                        verticalAlign: 'middle'
                      }} />
                      <span suppressHydrationWarning>{t('admin.languages.show', 'Show')}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleEdit(language)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-accent"
                  title={t('admin.languages.editTitle', 'Edit')}
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {!language.is_default && (
                  <button
                    onClick={() => handleDeleteClick(language)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid hsl(var(--destructive) / 0.5)',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: 'transparent',
                      color: 'hsl(var(--destructive))',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    className="hover:bg-destructive/10"
                    title={t('admin.languages.deleteTitle', 'Delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {languages.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 0',
              textAlign: 'center'
            }}>
              <Globe className="h-16 w-16" style={{
                color: 'hsl(var(--text-muted))',
                opacity: 0.5,
                marginBottom: '1rem'
              }} />
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-heading)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.5rem'
              }} suppressHydrationWarning>
                {t('admin.languages.empty', 'No languages yet')}
              </h3>
              <p style={{
                color: 'hsl(var(--text-muted))',
                marginBottom: '1rem',
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)'
              }} suppressHydrationWarning>
                {t('admin.languages.emptyDesc', 'Add your first language to get started')}
              </p>
              <button
                onClick={handleCreate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingInlineStart: '1rem',
                  paddingInlineEnd: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
                className="hover:opacity-90"
              >
                <Plus className="h-5 w-5" />
                <span suppressHydrationWarning>{t('admin.languages.add', 'Add Language')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '1rem'
            }}
            onClick={(e) => {
              // Only close if clicking the backdrop, not the modal content
              if (e.target === e.currentTarget && !saving) {
                // Prevent closing by outside click - do nothing
                // setShowModal(false); // Commented out to prevent closure
              }
            }}
          >
            <div
              style={{
                backgroundColor: 'hsl(var(--card))',
                borderRadius: 'calc(var(--radius) * 2)',
                maxWidth: '28rem',
                width: '100%',
                padding: '1.5rem',
                maxHeight: '90vh',
                overflow: 'auto',
                direction: direction,
                textAlign: isRtl ? 'right' : 'left'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                fontFamily: 'var(--font-family-heading)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '1rem',
                textAlign: isRtl ? 'right' : 'left'
              }} suppressHydrationWarning>
                {editingLanguage
                  ? t('admin.languages.edit', 'Edit Language')
                  : t('admin.languages.add', 'Add Language')}
              </h2>

              {error && (
                <div style={{
                  marginBottom: '1rem',
                  padding: '0.75rem',
                  backgroundColor: 'hsl(var(--destructive) / 0.1)',
                  color: 'hsl(var(--destructive))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    display: 'block',
                    marginBottom: '0.5rem',
                    textAlign: isRtl ? 'right' : 'left'
                  }}>
                    <span suppressHydrationWarning>{t('admin.languages.form.code', 'Language Code')} *</span>
                  </label>
                  {editingLanguage ? (
                    <input
                      type="text"
                      value={formData.code.toUpperCase()}
                      disabled
                      style={{
                        width: '100%',
                        paddingInlineStart: '0.75rem',
                        paddingInlineEnd: '0.75rem',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'calc(var(--radius) * 1.5)',
                        backgroundColor: 'hsl(var(--muted))',
                        color: 'hsl(var(--foreground))',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        opacity: 0.5
                      }}
                    />
                  ) : (
                    <div style={{ position: 'relative' }}>
                      {/* Custom searchable dropdown */}
                      <input
                        type="text"
                        placeholder={formData.code ? `${formData.code.toUpperCase()} - ${formData.name} (${formData.native_name})` : t('admin.languages.form.selectLanguage', 'Select a language...')}
                        value={languageSearch}
                        onChange={(e) => {
                          setLanguageSearch(e.target.value);
                          setShowLanguageDropdown(true);
                        }}
                        onFocus={(e) => {
                          setShowLanguageDropdown(true);
                          e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))');
                        }}
                        style={{
                          width: '100%',
                          paddingInlineStart: '0.75rem',
                          paddingInlineEnd: '0.75rem',
                          paddingTop: '0.5rem',
                          paddingBottom: '0.5rem',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'calc(var(--radius) * 1.5)',
                          backgroundColor: 'hsl(var(--background))',
                          color: 'hsl(var(--foreground))',
                          fontSize: 'var(--font-size-sm)',
                          fontFamily: 'var(--font-family-primary)',
                          cursor: 'pointer'
                        }}
                        className="focus:outline-none focus:ring-2"
                      />

                      {/* Dropdown list */}
                      {showLanguageDropdown && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            style={{
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 40
                            }}
                            onClick={() => {
                              setShowLanguageDropdown(false);
                              setLanguageSearch('');
                            }}
                          />

                          {/* Dropdown menu */}
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '0.25rem',
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'calc(var(--radius) * 1.5)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            maxHeight: '16rem',
                            overflowY: 'auto',
                            zIndex: 50
                          }}>
                            {(() => {
                              const filteredPopular = commonLanguages.filter(l => {
                                if (!l.is_popular) return false;
                                if (!languageSearch) return true;
                                const search = languageSearch.toLowerCase();
                                return l.code.toLowerCase().includes(search) ||
                                       l.name.toLowerCase().includes(search) ||
                                       l.native_name.toLowerCase().includes(search);
                              });

                              const filteredOther = commonLanguages.filter(l => {
                                if (l.is_popular) return false;
                                if (!languageSearch) return true;
                                const search = languageSearch.toLowerCase();
                                return l.code.toLowerCase().includes(search) ||
                                       l.name.toLowerCase().includes(search) ||
                                       l.native_name.toLowerCase().includes(search);
                              });

                              const hasResults = filteredPopular.length > 0 || filteredOther.length > 0;

                              if (!hasResults) {
                                return (
                                  <div style={{
                                    padding: '0.75rem',
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'hsl(var(--text-muted))',
                                    fontFamily: 'var(--font-family-primary)',
                                    textAlign: 'center'
                                  }} suppressHydrationWarning>
                                    {t('admin.languages.form.noResults', 'No languages found')}
                                  </div>
                                );
                              }

                              return (
                                <>
                                  {filteredPopular.length > 0 && (
                                    <>
                                      <div style={{
                                        padding: '0.5rem 0.75rem',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        color: 'hsl(var(--text-muted))',
                                        fontFamily: 'var(--font-family-primary)',
                                        backgroundColor: 'hsl(var(--muted) / 0.5)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                      }} suppressHydrationWarning>
                                        {t('admin.languages.form.popularLanguages', 'Popular Languages')}
                                      </div>
                                      {filteredPopular.map(lang => (
                                        <div
                                          key={lang.code}
                                          onClick={() => {
                                            handleCommonLanguageSelect(lang.code);
                                            setShowLanguageDropdown(false);
                                            setLanguageSearch('');
                                          }}
                                          style={{
                                            padding: '0.625rem 0.75rem',
                                            fontSize: 'var(--font-size-sm)',
                                            fontFamily: 'var(--font-family-primary)',
                                            color: 'hsl(var(--foreground))',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                        >
                                          {lang.code.toUpperCase()} - {lang.name} ({lang.native_name})
                                        </div>
                                      ))}
                                    </>
                                  )}

                                  {filteredOther.length > 0 && (
                                    <>
                                      <div style={{
                                        padding: '0.5rem 0.75rem',
                                        fontSize: 'var(--font-size-xs)',
                                        fontWeight: 'var(--font-weight-semibold)',
                                        color: 'hsl(var(--text-muted))',
                                        fontFamily: 'var(--font-family-primary)',
                                        backgroundColor: 'hsl(var(--muted) / 0.5)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginTop: filteredPopular.length > 0 ? '0.25rem' : '0'
                                      }} suppressHydrationWarning>
                                        {t('admin.languages.form.otherLanguages', 'Other Languages')}
                                      </div>
                                      {filteredOther.map(lang => (
                                        <div
                                          key={lang.code}
                                          onClick={() => {
                                            handleCommonLanguageSelect(lang.code);
                                            setShowLanguageDropdown(false);
                                            setLanguageSearch('');
                                          }}
                                          style={{
                                            padding: '0.625rem 0.75rem',
                                            fontSize: 'var(--font-size-sm)',
                                            fontFamily: 'var(--font-family-primary)',
                                            color: 'hsl(var(--foreground))',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'hsl(var(--muted))';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                          }}
                                        >
                                          {lang.code.toUpperCase()} - {lang.name} ({lang.native_name})
                                        </div>
                                      ))}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))',
                    fontFamily: 'var(--font-family-primary)',
                    marginTop: '0.25rem'
                  }} suppressHydrationWarning>
                    {editingLanguage
                      ? t('admin.languages.form.codeHint', '2-letter ISO 639-1 code')
                      : t('admin.languages.form.selectHint', 'Selecting a language will auto-fill the form')}
                  </p>
                </div>

                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}>
                    <span suppressHydrationWarning>{t('admin.languages.form.name', 'English Name')} *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="English, Hebrew, Spanish..."
                    style={{
                      width: '100%',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
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

                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}>
                    <span suppressHydrationWarning>{t('admin.languages.form.nativeName', 'Native Name')} *</span>
                  </label>
                  <input
                    type="text"
                    value={formData.native_name}
                    onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                    placeholder="English, עברית, Español..."
                    style={{
                      width: '100%',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
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

                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}>
                    <span suppressHydrationWarning>{t('admin.languages.form.direction', 'Text Direction')}</span>
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'ltr' | 'rtl' })}
                    disabled={!editingLanguage && !formData.code}
                    style={{
                      width: '100%',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: (!editingLanguage && !formData.code) ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      opacity: (!editingLanguage && !formData.code) ? 0.6 : 1,
                      cursor: (!editingLanguage && !formData.code) ? 'not-allowed' : 'pointer'
                    }}
                    className="focus:outline-none focus:ring-2"
                    onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
                  >
                    <option value="ltr" suppressHydrationWarning>{t('admin.languages.form.directionLtr', 'Left to Right (LTR)')}</option>
                    <option value="rtl" suppressHydrationWarning>{t('admin.languages.form.directionRtl', 'Right to Left (RTL)')}</option>
                  </select>
                  {!editingLanguage && !formData.code && (
                    <p style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'hsl(var(--text-muted))',
                      fontFamily: 'var(--font-family-primary)',
                      marginTop: '0.25rem'
                    }} suppressHydrationWarning>
                      {t('admin.languages.form.directionHint', 'Will be auto-filled when you select a language')}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'hsl(var(--text-heading))',
                    display: 'block',
                    marginBottom: '0.5rem'
                  }}>
                    <span suppressHydrationWarning>{t('admin.languages.form.currency', 'Currency')}</span>
                  </label>
                  <select
                    value={formData.currency_code}
                    onChange={(e) => {
                      const currency = CURRENCIES.find(c => c.code === e.target.value);
                      setFormData({
                        ...formData,
                        currency_code: e.target.value,
                        currency_symbol: currency?.symbol || '$',
                      });
                    }}
                    disabled={!editingLanguage && !formData.code}
                    style={{
                      width: '100%',
                      paddingInlineStart: '0.75rem',
                      paddingInlineEnd: '0.75rem',
                      paddingTop: '0.5rem',
                      paddingBottom: '0.5rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'calc(var(--radius) * 1.5)',
                      backgroundColor: (!editingLanguage && !formData.code) ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      opacity: (!editingLanguage && !formData.code) ? 0.6 : 1,
                      cursor: (!editingLanguage && !formData.code) ? 'not-allowed' : 'pointer'
                    }}
                    className="focus:outline-none focus:ring-2"
                    onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                  <p style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'hsl(var(--text-muted))',
                    fontFamily: 'var(--font-family-primary)',
                    marginTop: '0.25rem'
                  }} suppressHydrationWarning>
                    {!editingLanguage && !formData.code
                      ? t('admin.languages.form.currencyAutoFill', 'Will be auto-filled when you select a language')
                      : t('admin.languages.form.currencyHint', 'Default currency for this language')}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      style={{
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-body))'
                    }} suppressHydrationWarning>
                      {t('admin.languages.form.active', 'Active')}
                    </span>
                  </label>

                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      style={{
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      fontFamily: 'var(--font-family-primary)',
                      color: 'hsl(var(--text-body))'
                    }} suppressHydrationWarning>
                      {t('admin.languages.form.default', 'Default Language')}
                    </span>
                  </label>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '1.5rem',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}>
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingInlineStart: '1rem',
                    paddingInlineEnd: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    minWidth: '100px'
                  }}
                  className="hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                  <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingInlineStart: '1rem',
                    paddingInlineEnd: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    transition: 'opacity 0.2s',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    minWidth: '100px'
                  }}
                  className="hover:opacity-90"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span suppressHydrationWarning>{t('common.saving', 'Saving...')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span suppressHydrationWarning>{t('common.save', 'Save')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingLanguage && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={(e) => {
              // Prevent closing by outside click
              if (e.target === e.currentTarget) {
                // Do nothing - prevent closure
              }
            }}
          >
            <div
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderRadius: 'calc(var(--radius) * 2)',
                padding: '1.5rem',
                maxWidth: '28rem',
                width: '100%',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                direction: direction,
                textAlign: isRtl ? 'right' : 'left'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-heading))',
                marginBottom: '0.75rem',
                textAlign: isRtl ? 'right' : 'left'
              }} suppressHydrationWarning>
                {t('admin.languages.confirmDelete.title', 'Delete Language')}
              </h2>

              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-body))',
                marginBottom: '1.5rem'
              }} suppressHydrationWarning>
                {t('admin.languages.confirmDelete.message', 'Are you sure you want to delete')} <strong>{deletingLanguage.name}</strong> ({deletingLanguage.native_name})?
              </p>

              <p style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--destructive))',
                marginBottom: '1.5rem',
                padding: '0.75rem',
                backgroundColor: 'hsl(var(--destructive) / 0.1)',
                borderRadius: 'calc(var(--radius) * 1.5)'
              }} suppressHydrationWarning>
                {t('admin.languages.confirmDelete.warning', 'This action cannot be undone. All translations for this language will be deleted.')}
              </p>

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexDirection: isRtl ? 'row-reverse' : 'row'
              }}>
                <button
                  onClick={handleDeleteCancel}
                  style={{
                    flex: 1,
                    paddingInlineStart: '1rem',
                    paddingInlineEnd: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    backgroundColor: 'transparent',
                    color: 'hsl(var(--text-body))',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    transition: 'background-color 0.2s',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    minWidth: '100px'
                  }}
                  className="hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                  <span suppressHydrationWarning>{t('common.cancel', 'Cancel')}</span>
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  style={{
                    flex: 1,
                    paddingInlineStart: '1rem',
                    paddingInlineEnd: '1rem',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem',
                    backgroundColor: 'hsl(var(--destructive))',
                    color: 'hsl(var(--destructive-foreground))',
                    borderRadius: 'calc(var(--radius) * 1.5)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    transition: 'opacity 0.2s',
                    flexDirection: isRtl ? 'row-reverse' : 'row',
                    minWidth: '100px'
                  }}
                  className="hover:opacity-90"
                >
                  <Trash2 className="h-4 w-4" />
                  <span suppressHydrationWarning>{t('admin.languages.confirmDelete.confirm', 'Delete')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
