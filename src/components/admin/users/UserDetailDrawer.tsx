'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Shield, User, Info, Camera, X, Mail } from 'lucide-react';
import Image from 'next/image';
import { useRef } from 'react';
import { useAdminLanguage } from '@/context/AppContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';
import '@/styles/google-places.css';
import { loadGoogleMapsScript } from '@/lib/address/googleMaps';

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
  role: z.enum(['student', 'instructor', 'admin', 'staff']),
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

interface UserDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onUpdate: () => void;
}

export function UserDetailDrawer({
  open,
  onOpenChange,
  userId,
  onUpdate,
}: UserDetailDrawerProps) {
  const { t, direction } = useAdminLanguage();
  const isRtl = direction === 'rtl';
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Google Places address autocomplete — same setup as the public
  // enrollment wizard. The street_address input gets autocomplete; the
  // parsed components (city / region / postal_code / country) populate
  // the structured fields below it on selection.
  //
  // We track the input element in state (not a ref) so the init effect
  // can react to it. The callback ref `setAddressInputEl` is stable
  // (created once via useCallback([])), so React does NOT detach and
  // re-attach it on every render — earlier attempts that used an
  // inline `(el) => { ... }` ref combiner re-ran on every form-state
  // change, which tore down Google's listener before it could fire.
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
      role: 'student',
      status: 'active',
      bio: '',
      location: '',
      contact_email: '',
      is_whatsapp: false,
    },
  });

  const watchedStatus = form.watch('status');
  const { isDirty } = form.formState;

  // Fetch user details when drawer opens
  useEffect(() => {
    if (open && userId) {
      fetchUserDetails();
    }
  }, [open, userId]);

  // Stop pac-container pointer events from reaching Radix Dialog's
  // outside-detection listener (which would dismiss/blur the input
  // before Google can fire place_changed).
  //
  // IMPORTANT: bubble phase, NOT capture. Capture-phase stopPropagation
  // prevents the event from ever reaching the target — which would
  // block Google's own click handler. Bubble phase lets the event
  // reach the target (Google selects), then we stop it before it
  // bubbles up to Radix's document listener.
  //
  // Radix uses `pointerdown` (not mousedown) to detect outside clicks,
  // so we listen on that. We also handle mousedown as a safety net for
  // browsers/setups where Google still uses mousedown internally.
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  // Load the Google Maps script once the drawer is open. Same env var
  // and same idempotent loader the public enrollment wizard uses.
  useEffect(() => {
    if (!open) return;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('[UserDetailDrawer] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set');
      return;
    }
    loadGoogleMapsScript(apiKey)
      .then(() => setGoogleMapsLoaded(true))
      .catch((err) => console.error('[UserDetailDrawer] Google Maps load failed:', err));
  }, [open]);

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
      console.log('[UserDetailDrawer] Autocomplete attached (stable effect)');

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const formatted = place?.formatted_address ?? '';
        if (!formatted) return;
        // Plain React setState — exactly the wizard's pattern.
        setAddressValue(formatted);
      });
    } catch (err) {
      console.error('[UserDetailDrawer] Google Places autocomplete init failed:', err);
    }

    return () => {
      if (ac && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(ac);
        } catch {}
      }
    };
  }, [addressInputEl, googleMapsLoaded]);

  // Track form changes
  useEffect(() => {
    // RHF's isDirty OR a change to the plain-state address field.
    setHasChanges(isDirty || addressValue !== initialAddress);
  }, [isDirty, addressValue, initialAddress]);

  const fetchUserDetails = async () => {
    if (!userId) return;

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
          role: user.role || 'student',
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

  const onSubmit = async (data: UserUpdateForm) => {
    if (!userId) return;

    setSaving(true);
    try {
      // Merge the address (kept in plain React state, not RHF) into
      // the payload so it persists alongside the other fields.
      const payload = { ...data, location: addressValue };
      const response = await fetch(`/api/admin/tenant/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(t('admin.users.drawer.updateSuccess', 'User updated successfully'));
        setHasChanges(false);
        onUpdate();
        onOpenChange(false);
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

  // Admin avatar upload: client-side validation, POST to the admin-only
  // endpoint, then refetch the user so the new avatar shows immediately
  // (also propagates the change to the parent list via onUpdate()).
  const handleAvatarFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

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
      onUpdate();
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

  const handleClose = () => {
    if (hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedDialog(false);
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleCancelClose = () => {
    setShowUnsavedDialog(false);
  };

  const u = userDetails?.user?.users;
  const userStatus: string = userDetails?.user?.status ?? (u?.is_active ? 'active' : 'inactive');
  const statusDotColor =
    userStatus === 'active'
      ? 'bg-green-500'
      : userStatus === 'suspended' || userStatus === 'deleted'
      ? 'bg-destructive'
      : 'bg-muted-foreground';

  return (
    // modal={false} disables Radix's focus trap so the Google Places
    // suggestions dropdown (rendered in document.body) doesn't lose
    // focus / get cursor-jumped on selection.
    <Sheet open={open} onOpenChange={handleClose} modal={false}>
      <SheetContent
        // [&>button.absolute] hides the Sheet primitive's built-in close
        // button (hardcoded at right-4 top-4 → wrong corner in RTL).
        // Sheet primitive sets a default `gap-4 p-6` and `overflow-y-auto`
        // on the content; we override to a frozen-hero / scrollable-body
        // flex column instead.
        className="sm:max-w-[640px] p-0 gap-0 overflow-hidden flex flex-col [&>button.absolute]:hidden"
        dir={direction}
        // Google Places Autocomplete renders its suggestions dropdown
        // (.pac-container) as a sibling of <body>, OUTSIDE the Radix
        // dialog tree. Radix's outside-interaction handlers eat the
        // suggestion click before Google can fire `place_changed`. Tell
        // Radix to ignore events whose target is inside the pac-container
        // OR any descendant (.pac-item, the inner spans, the icon, …).
        onPointerDownOutside={(e) => {
          if (isInsidePacContainer(e.target)) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isInsidePacContainer(e.target)) e.preventDefault();
        }}
        onFocusOutside={(e) => {
          if (isInsidePacContainer(e.target)) e.preventDefault();
        }}
      >
        {/* Accessible title + description — visually replaced by the hero
            block below, kept here so screen readers still get them. */}
        <SheetHeader className="sr-only">
          <SheetTitle>
            {u?.first_name} {u?.last_name}
          </SheetTitle>
          <SheetDescription>{u?.email}</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col flex-1 min-h-0"
            >
              {/* Frozen hero — sits above the scrollable body. We use
                  the flex-column layout (shrink-0 hero, flex-1 body)
                  instead of `sticky top-0` so the hero never moves and
                  the scroll begins strictly after it. Custom close
                  button is on the logical end edge (left in RTL). */}
              <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 pb-8 border-b shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label={t('admin.users.drawer.close', 'Close')}
                  className="absolute top-3 end-3 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-background/60 hover:text-foreground transition z-10"
                >
                  <X className="h-4 w-4" />
                </button>
                <div
                  className="absolute top-0 end-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"
                  aria-hidden="true"
                />
                <div
                  className="absolute bottom-0 start-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10"
                  aria-hidden="true"
                />

                <div className="flex items-start gap-4">
                  {/* Avatar column — avatar on top, upload hint
                      directly beneath it. */}
                  <div className="shrink-0 flex flex-col items-center gap-2 w-20">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl font-bold flex items-center justify-center overflow-hidden ring-4 ring-background shadow-lg">
                        {u?.avatar_url ? (
                          <Image
                            src={u.avatar_url}
                            alt={u.first_name || 'User avatar'}
                            width={80}
                            height={80}
                            className="h-20 w-20 object-cover"
                          />
                        ) : (
                          <span>
                            {(u?.first_name?.[0] || '?').toUpperCase()}
                            {(u?.last_name?.[0] || '').toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Status dot */}
                      <span
                        className={`absolute -bottom-1 -start-1 h-5 w-5 rounded-full border-4 border-background ${statusDotColor}`}
                        aria-hidden="true"
                      />
                      {/* Camera overlay button */}
                      <input
                        ref={avatarFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileSelected}
                      />
                      <button
                        type="button"
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        title={
                          u?.avatar_url
                            ? t('admin.users.drawer.avatar.change', 'Change image')
                            : t('admin.users.drawer.avatar.upload', 'Upload image')
                        }
                        className="absolute -bottom-2 -end-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md ring-2 ring-background hover:opacity-90 transition disabled:opacity-50"
                      >
                        {uploadingAvatar ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {/* Hint directly under the avatar */}
                    <p className="text-[10px] leading-tight text-muted-foreground text-center mt-2">
                      {t('admin.users.drawer.avatar.hint', 'JPG or PNG, up to 2 MB.')}
                    </p>
                  </div>

                  {/* Identity column — name spans the row; email + phone
                      share one row on the start edge with role/status
                      pills pushed to the end via justify-between. */}
                  <div className="min-w-0 flex-1 pt-1">
                    <h2
                      className="text-xl sm:text-2xl font-bold text-foreground break-words leading-tight"
                      dir="auto"
                    >
                      {u?.first_name} {u?.last_name}
                    </h2>

                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-2">
                      {/* Email · Phone on one row */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground min-w-0">
                        <span dir="ltr" className="break-all">{u?.email}</span>
                        {u?.phone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span dir="ltr">{u.phone}</span>
                          </>
                        )}
                      </div>
                      {/* Role + Status pills on the end edge */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {userDetails?.user?.role && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-background/70 border">
                            {t(
                              `admin.users.roles.${String(userDetails.user.role).toLowerCase()}`,
                              userDetails.user.role
                            )}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            userStatus === 'active'
                              ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30'
                              : userStatus === 'suspended' || userStatus === 'deleted'
                              ? 'bg-destructive/10 text-destructive border-destructive/30'
                              : 'bg-muted text-muted-foreground border-muted'
                          }`}
                        >
                          {t(
                            `admin.users.status.${userStatus.toLowerCase()}`,
                            userStatus
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs span between the frozen hero and the sticky footer.
                  TabsList sits outside the scroll container so it stays
                  pinned; only TabsContent scrolls. */}
              <Tabs
                defaultValue="basic"
                className="flex flex-col flex-1 min-h-0"
                dir={direction}
              >
                <TabsList className="shrink-0 mx-4 mt-4 grid w-auto grid-cols-3">
                  <TabsTrigger value="basic">
                    <User className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('admin.users.drawer.tabs.basic', 'Basic Info')}
                  </TabsTrigger>
                  <TabsTrigger value="profile">
                    <Info className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('admin.users.drawer.tabs.profile', 'Profile')}
                  </TabsTrigger>
                  <TabsTrigger value="security">
                    <Shield className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                    {t('admin.users.drawer.tabs.security', 'Security')}
                  </TabsTrigger>
                </TabsList>

                {/* Scrollable body — only the tab content scrolls. */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Identity section card */}
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

                  {/* Contact section card */}
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

                  {/* Access section card — role on its own row, status
                      on its own row below it (status radio flows
                      horizontally so it doesn't tower). */}
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
                              <SelectItem value="student">{t('admin.users.drawer.role.student', 'Student')}</SelectItem>
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
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-wrap gap-x-4 gap-y-2"
                            >
                              {(['active', 'invited', 'suspended', 'deleted'] as const).map((s) => (
                                <div
                                  key={s}
                                  className={`flex items-center ${isRtl ? 'space-x-reverse' : ''} space-x-2`}
                                >
                                  <RadioGroupItem value={s} id={`status-${s}`} />
                                  <Label htmlFor={`status-${s}`}>
                                    {t(`admin.users.drawer.status.${s}`, s.charAt(0).toUpperCase() + s.slice(1))}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                  {/* Bio section card */}
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

                  {/* Address — single `location` text column on users.
                      Google Places autocomplete fills it with the
                      formatted address; no structured sub-fields. */}
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

                  {/* Communication section card — contact-email override
                      + WhatsApp toggle. */}
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
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="rounded-lg border bg-card p-4 space-y-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('admin.users.drawer.section.accountInfo', 'Account info')}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('admin.users.drawer.accountCreated', 'Account Created')}</Label>
                        <p className="text-sm font-medium mt-1">
                          {userDetails?.user?.users?.created_at
                            ? new Date(userDetails.user.users.created_at).toLocaleDateString()
                            : t('admin.users.drawer.notAvailable', 'N/A')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('admin.users.drawer.lastLogin', 'Last Login')}</Label>
                        <p className="text-sm font-medium mt-1">
                          {userDetails?.user?.users?.last_login_at
                            ? new Date(userDetails.user.users.last_login_at).toLocaleDateString()
                            : t('admin.users.drawer.never', 'Never')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('admin.users.drawer.enrollments', 'Enrollments')}</Label>
                        <p className="text-sm font-medium mt-1">
                          {userDetails?.stats?.enrollmentCount || 0}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">{t('admin.users.drawer.completedCourses', 'Completed Courses')}</Label>
                        <p className="text-sm font-medium mt-1">
                          {userDetails?.stats?.completedCourses || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                </div>
              </Tabs>

              {/* Sticky action footer — pinned at the bottom of the
                  drawer so Save/Cancel are always reachable even with a
                  long form on small screens. */}
              <div
                className={`shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 flex gap-2 ${
                  isRtl ? 'justify-start' : 'justify-end'
                }`}
              >
                <Button type="button" variant="outline" onClick={handleClose}>
                  {t('admin.users.drawer.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={saving || !hasChanges}>
                  {saving && <Loader2 className={`h-4 w-4 ${isRtl ? 'ml-2' : 'mr-2'} animate-spin`} />}
                  {t('admin.users.drawer.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent dir={direction}>
          <AlertDialogHeader className={isRtl ? 'text-right' : 'text-left'}>
            <AlertDialogTitle>
              {t('admin.users.drawer.unsavedChanges.title', 'Unsaved Changes')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.users.drawer.unsavedChanges', 'You have unsaved changes. Are you sure you want to close?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRtl ? 'flex-row-reverse' : ''}>
            <AlertDialogCancel onClick={handleCancelClose}>
              {t('admin.users.drawer.unsavedChanges.stay', 'Stay')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose} className="bg-destructive hover:bg-destructive/90">
              {t('admin.users.drawer.unsavedChanges.discard', 'Discard Changes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
