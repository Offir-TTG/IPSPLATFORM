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
  DollarSign,
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

export default function LanguagesPage() {
  const { t } = useAdminLanguage();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [formData, setFormData] = useState<Language>({
    code: '',
    name: '',
    native_name: '',
    direction: 'ltr',
    is_active: true,
    is_default: false,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/languages');
      const data = await response.json();

      if (data.success) {
        setLanguages(data.data || []);
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
    setShowModal(true);
  };

  const handleEdit = (language: Language) => {
    setEditingLanguage(language);
    setFormData(language);
    setError('');
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
        await loadLanguages();
        setShowModal(false);
        // Clear translation cache
        await fetch('/api/translations', { method: 'POST' });
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

  const handleDelete = async (language: Language) => {
    if (!confirm(t('admin.languages.confirmDelete', `Delete ${language.name}?`))) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/languages?code=${language.code}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await loadLanguages();
      } else {
        alert(data.error || 'Failed to delete language');
      }
    } catch (err) {
      alert('Failed to delete language');
      console.error(err);
    }
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
        await loadLanguages();
      }
    } catch (err) {
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
        await loadLanguages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t('admin.languages.title', 'Languages')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.languages.subtitle', 'Manage platform languages and translations')}
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-5 w-5" />
            {t('admin.languages.add', 'Add Language')}
          </button>
        </div>

        {/* Languages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((language) => (
            <div
              key={language.code}
              className="bg-card border rounded-lg p-6 relative group hover:shadow-lg transition-shadow"
            >
              {/* Badges */}
              <div className="absolute top-4 right-4 flex gap-2">
                {language.is_default && (
                  <div className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full" title={t('admin.languages.default', 'Default')}>
                    <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                  </div>
                )}
                {language.is_active ? (
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-full" title={t('admin.languages.active', 'Active')}>
                    <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" title={t('admin.languages.inactive', 'Inactive')}>
                    <EyeOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </div>

              {/* Language Info */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{language.native_name}</h3>
                    <p className="text-sm text-muted-foreground">{language.name}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('admin.languages.code', 'Code')}:
                    </span>
                    <span className="font-mono font-semibold">{language.code.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t('admin.languages.direction', 'Direction')}:
                    </span>
                    <span className="font-semibold">
                      {language.direction === 'rtl'
                        ? t('admin.languages.directionRtl', 'RTL ←')
                        : t('admin.languages.directionLtr', 'LTR →')}
                    </span>
                  </div>
                  {language.currency_code && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('admin.languages.currency', 'Currency')}:
                      </span>
                      <span className="font-semibold">
                        {language.currency_symbol} {language.currency_code}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {!language.is_default && (
                  <button
                    onClick={() => handleSetDefault(language)}
                    className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                    title={t('admin.languages.setDefaultTitle', 'Set as default')}
                  >
                    <Star className="h-4 w-4 inline me-1" />
                    {t('admin.languages.setDefault', 'Default')}
                  </button>
                )}

                <button
                  onClick={() => handleToggleActive(language)}
                  className="flex-1 px-3 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                  title={t('admin.languages.toggleActive', 'Toggle status')}
                >
                  {language.is_active ? (
                    <><EyeOff className="h-4 w-4 inline me-1" />{t('admin.languages.hide', 'Hide')}</>
                  ) : (
                    <><Eye className="h-4 w-4 inline me-1" />{t('admin.languages.show', 'Show')}</>
                  )}
                </button>

                <button
                  onClick={() => handleEdit(language)}
                  className="p-2 border rounded-md hover:bg-accent transition-colors"
                  title={t('admin.languages.editTitle', 'Edit')}
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {!language.is_default && (
                  <button
                    onClick={() => handleDelete(language)}
                    className="p-2 border border-destructive/50 text-destructive rounded-md hover:bg-destructive/10 transition-colors"
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
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Globe className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {t('admin.languages.empty', 'No languages yet')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('admin.languages.emptyDesc', 'Add your first language to get started')}
              </p>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                <Plus className="h-5 w-5" />
                {t('admin.languages.add', 'Add Language')}
              </button>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingLanguage
                  ? t('admin.languages.edit', 'Edit Language')
                  : t('admin.languages.add', 'Add Language')}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    {t('admin.languages.form.code', 'Language Code')} *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    placeholder="en, he, es, fr..."
                    maxLength={2}
                    disabled={!!editingLanguage}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('admin.languages.form.codeHint', '2-letter ISO 639-1 code')}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    {t('admin.languages.form.name', 'English Name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="English, Hebrew, Spanish..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    {t('admin.languages.form.nativeName', 'Native Name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.native_name}
                    onChange={(e) => setFormData({ ...formData, native_name: e.target.value })}
                    placeholder="English, עברית, Español..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    {t('admin.languages.form.direction', 'Text Direction')}
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({ ...formData, direction: e.target.value as 'ltr' | 'rtl' })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ltr">{t('admin.languages.form.directionLtr', 'Left to Right (LTR)')}</option>
                    <option value="rtl">{t('admin.languages.form.directionRtl', 'Right to Left (RTL)')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    {t('admin.languages.form.currency', 'Currency')}
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
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CURRENCIES.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('admin.languages.form.currencyHint', 'Default currency for this language')}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {t('admin.languages.form.active', 'Active')}
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_default}
                      onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {t('admin.languages.form.default', 'Default Language')}
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2 border rounded-md hover:bg-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('common.saving', 'Saving...')}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {t('common.save', 'Save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
