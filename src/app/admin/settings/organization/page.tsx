'use client';

import { useState, useEffect } from 'react';
import { useAdminLanguage, useTenant } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

interface TenantData {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  status: string;
  subscription_tier: string;
  max_users: number;
  max_courses: number;
  logo_url: string | null;
  primary_color: string | null;
  admin_email: string;
  default_language: string;
  timezone: string;
  currency: string;
  enabled_features: Record<string, boolean>;
  created_at: string;
  userRole?: string;
}

export default function OrganizationSettingsPage() {
  const { t } = useAdminLanguage();
  const { isAdmin, tenantName } = useTenant();
  const [tenantData, setTenantData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    primary_color: '',
    admin_email: '',
    default_language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    enabled_features: {
      courses: true,
      zoom: false,
      docusign: false,
    },
  });

  useEffect(() => {
    loadTenantData();
  }, []);

  const loadTenantData = async () => {
    try {
      const response = await fetch('/api/admin/tenant');
      const data = await response.json();

      if (data.success) {
        setTenantData(data.data);
        setFormData({
          name: data.data.name || '',
          logo_url: data.data.logo_url || '',
          primary_color: data.data.primary_color || '',
          admin_email: data.data.admin_email || '',
          default_language: data.data.default_language || 'en',
          timezone: data.data.timezone || 'UTC',
          currency: data.data.currency || 'USD',
          enabled_features: data.data.enabled_features || {
            courses: true,
            zoom: false,
            docusign: false,
          },
        });
      } else {
        setError(data.error || t('failed_to_load_tenant', 'Failed to load organization data'));
      }
    } catch (err) {
      setError(t('error_loading_tenant', 'Error loading organization data'));
      console.error('Error loading tenant:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch('/api/admin/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(t('tenant_updated', 'Organization updated successfully'));
        setTenantData(data.data);
      } else {
        setError(data.error || t('failed_to_update_tenant', 'Failed to update organization'));
      }
    } catch (err) {
      setError(t('error_updating_tenant', 'Error updating organization'));
      console.error('Error updating tenant:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleFeatureToggle = (feature: keyof typeof formData.enabled_features) => {
    setFormData({
      ...formData,
      enabled_features: {
        ...formData.enabled_features,
        [feature]: !formData.enabled_features[feature],
      },
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <p className="text-red-600">{t('admin_access_required', 'Admin access required')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>{t('loading', 'Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('organization_settings', 'Organization Settings')}</h1>
        <p className="text-gray-600">{t('manage_organization', 'Manage your organization settings')}</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">{error}</div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('basic_information', 'Basic Information')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('organization_name', 'Organization Name')}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('slug', 'Slug')}</label>
              <input
                type="text"
                disabled
                value={tenantData?.slug || ''}
                className="w-full p-2 border rounded bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('slug_cannot_be_changed', 'Slug cannot be changed')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('admin_email', 'Admin Email')}
              </label>
              <input
                type="email"
                required
                value={formData.admin_email}
                onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('status', 'Status')}</label>
              <input
                type="text"
                disabled
                value={tenantData?.status || ''}
                className="w-full p-2 border rounded bg-gray-100 text-gray-600 capitalize"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('branding', 'Branding')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('logo_url', 'Logo URL')}</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('primary_color', 'Primary Color')}
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primary_color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="h-10 w-20 border rounded"
                />
                <input
                  type="text"
                  value={formData.primary_color || ''}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="flex-1 p-2 border rounded"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Localization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('localization', 'Localization')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('default_language', 'Default Language')}
              </label>
              <select
                value={formData.default_language}
                onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="en">English</option>
                <option value="he">Hebrew</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('timezone', 'Timezone')}</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New York</option>
                <option value="America/Los_Angeles">America/Los Angeles</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Asia/Jerusalem">Asia/Jerusalem</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('currency', 'Currency')}</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full p-2 border rounded"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="ILS">ILS - Israeli Shekel</option>
              </select>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('enabled_features', 'Enabled Features')}</h2>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled_features.courses}
                onChange={() => handleFeatureToggle('courses')}
                className="mr-3 h-4 w-4"
              />
              <span>{t('courses', 'Courses')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled_features.zoom}
                onChange={() => handleFeatureToggle('zoom')}
                className="mr-3 h-4 w-4"
              />
              <span>{t('zoom_integration', 'Zoom Integration')}</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled_features.docusign}
                onChange={() => handleFeatureToggle('docusign')}
                className="mr-3 h-4 w-4"
              />
              <span>{t('docusign_integration', 'DocuSign Integration')}</span>
            </label>
          </div>
        </div>

        {/* Subscription Info (Read-only) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('subscription', 'Subscription')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('tier', 'Tier')}</label>
              <input
                type="text"
                disabled
                value={tenantData?.subscription_tier || ''}
                className="w-full p-2 border rounded bg-gray-100 text-gray-600 capitalize"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('max_users', 'Max Users')}</label>
              <input
                type="number"
                disabled
                value={tenantData?.max_users || 0}
                className="w-full p-2 border rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('max_courses', 'Max Courses')}</label>
              <input
                type="number"
                disabled
                value={tenantData?.max_courses || 0}
                className="w-full p-2 border rounded bg-gray-100 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('created_at', 'Created At')}</label>
              <input
                type="text"
                disabled
                value={tenantData?.created_at ? new Date(tenantData.created_at).toLocaleDateString() : ''}
                className="w-full p-2 border rounded bg-gray-100 text-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" onClick={loadTenantData} className="bg-gray-500 hover:bg-gray-600">
            {t('reset', 'Reset')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('saving', 'Saving...') : t('save_changes', 'Save Changes')}
          </Button>
        </div>
      </form>
    </div>
  );
}
