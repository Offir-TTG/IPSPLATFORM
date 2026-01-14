'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Shield, User, Info } from 'lucide-react';
import { useAdminLanguage } from '@/context/AppContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

// Schema matches the actual users table structure
const userUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['student', 'instructor', 'admin', 'staff']),
  status: z.enum(['active', 'invited', 'suspended', 'deleted']),
  bio: z.string().optional(),
  location: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  is_whatsapp: z.boolean(),
});

type UserUpdateForm = z.infer<typeof userUpdateSchema>;

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

  // Track form changes
  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

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
          contact_email: user.users.contact_email || '',
          is_whatsapp: !!user.users.is_whatsapp,
        });
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
      const response = await fetch(`/api/admin/tenant/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto" dir={direction}>
        <SheetHeader className={isRtl ? 'text-right' : 'text-left'}>
          <SheetTitle dir="auto">
            {userDetails?.user?.users?.first_name} {userDetails?.user?.users?.last_name}
          </SheetTitle>
          <SheetDescription dir="ltr">
            {userDetails?.user?.users?.email}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <Tabs defaultValue="basic" className="w-full" dir={direction}>
                <TabsList className="grid w-full grid-cols-3">
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

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
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
                          <Input type="tel" {...field} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            className="flex flex-col space-y-1"
                          >
                            <div className={`flex items-center ${isRtl ? 'space-x-reverse' : ''} space-x-2`}>
                              <RadioGroupItem value="active" id="active" />
                              <Label htmlFor="active">{t('admin.users.drawer.status.active', 'Active')}</Label>
                            </div>
                            <div className={`flex items-center ${isRtl ? 'space-x-reverse' : ''} space-x-2`}>
                              <RadioGroupItem value="invited" id="invited" />
                              <Label htmlFor="invited">{t('admin.users.drawer.status.invited', 'Invited')}</Label>
                            </div>
                            <div className={`flex items-center ${isRtl ? 'space-x-reverse' : ''} space-x-2`}>
                              <RadioGroupItem value="suspended" id="suspended" />
                              <Label htmlFor="suspended">{t('admin.users.drawer.status.suspended', 'Suspended')}</Label>
                            </div>
                            <div className={`flex items-center ${isRtl ? 'space-x-reverse' : ''} space-x-2`}>
                              <RadioGroupItem value="deleted" id="deleted" />
                              <Label htmlFor="deleted">{t('admin.users.drawer.status.deleted', 'Deleted')}</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.drawer.bio', 'Bio')}</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder={t('admin.users.drawer.bioPlaceholder', 'Tell us about yourself...')} dir="auto" rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.drawer.location', 'Location')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={t('admin.users.drawer.locationPlaceholder', 'City, Country')} dir="auto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin.users.drawer.contactEmail', 'Contact Email')}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} placeholder={t('admin.users.drawer.contactEmailPlaceholder', 'Alternative email address')} dir="ltr" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_whatsapp"
                    render={({ field }) => (
                      <FormItem className={`flex flex-row items-start ${isRtl ? 'space-x-reverse' : ''} space-x-3 space-y-0 rounded-md border p-4`}>
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
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">{t('admin.users.drawer.accountCreated', 'Account Created')}</Label>
                        <p className="text-sm font-medium">
                          {userDetails?.user?.users?.created_at
                            ? new Date(userDetails.user.users.created_at).toLocaleDateString()
                            : t('admin.users.drawer.notAvailable', 'N/A')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">{t('admin.users.drawer.lastLogin', 'Last Login')}</Label>
                        <p className="text-sm font-medium">
                          {userDetails?.user?.users?.last_login_at
                            ? new Date(userDetails.user.users.last_login_at).toLocaleDateString()
                            : t('admin.users.drawer.never', 'Never')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">{t('admin.users.drawer.enrollments', 'Enrollments')}</Label>
                        <p className="text-sm font-medium">
                          {userDetails?.stats?.enrollmentCount || 0}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">{t('admin.users.drawer.completedCourses', 'Completed Courses')}</Label>
                        <p className="text-sm font-medium">
                          {userDetails?.stats?.completedCourses || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className={`flex gap-2 pt-4 border-t ${isRtl ? 'justify-start' : 'justify-end'}`}>
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
