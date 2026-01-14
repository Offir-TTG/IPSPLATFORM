'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Loader2, Globe, Linkedin, Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';
import moment from 'moment-timezone';

interface ProfileEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  t: (key: string) => string;
}

// Get list of all timezones
const getTimezones = () => {
  return moment.tz.names().map(tz => ({
    value: tz,
    label: `${tz} (UTC${moment.tz(tz).format('Z')})`,
    offset: moment.tz(tz).utcOffset()
  })).sort((a, b) => a.offset - b.offset);
};

export function ProfileEditDialog({
  isOpen,
  onClose,
  user,
  onSave,
  isSaving,
  t
}: ProfileEditDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    is_whatsapp: false,
    contact_email: '',
    bio: '',
    location: '',
    timezone: 'Asia/Jerusalem',
    website: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
  });

  const [timezones] = useState(getTimezones());
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        is_whatsapp: user.is_whatsapp || false,
        contact_email: user.contact_email || user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        timezone: user.timezone || 'Asia/Jerusalem',
        website: user.website || '',
        linkedin_url: user.linkedin_url || '',
        facebook_url: user.facebook_url || '',
        instagram_url: user.instagram_url || '',
      });
      setTimezoneSearch(user.timezone || 'Asia/Jerusalem');
    }
  }, [user]);

  const filteredTimezones = timezones.filter(tz =>
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    await onSave(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'calc(var(--radius))',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family-primary)',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--text-body))'
  };

  const labelStyle = {
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'var(--font-family-primary)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'hsl(var(--text-heading))',
    display: 'block',
    marginBottom: '0.5rem'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('user.profile.edit.title')}</DialogTitle>
          <DialogDescription>
            {t('user.profile.edit.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name Fields */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>{t('user.profile.edit.first_name')}</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label style={labelStyle}>{t('user.profile.edit.last_name')}</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Phone with WhatsApp Toggle */}
          <div>
            <label style={labelStyle}>{t('user.profile.edit.phone')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 234 567 8900"
              style={inputStyle}
              className="focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '0.75rem'
            }}>
              <Switch
                checked={formData.is_whatsapp}
                onCheckedChange={(checked) => setFormData({ ...formData, is_whatsapp: checked })}
              />
              <label style={{
                fontSize: 'var(--font-size-sm)',
                fontFamily: 'var(--font-family-primary)',
                color: 'hsl(var(--text-body))',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
              onClick={() => setFormData({ ...formData, is_whatsapp: !formData.is_whatsapp })}
              >
                <MessageCircle className="h-4 w-4" style={{ color: '#25D366' }} />
                {t('user.profile.edit.is_whatsapp')}
              </label>
            </div>
          </div>

          {/* Email (Read-only) */}
          <div>
            <label style={labelStyle}>Login Email (Read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              disabled
              style={{
                ...inputStyle,
                backgroundColor: 'hsl(var(--muted))',
                cursor: 'not-allowed',
                opacity: 0.6
              }}
            />
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              marginTop: '0.25rem'
            }}>
              This is your login email and cannot be changed
            </p>
          </div>

          {/* Contact Email */}
          <div>
            <label style={{
              ...labelStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Mail className="h-4 w-4" />
              Email for Messages
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="email@example.com"
              style={inputStyle}
              className="focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'hsl(var(--text-muted))',
              marginTop: '0.25rem'
            }}>
              This email will be used for receiving messages
            </p>
          </div>

          {/* Bio - Rich Text Editor */}
          <div>
            <label style={labelStyle}>{t('user.profile.edit.bio')}</label>
            <RichTextEditor
              value={formData.bio}
              onChange={(value) => setFormData({ ...formData, bio: value })}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Location and Timezone */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Location - For now using regular input, can be upgraded to Google Places later */}
            <div>
              <label style={labelStyle}>{t('user.profile.edit.location')}</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('user.profile.edit.location_placeholder')}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Timezone - Searchable Dropdown */}
            <div className="relative">
              <label style={labelStyle}>{t('user.profile.edit.timezone')}</label>
              <input
                type="text"
                value={timezoneSearch}
                onChange={(e) => {
                  setTimezoneSearch(e.target.value);
                  setShowTimezoneDropdown(true);
                }}
                onFocus={() => setShowTimezoneDropdown(true)}
                placeholder="Search timezone..."
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {showTimezoneDropdown && filteredTimezones.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius))',
                    marginTop: '0.25rem',
                    zIndex: 50,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                >
                  {filteredTimezones.slice(0, 50).map((tz) => (
                    <button
                      key={tz.value}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, timezone: tz.value });
                        setTimezoneSearch(tz.value);
                        setShowTimezoneDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        textAlign: 'left',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'var(--font-family-primary)',
                        color: 'hsl(var(--text-body))',
                        border: 'none',
                        backgroundColor: 'transparent',
                        cursor: 'pointer'
                      }}
                      className="hover:bg-accent"
                    >
                      {tz.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Social Links Section */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid hsl(var(--border))'
          }}>
            <h4 style={{
              fontSize: 'var(--font-size-base)',
              fontFamily: 'var(--font-family-heading)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'hsl(var(--text-heading))',
              marginBottom: '1rem'
            }}>{t('user.profile.social.title')}</h4>

            {/* Website */}
            <div className="mb-4">
              <label style={{
                ...labelStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Globe className="h-4 w-4" />
                {t('user.profile.social.website')}
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder={t('user.profile.social.website_placeholder')}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* LinkedIn */}
            <div className="mb-4">
              <label style={{
                ...labelStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Linkedin className="h-4 w-4" />
                {t('user.profile.social.linkedin')}
              </label>
              <input
                type="text"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder={t('user.profile.social.linkedin_placeholder')}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Facebook */}
            <div className="mb-4">
              <label style={{
                ...labelStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Facebook className="h-4 w-4" />
                {t('user.profile.social.facebook')}
              </label>
              <input
                type="text"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder={t('user.profile.social.facebook_placeholder')}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Instagram */}
            <div className="mb-4">
              <label style={{
                ...labelStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Instagram className="h-4 w-4" />
                {t('user.profile.social.instagram')}
              </label>
              <input
                type="text"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder={t('user.profile.social.instagram_placeholder')}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClose}
            disabled={isSaving}
            style={{
              paddingInlineStart: '1rem',
              paddingInlineEnd: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius))',
              backgroundColor: 'transparent',
              color: 'hsl(var(--text-body))',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              opacity: isSaving ? 0.5 : 1
            }}
            className="hover:bg-accent"
          >
            {t('user.profile.edit.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
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
              borderRadius: 'calc(var(--radius))',
              border: 'none',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
              opacity: isSaving ? 0.7 : 1
            }}
            className="hover:opacity-90"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? t('user.profile.edit.saving') : t('user.profile.edit.save')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
