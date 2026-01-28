'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useUserLanguage } from '@/context/AppContext';
import {
  Loader2,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  Phone as PhoneIcon,
  MapPin,
  Clock,
  Save,
  X,
  Edit,
  User as UserIcon,
  ChevronDown,
  Search
} from 'lucide-react';
import Image from 'next/image';
import moment from 'moment-timezone';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: any;
  }
}

interface EditableProfileCardProps {
  user: any;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  t: (key: string) => string;
  avatarUrl: string;
  onChangeAvatar: () => void;
}

// Get list of all timezones
const getTimezones = () => {
  return moment.tz.names().map(tz => ({
    value: tz,
    label: `${tz} (UTC${moment.tz(tz).format('Z')})`,
    offset: moment.tz(tz).utcOffset()
  })).sort((a, b) => a.offset - b.offset);
};

// Load Google Maps Script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window.google !== 'undefined' && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

export function EditableProfileCard({
  user,
  onSave,
  isSaving,
  t,
  avatarUrl,
  onChangeAvatar
}: EditableProfileCardProps) {
  // Get direction from the useUserLanguage hook
  const { direction } = useUserLanguage();
  const [isEditing, setIsEditing] = useState(false);
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
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const timezoneDropdownRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      const data = {
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
      };
      setFormData(data);
      setTimezoneSearch('');
    }
  }, [user]);

  // Load Google Maps Script on mount
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log('[Google Maps] Checking API key availability...');

    if (!apiKey || apiKey === 'your_google_maps_api_key') {
      console.warn('[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment variables');
      setGoogleMapsError('Google Maps API key not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.');
      return;
    }

    console.log('[Google Maps] API key found, loading script...');
    loadGoogleMapsScript(apiKey)
      .then(() => {
        console.log('[Google Maps] Script loaded successfully');
        setGoogleMapsLoaded(true);
        setGoogleMapsError(null);
      })
      .catch((error) => {
        console.error('[Google Maps] Failed to load script:', error);
        setGoogleMapsError('Failed to load Google Maps. Please check your API key and internet connection.');
      });
  }, []);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    console.log('[Google Maps] Autocomplete initialization check:', {
      isEditing,
      googleMapsLoaded,
      hasInputRef: !!locationInputRef.current,
      hasGoogleAPI: typeof window !== 'undefined' && typeof window.google !== 'undefined'
    });

    if (!isEditing) {
      console.log('[Google Maps] Not in edit mode, skipping autocomplete');
      return;
    }

    if (!googleMapsLoaded) {
      console.log('[Google Maps] Script not loaded yet, skipping autocomplete');
      return;
    }

    if (!locationInputRef.current) {
      console.log('[Google Maps] Input ref not available, skipping autocomplete');
      return;
    }

    if (typeof window.google === 'undefined' || !window.google.maps) {
      console.error('[Google Maps] Google Maps API not available on window object');
      return;
    }

    try {
      console.log('[Google Maps] Initializing autocomplete...');

      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        fields: ['formatted_address', 'name', 'address_components', 'geometry']
      });

      console.log('[Google Maps] Autocomplete instance created');

      autocompleteRef.current.addListener('place_changed', () => {
        console.log('[Google Maps] Place changed event triggered');
        const place = autocompleteRef.current?.getPlace();
        console.log('[Google Maps] Selected place:', place);

        if (place && place.formatted_address) {
          console.log('[Google Maps] Updating location to:', place.formatted_address);
          setFormData(prev => ({ ...prev, location: place.formatted_address || '' }));
        }
      });

      console.log('[Google Maps] Autocomplete initialized successfully');
    } catch (error) {
      console.error('[Google Maps] Failed to initialize autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current && typeof window.google !== 'undefined') {
        console.log('[Google Maps] Cleaning up autocomplete listeners');
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isEditing, googleMapsLoaded]);

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target as Node)) {
        setShowTimezoneDropdown(false);
      }
    };

    if (showTimezoneDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTimezoneDropdown]);

  const handleSave = async () => {
    // Validate required fields
    const requiredFields = {
      first_name: 'First name',
      last_name: 'Last name',
      phone: 'Phone number',
      contact_email: 'Contact email',
      location: 'Location',
      timezone: 'Timezone'
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key, _]) => {
        const value = formData[key as keyof typeof formData];
        return !value || (typeof value === 'string' && value.trim() === '');
      })
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      toast.error(`${t('user.profile.validation.missing_fields')}: ${missingFields.join(', ')}`);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.contact_email)) {
      toast.error(t('user.profile.validation.invalid_email'));
      return;
    }

    // Validate phone number format using international validation
    if (!formData.phone) {
      toast.error(t('user.profile.validation.phone_required'));
      return;
    }

    // Check if it's a valid international phone number
    if (!isValidPhoneNumber(formData.phone)) {
      toast.error(t('user.profile.validation.phone_invalid'));
      return;
    }

    try {
      await onSave(formData);
      toast.success(t('user.profile.update.success'));
      setIsEditing(false);
      setPhoneError(null); // Clear phone error on successful save
    } catch (error) {
      toast.error(t('user.profile.validation.save_error'));
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
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
      setTimezoneSearch('');
      setPhoneError(null); // Clear phone error on cancel
    }
    setIsEditing(false);
  };

  const filteredTimezones = timezoneSearch
    ? timezones.filter(tz => tz.label.toLowerCase().includes(timezoneSearch.toLowerCase()))
    : timezones;

  const fieldStyle = {
    marginBottom: '1rem'
  };

  const labelStyle = {
    fontSize: 'var(--font-size-xs)',
    fontFamily: 'var(--font-family-primary)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'hsl(var(--text-muted))',
    display: 'block',
    marginBottom: '0.375rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'calc(var(--radius) - 2px)',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'var(--font-family-primary)',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--text-body))',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
  };

  const valueStyle = {
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'var(--font-family-primary)',
    color: 'hsl(var(--text-body))',
    padding: '0.5rem 0',
    minHeight: '2.25rem',
    display: 'flex',
    alignItems: 'center'
  };

  const sectionTitleStyle = {
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family-heading)',
    fontWeight: 'var(--font-weight-semibold)',
    color: 'hsl(var(--text-heading))',
    marginBottom: '0.875rem',
    marginTop: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  return (
    <Card className="overflow-hidden">
      {/* Header with Avatar - Mobile Optimized */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          {/* Avatar */}
          <div className="relative group">
            <Image
              src={avatarUrl}
              alt={`${user.first_name} ${user.last_name}`}
              width={100}
              height={100}
              className="rounded-full border-4 border-white shadow-lg cursor-pointer transition-transform group-hover:scale-105"
              onClick={onChangeAvatar}
            />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={onChangeAvatar}>
              <Edit className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-start">
            <h2 className="text-2xl sm:text-3xl font-bold text-heading mb-2">
              {user.first_name} {user.last_name}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium">
                {t(`user.profile.role.${user.role}`)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {/* Action Button */}
          <div className="w-full sm:w-auto">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Edit className="h-4 w-4" />
                <span>{t('user.profile.buttons.edit_profile')}</span>
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('user.profile.edit.cancel')}</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!isSaving && <Save className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isSaving ? t('user.profile.edit.saving') : t('user.profile.edit.save')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-4 sm:p-5">
        {/* Personal Information Section */}
        <div style={sectionTitleStyle}>
          <UserIcon className="h-4 w-4" />
          <span>{t('user.profile.edit.personal_info')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* First Name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              {t('user.profile.edit.first_name')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
                required
              />
            ) : (
              <div style={valueStyle}>{user.first_name || t('user.profile.edit.not_specified')}</div>
            )}
          </div>

          {/* Last Name */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              {t('user.profile.edit.last_name')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
                required
              />
            ) : (
              <div style={valueStyle}>{user.last_name || t('user.profile.edit.not_specified')}</div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div style={{...fieldStyle, marginBottom: '0'}}>
          <label style={labelStyle}>{t('user.profile.edit.bio')}</label>
          {isEditing ? (
            <RichTextEditor
              value={formData.bio}
              onChange={(value) => setFormData({ ...formData, bio: value })}
              placeholder={t('user.profile.edit.bio_placeholder')}
              dir={direction}
            />
          ) : (
            <div
              style={{
                ...valueStyle,
                minHeight: '50px'
              }}
              dangerouslySetInnerHTML={{
                __html: user.bio || `<p style="color: hsl(var(--text-muted))">${t('user.profile.no_bio')}</p>`
              }}
            />
          )}
        </div>

        <Separator className="my-4" />

        {/* Contact Information Section */}
        <div style={sectionTitleStyle}>
          <PhoneIcon className="h-4 w-4" />
          <span>{t('user.profile.edit.contact_info')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* Phone with WhatsApp - International Format */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              {t('user.profile.edit.phone')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            {isEditing ? (
              <div>
                <PhoneInput
                  international
                  defaultCountry="IL"
                  value={formData.phone}
                  onChange={(value) => {
                    // Limit to 17 characters (max for international phone numbers with country code)
                    // E.164 format allows max 15 digits + "+" prefix + spaces = ~17 chars
                    const maxLength = 17;
                    if (value && value.length > maxLength) {
                      setPhoneError(`Phone number is too long (max ${maxLength} characters)`);
                      return; // Don't update if too long
                    }

                    setFormData({ ...formData, phone: value || '' });

                    // Real-time validation
                    if (value && value.length > 5) {
                      if (!isValidPhoneNumber(value)) {
                        setPhoneError(t('user.profile.edit.phone_error.invalid'));
                      } else {
                        setPhoneError(null);
                      }
                    } else if (!value) {
                      setPhoneError(null); // Clear error when empty
                    }
                  }}
                  placeholder="+972 50 123 4567"
                  className="phone-input-custom"
                  style={{
                    ...inputStyle,
                    padding: '0'
                  }}
                  smartCaret={true}
                  numberInputProps={{
                    maxLength: 17
                  }}
                />
                <style jsx global>{`
                  .phone-input-custom .PhoneInputInput {
                    padding: 0.625rem 0.75rem;
                    border: none;
                    outline: none;
                    font-size: var(--font-size-sm);
                    font-family: var(--font-family-primary);
                    background-color: transparent;
                    color: hsl(var(--text-body));
                  }
                  .phone-input-custom .PhoneInputInput:focus {
                    outline: none;
                  }
                  .phone-input-custom {
                    display: flex;
                    align-items: center;
                  }
                  .phone-input-custom .PhoneInputCountry {
                    padding: 0 0.5rem;
                  }
                `}</style>
                {phoneError && (
                  <p className="text-xs text-destructive mt-1.5">
                    {phoneError}
                  </p>
                )}
                <div className="flex items-center gap-2.5 mt-2">
                  <Switch
                    checked={formData.is_whatsapp}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_whatsapp: checked })}
                  />
                  <label
                    className="flex items-center gap-2 cursor-pointer text-sm"
                    onClick={() => setFormData({ ...formData, is_whatsapp: !formData.is_whatsapp })}
                  >
                    <MessageCircle className="h-4 w-4" style={{ color: '#25D366' }} />
                    <span>{t('user.profile.edit.is_whatsapp')}</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2" style={valueStyle}>
                <span>{user.phone || t('user.profile.edit.not_specified')}</span>
                {user.is_whatsapp && (
                  <span title="WhatsApp">
                    <MessageCircle className="h-4 w-4" style={{ color: '#25D366' }} />
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Contact Email */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              {t('user.profile.edit.contact_email')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            {isEditing ? (
              <>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="email@example.com"
                  style={inputStyle}
                  className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {t('user.profile.edit.contact_email_hint')}
                </p>
              </>
            ) : (
              <div style={valueStyle}>{user.contact_email || user.email || t('user.profile.edit.not_specified')}</div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Location & Timezone Section */}
        <div style={sectionTitleStyle}>
          <MapPin className="h-4 w-4" />
          <span>{t('user.profile.edit.location_timezone')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          {/* Location with Google Autocomplete */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              {t('user.profile.edit.location')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            {isEditing ? (
              <>
                <input
                  ref={locationInputRef}
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Enter your city or address"
                  style={{...inputStyle, textAlign: 'right'}}
                  className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
                />
                {googleMapsError && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{googleMapsError}</span>
                  </p>
                )}
                {!googleMapsLoaded && !googleMapsError && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Loading location autocomplete...
                  </p>
                )}
                {googleMapsLoaded && (
                  <p className="text-xs text-green-600 mt-1.5">
                    {t('user.profile.edit.location_autocomplete_ready')}
                  </p>
                )}
              </>
            ) : (
              <div style={{...valueStyle, textAlign: 'right'}}>{user.location || t('user.profile.edit.not_specified')}</div>
            )}
          </div>

          {/* Timezone with Custom Searchable Dropdown */}
          <div style={fieldStyle} ref={timezoneDropdownRef}>
            <label style={labelStyle}>
              {t('user.profile.edit.timezone')} <span style={{ color: 'hsl(var(--destructive))' }}>*</span>
            </label>
            {isEditing ? (
              <div className="relative">
                <div
                  onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                  style={{
                    ...inputStyle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
                >
                  <span>
                    {timezones.find(tz => tz.value === formData.timezone)?.label || formData.timezone}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showTimezoneDropdown ? 'rotate-180' : ''}`} />
                </div>

                {showTimezoneDropdown && (
                  <div
                    className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg"
                    style={{ maxHeight: '320px' }}
                  >
                    {/* Search Input */}
                    <div className="p-2 border-b border-border sticky top-0 bg-background">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={timezoneSearch}
                          onChange={(e) => setTimezoneSearch(e.target.value)}
                          placeholder={t('user.profile.edit.search_timezone') || 'Search timezone...'}
                          className="w-full pl-9 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Timezone List */}
                    <div className="overflow-y-auto" style={{ maxHeight: '260px' }}>
                      {filteredTimezones.length > 0 ? (
                        filteredTimezones.map((tz) => (
                          <div
                            key={tz.value}
                            onClick={() => {
                              setFormData({ ...formData, timezone: tz.value });
                              setShowTimezoneDropdown(false);
                              setTimezoneSearch('');
                            }}
                            className={`px-4 py-2.5 cursor-pointer hover:bg-accent text-sm ${
                              formData.timezone === tz.value ? 'bg-accent font-medium' : ''
                            }`}
                          >
                            {tz.label}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                          {t('user.profile.edit.no_timezone_found') || 'No timezone found'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={valueStyle}>
                {user.timezone ? `${user.timezone} (UTC${moment.tz(user.timezone).format('Z')})` : t('user.profile.edit.not_specified')}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />

        {/* Social Links Section */}
        <div style={sectionTitleStyle}>
          <Globe className="h-4 w-4" />
          <span>{t('user.profile.edit.social_links')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Website */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <Globe className={`h-3 w-3 inline ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} />
              {t('user.profile.edit.website')}
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourwebsite.com"
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
              />
            ) : (
              <div style={valueStyle}>
                {user.website ? (
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.website}
                  </a>
                ) : t('user.profile.edit.not_specified')}
              </div>
            )}
          </div>

          {/* LinkedIn */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <Linkedin className={`h-3 w-3 inline ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} />
              {t('user.profile.edit.linkedin')}
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
              />
            ) : (
              <div style={valueStyle}>
                {user.linkedin_url ? (
                  <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.linkedin_url}
                  </a>
                ) : t('user.profile.edit.not_specified')}
              </div>
            )}
          </div>

          {/* Facebook */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <Facebook className={`h-3 w-3 inline ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} />
              {t('user.profile.edit.facebook')}
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.facebook_url}
                onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                placeholder="https://facebook.com/yourprofile"
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
              />
            ) : (
              <div style={valueStyle}>
                {user.facebook_url ? (
                  <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.facebook_url}
                  </a>
                ) : t('user.profile.edit.not_specified')}
              </div>
            )}
          </div>

          {/* Instagram */}
          <div style={fieldStyle}>
            <label style={labelStyle}>
              <Instagram className={`h-3 w-3 inline ${direction === 'rtl' ? 'ml-1' : 'mr-1'}`} />
              {t('user.profile.edit.instagram')}
            </label>
            {isEditing ? (
              <input
                type="url"
                value={formData.instagram_url}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com/yourprofile"
                style={inputStyle}
                className="focus:outline-none focus:ring-2 focus:ring-primary hover:border-primary/50"
              />
            ) : (
              <div style={valueStyle}>
                {user.instagram_url ? (
                  <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {user.instagram_url}
                  </a>
                ) : t('user.profile.edit.not_specified')}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
