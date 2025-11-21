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
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Responsive breakpoints
  const isMobile = windowWidth <= 640;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) =>
                setEditValues({ ...editValues, [setting.setting_key]: e.target.checked })
              }
              style={{
                borderRadius: 'var(--radius)',
                cursor: 'pointer'
              }}
            />
            <span style={{
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-body))'
            }}>{setting.label}</span>
          </label>
        );

      case 'number':
        return (
          <div>
            <label style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-heading))',
              display: 'block',
              marginBottom: '0.5rem'
            }}>{setting.label}</label>
            <input
              type="number"
              value={value || 0}
              onChange={(e) =>
                setEditValues({ ...editValues, [setting.setting_key]: Number(e.target.value) })
              }
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
            {setting.description && (
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                fontFamily: 'var(--font-family-primary)',
                marginTop: '0.25rem'
              }}>{setting.description}</p>
            )}
          </div>
        );

      case 'color':
        return (
          <div>
            <label style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-heading))',
              display: 'block',
              marginBottom: '0.5rem'
            }}>{setting.label}</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) =>
                  setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
                }
                style={{
                  height: '2.5rem',
                  width: '5rem',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <input
                type="text"
                value={value || '#000000'}
                onChange={(e) =>
                  setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
                }
                style={{
                  flex: 1,
                  paddingInlineStart: '0.75rem',
                  paddingInlineEnd: '0.75rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'calc(var(--radius) * 1.5)',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-mono)'
                }}
                className="focus:outline-none focus:ring-2"
                onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
              />
            </div>
            {setting.description && (
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                fontFamily: 'var(--font-family-primary)',
                marginTop: '0.25rem'
              }}>{setting.description}</p>
            )}
          </div>
        );

      case 'json':
        return (
          <div>
            <label style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-heading))',
              display: 'block',
              marginBottom: '0.5rem'
            }}>{setting.label}</label>
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
                fontFamily: 'var(--font-family-mono)'
              }}
              className="focus:outline-none focus:ring-2"
              onFocus={(e) => e.target.style.setProperty('--tw-ring-color', 'hsl(var(--primary))')}
            />
            {setting.description && (
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                fontFamily: 'var(--font-family-primary)',
                marginTop: '0.25rem'
              }}>{setting.description}</p>
            )}
          </div>
        );

      default: // string
        return (
          <div>
            <label style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              fontFamily: 'var(--font-family-primary)',
              color: 'hsl(var(--text-heading))',
              display: 'block',
              marginBottom: '0.5rem'
            }}>{setting.label}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) =>
                setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
              }
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
            {setting.description && (
              <p style={{
                fontSize: 'var(--font-size-xs)',
                color: 'hsl(var(--text-muted))',
                fontFamily: 'var(--font-family-primary)',
                marginTop: '0.25rem'
              }}>{setting.description}</p>
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '24rem'
        }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
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
              color: 'hsl(var(--text-heading))',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Settings className="h-8 w-8" style={{ color: 'hsl(var(--primary))' }} />
              {t('admin.settings.title', 'Platform Settings')}
            </h1>
            <p style={{
              color: 'hsl(var(--text-muted))',
              marginTop: '0.5rem',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)'
            }}>
              {t('admin.settings.subtitle', 'Configure platform-wide settings')}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              paddingInlineStart: '1.5rem',
              paddingInlineEnd: '1.5rem',
              paddingTop: '0.75rem',
              paddingBottom: '0.75rem',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderRadius: 'calc(var(--radius) * 1.5)',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              border: 'none',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'opacity 0.2s',
              width: isMobile ? '100%' : 'auto'
            }}
            className="hover:opacity-90"
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

        {/* Settings by Category */}
        {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
          <div key={category} style={{
            backgroundColor: 'hsl(var(--card))',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                height: '2.5rem',
                width: '2.5rem',
                backgroundColor: 'hsl(var(--primary) / 0.1)',
                borderRadius: 'calc(var(--radius) * 2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--primary))'
              }}>
                {getCategoryIcon(category)}
              </div>
              <div>
                <h2 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontFamily: 'var(--font-family-heading)',
                  color: 'hsl(var(--text-heading))',
                  textTransform: 'capitalize'
                }}>
                  {t(`admin.settings.category.${category}`, category)}
                </h2>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'hsl(var(--text-muted))',
                  fontFamily: 'var(--font-family-primary)'
                }}>
                  {t(`admin.settings.category.${category}.description`, `Configure ${category} settings`)}
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {categorySettings.map((setting) => (
                <div
                  key={setting.id}
                  style={{
                    gridColumn: setting.setting_type === 'json' ? '1 / -1' : 'auto'
                  }}
                >
                  {renderSettingInput(setting)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {Object.keys(settingsByCategory).length === 0 && (
          <div style={{
            backgroundColor: 'hsl(var(--card))',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--border))',
            padding: '3rem',
            textAlign: 'center',
            color: 'hsl(var(--text-muted))'
          }}>
            <Settings className="h-12 w-12" style={{
              margin: '0 auto 1rem',
              opacity: 0.5
            }} />
            <p style={{
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)'
            }}>{t('admin.settings.empty', 'No settings configured yet')}</p>
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
            <strong style={{ color: 'hsl(var(--text-heading))' }}>{t('admin.settings.info.title', 'Note')}:</strong>{' '}
            {t('admin.settings.info.message', 'Changes take effect immediately across the platform.')}
          </span>
        </div>
      </div>
    </AdminLayout>
  );
}
