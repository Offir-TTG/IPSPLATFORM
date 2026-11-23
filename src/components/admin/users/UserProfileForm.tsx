'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { toast } from 'sonner';
import { Camera, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuickPills } from '@/components/admin/notifications/kit';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAdminLanguage } from '@/context/AppContext';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';
import '@/styles/google-places.css';
import { loadGoogleMapsScript } from '@/lib/address/googleMaps';
import { NEW_CLIENT_ROLE, isClientRole } from '@/lib/auth/roles';

// Schema matches the actual users table structure. Phone uses E.164
// (validated via react-phone-number-input). Address is a single text
// column (`location`) — Google Places autocomplete fills it with the
// formatted address; no structured sub-fields.
const userUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || isValidPhoneNumber(v),
      'Invalid phone number'
    ),
  role: z.enum(['student', 'client', 'instructor', 'admin', 'staff']),
  status: z.enum(['active', 'invited', 'suspended', 'deleted']),
  bio: z.string().optional(),
  location: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  is_whatsapp: z.boolean(),
});

type UserUpdateForm = z.infer<typeof userUpdateSchema>;

// Google Places renders its dropdown into document.body, OUTSIDE the
// Radix dialog DOM. Suggestion clicks land on .pac-container, .pac-item,
// or any descendant span/icon. We treat any of those as "inside" so
// Radix doesn't dismiss the input mid-selection.
function isInsidePacContainer(target: EventTarget | null): boolean {
  if (!target) return false;
  const el = target as HTMLElement | null;
  if (!el?.closest) return false;
  return !!el.closest('.pac-container');
}

/**
 * Editing a user's profile, inside the user drawer (it used to open a
 * second drawer). The same fields, checks and saving as before: name,
 * email, phone, role, status, picture, bio, address with Google
 * suggestions, contact email and WhatsApp. Changes are kept until Save;
 * Discard puts the saved values back.
 */
export function UserProfileForm({
  userId,
  onSaved,
  onDirtyChange,
  actionsSlot,
}: {
  userId: string;
  onSaved: () => void;
  /** Tells the drawer when there are unsaved changes, so closing can warn. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Where Save / Discard go: the drawer's fixed footer, so nothing in the form moves when they appear. */
  actionsSlot?: HTMLElement | null;
}) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const [addressInputEl, setAddressInputElState] = useState<HTMLInputElement | null>(null);
  const setAddressInputEl = useCallback((el: HTMLInputElement | null) => {
    setAddressInputElState(el);
  }, []);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  // Address kept in plain React state (NOT react-hook-form) — same
  // pattern as the enrollment wizard. RHF's Controller-wrapped Input
  // kept dropping Google's selection because Google mutates the DOM
  // value directly without firing a React-compatible change event.
  const [addressValue, setAddressValue] = useState('');
  // Track the initially-loaded address so the Save button can detect
  // changes to it — RHF's isDirty doesn't cover this field anymore.
  const [initialAddress, setInitialAddress] = useState('');

  const form = useForm<UserUpdateForm>({
    resolver: zodResolver(userUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: NEW_CLIENT_ROLE,
      status: 'active',
      bio: '',
      location: '',
      contact_email: '',
      is_whatsapp: false,
    },
  });

  const { isDirty } = form.formState;

  const hasChanges = isDirty || addressValue !== initialAddress;
  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);
  // Leaving the section (or closing the drawer) clears the flag.
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const fetchUserDetails = async () => {

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/tenant/users/${userId}`);
      const result = await response.json();

      if (result.success) {
        const user = result.data.user;
        setUserDetails(result.data);

        // Populate form
        form.reset({
          first_name: user.users.first_name || '',
          last_name: user.users.last_name || '',
          email: user.users.email || '',
          phone: user.users.phone || '',
          role: isClientRole(user.role) || !user.role ? NEW_CLIENT_ROLE : user.role,
          status: user.status || 'active',
          bio: user.users.bio || '',
          location: user.users.location || '',
          // Default contact email to the login email when none is set,
          // so the admin sees the address that will receive communications.
          contact_email: user.users.contact_email || user.users.email || '',
          is_whatsapp: !!user.users.is_whatsapp,
        });
        // Address lives in plain React state (see addressValue declaration).
        const initialLoc = user.users.location || '';
        setAddressValue(initialLoc);
        setInitialAddress(initialLoc);
      } else {
        toast.error(result.error || t('admin.users.drawer.loadError', 'Failed to load user details'));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(t('admin.users.drawer.loadError', 'Failed to load user details'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    const stopPacPropagation = (e: Event) => {
      if (isInsidePacContainer(e.target)) {
        e.stopPropagation();
      }
    };
    document.addEventListener('pointerdown', stopPacPropagation, false);
    document.addEventListener('mousedown', stopPacPropagation, false);
    return () => {
      document.removeEventListener('pointerdown', stopPacPropagation, false);
      document.removeEventListener('mousedown', stopPacPropagation, false);
    };
  }, []);

  // Load the Google Maps script once the drawer is open. Same env var
  // and same idempotent loader the public enrollment wizard uses.
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('[UserProfileForm] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => setGoogleMapsLoaded(true))
      .catch((err) => console.error('[UserProfileForm] Google Maps load failed:', err));
  }, []);

  // Callback ref attached to the street_address <input>. Radix Tabs
  // only mounts the active tab's content, so the input doesn't exist
  // until the user opens the Profile tab — that's why a one-shot
  // useEffect on open wouldn't find it. A callback ref fires every
  // time React attaches the element (tab open → init) or detaches it
  // (tab switch → cleanup), and also re-fires when googleMapsLoaded
  // flips from false → true.
  // Attach Google Places Autocomplete once both the input is mounted
  // and the Google script has loaded. Earlier attempts initialized
  // inside a callback ref, which kept firing on every render (each
  // form-state change rebuilt the ref function) and tore down Google's
  // listener before `place_changed` could fire. A useEffect keyed on
  // the stable element + load flag attaches exactly once and survives
  // form re-renders.
  useEffect(() => {
    if (!addressInputEl) return;
    if (!googleMapsLoaded) return;
    if (typeof window === 'undefined' || !window.google?.maps?.places) return;

    let ac: any;
    try {
      ac = new window.google.maps.places.Autocomplete(addressInputEl, {
        fields: ['formatted_address', 'name', 'address_components', 'geometry'],
      });
      console.log('[UserProfileForm] Autocomplete attached (stable effect)');

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const formatted = place?.formatted_address ?? '';
        if (!formatted) return;
        // Plain React setState — exactly the wizard's pattern.
        setAddressValue(formatted);
      });
    } catch (err) {
      console.error('[UserProfileForm] Google Places autocomplete init failed:', err);
    }

    return () => {
      if (ac && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(ac);
        } catch {}
      }
    };
  }, [addressInputEl, googleMapsLoaded]);

  const discard = () => {
    form.reset();
    setAddressValue(initialAddress);
  };

  const onSubmit = async (data: UserUpdateForm) => {
    setSaving(true);
    try {
      // The address is kept outside the form library (see addressValue).
      const payload = { ...data, location: addressValue };
      const response = await fetch(`/api/admin/tenant/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(t('admin.users.drawer.updateSuccess', 'User updated successfully'));
        form.reset(data);
        setInitialAddress(addressValue);
        onSaved();
      } else {
        toast.error(result.error || t('admin.users.drawer.updateError', 'Failed to update user'));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(t('admin.users.drawer.updateError', 'Failed to update user'));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so picking the same file again still fires onChange.
    if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        t(
          'admin.users.drawer.avatar.tooLarge',
          'File is too large (max 2 MB).'
        )
      );
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error(
        t('admin.users.drawer.avatar.notImage', 'File must be an image.')
      );
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(
        `/api/admin/tenant/users/${userId}/upload-avatar`,
        { method: 'POST', body: formData }
      );
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      toast.success(
        t(
          'admin.users.drawer.avatar.uploaded',
          'Profile image updated successfully'
        )
      );
      await fetchUserDetails();
      onSaved();
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      toast.error(
        err?.message ||
          t('admin.users.drawer.avatar.uploadFailed', 'Failed to upload image')
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const u = userDetails?.user?.users;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const actions = (
    <div className="flex w-full items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{t('admin.users.drawer.unsavedNote', 'You have unsaved changes')}</span>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={discard} disabled={saving}>
          {t('admin.users.drawer.discard', 'Discard')}
        </Button>
        <Button type="submit" form="user-profile-form" disabled={saving}>
          {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t('admin.users.drawer.saveChanges', 'Save Changes')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
    {hasChanges && actionsSlot && createPortal(actions, actionsSlot)}
    <Form {...form}>
      <form id="user-profile-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Picture */}
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-lg font-bold text-primary">
              {u?.avatar_url ? (
                <Image src={u.avatar_url} alt="" width={64} height={64} className="h-16 w-16 object-cover" />
              ) : (
                <span>
                  {(u?.first_name?.[0] || '?').toUpperCase()}
                  {(u?.last_name?.[0] || '').toUpperCase()}
                </span>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <input ref={avatarFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileSelected} />
            <Button type="button" variant="outline" size="sm" onClick={() => avatarFileInputRef.current?.click()} disabled={uploadingAvatar}>
              {uploadingAvatar ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Camera className="me-2 h-4 w-4" />}
              {u?.avatar_url
                ? t('admin.users.drawer.avatar.change', 'Change image')
                : t('admin.users.drawer.avatar.upload', 'Upload image')}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">{t('admin.users.drawer.avatar.hint', 'JPG or PNG, up to 2 MB.')}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.users.drawer.section.identity', 'Identity')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.users.drawer.firstName', 'First Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="auto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.users.drawer.lastName', 'Last Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} dir="auto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.users.drawer.section.contact', 'Contact')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.users.drawer.email', 'Email')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} dir="ltr" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('admin.users.drawer.phone', 'Phone')}</FormLabel>
                  <FormControl>
                    {/* Mirrors the enrollment wizard config:
                        international E.164 + IL default + 17-char
                        cap + smart caret. The wrapper CSS
                        forces LTR so the country prefix stays
                        on the left of the digits. */}
                    <PhoneInput
                      international
                      defaultCountry="IL"
                      value={field.value || ''}
                      onChange={(value) => {
                        const v = value || '';
                        if (v.length > 17) return;
                        field.onChange(v);
                      }}
                      placeholder="+972 50 000 0000"
                      className="phone-input-wizard"
                      smartCaret={true}
                      numberInputProps={{ maxLength: 17 }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.users.drawer.section.access', 'Access')}
          </h3>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin.users.drawer.role', 'Role')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.users.drawer.role.selectRole', 'Select role')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={NEW_CLIENT_ROLE}>{t('admin.users.drawer.role.student', 'Client')}</SelectItem>
                    <SelectItem value="instructor">{t('admin.users.drawer.role.instructor', 'Instructor')}</SelectItem>
                    <SelectItem value="staff">{t('admin.users.drawer.role.staff', 'Staff')}</SelectItem>
                    <SelectItem value="admin">{t('admin.users.drawer.role.admin', 'Admin')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('admin.users.drawer.status', 'Status')}</FormLabel>
                <FormControl>
                  <div className="max-w-full overflow-x-auto pb-0.5">
                    <QuickPills
                      joined
                      label={t('admin.users.drawer.status', 'Status')}
                      value={field.value}
                      onChange={field.onChange}
                      options={(['active', 'invited', 'suspended', 'deleted'] as const).map((s) => ({
                        value: s,
                        label: (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                s === 'active' ? 'bg-green-500' : s === 'suspended' ? 'bg-red-500' : s === 'invited' ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              aria-hidden
                            />
                            {t(`admin.users.drawer.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1))}
                          </span>
                        ),
                      }))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.users.drawer.bio', 'Bio')}
          </h3>
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RichTextEditor
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder={t('admin.users.drawer.bioPlaceholder', 'Tell us about yourself...')}
                    dir={direction === 'rtl' ? 'rtl' : 'ltr'}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.users.drawer.address.section', 'Address')}
          </h3>

          {/* Plain controlled Input — bypasses RHF for this
              one field because Google's autocomplete mutates
              input.value directly without firing a React
              change event, which RHF's Controller cannot
              observe. The value is injected into the submit
              payload in onSubmit. Mirrors the enrollment
              wizard's profileData.address pattern. */}
          <div className="space-y-2">
            <Label className="flex items-baseline gap-2 flex-wrap">
              <span>{t('admin.users.drawer.location', 'Location')}</span>
              {googleMapsLoaded && (
                <span className="text-[10px] font-normal text-muted-foreground">
                  {t('admin.users.drawer.address.autocompleteHint', 'start typing to see suggestions')}
                </span>
              )}
            </Label>
            <Input
              ref={setAddressInputEl}
              value={addressValue}
              onChange={(e) => setAddressValue(e.target.value)}
              placeholder={t('admin.users.drawer.locationPlaceholder', 'City, Country')}
              dir="ltr"
              className="text-left [direction:ltr] [unicode-bidi:bidi-override]"
              style={{ direction: 'ltr', textAlign: 'left' }}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('admin.users.drawer.section.communication', 'Communication')}
          </h3>

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t('admin.users.drawer.contactEmail', 'Contact email')}
                </FormLabel>
                <FormControl>
                  <Input type="email" {...field} placeholder={t('admin.users.drawer.contactEmailPlaceholder', 'Alternative email address')} dir="ltr" />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'admin.users.drawer.contactEmail.help',
                    'Communications are sent to this address when set; otherwise the login email is used.'
                  )}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_whatsapp"
            render={({ field }) => (
              <FormItem className={`flex flex-row items-start ${isRtl ? 'space-x-reverse' : ''} space-x-3 space-y-0 rounded-md border bg-background p-3`}>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {t('admin.users.drawer.isWhatsapp', 'Phone number is WhatsApp')}
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.users.drawer.isWhatsappDescription', 'Enable if this phone number can receive WhatsApp messages')}
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

      </form>
    </Form>
    </>
  );
}
