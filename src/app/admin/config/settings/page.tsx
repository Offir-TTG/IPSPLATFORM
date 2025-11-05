'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminLanguage } from '@/context/AppContext';
import {
  Settings,
  Save,
  Loader2,
  AlertCircle,
  Check,
  Palette,
  Globe,
  Mail,
  Phone,
  Building,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-react';

interface PlatformSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: 'string' | 'number' | 'boolean' | 'json' | 'color' | 'file';
  category: string;
  label: string;
  description?: string;
  is_public: boolean;
}

interface SettingsByCategory {
  [category: string]: PlatformSetting[];
}

export default function SettingsPage() {
  const { t } = useAdminLanguage();
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [settingsByCategory, setSettingsByCategory] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      const result = await response.json();

      if (result.success) {
        setSettings(result.data);
        groupSettingsByCategory(result.data);
        initializeEditValues(result.data);
      } else {
        setError(result.error || 'Failed to load settings');
      }
    } catch (err) {
      console.error('Load settings error:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const groupSettingsByCategory = (data: PlatformSetting[]) => {
    const grouped: SettingsByCategory = {};
    data.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });
    setSettingsByCategory(grouped);
  };

  const initializeEditValues = (data: PlatformSetting[]) => {
    const values: Record<string, any> = {};
    data.forEach(setting => {
      values[setting.setting_key] = parseSettingValue(setting);
    });
    setEditValues(values);
  };

  const parseSettingValue = (setting: PlatformSetting) => {
    if (setting.setting_type === 'json') {
      return setting.setting_value;
    }
    if (setting.setting_type === 'boolean') {
      return setting.setting_value === true || setting.setting_value === 'true';
    }
    if (setting.setting_type === 'number') {
      return Number(setting.setting_value);
    }
    return setting.setting_value;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      // Prepare updates
      const updates = Object.entries(editValues).map(([key, value]) => {
        const setting = settings.find(s => s.setting_key === key);
        return {
          setting_key: key,
          setting_value: value,
          setting_type: setting?.setting_type,
        };
      });

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updates }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Settings saved successfully');
        await loadSettings();

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Save settings error:', err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderSettingInput = (setting: PlatformSetting) => {
    const value = editValues[setting.setting_key];

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) =>
                setEditValues({ ...editValues, [setting.setting_key]: e.target.checked })
              }
              className="rounded"
            />
            <span className="text-sm">{setting.label}</span>
          </label>
        );

      case 'number':
        return (
          <div>
            <label className="text-sm font-medium block mb-2">{setting.label}</label>
            <input
              type="number"
              value={value || 0}
              onChange={(e) =>
                setEditValues({ ...editValues, [setting.setting_key]: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
            )}
          </div>
        );

      case 'color':
        return (
          <div>
            <label className="text-sm font-medium block mb-2">{setting.label}</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) =>
                  setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
                }
                className="h-10 w-20 rounded cursor-pointer"
              />
              <input
                type="text"
                value={value || '#000000'}
                onChange={(e) =>
                  setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
                }
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
            )}
          </div>
        );

      case 'json':
        return (
          <div>
            <label className="text-sm font-medium block mb-2">{setting.label}</label>
            <textarea
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setEditValues({ ...editValues, [setting.setting_key]: parsed });
                } catch {
                  // Keep as string if invalid JSON
                  setEditValues({ ...editValues, [setting.setting_key]: e.target.value });
                }
              }}
              rows={4}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            />
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
            )}
          </div>
        );

      default: // string
        return (
          <div>
            <label className="text-sm font-medium block mb-2">{setting.label}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) =>
                setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>
            )}
          </div>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'branding':
        return <Building className="h-5 w-5" />;
      case 'theme':
        return <Palette className="h-5 w-5" />;
      case 'business':
        return <DollarSign className="h-5 w-5" />;
      case 'contact':
        return <Mail className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8 text-primary" />
              {t('admin.settings.title', 'Platform Settings')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('admin.settings.subtitle', 'Configure platform-wide settings')}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.saving', 'Saving...')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {t('common.saveAll', 'Save All Changes')}
              </>
            )}
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-md flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span>{success}</span>
          </div>
        )}

        {/* Settings by Category */}
        {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
          <div key={category} className="bg-card rounded-lg border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                {getCategoryIcon(category)}
              </div>
              <div>
                <h2 className="text-xl font-bold capitalize">
                  {t(`admin.settings.category.${category}`, category)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(`admin.settings.category.${category}.description`, `Configure ${category} settings`)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categorySettings.map((setting) => (
                <div
                  key={setting.id}
                  className={setting.setting_type === 'json' ? 'md:col-span-2' : ''}
                >
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(settingsByCategory).length === 0 && (
          <div className="bg-card rounded-lg border p-12 text-center text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('admin.settings.empty', 'No settings configured yet')}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-md text-sm">
          <strong>{t('admin.settings.info.title', 'Note')}:</strong>{' '}
          {t('admin.settings.info.message', 'Changes take effect immediately across the platform.')}
        </div>
      </div>
    </AdminLayout>
  );
}
